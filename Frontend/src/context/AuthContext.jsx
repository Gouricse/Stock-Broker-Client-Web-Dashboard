import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

// Token refresh interval (refresh 2 minutes before expiry)
const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutes (for 15 min token)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const refreshIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  // Clear all intervals and timeouts
  const clearTimers = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  // Auto refresh token before expiry
  const setupTokenRefresh = useCallback(() => {
    clearTimers();

    // Set up periodic token refresh
    refreshIntervalRef.current = setInterval(async () => {
      try {
        if (authService.isTokenExpiringSoon()) {
          await authService.refreshToken();
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, log out user
        logout();
        setSessionExpired(true);
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [clearTimers]);

  // Activity-based session timeout (30 minutes of inactivity)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

  const resetActivityTimeout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    if (isAuthenticated) {
      activityTimeoutRef.current = setTimeout(() => {
        console.log('Session expired due to inactivity');
        logout();
        setSessionExpired(true);
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated]);

  // Set up activity listeners
  useEffect(() => {
    if (isAuthenticated) {
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      
      const handleActivity = () => {
        resetActivityTimeout();
      };

      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });

      resetActivityTimeout();

      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [isAuthenticated, resetActivityTimeout]);

  useEffect(() => {
    // Check if user is logged in on mount
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        const storedUser = authService.getCurrentUser();
        
        if (token && storedUser) {
          // First, trust local storage if token exists (for immediate UI)
          // This prevents redirect flicker on page refresh
          setUser(storedUser);
          setIsAuthenticated(true);
          
          // Then verify with server in background
          try {
            const response = await authService.verifyToken();
            if (response.success) {
              setupTokenRefresh();
            } else {
              // Token invalid, try to refresh
              try {
                await authService.refreshToken();
                const freshUser = authService.getCurrentUser();
                if (freshUser) setUser(freshUser);
                setupTokenRefresh();
              } catch (refreshError) {
                // Both failed, clear auth
                console.error('Auth initialization failed:', refreshError);
                authService.logout();
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } catch (error) {
            // If verification fails, try refresh token
            try {
              await authService.refreshToken();
              const freshUser = authService.getCurrentUser();
              if (freshUser) setUser(freshUser);
              setupTokenRefresh();
            } catch (refreshError) {
              // Both failed, clear auth
              console.error('Auth initialization failed:', refreshError);
              authService.logout();
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      clearTimers();
    };
  }, [setupTokenRefresh, clearTimers]);

  const login = async (email, password, rememberMe = false) => {
    const response = password
      ? await authService.login(email, password, rememberMe)
      : await authService.emailLogin(email, rememberMe);
    if (response.success) {
      setUser(response.data.user);
      setIsAuthenticated(true);
      setSessionExpired(false);
      setupTokenRefresh();
    }
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authService.register(name, email, password);
    return response;
  };

  const logout = useCallback(async () => {
    clearTimers();
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, [clearTimers]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(updatedUser));
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    sessionExpired,
    login,
    register,
    logout,
    updateUser,
    clearSessionExpired,
    getSessionId: authService.getSessionId
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

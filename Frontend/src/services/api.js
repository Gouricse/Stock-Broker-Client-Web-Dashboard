import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://stock-broker-client-web-dashboard.onrender.com/api';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  TOKEN_EXPIRY: 'tokenExpiry',
  SESSION_ID: 'sessionId',
  REMEMBER_ME: 'rememberMe'
};

// Determine storage based on remember me setting
const getStorage = () => {
  const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

// Generate unique session ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add token to requests if available
api.interceptors.request.use((config) => {
  const storage = getStorage();
  const token = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add session ID for tracking
  const sessionId = storage.getItem(STORAGE_KEYS.SESSION_ID);
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  
  return config;
});

// Handle token expiry and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code;
      
      // If token expired, try to refresh
      if (errorCode === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const storage = getStorage();
          const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          }, {
            withCredentials: true
          });

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
            
            // Store new tokens
            storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + expiresIn);

            // Update authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            processQueue(null, accessToken);

            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // Clear all auth data and redirect to login
          authService.logout();
          window.location.href = '/login?session=expired';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // For other 401 errors, logout
      if (errorCode !== 'TOKEN_EXPIRED') {
        authService.logout();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    
    if (response.data.success) {
      const { accessToken, refreshToken, expiresIn, user } = response.data.data;
      
      // Set remember me preference first
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());
      
      const storage = getStorage();
      
      // Store tokens
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + expiresIn);
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      // Generate and store session ID
      const sessionId = generateSessionId();
      storage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
      
      // Update axios default header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return response.data;
  },

  emailLogin: async (email, rememberMe = false) => {
    const response = await api.post('/auth/email-login', { email, rememberMe });

    if (response.data.success) {
      const { accessToken, refreshToken, expiresIn, user } = response.data.data;

      // Set remember me preference first
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());

      const storage = getStorage();

      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + expiresIn);
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      // Generate and store session ID
      const sessionId = generateSessionId();
      storage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }

    return response.data;
  },

  logout: async () => {
    try {
      // Call server logout to invalidate refresh token
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.error('Logout API error:', error);
    }
    
    // Clear all storage
    const storage = getStorage();
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear axios header
    delete api.defaults.headers.common['Authorization'];
  },

  refreshToken: async () => {
    const storage = getStorage();
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh-token', { refreshToken });
    
    if (response.data.success) {
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
      
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + expiresIn);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  getCurrentUser: () => {
    const storage = getStorage();
    const user = storage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    const storage = getStorage();
    return storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  isAuthenticated: () => {
    const storage = getStorage();
    const token = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = storage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token) return false;
    
    // Check if token is expired locally
    if (expiry && Date.now() > parseInt(expiry)) {
      // Token expired, but we might be able to refresh
      const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      return !!refreshToken;
    }
    
    return true;
  },

  isTokenExpiringSoon: () => {
    const storage = getStorage();
    const expiry = storage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!expiry) return false;
    
    // Check if token expires in next 2 minutes
    return Date.now() > parseInt(expiry) - (2 * 60 * 1000);
  },

  getSessionId: () => {
    const storage = getStorage();
    return storage.getItem(STORAGE_KEYS.SESSION_ID);
  }
};

// Stock services
export const stockService = {
  getSupportedStocks: async () => {
    const response = await api.get('/stocks');
    return response.data;
  },

  getSubscribedStocks: async () => {
    const response = await api.get('/stocks/subscribed');
    return response.data;
  },

  subscribe: async (ticker) => {
    const response = await api.post('/stocks/subscribe', { ticker });
    return response.data;
  },

  unsubscribe: async (ticker) => {
    const response = await api.post('/stocks/unsubscribe', { ticker });
    return response.data;
  }
};

export default api;

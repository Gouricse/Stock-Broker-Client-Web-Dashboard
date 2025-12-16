import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ShowChart,
  TrendingUp,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for session expired in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('Your session has expired. Please login again.');
    }
    if (sessionExpired) {
      setError('Your session has expired due to inactivity. Please login again.');
      clearSessionExpired();
    }
  }, [sessionExpired, clearSessionExpired]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!formData.password) {
      setError('Please enter your password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await login(formData.email, formData.password, rememberMe);
      
      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid email or password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen bg-white flex">
      {/* Left Side - Illustration */}
      <Box 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <Box 
          className="absolute inset-0 opacity-10"
          sx={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <Box className="flex flex-col items-center justify-center w-full p-12 relative z-10">
          {/* Logo */}
          <Box className="flex items-center gap-3 mb-12">
            <Box 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              sx={{ 
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 7H21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800, 
                  color: 'white',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                Stock Broker
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(167, 243, 208, 0.9)', 
                  fontWeight: 700, 
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase'
                }}
              >
                CLIENT PANEL
              </Typography>
            </Box>
          </Box>

          {/* Illustration - Secure Login */}
          <Box className="relative mb-10">
            {/* Main Card - Lock Shield */}
            <Box 
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
              sx={{ width: 320 }}
            >
              {/* Shield Icon */}
              <Box className="flex justify-center mb-6">
                <Box 
                  className="w-24 h-28 flex items-center justify-center relative"
                  sx={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  }}
                >
                  <Security sx={{ fontSize: 48, color: 'white' }} />
                </Box>
              </Box>

              {/* Stats */}
              <Box className="grid grid-cols-2 gap-4">
                <Box className="bg-white/10 rounded-xl p-4 text-center">
                  <Typography variant="h5" className="font-bold text-white">
                    256-bit
                  </Typography>
                  <Typography variant="caption" className="text-emerald-200">
                    Encryption
                  </Typography>
                </Box>
                <Box className="bg-white/10 rounded-xl p-4 text-center">
                  <Typography variant="h5" className="font-bold text-white">
                    99.9%
                  </Typography>
                  <Typography variant="caption" className="text-emerald-200">
                    Uptime
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Floating Elements */}
            <Box 
              className="absolute -left-6 top-10 bg-white rounded-xl p-3 shadow-2xl"
              sx={{ animation: 'float 3s ease-in-out infinite' }}
            >
              <Box className="flex items-center gap-2">
                <Box className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp sx={{ fontSize: 16, color: '#10b981' }} />
                </Box>
                <Box>
                  <Typography variant="caption" className="text-gray-500 block leading-none">
                    Secure
                  </Typography>
                  <Typography variant="body2" className="font-bold text-emerald-600">
                    Login
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box 
              className="absolute -right-4 bottom-0 bg-white rounded-xl p-3 shadow-2xl"
              sx={{ animation: 'float 3s ease-in-out infinite 1.5s' }}
            >
              <Box className="flex items-center gap-2">
                <Box className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Security sx={{ fontSize: 16, color: '#8b5cf6' }} />
                </Box>
                <Box>
                  <Typography variant="caption" className="text-gray-500 block leading-none">
                    Secure
                  </Typography>
                  <Typography variant="body2" className="font-bold text-gray-800">
                    Email Login
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Text */}
          <Typography variant="h4" className="font-bold text-white text-center mb-3">
            Welcome Back!
          </Typography>
          <Typography variant="body1" className="text-emerald-100 text-center max-w-sm">
          Secure access. Live data. Smarter investing
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Box className="w-full max-w-md">
          {/* Mobile Logo */}
          <Box className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <Box 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              sx={{ 
                background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 7H21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                Stock Broker
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#10b981', 
                  fontWeight: 700, 
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase'
                }}
              >
                CLIENT Panel
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" className="font-bold text-gray-900 mb-2">
            Sign In
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-8">
            Enter your credentials to access your account
          </Typography>

          {error && (
            <Alert severity="error" className="mb-4" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box className="mb-4">
              <Typography variant="body2" className="font-medium text-gray-700 mb-2">
                Email Address
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#10b981' },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#1f2937',
                    '&::placeholder': { color: '#9ca3af', opacity: 1 },
                    '&:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 100px white inset',
                      WebkitTextFillColor: '#1f2937',
                    },
                    '&:-webkit-autofill:hover': {
                      WebkitBoxShadow: '0 0 0 100px white inset',
                      WebkitTextFillColor: '#1f2937',
                    },
                    '&:-webkit-autofill:focus': {
                      WebkitBoxShadow: '0 0 0 100px white inset',
                      WebkitTextFillColor: '#1f2937',
                    },
                  },
                }}
              />
            </Box>

            <Box className="mb-6">
              <Typography variant="body2" className="font-medium text-gray-700 mb-2">
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff sx={{ color: '#9ca3af' }} /> : <Visibility sx={{ color: '#9ca3af' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#10b981' },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#1f2937',
                    '&::placeholder': { color: '#9ca3af', opacity: 1 },
                    '&:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 100px white inset',
                      WebkitTextFillColor: '#1f2937',
                    },
                    '&:-webkit-autofill:hover': {
                      WebkitBoxShadow: '0 0 0 100px white inset',
                      WebkitTextFillColor: '#1f2937',
                    },
                    '&:-webkit-autofill:focus': {
                      WebkitBoxShadow: '0 0 0 100px white inset',
                      WebkitTextFillColor: '#1f2937',
                    },
                  },
                }}
              />
            </Box>

            <Box className="mb-6 flex items-center justify-between">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: '#9ca3af',
                      '&.Mui-checked': { color: '#10b981' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" className="text-gray-600">
                    Remember me
                  </Typography>
                }
              />
              <Typography 
                variant="body2" 
                className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium"
              >
               
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>
          </form>

          <Box className="mt-6 text-center">
            <Typography variant="body2" className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Create one
              </Link>
            </Typography>
          </Box>

          <Box className="mt-8 text-center">
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to Home
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Floating Animation Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </Box>
  );
};

export default LoginPage;

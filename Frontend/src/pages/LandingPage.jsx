import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  Security,
  Speed,
  AccountBalance,
  ArrowForward,
  PlayArrow,
  Verified,
  Public,
  BarChart,
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();
  const [visibleSections, setVisibleSections] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    }, observerOptions);

    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Box className="min-h-screen bg-white">
      {/* Navigation */}
      <Box className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <Container maxWidth="xl">
          <Box className="flex items-center justify-between py-4">
            {/* Logo */}
            <Box className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <Box 
                className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                sx={{ 
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {/* Custom Stock Logo SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 7H21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '1.1rem',
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
                  CLient Panel
                </Typography>
              </Box>
            </Box>

            

            {/* Auth Buttons */}
            <Box className="flex items-center gap-3">
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ 
                  textTransform: 'none', 
                  color: '#374151',
                  fontWeight: 500,
                  '&:hover': { backgroundColor: '#f3f4f6' }
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ 
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '10px',
                  px: 3,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                  }
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        {/* Background Decorations */}
        <Box 
          className="absolute top-20 right-1/4 w-96 h-96 rounded-full opacity-20"
          sx={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        />
        <Box 
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          sx={{ background: 'radial-gradient(circle, #667eea 0%, transparent 70%)' }}
        />

        <Container maxWidth="lg">
          <Box className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <Box className="z-10 text-left">
              <Box className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-6">
                <Box className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Typography variant="caption" className="font-semibold">
                  Live Market Updates
                </Typography>
              </Box>

              <Typography 
                variant="h2" 
                className="font-bold text-gray-900 leading-tight mb-4"
                sx={{ fontSize: { xs: '2.25rem', md: '3rem' } }}
              >
                Stock
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  Broker Platform
                </span>
              </Typography>

              <Typography 
                variant="body1" 
                className="text-gray-600 mb-8 leading-relaxed"
                sx={{ fontSize: '1rem', maxWidth: 420 }}
              >
                Experience a modern stock dashboard with real-time updates, smart portfolio management, and seamless stock subscriptions. 
                Start your investment journey today.
              </Typography>

              <Box className="flex flex-wrap items-center gap-4 mb-10">
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/register')}
                  sx={{ 
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      boxShadow: '0 12px 32px rgba(16, 185, 129, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Start 
                </Button>
               
              </Box>

              {/* Trust Badges */}
              <Box className="flex items-center gap-6">
                <Box className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Box
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600"
                      sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >
                      {['A', 'B', 'C', 'D'][i - 1]}
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Typography variant="body2" className="font-semibold text-gray-800">
                    Trusted by 10,000+
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Active Users worldwide
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right Content - Illustration */}
            <Box className="relative flex justify-center">
              {/* Main Illustration Card */}
              <Box className="relative">
                {/* Growth Chart Card */}
                <Box 
                  className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100"
                  sx={{ width: { xs: 300, md: 380 } }}
                >
                  {/* Chart Header */}
                  <Box className="flex items-center justify-between mb-4">
                    <Typography variant="subtitle2" className="font-semibold text-gray-800">
                      Portfolio Growth
                    </Typography>
                    <Box className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                      <TrendingUp sx={{ fontSize: 14, color: '#10b981' }} />
                      <Typography variant="caption" className="text-emerald-600 font-semibold">
                        +24.5%
                      </Typography>
                    </Box>
                  </Box>

                  {/* SVG Chart with Arrow */}
                  <Box className="mb-4 relative">
                    <svg viewBox="0 0 380 140" className="w-full h-28">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                        </marker>
                      </defs>
                      {/* Area */}
                      <path
                        d="M0,110 Q60,95 120,85 T240,55 T360,25 L380,20 L380,140 L0,140 Z"
                        fill="url(#chartGradient)"
                      />
                      {/* Line with arrow */}
                      <path
                        d="M0,110 Q60,95 120,85 T240,55 T360,25"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        markerEnd="url(#arrowhead)"
                      />
                      {/* Data Points */}
                      <circle cx="120" cy="85" r="4" fill="#10b981" />
                      <circle cx="240" cy="55" r="4" fill="#10b981" />
                      <circle cx="360" cy="25" r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                    </svg>
                  </Box>

                  {/* Coin Stacks - Like the reference image */}
                  <Box className="flex items-end justify-around pt-2">
                    {[
                      { height: 35, months: 'Jan' },
                      { height: 50, months: 'Feb' },
                      { height: 70, months: 'Mar' },
                      { height: 90, months: 'Apr' },
                      { height: 110, months: 'May' },
                    ].map((item, i) => (
                      <Box key={i} className="flex flex-col items-center gap-1">
                        {/* Coin Stack */}
                        <Box className="flex flex-col-reverse items-center">
                          {Array.from({ length: Math.floor(item.height / 18) }).map((_, coinIndex) => (
                            <Box 
                              key={coinIndex}
                              className="w-7 h-4 rounded-sm border-b border-amber-700"
                              sx={{ 
                                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                marginTop: coinIndex > 0 ? '-2px' : 0,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}
                            >
                              {coinIndex === Math.floor(item.height / 18) - 1 && (
                                <Typography 
                                  variant="caption" 
                                  className="text-amber-900 font-bold flex items-center justify-center"
                                  sx={{ fontSize: '8px', lineHeight: '16px' }}
                                >
                                  $
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                        <Typography variant="caption" className="text-gray-400 text-xs mt-1">
                          {item.months}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Floating AAPL Card */}
                <Box 
                  className="absolute -left-4 top-16 bg-white rounded-xl p-3 shadow-lg border border-gray-100"
                  sx={{ animation: 'float 3s ease-in-out infinite' }}
                >
                  <Box className="flex items-center gap-2">
                    <Box className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp sx={{ fontSize: 16, color: '#10b981' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" className="text-gray-500 block leading-none">
                        AAPL
                      </Typography>
                      <Typography variant="body2" className="font-bold text-emerald-600">
                        +2.4%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Floating Portfolio Card */}
                <Box 
                  className="absolute -right-4 bottom-20 bg-white rounded-xl p-3 shadow-lg border border-gray-100"
                  sx={{ animation: 'float 3s ease-in-out infinite 1.5s' }}
                >
                  <Box className="flex items-center gap-2">
                    <Box className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <AccountBalance sx={{ fontSize: 16, color: '#8b5cf6' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" className="text-gray-500 block leading-none">
                        Portfolio
                      </Typography>
                      <Typography variant="body2" className="font-bold text-gray-800">
                        ₹5.2L
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* People Illustration - Two business people */}
                <Box className="absolute -bottom-2 right-4 flex items-end gap-1">
                  {/* Person 1 - Yellow/Orange */}
                  <Box className="relative">
                    <Box className="w-5 h-5 rounded-full bg-amber-300 absolute -top-6 left-1/2 -translate-x-1/2" />
                    <Box 
                      className="w-12 h-16 rounded-t-full"
                      sx={{ background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' }}
                    />
                  </Box>
                  {/* Person 2 - Teal */}
                  <Box className="relative -ml-3">
                    <Box className="w-4 h-4 rounded-full bg-gray-800 absolute -top-5 left-1/2 -translate-x-1/2" />
                    <Box 
                      className="w-10 h-14 rounded-t-full"
                      sx={{ background: 'linear-gradient(180deg, #14b8a6 0%, #0d9488 100%)' }}
                    />
                  </Box>
                </Box>

                {/* Decorative plant */}
                <Box className="absolute -bottom-2 -right-4">
                  <Box className="w-3 h-8 bg-amber-500 rounded-full transform rotate-12" />
                  <Box className="w-2 h-6 bg-amber-400 rounded-full transform -rotate-12 -mt-4 ml-2" />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>


      {/* Features Section with Animation */}
      <Box 
        id="features"
        ref={el => sectionRefs.current['features'] = el}
        className={`py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden transition-all duration-1000 ${
          visibleSections['features'] ? 'opacity-100' : 'opacity-0'
        }`}
        sx={{
          transform: visibleSections['features'] ? 'translateY(0)' : 'translateY(60px)',
        }}
      >
        {/* Background Decorations */}
        <Box 
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
          sx={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        />

        <Container maxWidth="lg">
          <Box className="text-center mb-16">
            <Typography 
              variant="h3" 
              className="font-bold text-gray-900 mb-4"
              sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}
            >
              Why Choose Stock Broker?
            </Typography>
            <Typography 
              variant="body1" 
              className="text-gray-600 max-w-2xl mx-auto"
              sx={{ fontSize: '1.125rem' }}
            >
            </Typography>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <TrendingUp sx={{ fontSize: 32, color: '#10b981' }} />,
                title: 'Real-time Updates',
                description: 'Live stock prices updated every seconds',
              },
              {
                icon: <Security sx={{ fontSize: 32, color: '#667eea' }} />,
                title: 'Market analysis',
                description: 'Stay informed with live market movements and dynamic stock behavior.',
              },
              {
                icon: <Speed sx={{ fontSize: 32, color: '#f59e0b' }} />,
                title: 'Subscribed stocks',
                description: 'Instant order processing with minimal delay',
              },
              {
                icon: <BarChart sx={{ fontSize: 32, color: '#ec4899' }} />,
                title: 'Advanced Analytics',
                description: 'Visual insights into stock trends, performance, and activity.',
              },
            ].map((feature, index) => (
              <Box
                key={index}
                className={`bg-white p-8 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl group cursor-pointer ${
                  visibleSections['features'] ? 'opacity-100' : 'opacity-0'
                }`}
                sx={{
                  transform: visibleSections['features'] ? 'translateY(0)' : 'translateY(40px)',
                  transitionDelay: visibleSections['features'] ? `${index * 150}ms` : '0ms',
                }}
              >
                <Box className="mb-4 p-3 bg-emerald-50 rounded-xl w-fit group-hover:bg-emerald-100 transition-colors">
                  {feature.icon}
                </Box>
                <Typography variant="h6" className="font-bold text-gray-900 mb-2">
                  {feature.title}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {feature.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* About Section with Image Animation */}
      <Box 
        id="about"
        ref={el => sectionRefs.current['about'] = el}
        className={`py-20 md:py-32 bg-white relative overflow-hidden transition-all duration-1000 ${
          visibleSections['about'] ? 'opacity-100' : 'opacity-0'
        }`}
        sx={{
          transform: visibleSections['about'] ? 'translateY(0)' : 'translateY(60px)',
        }}
      >
        <Container maxWidth="lg">
          <Box className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <Box 
              className={`transition-all duration-1000 ${
                visibleSections['about'] ? 'opacity-100' : 'opacity-0'
              }`}
              sx={{
                transform: visibleSections['about'] ? 'translateX(0)' : 'translateX(-40px)',
              }}
            >
              <Typography 
                variant="body2" 
                className="text-emerald-600 font-bold mb-2 uppercase tracking-wide"
              >
                About Platform
              </Typography>
              <Typography 
                variant="h1" 
                className="font-bold text-gray-900 mb-4"
                sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}
              >
              
              </Typography>
              <Typography 
                variant="body1" 
                className="text-gray-600 mb-6 leading-relaxed"
                sx={{ fontSize: '1rem' }}
              >
                Our Stock Broker Client Web Dashboard is designed to provide a seamless, intuitive, and real-time investing experience for users 
                who want quick access to stock insights without relying on external market APIs. Built with modern web technologies, this platform enables users to:
              </Typography>

              <Box className="space-y-4 mb-8">
                {[
                  '✓ Multi-user Portfolio Management',
                  '✓ Real-time Price Updates',
                  '✓ Secure Authentication',
                ].map((item, i) => (
                  <Box key={i} className="flex items-center gap-3">
                    <Verified sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="body2" className="text-gray-700">
                      {item.replace('✓ ', '')}
                    </Typography>
                  </Box>
                ))}
              </Box>

              
            </Box>

            {/* Right Image/Illustration - Animated from Bottom */}
            <Box 
              className={`relative transition-all duration-1000 ${
                visibleSections['about'] ? 'opacity-100' : 'opacity-0'
              }`}
              sx={{
                transform: visibleSections['about'] ? 'translateY(0)' : 'translateY(80px)',
              }}
            >
              {/* Main Dashboard Card Illustration */}
              <Box 
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 relative overflow-hidden"
              >
                {/* Dashboard Header */}
                <Box className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                  <Box className="flex items-center gap-2">
                    <Box className="w-3 h-3 rounded-full bg-emerald-500" />
                    <Box className="w-3 h-3 rounded-full bg-yellow-500" />
                    <Box className="w-3 h-3 rounded-full bg-red-500" />
                  </Box>
                  <Typography variant="caption" className="text-gray-400">
                    Dashboard
                  </Typography>
                </Box>

                {/* Mock Charts */}
                <Box className="space-y-6">
                  {/* Portfolio Value */}
                  <Box>
                    <Typography variant="caption" className="text-gray-400 block mb-2">
                      Portfolio Value
                    </Typography>
                    <Typography variant="h5" className="text-white font-bold mb-2">
                      ₹5,24,580
                    </Typography>
                    <Box className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <Box 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        sx={{ width: '75%' }}
                      />
                    </Box>
                  </Box>

                  {/* Stock Holdings */}
                  <Box>
                    <Typography variant="caption" className="text-gray-400 block mb-3">
                      Top Holdings
                    </Typography>
                    <Box className="space-y-2">
                      {[
                        { ticker: 'AAPL', percent: 30 },
                        { ticker: 'TSLA', percent: 25 },
                        { ticker: 'GOOG', percent: 20 },
                      ].map((item, i) => (
                        <Box key={i} className="flex items-center justify-between">
                          <Typography variant="caption" className="text-gray-300">
                            {item.ticker}
                          </Typography>
                          <Box className="h-1 bg-gray-700 rounded-full flex-1 mx-2" style={{ width: '60px' }} />
                          <Typography variant="caption" className="text-emerald-400 font-semibold">
                            {item.percent}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Live Status */}
                  <Box className="pt-4 border-t border-gray-700 flex items-center gap-2">
                    <Box className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Typography variant="caption" className="text-emerald-400 font-semibold">
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Floating Stats Cards */}
              <Box 
                className="absolute -bottom-4 -left-8 bg-white rounded-xl p-4 shadow-lg border border-gray-100"
                sx={{ 
                  animation: 'float 3s ease-in-out infinite',
                  transform: visibleSections['about'] ? 'scale(1)' : 'scale(0.8)',
                }}
              >
                <Typography variant="caption" className="text-gray-500 block leading-none mb-1">
                  Today's Return
                </Typography>
                <Typography variant="body2" className="font-bold text-emerald-600">
                  +₹2,450
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

     
      {/* CTA Section */}
      <Box 
        id="cta"
        ref={el => sectionRefs.current['cta'] = el}
        className={`py-16 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden transition-all duration-1000 ${
          visibleSections['cta'] ? 'opacity-100' : 'opacity-0'
        }`}
        sx={{
          transform: visibleSections['cta'] ? 'translateY(0)' : 'translateY(60px)',
        }}
      >
        {/* Background Pattern */}
        <Box 
          className="absolute inset-0 opacity-10"
          sx={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <Container maxWidth="sm" className="relative z-10">
          <Box className="text-center px-4">
            <Typography 
              variant="h4" 
              className="font-bold text-white mb-3"
            >
              Ready to Start?
            </Typography>
            <Typography variant="body1" className="text-emerald-100 mb-6">
              Join thousands of Users who trust Stock broker
            </Typography>
            <Box className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ 
                  textTransform: 'none',
                  backgroundColor: 'white',
                  color: '#059669',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  '&:hover': { 
                    backgroundColor: '#f0fdf4',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                  }
                }}
              >
                Create Free Account
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ 
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': { 
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box className="py-6 bg-gray-900 border-t border-gray-800">
  <Container maxWidth="xl" className="flex items-center justify-center">
    <Typography 
      variant="body2" 
      className="text-gray-500 text-sm text-center"
    >
      © All rights reserved 2025.
    </Typography>
  </Container>
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

export default LandingPage;

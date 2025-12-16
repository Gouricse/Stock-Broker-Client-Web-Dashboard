import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  InputBase,
  Badge,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
} from '@mui/material';
import {
  Search,
  Notifications,
  KeyboardArrowDown,
  Dashboard,
  ShowChart,
  Person,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  Menu as MenuIcon,
  Close,
  AddShoppingCart,
  Logout,
  Delete,
  CheckCircle,
  ShoppingCart,
  NotificationsActive,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { stockService } from '../services/api';

// ==================== CONSTANTS ====================

// USD to INR conversion rate
const USD_TO_INR = 83.50;

// Real-time stock prices (current market approximate prices in USD - Dec 2024)
const INITIAL_STOCK_PRICES = {
  AAPL: 193.42,
  META: 591.55,
  GOOG: 191.41,
  TSLA: 389.22,
  MSFT: 448.39,
  NVDA: 138.25,
  AMZN: 225.94,
  NFLX: 919.92,
};

// Stock info with company details and logos (using reliable CDN sources)
const STOCK_INFO = {
  AAPL: { 
    name: 'Apple Inc', 
    fullName: 'Apple Inc.',
    color: '#555555',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/AAPL.webp',
    sector: 'Technology',
  },
  META: { 
    name: 'Meta', 
    fullName: 'Meta Platforms Inc.',
    color: '#0668E1',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/META.webp',
    sector: 'Technology',
  },
  GOOG: { 
    name: 'Google', 
    fullName: 'Alphabet Inc.',
    color: '#4285F4',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/GOOG.webp',
    sector: 'Technology',
  },
  TSLA: { 
    name: 'Tesla', 
    fullName: 'Tesla Inc.',
    color: '#CC0000',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/TSLA.webp',
    sector: 'Automotive',
  },
  MSFT: { 
    name: 'Microsoft', 
    fullName: 'Microsoft Corporation',
    color: '#00A4EF',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/MSFT.webp',
    sector: 'Technology',
  },
  NVDA: { 
    name: 'NVIDIA', 
    fullName: 'NVIDIA Corporation',
    color: '#76B900',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/NVDA.webp',
    sector: 'Semiconductors',
  },
  AMZN: { 
    name: 'Amazon', 
    fullName: 'Amazon.com Inc.',
    color: '#FF9900',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/AMZN.webp',
    sector: 'E-Commerce',
  },
  NFLX: { 
    name: 'Netflix', 
    fullName: 'Netflix Inc.',
    color: '#E50914',
    logo: 'https://companiesmarketcap.com/img/company-logos/64/NFLX.webp',
    sector: 'Entertainment',
  },
};

// Supported stocks (per requirements)
const SUPPORTED_STOCKS = ['AAPL', 'GOOG', 'TSLA', 'AMZN', 'META', 'NVDA', 'MSFT'];

// Time period options for chart
const TIME_PERIODS = [
  { label: 'Today', value: 'today', days: 1, points: 30 },
  { label: 'Last 7 days', value: '7d', days: 7, points: 50 },
  { label: '1 Month', value: '1m', days: 30, points: 60 },
  { label: '1 Year', value: '1y', days: 365, points: 100 },
  { label: '5 Years', value: '5y', days: 1825, points: 120 },
];

// ==================== HELPER FUNCTIONS ====================

// Format currency in INR
const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format large numbers in INR with K, L, Cr
const formatINRCompact = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return formatINR(amount);
};

// Seeded random number generator for consistent patterns per stock
const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

// Generate seed from ticker string
const tickerToSeed = (ticker) => {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed += ticker.charCodeAt(i) * (i + 1) * 7;
  }
  return seed;
};

// Stock-specific volatility and trend patterns - each stock has unique characteristics
const STOCK_PATTERNS = {
  AAPL: { volatility: 0.012, trend: 'steady', waveType: 'smooth', peakCount: 2, dip: 0.05 },
  META: { volatility: 0.025, trend: 'recovery', waveType: 'vshape', peakCount: 1, dip: 0.15 },
  GOOG: { volatility: 0.018, trend: 'wavy', waveType: 'sine', peakCount: 3, dip: 0.08 },
  TSLA: { volatility: 0.045, trend: 'volatile', waveType: 'spiky', peakCount: 5, dip: 0.20 },
  MSFT: { volatility: 0.010, trend: 'upward', waveType: 'stairs', peakCount: 4, dip: 0.03 },
  NVDA: { volatility: 0.035, trend: 'bullish', waveType: 'exponential', peakCount: 2, dip: 0.12 },
  AMZN: { volatility: 0.022, trend: 'correction', waveType: 'descending', peakCount: 3, dip: 0.18 },
  NFLX: { volatility: 0.032, trend: 'ranging', waveType: 'zigzag', peakCount: 6, dip: 0.10 },
};

// Generate historical data based on time period with truly unique patterns per stock
const generateHistoricalData = (currentPrice, period, ticker = 'AAPL') => {
  const { points, days } = period;
  const data = [];
  const seed = tickerToSeed(ticker) + days * 13; // Multiply by prime for more variation
  const random = seededRandom(seed);
  const pattern = STOCK_PATTERNS[ticker] || { volatility: 0.02, trend: 'steady', waveType: 'smooth', peakCount: 2, dip: 0.1 };
  
  // Each stock gets a completely different pattern shape
  const generatePatternValue = (i, total) => {
    const progress = i / total; // 0 to 1
    const r1 = random();
    const r2 = random();
    const r3 = random();
    
    switch(pattern.waveType) {
      case 'vshape': {
        // V-shape: starts high, dips in middle, recovers
        const midPoint = 0.3 + r1 * 0.2;
        if (progress < midPoint) {
          return 1 - (progress / midPoint) * pattern.dip * (1 + days/30);
        } else {
          return (1 - pattern.dip * (1 + days/30)) + ((progress - midPoint) / (1 - midPoint)) * pattern.dip * (1 + days/30);
        }
      }
      
      case 'sine': {
        // Smooth sine wave pattern
        const waves = pattern.peakCount + (days > 30 ? 1 : 0);
        const sineValue = Math.sin(progress * Math.PI * waves + r1 * Math.PI);
        return 1 + sineValue * pattern.dip * 0.5;
      }
      
      case 'spiky': {
        // Volatile spikes up and down
        const baseProgress = 0.7 + progress * 0.3;
        const spike = Math.sin(progress * Math.PI * pattern.peakCount * 2) * pattern.dip;
        const randomSpike = (r1 - 0.5) * pattern.dip * 0.8;
        return baseProgress + spike + randomSpike;
      }
      
      case 'stairs': {
        // Step-wise increases
        const step = Math.floor(progress * pattern.peakCount) / pattern.peakCount;
        const stepNoise = (r1 - 0.5) * 0.02;
        return 0.85 + step * 0.15 + stepNoise;
      }
      
      case 'exponential': {
        // Exponential growth curve
        const expValue = Math.pow(progress, 0.6);
        const noise = (r1 - 0.5) * pattern.dip * 0.3;
        return 0.75 + expValue * 0.25 + noise;
      }
      
      case 'descending': {
        // Downward trend with small recoveries
        const downTrend = 1 - progress * pattern.dip;
        const smallBounce = Math.sin(progress * Math.PI * pattern.peakCount) * 0.03;
        return downTrend + smallBounce + (r1 - 0.5) * 0.02;
      }
      
      case 'zigzag': {
        // Sharp zigzag pattern
        const segment = Math.floor(progress * pattern.peakCount);
        const segmentProgress = (progress * pattern.peakCount) % 1;
        const direction = segment % 2 === 0 ? 1 : -1;
        const zigValue = direction * (segmentProgress - 0.5) * pattern.dip;
        return 1 + zigValue + (r1 - 0.5) * 0.01;
      }
      
      case 'smooth':
      default: {
        // Gentle upward trend
        const gentleRise = progress * 0.08;
        const gentleWave = Math.sin(progress * Math.PI * 2) * 0.02;
        return 0.95 + gentleRise + gentleWave + (r1 - 0.5) * 0.01;
      }
    }
  };
  
  // Pre-calculate all pattern values for normalization
  const patternValues = [];
  for (let i = 0; i < points; i++) {
    patternValues.push(generatePatternValue(i, points));
  }
  
  // Find min and max to normalize
  const minVal = Math.min(...patternValues);
  const maxVal = Math.max(...patternValues);
  const range = maxVal - minVal || 1;
  
  // Determine price range based on period
  let priceRange = pattern.dip * currentPrice;
  if (days >= 365) priceRange *= 3;
  else if (days >= 30) priceRange *= 1.5;
  else if (days >= 7) priceRange *= 1.2;
  
  // Generate the actual price data
  for (let i = 0; i < points; i++) {
    // Normalize pattern value to 0-1 range
    const normalizedValue = (patternValues[i] - minVal) / range;
    
    // Calculate price: current price is at the end
    // The pattern determines the shape, and we scale it appropriately
    const basePrice = currentPrice - priceRange + (normalizedValue * priceRange * 2);
    
    // Add small random noise for realism (seeded)
    const noise = (random() - 0.5) * currentPrice * pattern.volatility * 0.1;
    
    let price = basePrice + noise;
    price = Math.max(price, currentPrice * 0.1); // Floor at 10% of current
    price = Math.min(price, currentPrice * 2.5); // Cap at 250% of current
    
    const timestamp = Date.now() - ((points - i - 1) * (days * 24 * 60 * 60 * 1000 / points));
    data.push({ price, timestamp });
  }
  
  // Smooth transition to current price for last few points
  const smoothPoints = Math.min(5, Math.floor(points * 0.1));
  for (let i = points - smoothPoints; i < points; i++) {
    const blendFactor = (i - (points - smoothPoints)) / smoothPoints;
    data[i].price = data[i].price * (1 - blendFactor) + currentPrice * blendFactor;
  }
  
  // Ensure last point is exactly current price
  data[data.length - 1].price = currentPrice;
  data[data.length - 1].timestamp = Date.now();
  
  return data;
};

// LocalStorage keys for persistence
const STORAGE_KEY_HISTORY = 'stockBroker_priceHistory';
const STORAGE_KEY_TIMESTAMP = 'stockBroker_historyTimestamp';

// Save price history to localStorage
const savePriceHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
  } catch (e) {
    console.warn('Failed to save price history to localStorage:', e);
  }
};

// Initialize price history with unique patterns immediately
const initializePriceHistory = (period) => {
  const history = {};
  const changes = {};
  
  SUPPORTED_STOCKS.forEach(ticker => {
    const priceINR = INITIAL_STOCK_PRICES[ticker] * USD_TO_INR;
    history[ticker] = generateHistoricalData(priceINR, period, ticker);
    
    const tickerHistory = history[ticker];
    if (tickerHistory.length >= 2) {
      const firstPrice = tickerHistory[0].price;
      const lastPrice = tickerHistory[tickerHistory.length - 1].price;
      const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      changes[ticker] = {
        percent: changePercent,
        isPositive: changePercent >= 0,
        value: lastPrice - firstPrice
      };
    }
  });
  
  return { history, changes };
};

// Try to load saved history for a specific period
const loadSavedHistoryForPeriod = (period) => {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    const savedTimestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
    const savedPeriodKey = localStorage.getItem('stockBroker_selectedPeriod');
    
    if (savedHistory && savedTimestamp && savedPeriodKey === period.value) {
      const timestamp = parseInt(savedTimestamp, 10);
      const age = Date.now() - timestamp;
      
      // Use saved data if less than 1 hour old and same period
      if (age < 60 * 60 * 1000) {
        const parsed = JSON.parse(savedHistory);
        const hasAllStocks = SUPPORTED_STOCKS.every(ticker => 
          parsed[ticker] && parsed[ticker].length >= 2
        );
        
        if (hasAllStocks) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load saved history:', e);
  }
  return null;
};

// ==================== COMPONENTS ====================

// Mini sparkline chart component with unique styles per stock
const MiniChart = ({ data, isPositive, width = 80, height = 32, ticker = '' }) => {
  if (!data || data.length < 2) return null;
  
  const prices = data.map(d => typeof d === 'object' ? d.price : d);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  
  const points = prices.map((value, index) => {
    const x = (index / (prices.length - 1)) * width;
    const y = height - 4 - ((value - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' ');
  
  // Create area fill path
  const firstX = 0;
  const lastX = width;
  const areaPath = `M ${firstX},${height} L ${points.split(' ').map(p => p.replace(',', ' ')).join(' L ')} L ${lastX},${height} Z`;
  
  // Unique gradient ID per ticker
  const gradientId = `gradient-${ticker || 'default'}-${isPositive ? 'up' : 'down'}`;
  
  // Get stock-specific styling
  const getStockStyle = () => {
    const pattern = STOCK_PATTERNS[ticker];
    if (!pattern) return { strokeWidth: 1.5, opacity: 0.15 };
    
    switch(pattern.trend) {
      case 'volatile':
        return { strokeWidth: 2, opacity: 0.2, dashArray: '' };
      case 'choppy':
        return { strokeWidth: 1.8, opacity: 0.18 };
      case 'uptrend':
        return { strokeWidth: 1.6, opacity: 0.22 };
      case 'downtrend':
        return { strokeWidth: 1.6, opacity: 0.2 };
      default:
        return { strokeWidth: 1.5, opacity: 0.15 };
    }
  };
  
  const style = getStockStyle();
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? '#22c55e' : '#ef4444';
  
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity={style.opacity} />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      
      {/* Main line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={style.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End point dot */}
      {prices.length > 0 && (
        <circle
          cx={width}
          cy={height - 4 - ((prices[prices.length - 1] - min) / range) * (height - 8)}
          r="2"
          fill={strokeColor}
        />
      )}
    </svg>
  );
};

// Interactive Investment Chart with tooltip
const InvestmentChart = ({ data, hoveredPoint, onHover, period }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 600,
          height: rect.height || 280
        });
      }
    };
    
    // Initial measurement
    const timer = setTimeout(updateDimensions, 100);
    
    // Add resize observer for better responsiveness
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  const { width, height } = dimensions;
  const padding = { top: 20, right: 20, bottom: 45, left: 65 };
  
  if (!data || data.length < 2) {
    return (
      <div ref={containerRef} className="h-80 flex items-center justify-center text-gray-400">
        <Typography>Add stocks to see investment chart</Typography>
      </div>
    );
  }
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const prices = data.map(d => d.price);
  const min = Math.min(...prices) * 0.98;
  const max = Math.max(...prices) * 1.02;
  const range = max - min || 1;
  
  const getX = (index) => padding.left + (index / (data.length - 1)) * chartWidth;
  const getY = (price) => padding.top + chartHeight - ((price - min) / range) * chartHeight;
  
  const points = data.map((d, index) => `${getX(index)},${getY(d.price)}`).join(' ');
  const areaPoints = `${padding.left},${padding.top + chartHeight} ${points} ${padding.left + chartWidth},${padding.top + chartHeight}`;
  
  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    value: min + ratio * range,
    y: padding.top + chartHeight - ratio * chartHeight
  }));
  
  // X-axis labels based on period
  const getXLabels = () => {
    const labels = [];
    const numLabels = 6;
    const step = Math.floor(data.length / numLabels);
    
    for (let i = 0; i < data.length; i += step) {
      if (i >= data.length) break;
      const date = new Date(data[i].timestamp);
      let label;
      
      if (period.value === 'today') {
        label = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      } else if (period.days <= 7) {
        label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      } else if (period.days <= 30) {
        label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else if (period.days <= 365) {
        label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      } else {
        label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }
      labels.push({ label, x: getX(i) });
    }
    return labels;
  };
  
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const index = Math.round((x / chartWidth) * (data.length - 1));
    
    if (index >= 0 && index < data.length) {
      onHover({
        ...data[index],
        index,
        x: getX(index),
        y: getY(data[index].price)
      });
    }
  };
  
  const handleMouseLeave = () => {
    onHover(null);
  };
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '250px',
        position: 'relative', 
        cursor: 'crosshair' 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="investmentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={label.y}
              x2={padding.left + chartWidth}
              y2={label.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4,4"}
            />
            <text
              x={padding.left - 10}
              y={label.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9ca3af"
            >
              {formatINRCompact(label.value)}
            </text>
          </g>
        ))}
        
        {/* X-axis labels */}
        {getXLabels().map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {label.label}
          </text>
        ))}
        
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill="url(#investmentGradient)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Hover indicator */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + chartHeight}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r={6}
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(hoveredPoint.x - 60, 10), width - 140),
            top: Math.max(hoveredPoint.y - 75, 10),
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '120px',
          }}
        >
          <Typography variant="caption" className="text-gray-500 block mb-1">
            {new Date(hoveredPoint.timestamp).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
          <Typography variant="caption" className="text-gray-400 block mb-1">
            {new Date(hoveredPoint.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </Typography>
          <Typography variant="body1" className="font-bold text-gray-800">
            {formatINR(hoveredPoint.price)}
          </Typography>
        </div>
      )}
    </div>
  );
};

// Sidebar menu items
const menuItems = [
  { icon: Dashboard, label: 'Dashboard', id: 'dashboard', active: true },
  { icon: ShowChart, label: 'Stock Lists', id: 'stocks' },
  { icon: Person, label: 'Profile', id: 'profile' },
];

// ==================== MAIN COMPONENT ====================

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, stockData, connect, disconnect, requestSubscriptionUpdate } = useSocket();
  
  // State
  const [subscribedStocks, setSubscribedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stockPrices, setStockPrices] = useState(INITIAL_STOCK_PRICES);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[0]); // Default to Today
  
  // Initialize price history and changes immediately with unique data per stock
  // Always generate fresh data - seeded random ensures consistency per stock
  const [priceHistory, setPriceHistory] = useState(() => {
    const defaultPeriod = TIME_PERIODS[0];
    return initializePriceHistory(defaultPeriod).history;
  });
  
  const [priceChanges, setPriceChanges] = useState(() => {
    const defaultPeriod = TIME_PERIODS[0];
    return initializePriceHistory(defaultPeriod).changes;
  });
  
  const [investmentHistory, setInvestmentHistory] = useState([]);
  const [periodAnchorEl, setPeriodAnchorEl] = useState(null);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed on mobile
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date()); // Real-time clock
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('stockNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const lastPriceCheckRef = useRef({});

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('stockNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add notification helper
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Set sidebar open on desktop by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time clock update every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Price change notifications for subscribed stocks
  useEffect(() => {
    const checkPriceChanges = () => {
      subscribedStocks.forEach(ticker => {
        if (stockPrices[ticker]) {
          const currentPriceINR = stockPrices[ticker] * USD_TO_INR;
          const lastCheck = lastPriceCheckRef.current[ticker];
          
          if (lastCheck) {
            const priceChange = ((currentPriceINR - lastCheck) / lastCheck) * 100;
            // Only notify if price change is significant (> 1%)
            if (Math.abs(priceChange) > 1) {
              const isIncrease = priceChange > 0;
              addNotification({
                type: 'price_change',
                ticker,
                stockName: STOCK_INFO[ticker]?.name || ticker,
                message: `${STOCK_INFO[ticker]?.name || ticker} has ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)}%`,
                priceChange: priceChange.toFixed(2),
                currentPrice: currentPriceINR,
                isPositive: isIncrease
              });
            }
          }
          lastPriceCheckRef.current[ticker] = currentPriceINR;
        }
      });
    };

    // Check every 5 minutes (300000ms)
    const priceCheckInterval = setInterval(checkPriceChanges, 300000);
    
    return () => clearInterval(priceCheckInterval);
  }, [subscribedStocks, stockPrices, addNotification]);
  
  // Subscription dialog state removed - using inline actions

  // Fetch subscribed stocks from backend
  useEffect(() => {
    const fetchSubscribed = async () => {
      try {
        const response = await stockService.getSubscribedStocks();
        if (response?.success) {
          setSubscribedStocks(response.data || []);
        }
      } catch (e) {
        console.error('Error fetching subscriptions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribed();
  }, []);

  // Update price history when period changes - always generate unique data immediately
  useEffect(() => {
    // Always generate fresh unique data for each stock when period changes
    // This ensures immediate visual difference between stocks
    const { history, changes } = initializePriceHistory(selectedPeriod);
    
    setPriceHistory(history);
    setPriceChanges(changes);
    savePriceHistory(history);
    localStorage.setItem('stockBroker_selectedPeriod', selectedPeriod.value);
  }, [selectedPeriod]);

  // Update prices from Socket.io - use synchronized server data
  useEffect(() => {
    if (stockData && Object.keys(stockData).length > 0) {
      // Update stock prices from socket (server sends synchronized data)
      setStockPrices(prev => {
        const newPrices = { ...prev };
        Object.keys(stockData).forEach(ticker => {
          if (stockData[ticker]?.price) {
            newPrices[ticker] = stockData[ticker].price;
          }
        });
        return newPrices;
      });
      
      // Update price changes from server (synchronized for all users)
      setPriceChanges(prev => {
        const newChanges = { ...prev };
        Object.keys(stockData).forEach(ticker => {
          if (stockData[ticker]) {
            const change = stockData[ticker].change || 0;
            newChanges[ticker] = {
              percent: change,
              isPositive: change >= 0,
              value: (stockData[ticker].price * USD_TO_INR) * (change / 100)
            };
          }
        });
        return newChanges;
      });
      
      // Update price history from server (synchronized for all users)
      setPriceHistory(prev => {
        const newHistory = { ...prev };
        Object.keys(stockData).forEach(ticker => {
          if (stockData[ticker]?.history && stockData[ticker].history.length > 0) {
            // Convert server history to our format
            newHistory[ticker] = stockData[ticker].history.map((price, index) => ({
              price: price * USD_TO_INR,
              timestamp: Date.now() - (stockData[ticker].history.length - index) * 1000
            }));
          }
        });
        return newHistory;
      });
      
      setLastUpdateTime(new Date());
    }
  }, [stockData]);

  // Calculate investment history from subscribed stocks
  useEffect(() => {
    if (Object.keys(priceHistory).length === 0 || subscribedStocks.length === 0) {
      setInvestmentHistory([]);
      return;
    }
    
    if (subscribedStocks.length === 0) {
      setInvestmentHistory([]);
      return;
    }
    
    // Get minimum history length
    let minLength = Infinity;
    subscribedStocks.forEach(ticker => {
      if (priceHistory[ticker]) {
        minLength = Math.min(minLength, priceHistory[ticker].length);
      }
    });
    
    if (minLength === Infinity || minLength < 2) {
      setInvestmentHistory([]);
      return;
    }
    
    const history = [];
    for (let i = 0; i < minLength; i++) {
      let totalValue = 0;
      let hasValidData = true;
      
      subscribedStocks.forEach(ticker => {
        const priceData = priceHistory[ticker]?.[i];
        if (priceData) {
          totalValue += priceData.price;
        } else {
          hasValidData = false;
        }
      });
      
      if (hasValidData && totalValue > 0) {
        const timestamp = priceHistory[subscribedStocks[0]]?.[i]?.timestamp || Date.now();
        history.push({ price: totalValue, timestamp });
      }
    }
    
    setInvestmentHistory(history);
  }, [priceHistory, subscribedStocks]);

  // Fetch subscribed stocks
  const fetchSubscribedStocks = useCallback(async () => {
    console.log('Fetching subscribed stocks...');
    try {
      const response = await stockService.getSubscribedStocks();
      console.log('Subscribed stocks response:', response);
      if (response.success) {
        setSubscribedStocks(response.data || []);
      } else {
        setSubscribedStocks([]);
      }
    } catch (error) {
      console.error('Error fetching subscribed stocks:', error);
      setSubscribedStocks([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribedStocks();
    connect();
    return () => disconnect();
  }, [fetchSubscribedStocks, connect, disconnect]);

  // Toggle subscription (subscribe/unsubscribe)
  const handleSubscriptionToggle = async (ticker) => {
    console.log('handleSubscriptionToggle called for:', ticker);
    setActionLoading(ticker);
    try {
      const isSubscribed = subscribedStocks.includes(ticker);
      console.log('isSubscribed:', isSubscribed);
      const response = isSubscribed
        ? await stockService.unsubscribe(ticker)
        : await stockService.subscribe(ticker);

      console.log('Response:', response);
      if (response?.success) {
        setSubscribedStocks(response.data || []);
        requestSubscriptionUpdate();
        
        // Add notification
        addNotification({
          type: isSubscribed ? 'unsubscribe' : 'subscribe',
          ticker,
          stockName: STOCK_INFO[ticker]?.name || ticker,
          message: `You ${isSubscribed ? 'unsubscribed from' : 'subscribed to'} ${STOCK_INFO[ticker]?.name || ticker}`,
          isPositive: !isSubscribed
        });
        
        setSnackbar({
          open: true,
          message: isSubscribed ? `Unsubscribed from ${STOCK_INFO[ticker]?.name}` : `Subscribed to ${STOCK_INFO[ticker]?.name}`,
          severity: 'success'
        });
      } else {
        console.error('Response not successful:', response);
      }
    } catch (error) {
      console.error('Error in handleSubscriptionToggle:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Subscription update failed', 
        severity: 'error' 
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Logout
  const handleLogout = () => {
    disconnect();
    logout();
    navigate('/');
  };

  // Calculate subscription metrics
  const subscriptionMetrics = useMemo(() => {
    let totalValue = 0;
    
    subscribedStocks.forEach((ticker) => {
      totalValue += (stockPrices[ticker] || INITIAL_STOCK_PRICES[ticker]) * USD_TO_INR;
    });
    
    return {
      totalSubscriptions: subscribedStocks.length,
      totalValue,
      activeUpdates: subscribedStocks.length
    };
  }, [subscribedStocks, stockPrices]);

  // Portfolio stocks (first 4 for cards)
  const portfolioStocks = useMemo(() => {
    return subscribedStocks.slice(0, 4);
  }, [subscribedStocks]);

  if (loading) {
    return (
      <Box className="min-h-screen bg-gray-100 flex items-center justify-center">
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-[#f1f5f9] flex">
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <Box 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <Box 
        className={`
          ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72'} 
          bg-[#1c2434] min-h-screen flex flex-col transition-all duration-300 
          fixed lg:relative z-40
        `}
        sx={{ flexShrink: 0 }}
      >
        {/* Logo */}
        <Box className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
          <Box className="flex items-center gap-3">
            <Box 
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              sx={{ 
                background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 7H21V11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            {!sidebarCollapsed && (
              <Box>
                <Typography 
                  variant="subtitle1" 
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
                    color: '#34d399', 
                    fontWeight: 700, 
                    fontSize: '0.65rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase'
                  }}
                >
                  CLient
                </Typography>
              </Box>
            )}
          </Box>
          {/* Close button for mobile only */}
          <IconButton 
            onClick={() => setSidebarCollapsed(true)}
            sx={{ 
              color: '#9ca3af',
              display: { xs: 'flex', lg: 'none' }
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Menu */}
        <Box className="flex-1 py-4 overflow-y-auto">
          {!sidebarCollapsed && (
            <Typography variant="caption" className="px-6 text-gray-500 uppercase tracking-wider mb-2 block">
              Menu
            </Typography>
          )}
          
          {menuItems.map((item, index) => (
            <Box
              key={index}
              onClick={() => {
                setActiveMenu(item.id);
                // Close sidebar on mobile after clicking menu item
                if (window.innerWidth < 1024) {
                  setSidebarCollapsed(true);
                }
              }}
              className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                activeMenu === item.id ? 'bg-[#333a48] text-white' : 'text-gray-400 hover:bg-[#333a48] hover:text-white'
              }`}
            >
              <item.icon sx={{ fontSize: 20 }} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-sm">{item.label}</span>
                </>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Main Content */}
      <Box className={`flex-1 flex flex-col min-h-screen overflow-hidden ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-0'}`}>
        {/* Top Header */}
        <Box className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <Box className="flex items-center gap-4">
            <IconButton 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              sx={{ 
                color: '#1f2937',
                '&:hover': { backgroundColor: '#f3f4f6' }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 w-64 lg:w-80 relative">
              <Search sx={{ color: '#1f2937', fontSize: 20 }} />
              <InputBase 
                placeholder="Search stocks..." 
                className="ml-2 flex-1 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                sx={{ 
                  fontSize: 14,
                  color: '#1f2937',
                  '& input::placeholder': {
                    color: '#1f2937',
                    opacity: 0.7,
                  }
                }}
              />
              {/* Search Dropdown */}
              {searchFocused && searchQuery.length > 0 && (
                <Box 
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                  sx={{ maxHeight: 300, overflowY: 'auto' }}
                >
                  {SUPPORTED_STOCKS
                    .filter(ticker => 
                      ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      STOCK_INFO[ticker].name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      STOCK_INFO[ticker].fullName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(ticker => (
                      <Box
                        key={ticker}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchFocused(false);
                          handleSubscriptionToggle(ticker);
                        }}
                      >
                        <Box 
                          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100"
                        >
                          <img 
                            src={STOCK_INFO[ticker].logo} 
                            alt={ticker}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<span style="font-weight: 700; font-size: 12px; color: ${STOCK_INFO[ticker].color}">${ticker.slice(0,2)}</span>`;
                            }}
                          />
                        </Box>
                        <Box className="flex-1">
                          <Typography variant="body2" className="font-semibold text-gray-900">
                            {ticker}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500">
                            {STOCK_INFO[ticker].fullName}
                          </Typography>
                        </Box>
                        <Box className="text-right">
                          <Typography variant="body2" className="font-semibold text-gray-900">
                            ₹{(stockPrices[ticker] * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </Typography>
                          {priceChanges[ticker] && (
                            <Typography 
                              variant="caption" 
                              className={priceChanges[ticker].isPositive ? 'text-green-600' : 'text-red-600'}
                            >
                              {priceChanges[ticker].isPositive ? '+' : ''}{priceChanges[ticker].percent.toFixed(2)}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))
                  }
                  {SUPPORTED_STOCKS.filter(ticker => 
                    ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    STOCK_INFO[ticker].name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    STOCK_INFO[ticker].fullName.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <Box className="px-4 py-6 text-center">
                      <Typography variant="body2" className="text-gray-500">
                        No stocks found matching "{searchQuery}"
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Box className="flex items-center gap-2 md:gap-4">
            <Box className="hidden sm:flex items-center gap-2 text-xs md:text-sm bg-green-50 text-green-700 px-2 md:px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Live</span>
              <span className="hidden md:inline text-gray-400">• {currentTime.toLocaleTimeString('en-IN')}</span>
            </Box>
            
            <IconButton 
              size="small"
              onClick={() => setNotificationsOpen(true)}
              sx={{ position: 'relative' }}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error" 
                sx={{ 
                  '& .MuiBadge-badge': { 
                    fontSize: 10, 
                    height: 16, 
                    minWidth: 16,
                    display: unreadCount > 0 ? 'flex' : 'none'
                  } 
                }}
              >
                <Notifications sx={{ color: '#64748b', fontSize: 22 }} />
              </Badge>
            </IconButton>
            
            <Box className="h-6 w-px bg-gray-200 hidden sm:block" />
            
            {/* User Dropdown */}
            <Box 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            >
              <Box className="text-right hidden md:block">
                <Typography variant="body2" className="font-semibold text-gray-800 text-sm">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" className="text-gray-500 text-xs">
              
                </Typography>
              </Box>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#3b82f6', fontSize: 14 }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <KeyboardArrowDown sx={{ color: '#64748b', fontSize: 20 }} />
            </Box>
            
            {/* User Dropdown Menu */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  backgroundColor: '#1c2434',
                }
              }}
            >
              <Box className="px-4 py-3 border-b border-gray-700">
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  {user?.email || 'user@email.com'}
                </Typography>
              </Box>
              <MenuItem 
                onClick={() => {
                  setUserMenuAnchor(null);
                  setActiveMenu('profile');
                }}
                sx={{ py: 1.5, color: '#e5e7eb', '&:hover': { backgroundColor: '#333a48' } }}
              >
                <Person sx={{ fontSize: 20, mr: 1.5, color: '#9ca3af' }} />
                <Typography variant="body2">My Profile</Typography>
              </MenuItem>
              <MenuItem 
                onClick={() => {
                  setUserMenuAnchor(null);
                  setActiveMenu('dashboard');
                }}
                sx={{ py: 1.5, color: '#e5e7eb', '&:hover': { backgroundColor: '#333a48' } }}
              >
                <Dashboard sx={{ fontSize: 20, mr: 1.5, color: '#9ca3af' }} />
                <Typography variant="body2">Dashboard</Typography>
              </MenuItem>
              <MenuItem 
                onClick={() => {
                  setUserMenuAnchor(null);
                  setActiveMenu('stocks');
                }}
                sx={{ py: 1.5, color: '#e5e7eb', '&:hover': { backgroundColor: '#333a48' } }}
              >
                <ShowChart sx={{ fontSize: 20, mr: 1.5, color: '#9ca3af' }} />
                <Typography variant="body2">Stock Lists</Typography>
              </MenuItem>
              <Box className="border-t border-gray-700 mt-1" />
              <MenuItem 
                onClick={() => {
                  setUserMenuAnchor(null);
                  handleLogout();
                }}
                sx={{ py: 1.5, color: '#ef4444' }}
              >
                <Logout sx={{ fontSize: 20, mr: 1.5 }} />
                <Typography variant="body2">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Dashboard Content */}
        <Box className="flex-1 p-3 md:p-6 overflow-auto">
          
          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Portfolio Cards */}
              <Box className="mb-6">
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle1" className="font-semibold text-gray-800">
                    Subscribed Stocks ({subscribedStocks.length})
                  </Typography>
                </Box>
            
                <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                  {portfolioStocks.length > 0 ? portfolioStocks.map((ticker) => {
                    const info = STOCK_INFO[ticker];
                    const priceINR = (stockPrices[ticker] || INITIAL_STOCK_PRICES[ticker]) * USD_TO_INR;
                    const change = priceChanges[ticker] || { percent: 0, isPositive: true };
                const history = priceHistory[ticker] || [];
                
                return (
                  <Box 
                    key={ticker}
                    className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative"
                  >
                    <Box className="flex items-start justify-between">
                      <Box className="flex items-center gap-3">
                        <Box className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                          <img 
                            src={info.logo} 
                            alt={ticker}
                            className="w-6 h-6 md:w-7 md:h-7 object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${ticker}&background=random&size=40`;
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" className="font-semibold text-gray-800">
                            {info.name}
                          </Typography>
                          <Typography variant="caption" className="text-gray-400">
                            Subscribed
                          </Typography>
                        </Box>
                      </Box>
                      <MiniChart data={history} isPositive={change.isPositive} ticker={ticker} />
                    </Box>
                    
                    <Box className="mt-4 flex items-end justify-between">
                      <Box>
                        <Typography variant="caption" className="text-gray-500">
                          Current Price
                        </Typography>
                        <Typography variant="subtitle1" className="font-bold text-gray-800">
                          {formatINR(priceINR)}
                        </Typography>
                      </Box>
                      <Box className="text-right">
                        <Typography variant="caption" className="text-gray-500">
                          Change
                        </Typography>
                        <Box className="flex items-center gap-1 justify-end">
                          <Typography 
                            variant="body2" 
                            className="font-semibold"
                            sx={{ color: change.isPositive ? '#22c55e' : '#ef4444' }}
                          >
                            {change.isPositive ? '+' : ''}{change.percent.toFixed(2)}%
                          </Typography>
                          {change.isPositive ? 
                            <TrendingUp sx={{ fontSize: 14, color: '#22c55e' }} /> : 
                            <TrendingDown sx={{ fontSize: 14, color: '#ef4444' }} />
                          }
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Action buttons */}
                    <Box className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={actionLoading === ticker ? <CircularProgress size={14} /> : <Remove />}
                        onClick={() => handleSubscriptionToggle(ticker)}
                        disabled={actionLoading === ticker}
                        sx={{ textTransform: 'none', fontSize: 11, flex: 1 }}
                      >
                        Unsubscribe
                      </Button>
                    </Box>
                  </Box>
                );
              }) : (
                <Box className="col-span-full bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <ShowChart sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" className="text-gray-500 mb-1">
                    No subscribed stocks
                  </Typography>
                  <Typography variant="caption" className="text-gray-400">
                    Subscribe to stocks from the list below to track live updates
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Main Grid */}
          <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Investment Chart */}
            <Box className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Box className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Typography variant="subtitle1" className="font-semibold text-gray-800">
                Subscription Summary
                </Typography>
                <Box 
                  className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={(e) => setPeriodAnchorEl(e.currentTarget)}
                >
                  <span>{selectedPeriod.label}</span>
                  <KeyboardArrowDown sx={{ fontSize: 18 }} />
                </Box>
                <Menu
                  anchorEl={periodAnchorEl}
                  open={Boolean(periodAnchorEl)}
                  onClose={() => setPeriodAnchorEl(null)}
                >
                  {TIME_PERIODS.map((period) => (
                    <MenuItem
                      key={period.value}
                      selected={selectedPeriod.value === period.value}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setPeriodAnchorEl(null);
                      }}
                      sx={{ fontSize: 14 }}
                    >
                      {period.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
              
              <Box className="p-4 md:p-5">
                <Box className="flex flex-wrap items-start gap-4 md:gap-8 mb-6">
                  <Box>
                    <Typography variant="caption" className="text-gray-500">
                      Total Subscriptions
                    </Typography>
                    <Typography variant="h6" className="font-bold text-gray-800">
                      {subscriptionMetrics.totalSubscriptions}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-gray-500">
                      Total Value
                    </Typography>
                    <Typography variant="h6" className="font-bold text-gray-800">
                      {formatINR(subscriptionMetrics.totalValue)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-gray-500">
                      Active Updates
                    </Typography>
                    <Box className="flex items-center gap-2">
                      <Typography 
                        variant="h6" 
                        className="font-bold"
                        sx={{ color: '#22c55e' }}
                      >
                        {subscriptionMetrics.activeUpdates}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ color: '#22c55e' }}
                      >
                        Live ▲
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box style={{ height: '280px', width: '100%' }}>
                  <InvestmentChart 
                    data={investmentHistory} 
                    hoveredPoint={hoveredChartPoint}
                    onHover={setHoveredChartPoint}
                    period={selectedPeriod}
                  />
                </Box>
              </Box>
            </Box>

            {/* Subscribed Stocks */}
            <Box className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <Box className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between">
                <Typography variant="subtitle1" className="font-semibold text-gray-800">
                  Subscribed Stocks
                </Typography>
                <Box className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </Box>
              </Box>
              
              <Box className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto">
                {subscribedStocks.length === 0 && (
                  <Box className="p-6 text-center">
                    <Typography variant="body2" className="text-gray-500 mb-1">
                      No subscribed stocks
                    </Typography>
                    <Typography variant="caption" className="text-gray-400">
                      Subscribe from the stock list to start receiving live updates.
                    </Typography>
                  </Box>
                )}

                {subscribedStocks.map((ticker) => {
                  const info = STOCK_INFO[ticker];
                  const priceINR = (stockPrices[ticker] || INITIAL_STOCK_PRICES[ticker]) * USD_TO_INR;
                  const change = priceChanges[ticker] || { percent: 0, isPositive: true };
                  
                  return (
                    <Box 
                      key={ticker}
                      className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 transition-colors"
                    >
                      <Box className="flex items-center gap-3">
                        <Box className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                          <img 
                            src={info.logo} 
                            alt={ticker}
                            className="w-5 h-5 md:w-6 md:h-6 object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${ticker}&background=random&size=40`;
                            }}
                          />
                        </Box>
                        <Box>
                          <Box className="flex items-center gap-2">
                            <Typography variant="body2" className="font-semibold text-gray-800">
                              {info.name}
                            </Typography>
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                              Subscribed
                            </span>
                          </Box>
                          <Typography variant="caption" className="text-gray-400">
                            {info.sector}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box className="flex items-center gap-2 md:gap-3">
                        <Box className="text-right">
                          <Typography variant="body2" className="font-semibold text-gray-800">
                            {formatINR(priceINR)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: change.isPositive ? '#22c55e' : '#ef4444' }}
                          >
                            {change.isPositive ? '+' : ''}{change.percent.toFixed(2)}%
                          </Typography>
                        </Box>
                        
                        <Tooltip title="Unsubscribe">
                          <IconButton
                            size="small"
                            onClick={() => handleSubscriptionToggle(ticker)}
                            disabled={actionLoading === ticker}
                            sx={{
                              bgcolor: '#fef2f2',
                              color: '#ef4444',
                              width: 32,
                              height: 32,
                              '&:hover': {
                                bgcolor: '#fee2e2',
                              }
                            }}
                          >
                            {actionLoading === ticker ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <Remove sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
            </>
          )}

          {/* Stock Lists View */}
          {activeMenu === 'stocks' && (
            <Box>
              {/* Header */}
              <Box className="mb-6">
                <Typography variant="h5" className="font-bold text-gray-800 mb-1">
                  Stock Lists
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  Browse and manage all available stocks
                </Typography>
              </Box>

              {/* Stats Cards */}
              <Box className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <Box className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <Typography variant="caption" className="text-gray-500">Total Stocks</Typography>
                  <Typography variant="h5" className="font-bold text-gray-800">{SUPPORTED_STOCKS.length}</Typography>
                </Box>
                <Box className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <Typography variant="caption" className="text-gray-500">Subscribed</Typography>
                  <Typography variant="h5" className="font-bold text-emerald-600">{subscribedStocks.length}</Typography>
                </Box>
                <Box className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <Typography variant="caption" className="text-gray-500">Gainers</Typography>
                  <Typography variant="h5" className="font-bold text-green-600">
                    {SUPPORTED_STOCKS.filter(t => priceChanges[t]?.isPositive).length}
                  </Typography>
                </Box>
                <Box className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <Typography variant="caption" className="text-gray-500">Losers</Typography>
                  <Typography variant="h5" className="font-bold text-red-600">
                    {SUPPORTED_STOCKS.filter(t => priceChanges[t] && !priceChanges[t].isPositive).length}
                  </Typography>
                </Box>
              </Box>

              {/* Stock List Table */}
              <Box className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header */}
                <Box className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <Typography variant="subtitle1" className="font-semibold text-gray-800">
                    All Available Stocks
                  </Typography>
                  <Box className="flex items-center gap-2">
                    <Box className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      Live Prices
                    </Box>
                  </Box>
                </Box>

                {/* Table Content */}
                <Box className="divide-y divide-gray-100">
                  {/* Table Head */}
                  <Box className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <Box className="col-span-4">Stock</Box>
                    <Box className="col-span-2 text-right">Price</Box>
                    <Box className="col-span-2 text-right">Change</Box>
                    <Box className="col-span-2 text-center">Status</Box>
                    <Box className="col-span-2 text-center">Action</Box>
                  </Box>

                  {/* Stock Rows */}
                  {SUPPORTED_STOCKS.map((ticker) => {
                    const info = STOCK_INFO[ticker];
                    const priceINR = (stockPrices[ticker] || INITIAL_STOCK_PRICES[ticker]) * USD_TO_INR;
                    const change = priceChanges[ticker] || { percent: 0, isPositive: true };
                    const isSubscribed = subscribedStocks.includes(ticker);
                    const history = priceHistory[ticker] || [];
                    
                    return (
                      <Box 
                        key={ticker}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-gray-50 transition-colors items-center"
                      >
                        {/* Stock Info */}
                        <Box className="col-span-1 md:col-span-4 flex items-center gap-3">
                          <Box className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
                            <img 
                              src={info.logo} 
                              alt={ticker}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${ticker}&background=random&size=48`;
                              }}
                            />
                          </Box>
                          <Box>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-gray-800">
                                {ticker}
                              </Typography>
                              {isSubscribed && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                                  SUBSCRIBED
                                </span>
                              )}
                            </Box>
                            <Typography variant="body2" className="text-gray-500">
                              {info.fullName}
                            </Typography>
                            <Typography variant="caption" className="text-gray-400">
                              {info.sector}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Price */}
                        <Box className="md:col-span-2 flex md:justify-end items-center gap-2">
                          <Typography variant="caption" className="text-gray-400 md:hidden">Price:</Typography>
                          <Typography variant="body1" className="font-bold text-gray-800">
                            {formatINR(priceINR)}
                          </Typography>
                        </Box>

                        {/* Change */}
                        <Box className="md:col-span-2 flex md:justify-end items-center gap-2">
                          <Typography variant="caption" className="text-gray-400 md:hidden">Change:</Typography>
                          <Box 
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            sx={{ 
                              backgroundColor: change.isPositive ? '#dcfce7' : '#fee2e2',
                            }}
                          >
                            {change.isPositive ? 
                              <TrendingUp sx={{ fontSize: 16, color: '#16a34a' }} /> : 
                              <TrendingDown sx={{ fontSize: 16, color: '#dc2626' }} />
                            }
                            <Typography 
                              variant="body2" 
                              className="font-semibold"
                              sx={{ color: change.isPositive ? '#16a34a' : '#dc2626' }}
                            >
                              {change.isPositive ? '+' : ''}{change.percent.toFixed(2)}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status / Mini Chart */}
                        <Box className="md:col-span-2 flex justify-center items-center">
                          <Box className="w-20 h-10">
                            <MiniChart data={history} isPositive={change.isPositive} ticker={ticker} />
                          </Box>
                        </Box>

                        {/* Action */}
                        <Box className="md:col-span-2 flex justify-center md:justify-center gap-2">
                          <Button
                            size="small"
                            variant={subscribedStocks.includes(ticker) ? 'outlined' : 'contained'}
                            color={subscribedStocks.includes(ticker) ? 'error' : 'primary'}
                            startIcon={actionLoading === ticker ? <CircularProgress size={14} color="inherit" /> : (subscribedStocks.includes(ticker) ? <Remove /> : <Add />)}
                            onClick={() => handleSubscriptionToggle(ticker)}
                            disabled={actionLoading === ticker}
                            sx={{ 
                              textTransform: 'none', 
                              fontSize: 12,
                              borderRadius: '8px',
                              px: 3
                            }}
                          >
                            {subscribedStocks.includes(ticker) ? 'Unsubscribe' : 'Subscribe'}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* Profile View */}
          {activeMenu === 'profile' && (
            <Box>
              <Box className="mb-6">
                <Typography variant="h5" className="font-bold text-gray-800 mb-1">
                  My Profile
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  Manage your account settings
                </Typography>
              </Box>

              <Box className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <Box className="flex items-center gap-4 mb-6">
                  <Avatar sx={{ width: 80, height: 80, bgcolor: '#3b82f6', fontSize: 32 }}>
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" className="font-bold text-gray-800">
                      {user?.name || 'User'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                      {user?.email || 'user@email.com'}
                    </Typography>
                    <Box className="flex items-center gap-2 mt-1">
                     
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        Active
                      </span>
                    </Box>
                  </Box>
                </Box>

                <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Box className="bg-gray-50 rounded-lg p-4">
                    <Typography variant="caption" className="text-gray-500">Total Subscriptions</Typography>
                    <Typography variant="h6" className="font-bold text-gray-800">
                      {subscriptionMetrics.totalSubscriptions}
                    </Typography>
                  </Box>
                  <Box className="bg-gray-50 rounded-lg p-4">
                    <Typography variant="caption" className="text-gray-500">Total Value</Typography>
                    <Typography variant="h6" className="font-bold text-gray-800">
                      {formatINR(subscriptionMetrics.totalValue)}
                    </Typography>
                  </Box>
                  <Box className="bg-gray-50 rounded-lg p-4">
                    <Typography variant="caption" className="text-gray-500">Active Updates</Typography>
                    <Typography 
                      variant="h6" 
                      className="font-bold"
                      sx={{ color: '#16a34a' }}
                    >
                      {subscriptionMetrics.activeUpdates}
                      <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                        Live
                      </Typography>
                    </Typography>
                  </Box>
                </Box>

                <Box className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={handleLogout}
                    sx={{ textTransform: 'none' }}
                  >
                    Logout
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

        </Box>
      </Box>

      {/* Notifications Panel */}
      <Dialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxHeight: '80vh',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-3">
              <Box 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                sx={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <NotificationsActive sx={{ color: 'white', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Typography variant="caption" sx={{ color: '#10b981' }}>
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <Button
                    size="small"
                    onClick={markAllAsRead}
                    sx={{ 
                      textTransform: 'none', 
                      fontSize: '0.75rem', 
                      color: '#10b981',
                      '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                    }}
                  >
                    Mark all read
                  </Button>
                  <Button
                    size="small"
                    onClick={clearAllNotifications}
                    sx={{ 
                      textTransform: 'none', 
                      fontSize: '0.75rem', 
                      color: '#f87171',
                      '&:hover': { backgroundColor: 'rgba(248, 113, 113, 0.1)' }
                    }}
                  >
                    Clear all
                  </Button>
                </>
              )}
              <IconButton 
                size="small" 
                onClick={() => setNotificationsOpen(false)}
                sx={{ color: '#94a3b8', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              >
                <Close sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, backgroundColor: 'transparent' }}>
          {notifications.length === 0 ? (
            <Box className="flex flex-col items-center justify-center py-16">
              <Box 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Notifications sx={{ fontSize: 32, color: '#475569' }} />
              </Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>
                No notifications yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Buy stocks to receive updates
              </Typography>
            </Box>
          ) : (
            <Box>
              {notifications.map((notification, index) => (
                <Box
                  key={notification.id}
                  className="cursor-pointer transition-all"
                  onClick={() => markAsRead(notification.id)}
                  sx={{
                    px: 2.5,
                    py: 2,
                    backgroundColor: !notification.read ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    borderBottom: index < notifications.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <Box className="flex items-start gap-3">
                    {/* Icon */}
                    <Box
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      sx={{
                        background: notification.type === 'purchase' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : notification.isPositive 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        boxShadow: notification.type === 'purchase' || notification.isPositive
                          ? '0 4px 12px rgba(16, 185, 129, 0.25)'
                          : '0 4px 12px rgba(239, 68, 68, 0.25)'
                      }}
                    >
                      {notification.type === 'purchase' ? (
                        <ShoppingCart sx={{ fontSize: 20, color: 'white' }} />
                      ) : (
                        notification.isPositive ? (
                          <TrendingUp sx={{ fontSize: 20, color: 'white' }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 20, color: 'white' }} />
                        )
                      )}
                    </Box>
                    
                    {/* Content */}
                    <Box className="flex-1 min-w-0">
                      <Box className="flex items-center gap-2 mb-1">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                          {notification.type === 'purchase' ? 'Purchase Successful' : 'Price Alert'}
                        </Typography>
                        {!notification.read && (
                          <Box 
                            className="w-2 h-2 rounded-full"
                            sx={{ backgroundColor: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1, lineHeight: 1.5 }}>
                        {notification.message}
                      </Typography>
                      {notification.type === 'purchase' && notification.totalCost && (
                        <Box 
                          sx={{ 
                            display: 'inline-block',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderRadius: '8px',
                            px: 1.5,
                            py: 0.5,
                            mb: 1
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600 }}>
                            Total: {formatINR(notification.totalCost)}
                          </Typography>
                        </Box>
                      )}
                      {notification.type === 'price_change' && (
                        <Box className="flex items-center gap-3 mt-1">
                          <Box 
                            sx={{ 
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              px: 1.5,
                              py: 0.5
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              Current: <span style={{ color: '#10b981', fontWeight: 600 }}>{formatINR(notification.currentPrice)}</span>
                            </Typography>
                          </Box>
                          <Box 
                            sx={{ 
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              px: 1.5,
                              py: 0.5
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              Buy: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{formatINR(notification.buyPrice)}</span>
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1.5 }}>
                        {new Date(notification.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    
                    {/* Actions */}
                    <Box className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Tooltip title="Mark as read">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            sx={{ 
                              color: '#10b981',
                              '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          sx={{ 
                            color: '#64748b', 
                            '&:hover': { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' } 
                          }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </Box>
  );
};
export default DashboardPage;

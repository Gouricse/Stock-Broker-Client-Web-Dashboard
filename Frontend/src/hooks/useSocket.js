import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { authService } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://stock-broker-client-web-dashboard.onrender.com';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stockData, setStockData] = useState({}); // { ticker: { price, change, history } }
  const [lastUpdate, setLastUpdate] = useState(null);
  const [subscribedStocks, setSubscribedStocks] = useState([]);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    const token = authService.getToken();
    
    if (!token) {
      console.log('No token available for socket connection');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    // Handle initial snapshot with full stock data
    newSocket.on('prices_snapshot', (data) => {
      console.log('Received prices_snapshot');
      if (data?.stocks && typeof data.stocks === 'object') {
        setStockData(data.stocks);
      }
      if (data?.timestamp) {
        setLastUpdate(data.timestamp);
      }
    });

    // Listen for ALL prices update (broadcasted to everyone - SYNCHRONIZED)
    newSocket.on('all_prices_update', (data) => {
      console.log('Received all_prices_update:', Object.keys(data?.stocks || {}).length, 'stocks');
      if (data?.stocks && typeof data.stocks === 'object') {
        setStockData(data.stocks);
      }
      if (data?.timestamp) {
        setLastUpdate(data.timestamp);
      }
    });

    // Handle individual ticker updates
    newSocket.on('price_update', (data) => {
      if (data?.ticker) {
        setStockData((prev) => ({
          ...prev,
          [data.ticker]: {
            price: data.price,
            change: data.change,
            history: data.history || prev[data.ticker]?.history || []
          }
        }));
        if (data.timestamp) setLastUpdate(data.timestamp);
      }
    });

    newSocket.on('subscribed_stocks', (stocks) => {
      console.log('Subscribed stocks updated:', stocks);
      if (Array.isArray(stocks)) {
        setSubscribedStocks(stocks);
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setStockData({});
      setSubscribedStocks([]);
    }
  }, []);

  const requestSubscriptionUpdate = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update_subscriptions');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    stockData, // { ticker: { price, change, history } }
    lastUpdate,
    subscribedStocks,
    connect,
    disconnect,
    requestSubscriptionUpdate
  };
};

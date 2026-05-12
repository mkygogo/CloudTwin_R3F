import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useTwinStore from '../store/useTwinStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

/**
 * WebSocket hook - 连接数字孪生数据服务
 * 支持自动重连、批量数据更新
 */
export function useDataSocket() {
  const socketRef = useRef(null);
  const setConnected = useTwinStore((s) => s.setConnected);
  const batchUpdateDeviceData = useTwinStore((s) => s.batchUpdateDeviceData);
  const setDeviceData = useTwinStore((s) => s.setDeviceData);
  const addAlert = useTwinStore((s) => s.addAlert);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[DataSocket] connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[DataSocket] disconnected');
      setConnected(false);
    });

    // 单设备数据更新
    socket.on('device:update', ({ deviceId, data }) => {
      setDeviceData(deviceId, data);
    });

    // 批量数据更新 (高频场景)
    socket.on('device:batch', (updates) => {
      batchUpdateDeviceData(updates);
    });

    // 告警推送
    socket.on('alert', (alert) => {
      addAlert(alert);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}

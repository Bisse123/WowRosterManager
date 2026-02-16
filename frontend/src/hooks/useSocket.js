import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useSocket(url) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!url) return;

    // Configure reconnection behavior to be resilient to intermittent tunnel hiccups
    const opts = {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    };

    const socketInstance = io(url, opts);
    setSocket(socketInstance);

    // Helpful debug logs to observe reconnect behavior in the browser console
    const log = (...args) => {
      try { console.debug('[socket]', ...args); } catch (e) {}
    };

    socketInstance.on('connect', () => log('connect', socketInstance.id));
    socketInstance.on('disconnect', (reason) => log('disconnect', reason));
    socketInstance.on('reconnect_attempt', (attempt) => log('reconnect_attempt', attempt));
    socketInstance.on('reconnect_error', (err) => log('reconnect_error', err && err.message));
    socketInstance.on('reconnect_failed', () => log('reconnect_failed'));

    return () => {
      try {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('reconnect_attempt');
        socketInstance.off('reconnect_error');
        socketInstance.off('reconnect_failed');
      } catch (e) {}
      socketInstance.disconnect();
    };
  }, [url]);

  return socket;
}

export default useSocket;
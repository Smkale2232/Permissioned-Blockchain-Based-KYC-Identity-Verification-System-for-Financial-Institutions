import { createContext, useContext, useState, useCallback } from 'react';

const NotificationsContext = createContext(null);
let idCounter = 0;
const MAX_NOTIFICATIONS = 20;

// Session-only (not persisted) — populated by the dashboards' existing
// silent background polls whenever they notice something changed, so this
// doesn't need its own polling or a backend notifications API.
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message) => {
    setNotifications((prev) =>
      [{ id: ++idCounter, message, timestamp: new Date().toISOString(), read: false }, ...prev].slice(0, MAX_NOTIFICATIONS)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAllRead, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

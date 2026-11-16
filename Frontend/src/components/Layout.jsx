import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login'); };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 10 } }),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(listRes.data.data || []);
      setUnreadCount(countRes.data.data?.unreadCount || 0);
    } catch {
      // Silently ignore notification fetch failures.
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Position the panel relative to the bell, flipping to stay in the viewport.
  useEffect(() => {
    if (!showPanel) return;
    const position = () => {
      const bell = bellRef.current;
      const panel = panelRef.current;
      if (!bell || !panel) return;
      const rect = bell.getBoundingClientRect();
      const panelW = panel.offsetWidth;
      const gap = 8;
      let left = rect.right - panelW;
      let top = rect.bottom + gap;
      // Flip horizontally if it would overflow the left edge.
      if (left < 8) left = rect.left;
      // Flip vertically if it would overflow the bottom of the viewport.
      if (top + panel.offsetHeight > window.innerHeight - 8) {
        top = rect.top - panel.offsetHeight - gap;
      }
      // Keep within horizontal bounds.
      left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [showPanel]);

  // Close the panel on Escape or outside click.
  useEffect(() => {
    if (!showPanel) return;
    const onDown = (e) => {
      if (bellRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setShowPanel(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setShowPanel(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showPanel]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const markReadAndClose = async (id) => {
    try {
      await api.put('/notifications/mark-read', { ids: [id] });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/dashboard">SplitShare</Link>
        <nav>
          {user && (
            <>
              <span className="welcome">Hi, {user.name}</span>
              <Link className="nav-link" to="/profile">Profile</Link>
              <div className="notification-bell">
                <button
                  ref={bellRef}
                  className="bell-button"
                  onClick={() => setShowPanel(!showPanel)}
                  aria-label="Notifications"
                  aria-expanded={showPanel}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {showPanel && (
                  <div
                    ref={panelRef}
                    className="notification-panel"
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="notification-panel-header">
                      <strong>Notifications</strong>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {unreadCount > 0 && (
                          <button className="text-button" onClick={markAllRead}>Mark all read</button>
                        )}
                        <button className="text-button" onClick={() => setShowPanel(false)}>✕</button>
                      </div>
                    </div>
                    <div className="notification-panel-list">
                      {notifications.length ? (
                        notifications.map(n => (
                          <div
                            key={n._id}
                            className={`notification-item ${n.read ? 'read' : 'unread'}`}
                            onClick={() => markReadAndClose(n._id)}
                          >
                            <div className="notification-title">{n.title}</div>
                            <div className="notification-message">{n.message}</div>
                            <div className="notification-time">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button className="link-button" onClick={signOut}>Logout</button>
            </>
          )}
        </nav>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
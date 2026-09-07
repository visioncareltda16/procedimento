'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Bell, User, Sun, Moon, Check, Menu } from 'lucide-react';
import styles from './Header.module.css';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getSystemSetting } from '@/app/actions';
import { useSession } from 'next-auth/react';
import SessionTimer from './SessionTimer';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(60);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || 'Usuário';
  const userRole = (session?.user as any)?.role === 'ADMIN' ? 'Administrador' : 'Funcionário';

  useEffect(() => {
    setMounted(true);
    getSystemSetting('session_timeout', '60').then(val => {
      setSessionTimeoutMinutes(parseInt(val) || 60);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    // Initial fetch
    getNotifications(userId).then(setNotifications);
    
    // Poll every 10 seconds for new notifications
    const poll = setInterval(() => {
      getNotifications(userId).then(setNotifications);
    }, 10000);
    return () => clearInterval(poll);
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleReadAll = async () => {
    if (!userId) return;
    await markAllNotificationsAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className={`${styles.header} glass-panel`}>
      <div className={styles.titleGroup}>
        <div className={styles.titleContainer}>
          <h1 className={styles.pageTitle}>Solicitações</h1>
          <p className={styles.pageSubtitle}>Hub de procedimentos médicos Vision Care</p>
        </div>
      </div>

      <div className={styles.actions}>
        <SessionTimer timeoutMinutes={sessionTimeoutMinutes} userId={userId} />

        {mounted && (
          <button 
            className={styles.iconBtn} 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <button className={styles.iconBtn} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className={styles.notificationsDropdown}>
              <div className={styles.notificationsHeader}>
                <h4>Notificações</h4>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={handleReadAll}>
                    <Check size={14} /> Marcar todas
                  </button>
                )}
              </div>
              <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <p className={styles.noNotifications}>Nenhuma notificação.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`${styles.notificationItem} ${!n.read ? styles.unread : ''}`}>
                      <p>{n.message}</p>
                      {!n.read && (
                        <button className={styles.readBtn} onClick={() => handleRead(n.id)} title="Marcar como lida">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.divider}></div>
        
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <User size={20} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SessionTimer({ timeoutMinutes, userId }: { timeoutMinutes: number, userId?: string }) {
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);

  useEffect(() => {
    if (!userId) return; // Wait until userId is loaded

    const SESSION_KEY = `app_session_expiry_${userId}`;
    let expiry = localStorage.getItem(SESSION_KEY);

    if (!expiry) {
      // First time loading, set the expiry
      expiry = (Date.now() + timeoutMinutes * 60 * 1000).toString();
      localStorage.setItem(SESSION_KEY, expiry);
    }

    const expiryTime = parseInt(expiry, 10);
    const initialRemaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) {
      localStorage.removeItem(SESSION_KEY);
      signOut({ callbackUrl: '/login' });
      return;
    }

    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalId);
        localStorage.removeItem(SESSION_KEY);
        signOut({ callbackUrl: '/login' });
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeoutMinutes, userId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: 'var(--navy-blue)',
      padding: '0.4rem 0.8rem',
      borderRadius: '2rem',
      fontSize: '0.85rem',
      fontWeight: 600,
    }}>
      <Clock size={16} />
      <span>Sessão: {formatTime(timeLeft)}</span>
    </div>
  );
}

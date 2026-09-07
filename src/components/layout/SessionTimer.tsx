'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SessionTimer({ timeoutMinutes }: { timeoutMinutes: number }) {
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);



  useEffect(() => {
    if (timeLeft <= 0) {
      signOut({ callbackUrl: '/login' });
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

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

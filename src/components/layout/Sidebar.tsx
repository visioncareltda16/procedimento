'use client';

import Link from 'next/link';
import { Home, Users, FileText, Settings, LogOut, X } from 'lucide-react';
import styles from './Sidebar.module.css';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Sidebar({ 
  userRole = 'CAPTADOR', 
  isOpen = false, 
  onClose 
}: { 
  userRole?: string, 
  isOpen?: boolean, 
  onClose?: () => void 
}) {
  const pathname = usePathname();
  
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} glass-panel`}>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={24} />
      </button>
      
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <img 
            src="/logo.png" 
            alt="Vision Care" 
            className={styles.shiningLogo}
          />
        </div>
        <h2 className={styles.logoSubtitle}>PROCEDIMENTOS</h2>
      </div>
      
      <nav className={styles.nav}>
        <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`} onClick={onClose}>
          <Home size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/dashboard/pacientes" className={`${styles.navItem} ${pathname?.includes('/pacientes') ? styles.active : ''}`} onClick={onClose}>
          <Users size={20} />
          <span>Pacientes</span>
        </Link>
        <Link href="/dashboard/relatorios" className={`${styles.navItem} ${pathname?.includes('/relatorios') ? styles.active : ''}`} onClick={onClose}>
          <FileText size={20} />
          <span>Relatórios</span>
        </Link>
        {userRole === 'ADMIN' && (
          <Link href="/dashboard/configuracoes" className={`${styles.navItem} ${pathname?.includes('/configuracoes') ? styles.active : ''}`} onClick={onClose}>
            <Settings size={20} />
            <span>Configurações</span>
          </Link>
        )}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

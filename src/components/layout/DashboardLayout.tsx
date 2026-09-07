'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export default function DashboardLayout({ children, userRole = 'CAPTADOR' }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <Sidebar userRole={userRole} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className={styles.mainContent}>
        <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}

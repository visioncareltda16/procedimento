import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export default function DashboardLayout({ children, userRole = 'CAPTADOR' }: DashboardLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar userRole={userRole} />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/dashboard/pacientes', label: 'Pacientes', icon: Users },
    { href: '/dashboard/relatorios', label: 'Relatórios', icon: FileText },
    { href: '/dashboard/configuracoes', label: 'Ajustes', icon: Settings }
  ];

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navContent}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <div className={styles.iconWrapper}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

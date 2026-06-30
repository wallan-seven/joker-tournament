'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  const links = [
    { href: '/', icon: 'fa-trophy', label: 'Torneios' },
    { href: '/jogadores', icon: 'fa-users', label: 'Jogadores' },
    { href: '/torneios/novo', icon: 'fa-square-plus', label: 'Cadastrar Torneio' },
    { href: '/jogadores/novo', icon: 'fa-user-plus', label: 'Cadastrar Jogador' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <img src="/logo.png" alt="Joker Tournament" className={styles.logo} />
        <h2>JOKER</h2>
        <span>Tournament</span>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
          >
            <i className={`fa-solid ${link.icon}`}></i>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.logout}>
        <span className={styles.userBadge}>{usuario}</span>
        <button onClick={logout} className={styles.logoutBtn}>
          <i className="fa-solid fa-right-from-bracket"></i>
          Sair
        </button>
      </div>
    </aside>
  );
}

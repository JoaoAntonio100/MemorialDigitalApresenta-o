import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import styles from './Header.module.css';
import logo from '../assets/logo.png';

export default function Header({ isAuthenticated = false, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');

  const navLinks = isAdmin
    ? [
        { to: '/admin', label: 'Painel' },
        { to: '/admin/memoriais', label: 'Memoriais' },
        { to: '/admin/relatorios', label: 'Relatórios' },
        { to: '/admin/configuracoes', label: 'Configurações' },
        { to: '/', label: 'Ver Site' },
      ]
    : [
        { to: '/', label: 'Início' },
        { to: '/memoriais', label: 'Memoriais' },
        { to: '/mapa', label: 'Mapa do Cemitério' },
        ...(isAuthenticated ? [{ to: '/admin', label: 'Administração' }] : []),
        ...(isAuthenticated
          ? []
          : [{ to: '/login', label: 'Login', icon: <LogIn size={16} /> }]),
      ];

  return (
    <header className={styles.header}>

      {/* Barra Principal Institucional */}
      <div className={styles.mainBar}>
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <img src={logo} alt="Logo da Prefeitura" className={styles.logoImage} />
            </div>

            <div className={styles.logoText}>
              <span className={styles.title}>
                Sistema Digital
              </span>
              <span className={styles.subtitle}>
                Cemitério São Miguel
              </span>
            </div>
          </Link>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X size={24} color="#0066cc" /> : <Menu size={24} color="#0066cc" />}
          </button>

          <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`${styles.navLink} ${
                  location.pathname === link.to ? styles.navLinkActive : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                className={`${styles.navLink} ${styles.logoutButton}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                type="button"
              >
                <LogOut size={16} />
                Sair da conta
              </button>
            )}
          </nav>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3>Deseja sair da conta?</h3>
            <p>Você será redirecionado para a página inicial.</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowLogoutConfirm(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                type="button"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

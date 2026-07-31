import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from './LoginPage.module.css';
import logo from '../assets/logo.png';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      onLogin?.();
      navigate('/admin');
    }, 600);
  }

  return (
    <div className={styles.page}>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.brandBlock}>
            <div className={styles.brandIcon}>
              <img src={logo} alt="Logo do Memorial Digital" />
            </div>
            <div className={styles.brandText}>
              <p className={styles.eyebrow}>Portal institucional</p>
              <h1>Bem-vindo ao Memorial Digital</h1>
            </div>
          </div>

          <div className={styles.intro}>
            <p>Acesse o painel de gestão e zeladoria com segurança.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field} htmlFor="email">
              <span className={styles.fieldLabel}>E-mail de acesso</span>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@memorial.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </label>

            <label className={styles.field} htmlFor="password">
              <div className={styles.fieldHeader}>
                <span className={styles.fieldLabel}>Senha</span>
                <a className={styles.linkText} href="#">Esqueceu a senha?</a>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </label>

            <label className={styles.checkboxRow} htmlFor="remember">
              <input id="remember" type="checkbox" />
              <span>Manter conectado</span>
            </label>

            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar no Sistema'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className={styles.supportBox}>
            <ShieldCheck size={18} className={styles.supportIcon} />
            <p>Acesso restrito a administradores e zeladores autorizados.</p>
          </div>

          <Link to="/" className={styles.backLink}>
            Voltar para o site
          </Link>
        </div>
      </main>

    </div>
  );
}

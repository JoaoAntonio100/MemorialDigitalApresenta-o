import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { loginAdmin } from '../lib/api';
import styles from './LoginPage.module.css';
import logo from '../assets/logo.png';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    const sanitizedValue = name === 'email' || name === 'password' ? value.replace(/\s+/g, '') : value;

    setFormData((current) => ({ ...current, [name]: sanitizedValue }));

    if (errorModal.open) {
      setErrorModal({ open: false, message: '' });
    }
  }

  function handleKeyDown(event) {
    const isRestrictedField = event.target.name === 'email' || event.target.name === 'password';

    if (isRestrictedField && event.key === ' ') {
      event.preventDefault();
    }
  }

  function handlePaste(event) {
    const isRestrictedField = event.target.name === 'email' || event.target.name === 'password';

    if (!isRestrictedField) return;

    event.preventDefault();
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    const cleanedText = pastedText.replace(/\s+/g, '');

    if (!cleanedText) return;

    const target = event.target;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? target.value.length;
    const nextValue = `${target.value.slice(0, start)}${cleanedText}${target.value.slice(end)}`;
    target.value = nextValue;

    const syntheticEvent = {
      target: { ...target, name: target.name, value: nextValue },
      currentTarget: { ...target, name: target.name, value: nextValue },
    };

    handleChange(syntheticEvent);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setErrorModal({ open: true, message: 'Informe e-mail e senha válidos para continuar.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginAdmin(email, password);
      onLogin?.(response.token);
      navigate(location.state?.from || '/admin');
    } catch (error) {
      setErrorModal({
        open: true,
        message: error.message || 'As credenciais informadas estão incorretas.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            </div>
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
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
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
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
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
            <p>Acesso restrito</p>
          </div>

          <Link to="/" className={styles.backLink}>
            Voltar para o site
          </Link>
        </div>
      </main>

      {errorModal.open && (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="login-error-title">
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setErrorModal({ open: false, message: '' })}
              aria-label="Fechar modal de erro"
            >
              <X size={16} />
            </button>

            <div className={styles.modalIconWrap}>
              <ShieldAlert size={28} className={styles.modalIcon} />
            </div>

            <h2 id="login-error-title">Credenciais inválidas</h2>
            <p>{errorModal.message}</p>

            <button
              type="button"
              className={styles.modalButton}
              onClick={() => setErrorModal({ open: false, message: '' })}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

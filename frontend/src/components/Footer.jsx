import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Landmark } from 'lucide-react';
import logo from '../assets/logo.png'; 
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoIcon}>
                <img src={logo} alt="Logo da Prefeitura" className={styles.logoImage} />
              </span>
            </Link>
            <p className={styles.brandDesc}>
              Sistema Digital para preservação e mapeamento do Cemitério Público São Miguel.
            </p>
          </div>

          <div className={styles.links}>
            <h4>Navegação</h4>
            <nav>
              <Link to="/">Início</Link>
              <Link to="/memoriais">Consulta Pública</Link>
              <Link to="/mapa">Geolocalização</Link>
            </nav>
          </div>

          <div className={styles.contact}>
            <h4>Atendimento</h4>
            <div className={styles.contactItem}>
              <MapPin size={18} />
              <span>Rua Cel. Antônio Pessoa, s/n<br />Centro, Pirpirituba - PB</span>
            </div>
            <div className={styles.contactItem}>
              <Clock size={18} />
              <span>Segunda a Sexta: 08h às 12h</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={18} />
              <span>(83) 3277-1234</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} />
              <span>infraestrutura@pirpirituba.pb.gov.br</span>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; 2026 Prefeitura Municipal de Pirpirituba. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
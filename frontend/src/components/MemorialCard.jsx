import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import styles from './MemorialCard.module.css';

export default function MemorialCard({
  memorial,
  onClick
}) {

  return (
    <Link
      to={`/memoriais/${memorial.id}`}
      className={styles.card}
      onClick={onClick}
    >
      <div className={styles.imageWrapper}>
        <img
          src={memorial.imagem}
          alt={memorial.nome}
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{memorial.nome}</h3>

        <p className={styles.dates}>
          {memorial.dataNascimento || '—'} — {memorial.dataMorte || '—'}
        </p>

        <p className={styles.description}>
          {memorial.descricao}
        </p>

        <div className={styles.metaData}>
          <div className={styles.location}>
            <MapPin size={16} className={styles.iconLocation} />
            <span>{memorial.localizacao}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}
import { useParams, Link } from 'react-router-dom';
import { MapPin, Quote, Star, User } from 'lucide-react';
import { getMemoriaisPorTumulo } from '../data/memoriaisStorage';
import styles from './TumuloPage.module.css';

export default function TumuloPage() {
  const { localizacao } = useParams();
  const decoded = (() => {
    try { return decodeURIComponent(localizacao || ''); }
    catch { return localizacao || ''; }
  })();

  const pessoas = getMemoriaisPorTumulo(decoded);

  if (pessoas.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.mainSection}>
            <div className={styles.card} style={{ padding: '48px', textAlign: 'center' }}>
              <MapPin size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
              <h2>Memorial não encontrado</h2>
              <p style={{ color: '#666', marginTop: '12px' }}>
                Nenhum registro encontrado para <strong>{decoded}</strong>.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <header className={styles.tombHeader}>
          <div className={styles.tombIcon}>
            <MapPin size={28} />
          </div>
          <h1 className={styles.tombTitle}>{decoded}</h1>
          <p className={styles.tombSubtitle}>
            {pessoas.length} pessoa{pessoas.length !== 1 ? 's' : ''} neste lote
          </p>
        </header>

        <div className={styles.grid}>
          {pessoas.map((pessoa) => (
            <Link
              key={pessoa.id}
              to={`/memoriais/${pessoa.id}`}
              className={styles.personCard}
            >
              <div className={styles.personImage}>
                {pessoa.imagem ? (
                  <img src={pessoa.imagem} alt={pessoa.nome} />
                ) : (
                  <User size={40} className={styles.userIcon} />
                )}
              </div>

              <div className={styles.personInfo}>
                <h2 className={styles.personName}>{pessoa.nome}</h2>

                <div className={styles.personDates}>
                  <span className={styles.dateBlock}>
                    <Star size={14} className={styles.starIcon} />
                    {pessoa.dataNascimento || '—'}
                  </span>
                  <span className={styles.dateDivider}></span>
                  <span className={styles.dateBlock}>
                    <span className={styles.crossIcon}>✝</span>
                    {pessoa.dataMorte || '—'}
                  </span>
                </div>

                <p className={styles.personDesc}>{pessoa.descricao}</p>

                {pessoa.mensagemFamilia && (
                  <blockquote className={styles.tributeBox}>
                    <Quote size={20} className={styles.tributeIcon} />
                    <p>"{pessoa.mensagemFamilia}"</p>
                  </blockquote>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

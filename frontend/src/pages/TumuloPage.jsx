import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Quote, Star, User } from 'lucide-react';
import { fetchMemoriais, resolveImageUrl } from '../lib/api';
import styles from './TumuloPage.module.css';

function getLocalizacaoPart(localizacao, label) {
  const pattern = label === 'Quadra'
    ? /(?:^|,\s*)Quadra\s+(.+?)(?:,\s*Lote\s+|$)/i
    : /(?:^|,\s*)Lote\s+(.+?)$/i;
  const match = localizacao?.match(pattern);
  return match ? match[1].trim().toLowerCase() : null;
}

function isInLocalizacao(memorial, localizacao) {
  const targetQuadra = getLocalizacaoPart(localizacao, 'Quadra');
  const targetLote = getLocalizacaoPart(localizacao, 'Lote');
  const memorialQuadra = getLocalizacaoPart(memorial.localizacao, 'Quadra');
  const memorialLote = getLocalizacaoPart(memorial.localizacao, 'Lote');

  if (targetQuadra && targetLote) {
    return memorialQuadra === targetQuadra && memorialLote === targetLote;
  }

  if (targetQuadra) {
    return memorialQuadra === targetQuadra;
  }

  return memorial.localizacao?.trim().toLowerCase() === localizacao.trim().toLowerCase();
}

export default function TumuloPage() {
  const { localizacao } = useParams();
  const [pessoas, setPessoas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const decoded = (() => {
    try { return decodeURIComponent(localizacao || ''); }
    catch { return localizacao || ''; }
  })();

  useEffect(() => {
    async function loadMemoriais() {
      setIsLoading(true);
      try {
        const memoriais = await fetchMemoriais();
        setPessoas(memoriais.filter((memorial) => isInLocalizacao(memorial, decoded)));
      } catch (error) {
        console.error('Erro ao carregar memoriais do tumulo:', error);
        setPessoas([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadMemoriais();
  }, [decoded]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.mainSection}>
            <div className={styles.card} style={{ padding: '48px', textAlign: 'center' }}>
              <h2>Carregando memorial...</h2>
            </div>
          </section>
        </div>
      </div>
    );
  }

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
                  <img src={resolveImageUrl(pessoa.imagem)} alt={pessoa.nome} />
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

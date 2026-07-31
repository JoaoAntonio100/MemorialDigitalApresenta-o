import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import MemorialCard from '../components/MemorialCard';
import { fetchMemoriais, resolveImageUrl } from '../lib/api';
import styles from './HomePage.module.css';
import mapaImg from '../assets/mapaExemplo.png';

const PLACEHOLDER_IMG = 'https://placehold.co/400x400/e4e2e1/44474e?text=Foto';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [memorials, setMemorials] = useState([]);
  const historicalRef = useRef(null);
  const recentRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    fetchMemoriais()
      .then((data) => {
        if (isMounted) setMemorials(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setMemorials([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const historicalMemorials = useMemo(
    () => memorials.filter((memorial) => memorial.tipo === 'historica' || memorial.tipo === 'historico'),
    [memorials]
  );
  const recentMemorials = useMemo(
    () => memorials.filter((memorial) => memorial.tipo === 'recente'),
    [memorials]
  );
  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return memorials
      .filter((memorial) => typeof memorial.nome === 'string' && memorial.nome.toLowerCase().includes(query))
      .slice(0, 5);
  }, [memorials, searchQuery]);

  function scrollCarousel(ref, direction) {
    ref.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  }

  function handleSearch(event) {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (query) navigate(`/memoriais?search=${encodeURIComponent(query)}`);
  }

  function renderCarousel(items, ref) {
    if (items.length === 0) {
      return <div className={styles.emptyState}>Ainda não há memoriais cadastrados.</div>;
    }

    return (
      <div className={styles.memorialsGrid} ref={ref}>
        {items.slice(0, 10).map((memorial) => (
          <MemorialCard key={memorial.id} memorial={memorial} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.heroIntegrated}>
        <div className={styles.integratedBackground}>
          <img
            src="https://images.pexels.com/photos/116909/pexels-photo-116909.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Textura Memorial"
            className={styles.integratedImage}
          />
          <div className={styles.integratedOverlay} />
        </div>

        <div className={styles.integratedContent}>
          <div className={styles.integratedHeader}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitlePrefix}>Memorial Municipal</span>
              <span className={styles.heroLineStrong}>São Miguel</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Pesquise homenagens e preserve a memória de nossa comunidade.
            </p>
          </div>

          <div className={styles.integratedSearchContainer}>
            <form className={styles.searchWrapper} onSubmit={handleSearch}>
              <Search size={22} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar pelo nome..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery && (
                <button type="button" className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                  x
                </button>
              )}
              <button type="submit" className={styles.searchButton}>Pesquisar</button>
            </form>

            {filteredResults.length > 0 && (
              <div className={styles.searchResults}>
                {filteredResults.map((memorial) => (
                  <Link key={memorial.id} to={`/memoriais/${memorial.id}`} className={styles.resultItem}>
                    <img src={resolveImageUrl(memorial.imagem) || PLACEHOLDER_IMG} alt={memorial.nome} />
                    <strong>{memorial.nome}</strong>
                  </Link>
                ))}
                <button className={styles.viewAll} onClick={handleSearch}>
                  Ver todos os resultados <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionLabel}>Acervo Histórico Municipal</span>
              <h2 className={styles.sectionTitle}>Figuras Históricas de Pirpirituba</h2>
            </div>
            <Link to="/memoriais?type=historical" className={styles.sectionLink}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.carouselWrapper}>
            <button className={`${styles.navButton} ${styles.navLeft}`} onClick={() => scrollCarousel(historicalRef, 'left')} aria-label="Rolar para a esquerda">
              <ChevronLeft size={24} />
            </button>
            {renderCarousel(historicalMemorials, historicalRef)}
            <button className={`${styles.navButton} ${styles.navRight}`} onClick={() => scrollCarousel(historicalRef, 'right')} aria-label="Rolar para a direita">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.mapSectionBlue}>
        <div className={styles.container}>
          <div className={styles.mapGridBlue}>
            <div className={styles.mapImageWrapperBlue}>
              <img src={mapaImg} alt="Vista aérea do Cemitério" className={styles.mapPreviewBlue} />
            </div>

            <div className={styles.mapContentBlue}>
              <h2>Mapa do Cemitério</h2>
              <p>Utilize o sistema de mapeamento digital para localizar quadras, lotes e setores do Cemitério Público São Miguel.</p>
              <div className={styles.mapFeatureBlue}>
                <MapPin size={20} />
                <span>Mapeamento dos sepultamentos</span>
              </div>
              <Link to="/mapa" className={styles.mapButton}>Acessar Mapa Digital</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionLabel}>Atualizações do Sistema</span>
              <h2 className={styles.sectionTitle}>Registros Recentes</h2>
            </div>
            <Link to="/memoriais?type=recent" className={styles.sectionLink}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.carouselWrapper}>
            <button className={`${styles.navButton} ${styles.navLeft}`} onClick={() => scrollCarousel(recentRef, 'left')} aria-label="Rolar para a esquerda">
              <ChevronLeft size={24} />
            </button>
            {renderCarousel(recentMemorials, recentRef)}
            <button className={`${styles.navButton} ${styles.navRight}`} onClick={() => scrollCarousel(recentRef, 'right')} aria-label="Rolar para a direita">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Landmark, ChevronRight, ChevronLeft } from 'lucide-react';
import MemorialCard from '../components/MemorialCard';
import Button from '../components/Button';
import { memoriaisRecentes, personalidadesImportantes } from '../data/sampleData';
import styles from './HomePage.module.css';
import mapaImg from '../assets/mapaExemplo.png';

// Junta todos os memoriais para pesquisa
const allMemorials = [
  ...personalidadesImportantes,
  ...memoriaisRecentes,
];


export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const historicalRef = useRef(null);
  const recentRef = useRef(null);

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Sugestões
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allMemorials
      .filter((m) => m.nome.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchQuery]);

  function handleSearch(e) {
    if (e) e.preventDefault();

    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/memoriais?search=${encodeURIComponent(q)}`);
  }

  return (
    <div className={styles.page}>
      {/* Hero Institucional  */}
      <section className={styles.heroIntegrated}>
        <div className={styles.integratedBackground}>
          <img
            src="https://images.pexels.com/photos/116909/pexels-photo-116909.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Textura Memorial"
            className={styles.integratedImage}
          />
          <div className={styles.integratedOverlay}></div>
        </div>

        <div className={styles.integratedContent}>
          <div className={styles.integratedHeader}>
            <span className={styles.heroLabel}>Memorial Municipal</span>
            <h1 className={styles.heroTitle}>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
              <button type="submit" className={styles.searchButton}>
                Pesquisar
              </button>
            </form>

            {/* Sugestões */}
            {filteredResults.length > 0 && (
              <div className={styles.searchResults}>
                {filteredResults.map((memorial) => (
                  <Link key={memorial.id} to={`/memoriais/${memorial.id}`} className={styles.resultItem}>
                    <img src={memorial.imagem} alt={memorial.nome} />
                    <div><strong>{memorial.nome}</strong></div>
                  </Link>
                ))}
                <button className={styles.viewAll} onClick={() => handleSearch()}>
                  Ver todos os resultados <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Personalidades Históricas */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionLabel}>
                Acervo Histórico Municipal
              </span>
              <h2 className={styles.sectionTitle}>
                Figuras Históricas de Pirpirituba
              </h2>
            </div>

            <Link to="/memoriais" className={styles.sectionLink}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.carouselWrapper}>
            <button
              className={`${styles.navButton} ${styles.navLeft}`}
              onClick={() => scrollCarousel(historicalRef, 'left')}
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft size={24} />
            </button>

            {/* historicalRef */}
            <div className={styles.memorialsGrid} ref={historicalRef}>
              {personalidadesImportantes.slice(0, 10).map((memorial) => (
                <MemorialCard
                  key={memorial.id}
                  memorial={memorial}
                />
              ))}
            </div>

            <button
              className={`${styles.navButton} ${styles.navRight}`}
              onClick={() => scrollCarousel(historicalRef, 'right')}
              aria-label="Rolar para a direita"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Mapa Institucional */}
      <section className={styles.mapSectionBlue}>
        <div className={styles.container}>
          <div className={styles.mapGridBlue}>

            <div className={styles.mapImageWrapperBlue}>
              <img
                src={mapaImg}
                alt="Vista aérea do Cemitério"
                className={styles.mapPreviewBlue}
              />
            </div>

            <div className={styles.mapContentBlue}>
              <h2>Mapa do Cemitério</h2>
              <p>
                Utilize o sistema de mapeamento digital para localizar quadras,
                lotes e setores do Cemitério Público São Miguel.
              </p>

              <div className={styles.mapFeaturesBlue}>
                <div className={styles.mapFeatureBlue}>
                  <MapPin size={20} color="#ffd700" />
                  <span>Mapeamento dos sepultamentos</span>
                </div>
              </div>

              <Link to="/mapa">
                <Button variant="secondary" size="large" style={{ background: 'white', color: '#004c99' }}>
                  Acessar Mapa Digital
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Registros Recentes */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionLabel}>
                Atualizações do Sistema
              </span>
              <h2 className={styles.sectionTitle}>
                Registros Recentes
              </h2>
            </div>

            <Link to="/memoriais" className={styles.sectionLink}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.carouselWrapper}>
            <button
              className={`${styles.navButton} ${styles.navLeft}`}
              onClick={() => scrollCarousel(recentRef, 'left')}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Adicionada a propriedade ref={recentRef} aqui */}
            <div className={styles.memorialsGrid} ref={recentRef}>
              {memoriaisRecentes.slice(0, 10).map((memorial) => (
                <MemorialCard
                  key={memorial.id}
                  memorial={memorial}
                />
              ))}
            </div>

            <button
              className={`${styles.navButton} ${styles.navRight}`}
              onClick={() => scrollCarousel(recentRef, 'right')}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
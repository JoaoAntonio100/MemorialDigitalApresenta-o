import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, MapPin, X, Map, Quote, Star } from 'lucide-react';
import { getMemorialById } from '../data/memoriaisStorage';
import styles from './MemorialPage.module.css';
import Button from '../components/Button';

const galleryImages = [
  { src: "https://images.pexels.com/photos/2259917/pexels-photo-2259917.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Foto histórica" },
  { src: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Jardim da Família" },
  { src: "https://images.pexels.com/photos/2214376/pexels-photo-2214376.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Retrato oficial" },
  { src: "https://images.pexels.com/photos/262367/pexels-photo-262367.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Vista do memorial" },
  { src: "https://images.pexels.com/photos/534259/pexels-photo-534259.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Jardins" },
  { src: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=800", caption: "Homenagem" },
];

export default function MemorialPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const memorial = getMemorialById(id);
  const [activeTab, setActiveTab] = useState('bio');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!memorial) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.topNav}>
            <button onClick={() => navigate(-1)} className={styles.backLink}>
              <ChevronLeft size={20} />
              Voltar
            </button>
          </div>
          <section className={styles.mainSection}>
            <div className={styles.profileCard} style={{ padding: '48px', textAlign: 'center' }}>
              <h2>Memorial não encontrado</h2>
              <p style={{ color: '#666', marginTop: '12px' }}>Este registro pode ter sido removido.</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      <div className={styles.container}>
        {/* Navegação Topo */}
        <div className={styles.topNav}>
          <button onClick={() => navigate(-1)} className={styles.backLink}>
            <ChevronLeft size={20} />
            Voltar
          </button>
        </div>

        {/* Card Principal */}
        <section className={styles.mainSection}>
          <div className={styles.profileCard}>

            {/* Cabeçalho do Perfil */}
            <div className={styles.profileHeader}>
              <div className={styles.photoWrapper}>
                <img src={memorial.imagem} alt={memorial.nome} className={styles.photo} />
              </div>

              <div className={styles.infoWrapper}>
                <h1 className={styles.name}>{memorial.nome}</h1>

                <div className={styles.metadata}>
                  <div className={styles.dateWrapper}>
                    <div className={styles.dateBlock}>
                      <Star size={18} className={styles.starIcon} />
                      <span>{memorial.dataNascimento || memorial.anoNascimento}</span>
                    </div>
                    
                    <span className={styles.dateDivider}></span>
                    
                    <div className={styles.dateBlock}>
                      <span className={styles.crossIcon}>✝</span>
                      <span>{memorial.dataMorte || memorial.anoMorte}</span>
                    </div>
                  </div>
                </div>

                <p className={styles.shortBio}>{memorial.descricao}</p>
                <div className={styles.actionButtons}>
                  <Button onClick={() => navigate('/mapa')} variant="primary" size="small" icon={<Map size={16} />}>
                    Ver no Mapa 
                  </Button>
                  
                  <div className={styles.locationBadge}>
                    <MapPin size={16} />
                    <span>{memorial.localizacao}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navegação por Abas */}
            <div className={styles.tabNavWrapper}>
              <div className={styles.tabNav}>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'bio' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('bio')}
                >
                  Biografia
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'gallery' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('gallery')}
                >
                  Galeria de Fotos
                </button>
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className={styles.tabContent}>
              {activeTab === 'bio' && (
                <div className={styles.bioSection}>
                  <p className={styles.bioText}>{memorial.biografia || memorial.descricao}</p>

                  {memorial.mensagemFamilia && (
                    <blockquote className={styles.tributeBox}>
                      <Quote className={styles.tributeIcon} size={48} />
                      <div className={styles.tributeContent}>
                        <p>"{memorial.mensagemFamilia}"</p>
                        <span className={styles.tributeAuthor}>— Homenagem da Família</span>
                      </div>
                    </blockquote>
                  )}
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className={styles.galleryGrid}>
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      className={styles.galleryThumb}
                      onClick={() => setLightboxIndex(i)}
                    >
                      <img src={img.src} alt={img.caption} />
                      <div className={styles.thumbOverlay}>
                        <span>{img.caption}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      </div>

      {/* Lightbox para fotos em tela cheia */}
      {lightboxIndex !== null && (
        <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)}>
            <X size={24} />
          </button>
          <button
            className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
          >
            ‹
          </button>
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            <img src={galleryImages[lightboxIndex].src} alt={galleryImages[lightboxIndex].caption} />
            <p>{galleryImages[lightboxIndex].caption}</p>
            <span>{lightboxIndex + 1} / {galleryImages.length}</span>
          </div>
          <button
            className={`${styles.lightboxNav} ${styles.lightboxNext}`}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
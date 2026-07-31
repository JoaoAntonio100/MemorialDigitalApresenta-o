import { Users, PlusCircle, Search, Map, Clock, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { getMemoriais } from '../../data/memoriaisStorage';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const memoriais = getMemoriais();
    const ultimosCadastros = memoriais.slice(0, 3);
    const quadras = [...new Set(
        memoriais
            .map((memorial) => memorial.localizacao?.match(/Quadra\s+([^,]+)/i)?.[1]?.trim().toUpperCase())
            .filter(Boolean)
    )];
    const lotes = [...new Set(
        memoriais
            .map((memorial) => memorial.localizacao?.match(/Lote\s+([^,]+)/i)?.[1]?.trim())
            .filter(Boolean)
            .map((lote, index) => {
                const quadra = memoriais[index]?.localizacao?.match(/Quadra\s+([^,]+)/i)?.[1]?.trim().toUpperCase();
                return quadra ? `${quadra}-${lote}` : lote;
            })
    )];

    return (
        <div className={styles.adminLayout}>
            <AdminSidebar />

            <main className={styles.mainContent}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Olá, Administrador </h1>
                        <p className={styles.subtitle}>Bem-vindo ao sistema de gestão do Cemitério São Miguel.</p>
                    </header>

                    {/* --- CARDS DE RESUMO --- */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: '#e6f0ff', color: '#0066cc' }}>
                                <Users size={28} />
                            </div>
                            <div className={styles.statInfo}>
                                <h3>{memoriais.length}</h3>
                                <p>Memoriais Cadastrados</p>
                            </div>
                            
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: '#e6f0ff', color: '#0066cc' }}>
                                <Map size={28} />
                            </div>
                            <div className={styles.statInfo}>
                                <h3>{quadras.length}</h3>
                                <p>Quadras Cadastradas</p>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: '#e6f0ff', color: '#0066cc' }}>
                                <MapPin size={28} />
                            </div>
                            <div className={styles.statInfo}>
                                <h3>{lotes.length}</h3>
                                <p>Lotes Cadastrados</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.dashboardGrid}>
                        {/* --- ATALHOS RÁPIDOS --- */}
                        <section className={styles.quickActions}>
                            <h2 className={styles.title}>Ações Rápidas</h2>
                            <div className={styles.actionsGrid}>
                                <Link to="/admin/memoriais" className={styles.actionButton}>
                                    <PlusCircle size={32} className={styles.actionIcon} />
                                    <span>Novo Memorial</span>
                                    <p>Cadastrar um novo falecido</p>
                                </Link>

                                <Link to="/admin/memoriais" className={styles.actionButton}>
                                    <Search size={32} className={styles.actionIcon} />
                                    <span>Buscar Registro</span>
                                    <p>Localizar setor e lote</p>
                                </Link>

                                <Link to="/mapa" target="_blank" className={styles.actionButton}>
                                    <Map size={32} className={styles.actionIcon} />
                                    <span>Ver Mapa</span>
                                    <p>Abrir mapa do cemitério</p>
                                </Link>
                            </div>
                        </section>

                        {/* --- ÚLTIMOS CADASTROS (AGORA EM TABELA) --- */}
                        <section className={styles.recentActivity}>
                            <div className={styles.recentHeader}>
                                <h2 className={styles.title}>Últimos Cadastros</h2>
                                <Link to="/admin/memoriais" className={styles.viewAllLink}>
                                    Ver todos <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nome do Falecido</th>
                                            <th>Localização</th>
                                            <th className={styles.registroHeader}>Registro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ultimosCadastros.map(memorial => (
                                            <tr key={memorial.id}>
                                                <td className={styles.nameCell}>
                                                    <div className={styles.nameContent}>
                                                    <div className={styles.avatar}>
                                                        <img src={memorial.imagem} alt={memorial.nome} />
                                                    </div>
                                                    <div className={styles.nameInfo}>
                                                        <span className={styles.name}>{memorial.nome}</span>
                                                        <span className={styles.dates}>{memorial.dataNascimento || '—'} — {memorial.dataMorte || '—'}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                <td className={styles.locationCell}>
                                                    <span className={styles.locationContent}>
                                                        <MapPin size={16} className={styles.pinIcon} />
                                                        {memorial.localizacao}
                                                    </span>
                                                </td>
                                                <td className={styles.timeCell}>
                                                    <span className={styles.timeContent}>
                                                        <Clock size={16} className={styles.clockIcon} />
                                                        {memorial.data || '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

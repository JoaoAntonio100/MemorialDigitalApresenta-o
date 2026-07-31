import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, QrCode, ChevronLeft, ChevronRight, LayoutGrid, SquareChartGantt } from 'lucide-react';
import QRCode from 'react-qr-code';
import {
    getMemoriais, addMemorial, updateMemorial,
    deleteMemorial as deleteMemorialStorage, getMemoriaisPorTumulo, getMemoriaisPorLote,
    renameQuadra, deleteQuadra, renameLote, deleteLote
} from '../../data/memoriaisStorage';
import AdminSidebar from './AdminSidebar';
import styles from './AdminMemoriais.module.css';

const ITEMS_PER_PAGE = 10;

export default function AdminMemoriais() {
    const [memoriais, setMemoriais] = useState(getMemoriais);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedQuadra, setSelectedQuadra] = useState(null);
    const [selectedLote, setSelectedLote] = useState(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedMemorial, setSelectedMemorial] = useState(null);

    const [isQuadraModalOpen, setIsQuadraModalOpen] = useState(false);
    const [editingQuadra, setEditingQuadra] = useState(null);
    const [quadraNome, setQuadraNome] = useState('');

    const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
    const [editingLote, setEditingLote] = useState(null);
    const [loteNome, setLoteNome] = useState('');

    const [formData, setFormData] = useState({
        nome: '', dataNascimento: '', dataMorte: '',
        setor: '', lote: '',
        descricao: '', biografia: '', imagem: '', tipo: 'historica'
    });

    // --- DADOS DERIVADOS ---
    const quadras = [...new Set(
        memoriais.map(m => {
            const match = m.localizacao?.match(/Quadra\s+(.+?)(?:,|$)/);
            return match ? match[1].trim() : null;
        }).filter(Boolean)
    )].sort();

    const quadrasComCount = quadras.map(q => ({
        nome: q,
        count: memoriais.filter(m => m.localizacao?.includes(`Quadra ${q}`)).length
    }));

    const lotesDaQuadra = selectedQuadra
        ? [...new Set(
            memoriais
                .filter(m => m.localizacao?.includes(`Quadra ${selectedQuadra}`))
                .map(m => {
                    const match = m.localizacao?.match(/Lote\s+(.+?)$/);
                    return match ? match[1].trim() : null;
                }).filter(Boolean)
        )].sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
        })
        : [];

    const lotesComCount = lotesDaQuadra.map(l => ({
        nome: l,
        count: memoriais.filter(m =>
            m.localizacao?.includes(`Quadra ${selectedQuadra}`) &&
            m.localizacao?.includes(`Lote ${l}`)
        ).length
    }));

    const memoriaisDoLote = (selectedQuadra && selectedLote)
        ? memoriais.filter(m =>
            m.localizacao?.includes(`Quadra ${selectedQuadra}`) &&
            m.localizacao?.includes(`Lote ${selectedLote}`)
        )
        : [];

    const filteredMemoriais = memoriaisDoLote.filter(m =>
        m.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredMemoriais.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentMemoriais = filteredMemoriais.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // --- SALVAR MEMORIAL ---
    const saveMemorial = async (e) => {
        e.preventDefault();
        const setor = (formData.setor || '').trim();
        const lote = (formData.lote || '').trim();
        const localizacao = `Quadra ${setor}, Lote ${lote}`;
        const dadosParaSalvar = { ...formData, setor, lote, localizacao };
        delete dadosParaSalvar.setor;
        delete dadosParaSalvar.lote;
        if (selectedMemorial) {
            setMemoriais(updateMemorial(selectedMemorial.id, dadosParaSalvar));
        } else {
            setMemoriais(addMemorial(dadosParaSalvar));
        }
        closeFormModal();
    };

    const deleteMemorial = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja excluir o memorial de ${nome}?`)) {
            setMemoriais(deleteMemorialStorage(id));
            if (currentMemoriais.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
        }
    };

    // --- FORMATAR DATA ---
    const formatarData = (valor) => {
        const n = valor.replace(/\D/g, '').slice(0, 8);
        if (n.length <= 2) return n;
        if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
        return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let v = value;
        if (name === 'dataNascimento' || name === 'dataMorte') v = formatarData(value);
        else if (name === 'setor') v = value.toUpperCase();
        setFormData(prev => ({ ...prev, [name]: v }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagem: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    // --- MODAL MEMORIAL ---
    const openEditModal = (memorial) => {
        setSelectedMemorial(memorial);
        let setor = '', lote = '';
        if (memorial.localizacao) {
            const s = memorial.localizacao.match(/Quadra\s+(.+?),/);
            const l = memorial.localizacao.match(/Lote\s+(.+?)$/);
            if (s) setor = s[1].trim();
            if (l) lote = l[1].trim();
        }
        setFormData({ ...memorial, setor, lote });
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setSelectedMemorial(null);
        setFormData({
            nome: '', dataNascimento: '', dataMorte: '',
            setor: selectedQuadra || '', lote: '',
            descricao: '', biografia: '', imagem: '', tipo: 'historica'
        });
        setIsFormModalOpen(false);
    };

    // --- MODAL QUADRA ---
    const openQuadraModal = (nome = null) => {
        setEditingQuadra(nome);
        setQuadraNome(nome || '');
        setIsQuadraModalOpen(true);
    };

    const saveQuadra = (e) => {
        e.preventDefault();
        const nome = quadraNome.trim().toUpperCase();
        if (!nome) return;
        if (editingQuadra) {
            setMemoriais(renameQuadra(editingQuadra, nome));
        } else {
            setMemoriais(addMemorial({
                nome: 'Novo memorial', dataNascimento: '', dataMorte: '',
                localizacao: `Quadra ${nome}, Lote 1`,
                descricao: '', biografia: '', imagem: '', tipo: 'recente'
            }));
        }
        setIsQuadraModalOpen(false);
        setEditingQuadra(null);
        setQuadraNome('');
    };

    const handleDeleteQuadra = (nome) => {
        if (window.confirm(`Excluir a Quadra ${nome} e TODOS os memoriais dentro dela?`)) {
            setMemoriais(deleteQuadra(nome));
            if (selectedQuadra === nome) { setSelectedQuadra(null); setSelectedLote(null); }
        }
    };

    // --- MODAL LOTE ---
    const openLoteModal = (nome = null) => {
        setEditingLote(nome);
        setLoteNome(nome || '');
        setIsLoteModalOpen(true);
    };

    const saveLote = (e) => {
        e.preventDefault();
        const nome = loteNome.trim();
        if (!nome) return;
        if (editingLote) {
            setMemoriais(renameLote(selectedQuadra, editingLote, nome));
        } else {
            setMemoriais(addMemorial({
                nome: 'Novo memorial', dataNascimento: '', dataMorte: '',
                localizacao: `Quadra ${selectedQuadra}, Lote ${nome}`,
                descricao: '', biografia: '', imagem: '', tipo: 'recente'
            }));
        }
        setIsLoteModalOpen(false);
        setEditingLote(null);
        setLoteNome('');
    };

    const handleDeleteLote = (lote) => {
        if (window.confirm(`Excluir o Lote ${lote} da Quadra ${selectedQuadra} e TODOS os memoriais dentro dele?`)) {
            setMemoriais(deleteLote(selectedQuadra, lote));
            if (selectedLote === lote) setSelectedLote(null);
        }
    };

    // --- QR CODE ---
    const [tumuloPeople, setTumuloPeople] = useState([]);
    const openQrModal = (memorial) => {
        setSelectedMemorial(memorial);
        setTumuloPeople(getMemoriaisPorTumulo(memorial.localizacao));
        setIsQrModalOpen(true);
    };
    const qrCodeUrl = selectedMemorial ? `${window.location.origin}/tumulo/${encodeURIComponent(selectedMemorial.localizacao)}` : '';

    // --- QR CODE DO LOTE ---
    const [isLoteQrModalOpen, setIsLoteQrModalOpen] = useState(false);
    const [loteQrData, setLoteQrData] = useState(null);
    const openLoteQrModal = (quadra, lote) => {
        const localizacao = `Quadra ${quadra}, Lote ${lote}`;
        const people = getMemoriaisPorLote(quadra, lote);
        setLoteQrData({ localizacao, people });
        setIsLoteQrModalOpen(true);
    };
    const loteQrUrl = loteQrData ? `${window.location.origin}/tumulo/${encodeURIComponent(loteQrData.localizacao)}` : '';

    // --- QR CODE DA QUADRA ---
    const [isQuadraQrModalOpen, setIsQuadraQrModalOpen] = useState(false);
    const [quadraQrData, setQuadraQrData] = useState(null);
    const openQuadraQrModal = (quadra) => {
        const people = memoriais.filter(m => m.localizacao?.includes(`Quadra ${quadra}`));
        setQuadraQrData({ nome: quadra, people });
        setIsQuadraQrModalOpen(true);
    };
    const quadraQrUrl = quadraQrData ? `${window.location.origin}/tumulo/Quadra%20${encodeURIComponent(quadraQrData.nome)}` : '';

    // --- NAVEGAÇÃO ---
    const goBack = () => {
        if (selectedLote) { setSelectedLote(null); setSearchTerm(''); setCurrentPage(1); }
        else if (selectedQuadra) { setSelectedQuadra(null); setSelectedLote(null); setSearchTerm(''); }
    };

    const nivelAtual = selectedLote ? 'lote' : selectedQuadra ? 'quadra' : 'inicio';

    return (
        <div className={styles.adminLayout}>
            <AdminSidebar />
            <main className={styles.mainContent}>
                <div className={styles.container}>

                    {/* --- HEADER --- */}
                    <header className={styles.header}>
                        <div>
                            {nivelAtual !== 'inicio' && (
                                <button className={styles.backBtn} onClick={goBack}>
                                    <ChevronLeft size={18} />
                                    {nivelAtual === 'lote' ? `Voltar para Lotes` : `Voltar para Quadras`}
                                </button>
                            )}
                            <h1 className={styles.title}>
                                {nivelAtual === 'inicio' && 'Quadras'}
                                {nivelAtual === 'quadra' && `Quadra ${selectedQuadra}`}
                                {nivelAtual === 'lote' && `Lote ${selectedLote}`}
                            </h1>
                            <p className={styles.subtitle}>
                                {nivelAtual === 'inicio' && 'Selecione uma quadra para ver os lotes.'}
                                {nivelAtual === 'quadra' && `${lotesComCount.length} lote${lotesComCount.length !== 1 ? 's' : ''} nesta quadra.`}
                                {nivelAtual === 'lote' && `${filteredMemoriais.length} memorial${filteredMemoriais.length !== 1 ? 'es' : ''} neste lote.`}
                            </p>
                        </div>
                        <div className={styles.headerActions}>
                            {nivelAtual === 'inicio' && (
                                <button className={styles.addButton} onClick={() => openQuadraModal()}>
                                    <Plus size={20} /> Nova Quadra
                                </button>
                            )}
                            {nivelAtual === 'quadra' && (
                                <button className={styles.addButton} onClick={() => openLoteModal()}>
                                    <Plus size={20} /> Novo Lote
                                </button>
                            )}
                            {nivelAtual === 'lote' && (
                                <button className={styles.addButton} onClick={() => {
                                    setFormData({
                                        nome: '', dataNascimento: '', dataMorte: '',
                                        setor: selectedQuadra || '', lote: selectedLote || '',
                                        descricao: '', biografia: '', imagem: '', tipo: 'historica'
                                    });
                                    setSelectedMemorial(null);
                                    setIsFormModalOpen(true);
                                }}>
                                    <Plus size={20} /> Novo Memorial
                                </button>
                            )}
                        </div>
                    </header>

                    {/* --- NÍVEL 1: QUADRAS --- */}
                    {nivelAtual === 'inicio' && (
                        <div className={styles.setoresGrid}>
                            {quadrasComCount.map(q => (
                                <div key={q.nome} className={styles.setorCard}>
                                    <button className={styles.setorCardBtn} onClick={() => { setSelectedQuadra(q.nome); setSelectedLote(null); setSearchTerm(''); }}>
                                        <div className={styles.setorIcon}><LayoutGrid size={28} /></div>
                                        <div className={styles.setorInfo}>
                                            <h3>Quadra {q.nome}</h3>
                                            <p>{q.count} memorial{q.count !== 1 ? 'es' : ''}</p>
                                        </div>
                                    </button>
                                    <div className={styles.cardActions}>
                                        <button className={styles.iconBtn} title="QR Code da Quadra" onClick={() => openQuadraQrModal(q.nome)}><QrCode size={16} /></button>
                                        <button className={styles.iconBtn} title="Editar Quadra" onClick={() => openQuadraModal(q.nome)}><Edit size={16} /></button>
                                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Excluir Quadra" onClick={() => handleDeleteQuadra(q.nome)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {quadrasComCount.length === 0 && (
                                <p className={styles.emptyState}>Nenhuma quadra encontrada. Crie uma para começar.</p>
                            )}
                        </div>
                    )}

                    {/* --- NÍVEL 2: LOTES --- */}
                    {nivelAtual === 'quadra' && (
                        <div className={styles.setoresGrid}>
                            {lotesComCount.map(l => (
                                <div key={l.nome} className={styles.setorCard}>
                                    <button className={styles.setorCardBtn} onClick={() => { setSelectedLote(l.nome); setSearchTerm(''); setCurrentPage(1); }}>
                                        <div className={styles.setorIcon}><SquareChartGantt size={28} /></div>
                                        <div className={styles.setorInfo}>
                                            <h3>Lote {l.nome}</h3>
                                            <p>{l.count} memorial{l.count !== 1 ? 'es' : ''}</p>
                                        </div>
                                    </button>
                                    <div className={styles.cardActions}>
                                        <button className={styles.iconBtn} title="QR Code do Lote" onClick={() => openLoteQrModal(selectedQuadra, l.nome)}><QrCode size={16} /></button>
                                        <button className={styles.iconBtn} title="Editar Lote" onClick={() => openLoteModal(l.nome)}><Edit size={16} /></button>
                                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Excluir Lote" onClick={() => handleDeleteLote(l.nome)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {lotesComCount.length === 0 && (
                                <p className={styles.emptyState}>Nenhum lote encontrado. Crie um para começar.</p>
                            )}
                        </div>
                    )}

                    {/* --- NÍVEL 3: FALECIDOS --- */}
                    {nivelAtual === 'lote' && (
                        <div className={styles.card}>
                            <div className={styles.toolbar}>
                                <div className={styles.searchBox}>
                                    <Search size={18} className={styles.searchIcon} />
                                    <input type="text" placeholder="Buscar falecido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nome do Falecido</th>
                                            <th>Tipo</th>
                                            <th className={styles.actionsColumn}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentMemoriais.map(memorial => (
                                            <tr key={memorial.id}>
                                                <td className={styles.nameCell}>
                                                    <div className={styles.avatar}>
                                                        <img src={memorial.imagem} alt={memorial.nome} />
                                                    </div>
                                                    <div>
                                                        <span className={styles.name}>{memorial.nome}</span>
                                                        <span className={styles.dateCell}>{memorial.dataNascimento || '—'} — {memorial.dataMorte || '—'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${memorial.tipo === 'historica' ? styles.badgeHist : styles.badgeRec}`}>
                                                        {memorial.tipo === 'historica' ? 'Histórico' : 'Recente'}
                                                    </span>
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button className={styles.iconBtn} title="QR Code" onClick={() => openQrModal(memorial)}><QrCode size={18} /></button>
                                                    <button className={styles.iconBtn} title="Editar" onClick={() => openEditModal(memorial)}><Edit size={18} /></button>
                                                    <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Excluir" onClick={() => deleteMemorial(memorial.id, memorial.nome)}><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentMemoriais.length === 0 && (
                                            <tr><td colSpan="3" className={styles.emptyState}>Nenhum memorial neste lote.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className={styles.paginationContainer}>
                                    <p className={styles.paginationInfo}>
                                        Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredMemoriais.length)} de {filteredMemoriais.length}
                                    </p>
                                    <div className={styles.pagination}>
                                        <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18} /></button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button key={page} className={`${styles.pageBtn} ${page === currentPage ? styles.pageBtnActive : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                                        ))}
                                        <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODAL QUADRA --- */}
            {isQuadraModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingQuadra ? 'Editar Quadra' : 'Nova Quadra'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsQuadraModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={saveQuadra} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Nome da Quadra *</label>
                                <input type="text" required value={quadraNome} onChange={(e) => setQuadraNome(e.target.value.toUpperCase())} placeholder="Ex: A" autoFocus />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setIsQuadraModalOpen(false)}>Cancelar</button>
                                <button type="submit" className={styles.saveBtn}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL LOTE --- */}
            {isLoteModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingLote ? 'Editar Lote' : 'Novo Lote'} — Quadra {selectedQuadra}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsLoteModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={saveLote} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Número do Lote *</label>
                                <input type="text" required value={loteNome} onChange={(e) => setLoteNome(e.target.value)} placeholder="Ex: 42" autoFocus />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setIsLoteModalOpen(false)}>Cancelar</button>
                                <button type="submit" className={styles.saveBtn}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL MEMORIAL --- */}
            {isFormModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentLarge}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedMemorial ? 'Editar Memorial' : 'Novo Memorial'}</h2>
                            <button className={styles.closeBtn} onClick={closeFormModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={saveMemorial} className={styles.formGrid}>
                            <div className={styles.formCol}>
                                <h3>Dados Pessoais e Localização</h3>
                                <div className={styles.formGroup}>
                                    <label>Nome Completo *</label>
                                    <input type="text" name="nome" required value={formData.nome} onChange={handleInputChange} />
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Data Nascimento *</label>
                                        <input type="text" name="dataNascimento" required placeholder="Ex: 12/03/1823" value={formData.dataNascimento} onChange={handleInputChange} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Data de Falecimento *</label>
                                        <input type="text" name="dataMorte" required placeholder="Ex: 04/11/1912" value={formData.dataMorte} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Quadra *</label>
                                        <input type="text" name="setor" required value={formData.setor} onChange={handleInputChange} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Lote *</label>
                                        <input type="text" name="lote" required value={formData.lote} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Categoria (Tipo) *</label>
                                    <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
                                        <option value="historica">Personalidade Histórica</option>
                                        <option value="recente">Memorial Recente</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Imagem de Perfil</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                                    <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                                        Você pode escolher uma foto do computador ou usar um URL abaixo.
                                    </small>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>URL da Imagem (opcional)</label>
                                    <input type="url" name="imagem" placeholder="https://..." value={formData.imagem} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className={styles.formCol}>
                                <h3>Biografia e Textos</h3>
                                <div className={styles.formGroup}>
                                    <label>Breve Descrição *</label>
                                    <textarea name="descricao" rows="2" required value={formData.descricao} onChange={handleInputChange} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Biografia Completa {formData.tipo === 'historica' ? '*' : '(Opcional)'}</label>
                                    <textarea name="biografia" rows="6" required={formData.tipo === 'historica'} value={formData.biografia} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className={styles.modalActionsFull}>
                                <button type="button" className={styles.cancelBtn} onClick={closeFormModal}>Cancelar</button>
                                <button type="submit" className={styles.saveBtn}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL QR CODE --- */}
            {isQrModalOpen && selectedMemorial && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentSmall}>
                        <div className={styles.modalHeader}>
                            <h2>QR Code do Túmulo</h2>
                            <button className={styles.closeBtn} onClick={() => setIsQrModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.qrContainer}>
                            <p>Túmulo: <strong>{selectedMemorial.localizacao}</strong></p>
                            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>
                                {tumuloPeople.length} pessoa{tumuloPeople.length !== 1 ? 's' : ''} enterrada{tumuloPeople.length !== 1 ? 's' : ''}
                            </p>
                            <div className={styles.qrCodeBox}>
                                <QRCode value={qrCodeUrl} size={200} fgColor="#003366" />
                            </div>
                            <p className={styles.qrLinkUrl}>{qrCodeUrl}</p>
                            <button className={styles.saveBtn} onClick={() => window.print()}>Imprimir Placa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL QR CODE DO LOTE --- */}
            {isLoteQrModalOpen && loteQrData && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentSmall}>
                        <div className={styles.modalHeader}>
                            <h2>QR Code do Lote</h2>
                            <button className={styles.closeBtn} onClick={() => setIsLoteQrModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.qrContainer}>
                            <p>{loteQrData.localizacao}</p>
                            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>
                                {loteQrData.people.length} pessoa{loteQrData.people.length !== 1 ? 's' : ''} enterrada{loteQrData.people.length !== 1 ? 's' : ''}
                            </p>
                            <div className={styles.qrCodeBox}>
                                <QRCode value={loteQrUrl} size={200} fgColor="#003366" />
                            </div>
                            <p className={styles.qrLinkUrl}>{loteQrUrl}</p>
                            <button className={styles.saveBtn} onClick={() => window.print()}>Imprimir Placa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL QR CODE DA QUADRA --- */}
            {isQuadraQrModalOpen && quadraQrData && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentSmall}>
                        <div className={styles.modalHeader}>
                            <h2>QR Code da Quadra</h2>
                            <button className={styles.closeBtn} onClick={() => setIsQuadraQrModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.qrContainer}>
                            <p>Quadra {quadraQrData.nome}</p>
                            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>
                                {quadraQrData.people.length} pessoa{quadraQrData.people.length !== 1 ? 's' : ''} nesta quadra
                            </p>
                            <div className={styles.qrCodeBox}>
                                <QRCode value={quadraQrUrl} size={200} fgColor="#003366" />
                            </div>
                            <p className={styles.qrLinkUrl}>{quadraQrUrl}</p>
                            <button className={styles.saveBtn} onClick={() => window.print()}>Imprimir Placa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

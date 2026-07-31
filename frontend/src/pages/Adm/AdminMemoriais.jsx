import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, QrCode, ChevronLeft, ChevronRight, LayoutGrid, SquareChartGantt } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useLocation } from 'react-router-dom';
import {
    fetchMemoriais,
    createMemorial,
    updateMemorial as apiUpdateMemorial,
    deleteMemorial as apiDeleteMemorial,
    resolveImageUrl,
} from '../../lib/api';
import AdminSidebar from './AdminSidebar';
import styles from './AdminMemoriais.module.css';

const ITEMS_PER_PAGE = 10;

export default function AdminMemoriais() {
    const location = useLocation();
    const editHandledRef = useRef(false);
    const [memoriais, setMemoriais] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);

    const [selectedQuadra, setSelectedQuadra] = useState(null);
    const [selectedLote, setSelectedLote] = useState(null);

    // quadras/lotes criados explicitamente persistem mesmo sem memoriais
    const [quadrasRegistradas, setQuadrasRegistradas] = useState([]);
    const [lotesRegistrados, setLotesRegistrados] = useState([]); // { quadra, lote }[]

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedMemorial, setSelectedMemorial] = useState(null);

    // Modal de confirmação genérico
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const openConfirm = (title, message, onConfirm) =>
        setConfirmModal({ open: true, title, message, onConfirm });
    const closeConfirm = () =>
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });

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

    const normalizeMemorialsFromApi = (items) => items.map((item) => ({
        ...item,
        localizacao: item.localizacao || `Quadra A, Lote 1`,
        tipo: item.tipo || 'historica',
        imagem: resolveImageUrl(item.imagem || item.galeria?.[0]) || 'https://placehold.co/400x400/png',
        galeria: Array.isArray(item.galeria) ? item.galeria.filter(Boolean).map((src) => resolveImageUrl(src)) : [],
        descricao: item.descricao || item.biografia || '',
        dataNascimento: item.dataNascimento || '',
        dataMorte: item.dataMorte || '',
    }));

    const getMemoriaisPorTumulo = (localizacao) =>
        memoriais.filter((item) => item.localizacao === localizacao);

    const getMemoriaisPorLote = (quadra, lote) =>
        memoriais.filter((item) =>
            item.localizacao === `Quadra ${quadra}, Lote ${lote}`
        );

    useEffect(() => {
        async function loadMemoriais() {
            try {
                const data = await fetchMemoriais();
                setMemoriais(normalizeMemorialsFromApi(data));
            } catch (error) {
                console.error('Erro ao buscar memoriais:', error);
                setMemoriais([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadMemoriais();
    }, []);

    // Abre edição vinda do dashboard apenas uma vez; ref impede re-disparo ao salvar memoriais
    useEffect(() => {
        if (editHandledRef.current) return;
        const editId = location.state?.editMemorialId;
        if (!editId || memoriais.length === 0) return;
        const found = memoriais.find((m) => m.id === editId);
        if (found) {
            editHandledRef.current = true;
            // Navega até o lote do memorial antes de abrir o modal
            const quadraMatch = found.localizacao?.match(/^Quadra\s+(.+?),/);
            const loteMatch   = found.localizacao?.match(/Lote\s+(.+?)$/);
            if (quadraMatch) setSelectedQuadra(quadraMatch[1].trim());
            if (loteMatch)   setSelectedLote(loteMatch[1].trim());
            openEditModal(found);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.editMemorialId, memoriais.length]);

    // --- DADOS DERIVADOS ---
    const quadras = [...new Set([
        ...quadrasRegistradas,
        ...memoriais.map(m => {
            const match = m.localizacao?.match(/Quadra\s+(.+?)(?:,|$)/);
            return match ? match[1].trim() : null;
        }).filter(Boolean),
    ])].sort();

    const quadrasComCount = quadras.map(q => ({
        nome: q,
        // startsWith garante que 'Quadra A' não bate 'Quadra AB'
        count: memoriais.filter(m => m.localizacao?.startsWith(`Quadra ${q},`)).length
    }));

    const lotesDaQuadra = selectedQuadra
        ? [...new Set([
            ...lotesRegistrados.filter(l => l.quadra === selectedQuadra).map(l => l.lote),
            ...memoriais
                .filter(m => m.localizacao?.startsWith(`Quadra ${selectedQuadra},`))
                .map(m => {
                    const match = m.localizacao?.match(/Lote\s+(.+?)$/);
                    return match ? match[1].trim() : null;
                }).filter(Boolean),
        ])].sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
        })
        : [];

    const lotesComCount = lotesDaQuadra.map(l => ({
        nome: l,
        // exact match evita que Lote 1 bata Lote 10, 11, etc.
        count: memoriais.filter(m => m.localizacao === `Quadra ${selectedQuadra}, Lote ${l}`).length
    }));

    const memoriaisDoLote = (selectedQuadra && selectedLote)
        ? memoriais.filter(m => m.localizacao === `Quadra ${selectedQuadra}, Lote ${selectedLote}`)
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
        const token = localStorage.getItem('memorialAdminToken') || '';
        const setor = (formData.setor || '').trim();
        const lote = (formData.lote || '').trim();
        const localizacao = `Quadra ${setor}, Lote ${lote}`;

        try {
            const form = new FormData();
            form.append('nome', formData.nome);
            form.append('biografia', formData.biografia || '');
            form.append('descricao', formData.descricao || '');
            form.append('dataNascimento', formData.dataNascimento || '');
            form.append('dataMorte', formData.dataMorte || '');
            form.append('localizacao', localizacao);
            form.append('tipo', formData.tipo || 'historica');

            if (selectedImageFile) {
                form.append('imagem', selectedImageFile);
            } else if (formData.imagem?.trim()) {
                form.append('imagem', formData.imagem.trim());
            }

            if (selectedGalleryFiles.length > 0) {
                selectedGalleryFiles.forEach((file) => {
                    form.append('galeria', file);
                });
            }

            if (selectedMemorial) {
                const updated = await apiUpdateMemorial(selectedMemorial.id, form, token);
                setMemoriais((current) => normalizeMemorialsFromApi(
                    current.map((item) => item.id === updated.id ? { ...item, ...updated, localizacao } : item)
                ));
            } else {
                const created = await createMemorial(form, token);
                setMemoriais((current) => normalizeMemorialsFromApi([created, ...current]));
            }

            closeFormModal();
        } catch (error) {
            window.alert(error.message || 'Não foi possível salvar o memorial.');
        }
    };

    const deleteMemorial = async (id, nome) => {
        openConfirm(
            'Excluir memorial',
            `Tem certeza que deseja excluir o memorial de ${nome}? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    const token = localStorage.getItem('memorialAdminToken') || '';
                    await apiDeleteMemorial(id, token);
                    setMemoriais((current) => current.filter((item) => item.id !== id));
                    if (currentMemoriais.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
                } catch (error) {
                    window.alert(error.message || 'Não foi possível excluir o memorial.');
                }
            }
        );
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
        if (!file) {
            setSelectedImageFile(null);
            return;
        }

        setSelectedImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagem: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) {
            setSelectedGalleryFiles([]);
            return;
        }

        setSelectedGalleryFiles(files);
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
        setSelectedImageFile(null);
        setSelectedGalleryFiles([]);
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
            setMemoriais((current) => current.map((item) => {
                if (!item.localizacao?.startsWith(`Quadra ${editingQuadra},`)) return item;
                return {
                    ...item,
                    localizacao: item.localizacao.replace(`Quadra ${editingQuadra},`, `Quadra ${nome},`),
                };
            }));
            setQuadrasRegistradas(prev => prev.map(q => q === editingQuadra ? nome : q));
            setLotesRegistrados(prev => prev.map(l => l.quadra === editingQuadra ? { ...l, quadra: nome } : l));
        } else {
            // Navega direto para a nova quadra; o admin adiciona lotes/memoriais a partir daqui
            setQuadrasRegistradas(prev => [...new Set([...prev, nome])]);
            setSelectedQuadra(nome);
            setSelectedLote(null);
        }

        setIsQuadraModalOpen(false);
        setEditingQuadra(null);
        setQuadraNome('');
    };

    const handleDeleteQuadra = (nome) => {
        openConfirm(
            `Excluir Quadra ${nome}`,
            `Isso removerá a Quadra ${nome} e TODOS os memoriais dentro dela. Esta ação não pode ser desfeita.`,
            () => {
                setMemoriais((current) => current.filter((item) => !item.localizacao?.startsWith(`Quadra ${nome},`)));
                setQuadrasRegistradas(prev => prev.filter(q => q !== nome));
                setLotesRegistrados(prev => prev.filter(l => l.quadra !== nome));
                if (selectedQuadra === nome) { setSelectedQuadra(null); setSelectedLote(null); }
            }
        );
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
            setMemoriais((current) => current.map((item) => {
                if (item.localizacao !== `Quadra ${selectedQuadra}, Lote ${editingLote}`) return item;
                return {
                    ...item,
                    localizacao: `Quadra ${selectedQuadra}, Lote ${nome}`,
                };
            }));
            setLotesRegistrados(prev => prev.map(l =>
                l.quadra === selectedQuadra && l.lote === editingLote ? { ...l, lote: nome } : l
            ));
        } else {
            // Navega para o novo lote; o admin clica em "Novo Memorial" para adicionar
            setLotesRegistrados(prev => {
                const jaExiste = prev.some(l => l.quadra === selectedQuadra && l.lote === nome);
                return jaExiste ? prev : [...prev, { quadra: selectedQuadra, lote: nome }];
            });
            setSelectedLote(nome);
        }

        setIsLoteModalOpen(false);
        setEditingLote(null);
        setLoteNome('');
    };

    const handleDeleteLote = (lote) => {
        openConfirm(
            `Excluir Lote ${lote}`,
            `Isso removerá o Lote ${lote} da Quadra ${selectedQuadra} e TODOS os memoriais dentro dele. Esta ação não pode ser desfeita.`,
            () => {
                setMemoriais((current) => current.filter((item) =>
                    item.localizacao !== `Quadra ${selectedQuadra}, Lote ${lote}`
                ));
                setLotesRegistrados(prev => prev.filter(l =>
                    !(l.quadra === selectedQuadra && l.lote === lote)
                ));
                if (selectedLote === lote) setSelectedLote(null);
            }
        );
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
                                <div className={styles.formGroup}>
                                    <label>Fotos da Galeria (opcional)</label>
                                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
                                    <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                                        Você pode enviar até 10 imagens para a galeria do memorial.
                                    </small>
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

            {/* --- MODAL DE CONFIRMAÇÃO --- */}
            {confirmModal.open && (
                <div className={styles.modalOverlay} onClick={closeConfirm}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <Trash2 size={28} color="#cc2200" />
                        </div>
                        <h2 className={styles.confirmTitle}>{confirmModal.title}</h2>
                        <p className={styles.confirmMessage}>{confirmModal.message}</p>
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={closeConfirm}>Cancelar</button>
                            <button
                                className={styles.deleteConfirmBtn}
                                onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }}
                            >
                                Excluir
                            </button>
                        </div>
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

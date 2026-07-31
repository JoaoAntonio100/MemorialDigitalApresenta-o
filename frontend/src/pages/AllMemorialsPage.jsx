import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMemoriais } from '../data/memoriaisStorage';
import MemorialCard from '../components/MemorialCard';
import styles from './AllMemorialsPage.module.css';

const PER_PAGE = 8;

export default function MemorialsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const activeFilter =
        searchParams.get('type') === 'historical'
            ? 'historicos'
            : searchParams.get('type') === 'recent'
                ? 'recentes'
                : 'todos';

    const page = Number(searchParams.get('page')) || 1;

    function updateParams({
        search = searchQuery,
        filter = activeFilter,
        page = 1
    }, options = {}) {
        const params = new URLSearchParams(searchParams);

        if (search.trim()) {
            params.set('search', search);
        } else {
            params.delete('search');
        }

        if (filter === 'historicos') {
            params.set('type', 'historical');
        } else if (filter === 'recentes') {
            params.set('type', 'recent');
        } else {
            params.delete('type');
        }

        if (page > 1) {
            params.set('page', page);
        } else {
            params.delete('page');
        }
        setSearchParams(params, options);
    }

    // --- EFEITO DE DEBOUNCE ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchQuery) {
                updateParams({ search: localSearch, page: 1 }, { replace: true });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localSearch]);

    const todosMemoriais = getMemoriais();
    const personalidadesImportantes = todosMemoriais.filter(m => m.tipo === 'historica');
    const memoriaisRecentes = todosMemoriais.filter(m => m.tipo === 'recente');

    const filtered = useMemo(() => {
        let list = todosMemoriais;

        if (activeFilter === 'historicos') {
            list = personalidadesImportantes;
        } else if (activeFilter === 'recentes') {
            list = memoriaisRecentes;
        }

        const query = searchQuery.trim().toLowerCase();

        if (!query) return list;

        return list.filter(memorial =>
            memorial.nome.toLowerCase().includes(query)
        );
    }, [searchQuery, activeFilter, personalidadesImportantes, memoriaisRecentes, todosMemoriais]);

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / PER_PAGE)
    );

    const currentPage = Math.min(page, totalPages);

    const memoriaisPagina = filtered.slice(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE
    );

    function handleFilter(filter) {
        updateParams({
            filter,
            page: 1
        });
    }

    function clearFilters() {
        setLocalSearch(''); 
        setSearchParams({});
    }

    return (
        <div className={styles.page}>
            <section className={styles.heroBanner}>
                <div className={styles.container}>
                    <h1>Nossos Memoriais</h1>

                    <p>
                        Explore a história e as homenagens de pessoas que
                        construíram o legado de nossa cidade.
                    </p>

                    <div className={styles.searchWrapper}>
                        <Search
                            size={22}
                            className={styles.searchIcon}
                        />

                        <input
                            type="text"
                            placeholder="Buscar pelo nome..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />

                        {localSearch && (
                            <button
                                className={styles.clearSearch}
                                onClick={() => {
                                    setLocalSearch('');
                                    updateParams({ search: '', page: 1 }, { replace: true });
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className={styles.filterSection}>
                <div className={styles.container}>
                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${activeFilter === 'todos'
                                ? styles.active
                                : ''
                                }`}
                            onClick={() => handleFilter('todos')}
                        >
                            Todos ({todosMemoriais.length})
                        </button>

                        <button
                            className={`${styles.filterBtn} ${activeFilter === 'historicos'
                                ? styles.active
                                : ''
                                }`}
                            onClick={() => handleFilter('historicos')}
                        >
                            Históricos ({personalidadesImportantes.length})
                        </button>

                        <button
                            className={`${styles.filterBtn} ${activeFilter === 'recentes'
                                ? styles.active
                                : ''
                                }`}
                            onClick={() => handleFilter('recentes')}
                        >
                            Recentes ({memoriaisRecentes.length})
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.results}>
                <div className={styles.container}>
                    <p className={styles.resultsCount}>
                        {filtered.length === 0
                            ? 'Nenhum memorial encontrado.'
                            : `${filtered.length} memorial${filtered.length > 1 ? 's' : ''} encontrado${filtered.length > 1 ? 's' : ''}.`}
                    </p>

                    {memoriaisPagina.length > 0 ? (
                        <>
                            <div className={styles.grid}>
                                {memoriaisPagina.map((memorial) => (
                                    <MemorialCard
                                        key={memorial.id}
                                        memorial={memorial}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === 1}
                                        onClick={() => updateParams({ page: currentPage - 1 })}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    {Array.from(
                                        { length: totalPages },
                                        (_, index) => index + 1
                                    ).map((number) => (
                                        <button
                                            key={number}
                                            className={`${styles.pageBtn} ${number === currentPage ? styles.pageBtnActive : ''}`}
                                            onClick={() => updateParams({ page: number })}
                                        >
                                            {number}
                                        </button>
                                    ))}

                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === totalPages}
                                        onClick={() => updateParams({ page: currentPage + 1 })}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.empty}>
                            <Search size={48} />

                            <h3>Nenhum memorial encontrado</h3>

                            <p>
                                Tente pesquisar utilizando outros termos ou sobrenomes.
                            </p>

                            <button
                                className={styles.clearBtn}
                                onClick={clearFilters}
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
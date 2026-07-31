import { todosMemoriais } from './sampleData';

const STORAGE_KEY = 'memorial_digital_data';

function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Erro ao ler memoriais do localStorage:', e);
    }
    return null;
}

function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Erro ao salvar memoriais no localStorage:', e);
    }
}

function extractQuadra(localizacao) {
    const match = localizacao?.match(/Quadra\s+([A-Za-z0-9]+)/i);
    return match ? match[1].trim().toUpperCase() : null;
}

function extractLote(localizacao) {
    const match = localizacao?.match(/Lote\s+([A-Za-z0-9]+)/i);
    return match ? match[1].trim() : null;
}

function normalizeLocalizacao(loc) {
    if (!loc) return '';
    return loc.replace(/\s+/g, ' ').trim();
}

export function getMemoriais() {
    const stored = loadFromStorage();
    if (stored) {
        const migrado = stored.map(m => {
            let loc = m.localizacao;
            if (loc && loc.includes('Setor')) {
                loc = loc.replace(/Setor/g, 'Quadra');
            }
            loc = normalizeLocalizacao(loc);
            return loc !== m.localizacao ? { ...m, localizacao: loc } : m;
        });
        if (JSON.stringify(migrado) !== JSON.stringify(stored)) saveToStorage(migrado);
        return migrado;
    }
    saveToStorage(todosMemoriais);
    return todosMemoriais;
}

export function addMemorial(memorial) {
    const lista = getMemoriais();
    const novo = {
        ...memorial,
        id: Date.now().toString(),
        data: new Date().toLocaleDateString('pt-BR')
    };
    const updated = [novo, ...lista];
    saveToStorage(updated);
    return updated;
}

export function updateMemorial(id, dadosAtualizados) {
    const lista = getMemoriais();
    const updated = lista.map(m => m.id === id ? { ...dadosAtualizados, id: m.id } : m);
    saveToStorage(updated);
    return updated;
}

export function deleteMemorial(id) {
    const lista = getMemoriais();
    const updated = lista.filter(m => m.id !== id);
    saveToStorage(updated);
    return updated;
}

export function getMemorialById(id) {
    const lista = getMemoriais();
    return lista.find(m => String(m.id) === String(id)) || null;
}

export function getMemoriaisPorTumulo(localizacao) {
    const lista = getMemoriais();
    const targetQuadra = extractQuadra(localizacao);
    const targetLote = extractLote(localizacao);

    return lista.filter(m => {
        const memQuadra = extractQuadra(m.localizacao);
        const memLote = extractLote(m.localizacao);
        if (!memQuadra) return false;

        if (targetQuadra && targetLote) {
            return memQuadra === targetQuadra && memLote === targetLote;
        }
        if (targetQuadra) {
            return memQuadra === targetQuadra;
        }
        return normalizeLocalizacao(m.localizacao).toLowerCase() === normalizeLocalizacao(localizacao).toLowerCase();
    });
}

export function getTodasLocalizacoes() {
    const lista = getMemoriais();
    const locs = [...new Set(lista.map(m => m.localizacao).filter(Boolean))];
    return locs.sort();
}

export function renameQuadra(antigoNome, novoNome) {
    const lista = getMemoriais();
    const updated = lista.map(m => {
        const mq = extractQuadra(m.localizacao);
        if (mq && mq.toUpperCase() === antigoNome.toUpperCase()) {
            return { ...m, localizacao: m.localizacao.replace(new RegExp(`Quadra\\s+${antigoNome}`, 'i'), `Quadra ${novoNome}`) };
        }
        return m;
    });
    saveToStorage(updated);
    return updated;
}

export function deleteQuadra(nome) {
    const lista = getMemoriais();
    const updated = lista.filter(m => {
        const mq = extractQuadra(m.localizacao);
        return !(mq && mq.toUpperCase() === nome.toUpperCase());
    });
    saveToStorage(updated);
    return updated;
}

export function renameLote(quadra, antigoLote, novoLote) {
    const lista = getMemoriais();
    const updated = lista.map(m => {
        const mq = extractQuadra(m.localizacao);
        const ml = extractLote(m.localizacao);
        if (mq?.toUpperCase() === quadra.toUpperCase() && ml === antigoLote) {
            return { ...m, localizacao: m.localizacao.replace(new RegExp(`Lote\\s+${antigoLote}`, 'i'), `Lote ${novoLote}`) };
        }
        return m;
    });
    saveToStorage(updated);
    return updated;
}

export function deleteLote(quadra, lote) {
    const lista = getMemoriais();
    const updated = lista.filter(m => {
        const mq = extractQuadra(m.localizacao);
        const ml = extractLote(m.localizacao);
        return !(mq?.toUpperCase() === quadra.toUpperCase() && ml === lote);
    });
    saveToStorage(updated);
    return updated;
}

export function getMemoriaisPorLote(quadra, lote) {
    const lista = getMemoriais();
    return lista.filter(m => {
        const mq = extractQuadra(m.localizacao);
        const ml = extractLote(m.localizacao);
        return mq?.toUpperCase() === quadra.toUpperCase() && ml === lote;
    });
}

/**
 * UMBRELLA ARCHIVES // BIOWEAPON RESEARCH DATABASE
 * Frontend en Vanilla JavaScript
 * Integración con API REST Spring Boot (/api/monsters)
 */

// Estado global de la aplicación
const API_URL = '/api/monsters';
let allMonsters = [];
let currentFilter = 'all';
let searchQuery = '';

// Catálogo por defecto (Fallback acorde a init.sql, solo texto)
const FALLBACK_MONSTERS = [
    {
        id: 1,
        name: 'Zombie',
        virusType: 'T-Virus',
        gameAppearance: 'Resident Evil 1 & 2',
        dangerLevel: 3,
        weakness: 'Fuego / Cabeza'
    },
    {
        id: 2,
        name: 'Licker',
        virusType: 'T-Virus',
        gameAppearance: 'Resident Evil 2',
        dangerLevel: 7,
        weakness: 'Ruido / Ceguera'
    },
    {
        id: 3,
        name: 'Nemesis T-Type',
        virusType: 'NE-Alpha + T-Virus',
        gameAppearance: 'Resident Evil 3',
        dangerLevel: 10,
        weakness: 'Lanzacohetes / Acido'
    },
    {
        id: 4,
        name: 'Ganado',
        virusType: 'Las Plagas',
        gameAppearance: 'Resident Evil 4',
        dangerLevel: 5,
        weakness: 'Granada de luz'
    }
];

// Elementos del DOM
const monstersGrid = document.getElementById('monsters-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const specimensCount = document.getElementById('specimens-count');
const emptyState = document.getElementById('empty-state');
const resetSearchBtn = document.getElementById('reset-search-btn');
const quickFilters = document.getElementById('quick-filters');
const connectionStatus = document.getElementById('connection-status');

// Modal Elements
const openModalBtn = document.getElementById('open-modal-btn');
const monsterModal = document.getElementById('monster-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const monsterForm = document.getElementById('monster-form');
const dangerInput = document.getElementById('monster-danger');
const dangerPreview = document.getElementById('danger-value');

// Detail Modal
const detailModal = document.getElementById('detail-modal');
const closeDetailBtn = document.getElementById('close-detail-btn');
const detailTitle = document.getElementById('detail-title');
const detailBody = document.getElementById('detail-body');

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    await fetchMonsters();
}

// ==========================================================================
// PETICIONES A LA API (SPRING BOOT REST)
// ==========================================================================

async function fetchMonsters() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        
        // Si la base de datos está vacía, usamos los datos de ejemplo iniciales
        if (Array.isArray(data) && data.length > 0) {
            allMonsters = data;
        } else {
            allMonsters = [...FALLBACK_MONSTERS];
        }

        updateConnectionStatus(true, 'CONECTADO AL SERVIDOR');
    } catch (err) {
        console.warn('No se pudo conectar a la API local de Spring Boot. Modo de demostración activo.', err);
        allMonsters = [...FALLBACK_MONSTERS];
        updateConnectionStatus(false, 'MODO ARCHIVO LOCAL (OFFLINE)');
        showToast('Modo de contingencia: visualizando datos locales', 'error');
    } finally {
        renderMonsters();
    }
}

async function createMonster(monsterData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(monsterData)
        });

        if (response.ok) {
            const saved = await response.json();
            allMonsters.unshift(saved);
            showToast(`¡Espécimen [${saved.name}] registrado exitosamente!`, 'success');
        } else {
            throw new Error('Error al guardar en el servidor');
        }
    } catch (err) {
        // En caso de que no haya conexión al backend, lo agregamos en memoria
        const newMonster = {
            id: Date.now(),
            ...monsterData
        };
        allMonsters.unshift(newMonster);
        showToast(`Espécimen [${newMonster.name}] guardado en memoria local`, 'success');
    } finally {
        renderMonsters();
        closeModal();
    }
}

async function deleteMonster(id, name) {
    if (!confirm(`¿CONFIRMAR ELIMINACIÓN DEL EXPEDIENTE [${name}]?\nEsta acción es irreversible en los archivos de Umbrella.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok || response.status === 204) {
            allMonsters = allMonsters.filter(m => m.id !== id);
            showToast(`Expediente [${name}] purgado con éxito`, 'success');
        } else {
            throw new Error('Error al eliminar');
        }
    } catch (err) {
        // Fallback local
        allMonsters = allMonsters.filter(m => m.id !== id);
        showToast(`Expediente [${name}] eliminado localmente`, 'success');
    } finally {
        renderMonsters();
    }
}

// ==========================================================================
// RENDERIZADO DEL GRID DE TARJETAS (REUTILIZABLE PARA GALERÍA)
// ==========================================================================

function renderMonsters() {
    const filtered = allMonsters.filter(monster => {
        // Filtro por texto de búsqueda
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = 
            !q ||
            (monster.name && monster.name.toLowerCase().includes(q)) ||
            (monster.virusType && monster.virusType.toLowerCase().includes(q)) ||
            (monster.gameAppearance && monster.gameAppearance.toLowerCase().includes(q)) ||
            (monster.weakness && monster.weakness.toLowerCase().includes(q));

        // Filtro rápido por categoría
        let matchesFilter = true;
        if (currentFilter === 'high-threat') {
            matchesFilter = (monster.dangerLevel || 0) >= 7;
        } else if (currentFilter !== 'all') {
            matchesFilter = monster.virusType && monster.virusType.toLowerCase().includes(currentFilter.toLowerCase());
        }

        return matchesSearch && matchesFilter;
    });

    // Actualizar contador
    specimensCount.textContent = filtered.length;

    // Manejo de estado vacío
    if (filtered.length === 0) {
        monstersGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Construcción del HTML de las tarjetas
    monstersGrid.innerHTML = filtered.map(monster => createCardHTML(monster)).join('');

    // Asignar eventos dinámicos a los botones de cada tarjeta
    filtered.forEach(monster => {
        const viewBtn = document.getElementById(`view-btn-${monster.id}`);
        const deleteBtn = document.getElementById(`delete-btn-${monster.id}`);

        if (viewBtn) {
            viewBtn.addEventListener('click', () => openDetailModal(monster));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteMonster(monster.id, monster.name));
        }
    });
}

/**
 * Genera el markup HTML para cada tarjeta.
 * Diseñado como un `div` con detalles y compatible con imágenes / galerías.
 */
function createCardHTML(monster) {
    const danger = Number(monster.dangerLevel) || 1;
    const dangerPercentage = Math.min(Math.max(danger * 10, 10), 100);
    
    // Configuración estética según el nivel de amenaza
    let threatClass = 'threat-low';
    let threatText = 'BAJO';
    let meterColor = 'var(--hazard-green)';

    if (danger >= 9) {
        threatClass = 'threat-extreme';
        threatText = 'CRÍTICO';
        meterColor = 'var(--umbrella-red)';
    } else if (danger >= 7) {
        threatClass = 'threat-high';
        threatText = 'ALTO';
        meterColor = '#ff4d6d';
    } else if (danger >= 4) {
        threatClass = 'threat-medium';
        threatText = 'MEDIO';
        meterColor = 'var(--hazard-yellow)';
    }

    return `
        <div class="monster-card" id="card-${monster.id}" data-id="${monster.id}">
            <!-- Encabezado de la Tarjeta (Solo Texto) -->
            <div class="card-header-bar">
                <div class="card-meta">
                    <span class="specimen-id">B.O.W. #${String(monster.id).padStart(3, '0')}</span>
                    <span class="specimen-game">${escapeHTML(monster.gameAppearance || 'N/D')}</span>
                </div>
                <div class="threat-badge ${threatClass}">
                    <span>AMENAZA:</span>
                    <strong>${danger}/10 [${threatText}]</strong>
                </div>
            </div>

            <!-- Contenido y detalles del monstruo -->
            <div class="card-content">
                <h2 class="specimen-name">${escapeHTML(monster.name)}</h2>

                <!-- Medidor de Nivel de Peligro -->
                <div class="danger-meter-group">
                    <div class="danger-meter-label">
                        <span>ÍNDICE DE LETHALIDAD</span>
                        <span>${danger * 10}%</span>
                    </div>
                    <div class="danger-track">
                        <div class="danger-fill" style="width: ${dangerPercentage}%; background-color: ${meterColor};"></div>
                    </div>
                </div>

                <!-- Detalles técnicos -->
                <div class="details-list">
                    <div class="detail-row">
                        <span class="detail-label">PATÓGENO:</span>
                        <span class="detail-value"><span class="virus-pill">${escapeHTML(monster.virusType || 'Desconocido')}</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">DEBILIDAD:</span>
                        <span class="detail-value">${escapeHTML(monster.weakness || 'Sin contramedidas registradas')}</span>
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div class="card-actions">
                    <button class="card-btn" id="view-btn-${monster.id}">EXPEDIENTE</button>
                    <button class="card-btn card-btn-delete" id="delete-btn-${monster.id}">PURGAR</button>
                </div>
            </div>
        </div>
    `;
}

function getFallbackGraphicHTML(id) {
    return `
        <div class="card-placeholder-graphic">
            <span class="placeholder-biohazard">☣</span>
            <span class="placeholder-code">ESPÉCIMEN #${String(id).padStart(3, '0')}</span>
        </div>
    `;
}

// ==========================================================================
// MANEJADORES DE EVENTOS (BÚSQUEDA, FILTROS, MODALES)
// ==========================================================================

function setupEventListeners() {
    // 1. Barra de Búsqueda reactiva
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
        renderMonsters();
    });

    // 2. Clic en la lupa de la derecha
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value;
        renderMonsters();
        searchInput.focus();
    });

    // Enter en input de búsqueda
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value;
            renderMonsters();
        }
    });

    // Limpiar búsqueda
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderMonsters();
        searchInput.focus();
    });

    resetSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        currentFilter = 'all';
        clearSearchBtn.classList.add('hidden');
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.filter-chip[data-filter="all"]').classList.add('active');
        renderMonsters();
    });

    // 3. Filtros rápidos
    quickFilters.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-chip')) return;

        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');

        currentFilter = e.target.dataset.filter;
        renderMonsters();
    });

    // 4. Modal para nuevo espécimen
    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Cerrar modal al dar click fuera
    monsterModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) closeModal();
    });

    detailModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) closeDetailModal();
    });
    closeDetailBtn.addEventListener('click', closeDetailModal);

    // Tecla ESC para cerrar modales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailModal();
        }
    });

    // Slider de peligro
    dangerInput.addEventListener('input', (e) => {
        const val = e.target.value;
        dangerPreview.textContent = `${val} / 10`;
    });

    // Envío del formulario
    monsterForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newMonster = {
            name: document.getElementById('monster-name').value.trim(),
            virusType: document.getElementById('monster-virus').value.trim(),
            gameAppearance: document.getElementById('monster-game').value.trim(),
            dangerLevel: parseInt(dangerInput.value, 10),
            weakness: document.getElementById('monster-weakness').value.trim()
        };

        createMonster(newMonster);
    });
}

// ==========================================================================
// MODALES Y UTILIDADES
// ==========================================================================

function openModal() {
    monsterForm.reset();
    dangerInput.value = 5;
    dangerPreview.textContent = '5 / 10';
    monsterModal.classList.remove('hidden');
    document.getElementById('monster-name').focus();
}

function closeModal() {
    monsterModal.classList.add('hidden');
}

function openDetailModal(monster) {
    detailTitle.textContent = `${monster.name.toUpperCase()} // EXPEDIENTE TÉCNICO B.O.W.`;
    
    detailBody.innerHTML = `
        <div class="detail-view-container">
            <div class="details-list" style="font-size: 1.05rem; gap: 0.85rem;">
                <div class="detail-row">
                    <span class="detail-label">CÓDIGO:</span>
                    <span class="detail-value">UMBRELLA-EXP-#${String(monster.id).padStart(3, '0')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">NOMBRE:</span>
                    <span class="detail-value">${escapeHTML(monster.name)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">CEPA VIRAL:</span>
                    <span class="detail-value"><span class="virus-pill">${escapeHTML(monster.virusType)}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">APARICIÓN:</span>
                    <span class="detail-value">${escapeHTML(monster.gameAppearance)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">PELIGRO:</span>
                    <span class="detail-value" style="color: var(--umbrella-red); font-weight: 700;">${monster.dangerLevel} de 10</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">DEBILIDAD:</span>
                    <span class="detail-value">${escapeHTML(monster.weakness || 'Ninguna identificada')}</span>
                </div>
            </div>
        </div>
    `;

    detailModal.classList.remove('hidden');
}

function closeDetailModal() {
    detailModal.classList.add('hidden');
}

function updateConnectionStatus(isOnline, text) {
    if (connectionStatus) {
        connectionStatus.textContent = text;
        const dot = document.querySelector('.status-dot');
        if (dot) {
            dot.style.backgroundColor = isOnline ? 'var(--hazard-green)' : 'var(--umbrella-red)';
            dot.style.boxShadow = isOnline ? '0 0 10px var(--hazard-green)' : '0 0 10px var(--umbrella-red)';
        }
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `re-toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
        <span>${type === 'error' ? '⚠️' : '☣️'}</span>
        <div>${escapeHTML(message)}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

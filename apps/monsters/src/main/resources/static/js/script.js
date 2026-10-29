/**
 * UMBRELLA ARCHIVES // BIOWEAPON RESEARCH DATABASE
 * Pure Vanilla JavaScript Frontend
 * Integration with Spring Boot REST API (/api/monsters)
 * Full CRUD Operations: Read, Filter/Search, Create (POST), Edit (PUT), Purge (DELETE)
 */

// Application global state
const API_URL = '/api/monsters';
let allMonsters = [];
let currentFilter = 'all';
let searchQuery = '';

// Default catalog (matches init.sql as fallback)
const FALLBACK_MONSTERS = [
    {
        id: 1,
        name: 'Zombie',
        virusType: 'T-Virus',
        gameAppearance: 'Resident Evil 1 & 2',
        dangerLevel: 3,
        weakness: 'Fire / Headshot'
    },
    {
        id: 2,
        name: 'Licker',
        virusType: 'T-Virus',
        gameAppearance: 'Resident Evil 2',
        dangerLevel: 7,
        weakness: 'Loud Noise / Blindness'
    },
    {
        id: 3,
        name: 'Nemesis T-Type',
        virusType: 'NE-Alpha + T-Virus',
        gameAppearance: 'Resident Evil 3',
        dangerLevel: 10,
        weakness: 'Rocket Launcher / Acid'
    },
    {
        id: 4,
        name: 'Ganado',
        virusType: 'Las Plagas',
        gameAppearance: 'Resident Evil 4',
        dangerLevel: 5,
        weakness: 'Flash Grenade'
    }
];

// DOM elements
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
const monsterIdInput = document.getElementById('monster-id');
const modalTitle = document.getElementById('modal-title');
const modalTag = document.getElementById('modal-tag');
const submitModalBtn = document.getElementById('submit-modal-btn');
const dangerInput = document.getElementById('monster-danger');
const dangerPreview = document.getElementById('danger-value');

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    await fetchMonsters();
}

// ==========================================================================
// API REQUESTS (SPRING BOOT REST)
// ==========================================================================

async function fetchMonsters() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            allMonsters = data;
        } else {
            allMonsters = [...FALLBACK_MONSTERS];
        }

        updateConnectionStatus(true, 'SYSTEM ONLINE');
    } catch (err) {
        console.warn('Could not connect to Spring Boot backend. Fallback demo mode active.', err);
        allMonsters = [...FALLBACK_MONSTERS];
        updateConnectionStatus(false, 'LOCAL ARCHIVE MODE (OFFLINE)');
        showToast('Contingency mode: viewing offline local dataset', 'error');
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
            showToast(`Specimen [${saved.name}] successfully registered!`, 'success');
        } else {
            throw new Error('Server error while saving');
        }
    } catch (err) {
        const newMonster = {
            id: Date.now(),
            ...monsterData
        };
        allMonsters.unshift(newMonster);
        showToast(`Specimen [${newMonster.name}] saved in local memory`, 'success');
    } finally {
        renderMonsters();
        closeModal();
    }
}

async function updateMonster(id, monsterData) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(monsterData)
        });

        if (response.ok) {
            const updated = await response.json();
            const index = allMonsters.findIndex(m => m.id === id);
            if (index !== -1) allMonsters[index] = updated;
            showToast(`Specimen [${updated.name}] successfully updated!`, 'success');
        } else {
            throw new Error('Server error while updating');
        }
    } catch (err) {
        const index = allMonsters.findIndex(m => m.id === id);
        if (index !== -1) {
            allMonsters[index] = { id, ...monsterData };
            showToast(`Specimen [${monsterData.name}] updated locally`, 'success');
        }
    } finally {
        renderMonsters();
        closeModal();
    }
}

async function deleteMonster(id, name) {
    if (!confirm(`CONFIRM PURGE OF RECORD [${name}]?\nThis action is irreversible in Umbrella archives.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok || response.status === 204) {
            allMonsters = allMonsters.filter(m => m.id !== id);
            showToast(`Record [${name}] successfully purged`, 'success');
        } else {
            throw new Error('Server error while deleting');
        }
    } catch (err) {
        allMonsters = allMonsters.filter(m => m.id !== id);
        showToast(`Record [${name}] removed locally`, 'success');
    } finally {
        renderMonsters();
    }
}

// ==========================================================================
// RENDERING CARDS GRID
// ==========================================================================

function renderMonsters() {
    const filtered = allMonsters.filter(monster => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = 
            !q ||
            (monster.name && monster.name.toLowerCase().includes(q)) ||
            (monster.virusType && monster.virusType.toLowerCase().includes(q)) ||
            (monster.gameAppearance && monster.gameAppearance.toLowerCase().includes(q)) ||
            (monster.weakness && monster.weakness.toLowerCase().includes(q));

        let matchesFilter = true;
        if (currentFilter === 'high-threat') {
            matchesFilter = (monster.dangerLevel || 0) >= 7;
        } else if (currentFilter !== 'all') {
            matchesFilter = monster.virusType && monster.virusType.toLowerCase().includes(currentFilter.toLowerCase());
        }

        return matchesSearch && matchesFilter;
    });

    specimensCount.textContent = filtered.length;

    if (filtered.length === 0) {
        monstersGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    monstersGrid.innerHTML = filtered.map(monster => createCardHTML(monster)).join('');

    filtered.forEach(monster => {
        const editBtn = document.getElementById(`edit-btn-${monster.id}`);
        const deleteBtn = document.getElementById(`delete-btn-${monster.id}`);

        if (editBtn) {
            editBtn.addEventListener('click', () => openEditModal(monster));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteMonster(monster.id, monster.name));
        }
    });
}

function createCardHTML(monster) {
    const danger = Number(monster.dangerLevel) || 1;
    const dangerPercentage = Math.min(Math.max(danger * 10, 10), 100);
    
    let threatClass = 'threat-low';
    let threatText = 'LOW';
    let meterColor = 'var(--hazard-green)';

    if (danger >= 9) {
        threatClass = 'threat-extreme';
        threatText = 'CRITICAL';
        meterColor = 'var(--umbrella-red)';
    } else if (danger >= 7) {
        threatClass = 'threat-high';
        threatText = 'HIGH';
        meterColor = '#ff4d6d';
    } else if (danger >= 4) {
        threatClass = 'threat-medium';
        threatText = 'MEDIUM';
        meterColor = 'var(--hazard-yellow)';
    }

    return `
        <div class="monster-card" id="card-${monster.id}" data-id="${monster.id}">
            <div class="card-header-bar">
                <div class="card-meta">
                    <span class="specimen-id">B.O.W. #${String(monster.id).padStart(3, '0')}</span>
                    <span class="specimen-game">${escapeHTML(monster.gameAppearance || 'N/A')}</span>
                </div>
                <div class="threat-badge ${threatClass}">
                    <span>THREAT:</span>
                    <strong>${danger}/10 [${threatText}]</strong>
                </div>
            </div>

            <div class="card-content">
                <h2 class="specimen-name">${escapeHTML(monster.name)}</h2>

                <div class="danger-meter-group">
                    <div class="danger-meter-label">
                        <span>LETHALITY INDEX</span>
                        <span>${danger * 10}%</span>
                    </div>
                    <div class="danger-track">
                        <div class="danger-fill" style="width: ${dangerPercentage}%; background-color: ${meterColor};"></div>
                    </div>
                </div>

                <div class="details-list">
                    <div class="detail-row">
                        <span class="detail-label">PATHOGEN:</span>
                        <span class="detail-value"><span class="virus-pill">${escapeHTML(monster.virusType || 'Unknown')}</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">WEAKNESS:</span>
                        <span class="detail-value">${escapeHTML(monster.weakness || 'No registered countermeasures')}</span>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="card-btn card-btn-edit" id="edit-btn-${monster.id}">EDIT</button>
                    <button class="card-btn card-btn-delete" id="delete-btn-${monster.id}">PURGE</button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
        renderMonsters();
    });

    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value;
        renderMonsters();
        searchInput.focus();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value;
            renderMonsters();
        }
    });

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

    quickFilters.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-chip')) return;

        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');

        currentFilter = e.target.dataset.filter;
        renderMonsters();
    });

    openModalBtn.addEventListener('click', openCreateModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    monsterModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    dangerInput.addEventListener('input', (e) => {
        const val = e.target.value;
        dangerPreview.textContent = `${val} / 10`;
    });

    monsterForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = monsterIdInput.value ? Number(monsterIdInput.value) : null;
        const monsterData = {
            name: document.getElementById('monster-name').value.trim(),
            virusType: document.getElementById('monster-virus').value.trim(),
            gameAppearance: document.getElementById('monster-game').value.trim(),
            dangerLevel: parseInt(dangerInput.value, 10),
            weakness: document.getElementById('monster-weakness').value.trim()
        };

        if (id) {
            updateMonster(id, monsterData);
        } else {
            createMonster(monsterData);
        }
    });
}

// ==========================================================================
// MODAL CONTROLS
// ==========================================================================

function openCreateModal() {
    monsterForm.reset();
    monsterIdInput.value = '';
    dangerInput.value = 5;
    dangerPreview.textContent = '5 / 10';

    modalTag.textContent = 'CONTAINMENT PROTOCOL';
    modalTitle.textContent = 'REGISTER NEW BIOWEAPON';
    submitModalBtn.textContent = 'SAVE RECORD';

    monsterModal.classList.remove('hidden');
    document.getElementById('monster-name').focus();
}

function openEditModal(monster) {
    monsterIdInput.value = monster.id;
    document.getElementById('monster-name').value = monster.name || '';
    document.getElementById('monster-virus').value = monster.virusType || '';
    document.getElementById('monster-game').value = monster.gameAppearance || '';
    
    const danger = Number(monster.dangerLevel) || 5;
    dangerInput.value = danger;
    dangerPreview.textContent = `${danger} / 10`;
    
    document.getElementById('monster-weakness').value = monster.weakness || '';

    modalTag.textContent = `MODIFY RECORD B.O.W. #${String(monster.id).padStart(3, '0')}`;
    modalTitle.textContent = `EDIT: ${monster.name.toUpperCase()}`;
    submitModalBtn.textContent = 'SAVE CHANGES';

    monsterModal.classList.remove('hidden');
    document.getElementById('monster-name').focus();
}

function closeModal() {
    monsterModal.classList.add('hidden');
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

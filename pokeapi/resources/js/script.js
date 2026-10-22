/**
 * ==========================================================================
 * POKÉDEX ARCHIVES // POKEAPI CONSUMPTION ENGINE (HOMEWORK 1)
 * Pure Vanilla JavaScript Frontend
 * 
 * Explicit consumption of 3 REST Endpoints from PokeAPI:
 * 1. https://pokeapi.co/api/v2/pokemon/{id_or_name}
 *    -> Basic attributes, elemental types, combat stats, physical dimensions, cries (audio) and official artwork.
 * 2. https://pokeapi.co/api/v2/pokemon-species/{id_or_name}
 *    -> Official lore/description (flavor_text), genus classification, habitat, capture rate and evolution link.
 * 3. https://pokeapi.co/api/v2/evolution-chain/{id}
 *    -> Complete evolutionary tree structure (stages, minimum levels and evolution triggers).
 * ==========================================================================
 */

// Configuration and Endpoints
const API_BASE = 'https://pokeapi.co/api/v2';
const ENDPOINTS = {
    POKEMON: `${API_BASE}/pokemon`,
    SPECIES: `${API_BASE}/pokemon-species`,
    EVOLUTION: `${API_BASE}/evolution-chain`
};

// Generation ranges
const GENERATIONS = {
    '1': { offset: 0, limit: 151, startId: 1, endId: 151 },
    '2': { offset: 151, limit: 100, startId: 152, endId: 251 },
    '3': { offset: 251, limit: 135, startId: 252, endId: 386 },
    '4': { offset: 386, limit: 107, startId: 387, endId: 493 },
    'all': { offset: 0, limit: 1025, startId: 1, endId: 1025 }
};

// Type translations for display
const TYPE_TRANSLATIONS = {
    normal: 'Normal',
    fire: 'Fire',
    water: 'Water',
    grass: 'Grass',
    electric: 'Electric',
    ice: 'Ice',
    fighting: 'Fighting',
    poison: 'Poison',
    ground: 'Ground',
    flying: 'Flying',
    psychic: 'Psychic',
    bug: 'Bug',
    rock: 'Rock',
    ghost: 'Ghost',
    dragon: 'Dragon',
    steel: 'Steel',
    fairy: 'Fairy',
    dark: 'Dark'
};

// Readable names for combat stats
const STAT_NAMES = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed'
};

// Global application state
let allLoadedPokemon = [];
let currentOffset = 0;
const BATCH_SIZE = 24;
let currentGen = '1';
let activeTypeFilter = 'all';
let searchQuery = '';
let isLoading = false;

// Additional details cache for performance (species and evolution)
const speciesCache = new Map();
const evolutionCache = new Map();

// DOM references
const pokemonGrid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const genFilter = document.getElementById('gen-filter');
const typeFilters = document.getElementById('type-filters');
const specimensCount = document.getElementById('specimens-count');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const resetSearchBtn = document.getElementById('reset-search-btn');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreContainer = document.getElementById('load-more-container');
const connectionStatus = document.getElementById('connection-status');
const debounceIndicator = document.getElementById('debounce-indicator');
const debounceText = document.getElementById('debounce-text');

// Debounce state configuration (4000ms delay)
const DEBOUNCE_DELAY_MS = 4000;
let debounceTimeoutId = null;
let debounceIntervalId = null;
let debounceStartTime = null;

// Modal DOM references
const modal = document.getElementById('pokemon-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalFooterCloseBtn = document.getElementById('modal-footer-close-btn');
const modalPokemonId = document.getElementById('modal-pokemon-id');
const modalPokemonName = document.getElementById('modal-pokemon-name');
const modalPokemonGenus = document.getElementById('modal-pokemon-genus');
const modalPokemonImg = document.getElementById('modal-pokemon-img');
const modalGlow = document.getElementById('modal-glow');
const modalHeight = document.getElementById('modal-height');
const modalWeight = document.getElementById('modal-weight');
const modalHabitat = document.getElementById('modal-habitat');
const modalCaptureRate = document.getElementById('modal-capture-rate');
const modalTypes = document.getElementById('modal-types');
const modalDescription = document.getElementById('modal-description');
const modalStatsGrid = document.getElementById('modal-stats-grid');
const modalEvolutionChain = document.getElementById('modal-evolution-chain');
const playCryBtn = document.getElementById('play-cry-btn');
const pokemonCryAudio = document.getElementById('pokemon-cry-audio');

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    currentOffset = 0;
    allLoadedPokemon = [];
    await loadPokemonBatch();
}

// ==========================================================================
// ENDPOINT 1: /pokemon (Listing and basic combat attributes)
// ==========================================================================
async function loadPokemonBatch() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
        const genInfo = GENERATIONS[currentGen];
        const offset = genInfo.offset + currentOffset;
        const remainingInGen = genInfo.limit - currentOffset;
        const fetchCount = Math.min(BATCH_SIZE, remainingInGen);

        if (fetchCount <= 0) {
            loadMoreContainer.classList.add('hidden');
            showLoading(false);
            isLoading = false;
            return;
        }

        // Call endpoint 1 to obtain paginated list
        const response = await fetch(`${ENDPOINTS.POKEMON}?offset=${offset}&limit=${fetchCount}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        // Fetch individual details concurrently using /pokemon/{id}
        const detailPromises = data.results.map(p => fetch(p.url).then(r => r.json()));
        const pokemonDetails = await Promise.all(detailPromises);

        // Store into global collection
        allLoadedPokemon.push(...pokemonDetails);
        currentOffset += fetchCount;

        // Hide load more button if all generation specimens are loaded
        if (currentOffset >= genInfo.limit) {
            loadMoreContainer.classList.add('hidden');
        } else {
            loadMoreContainer.classList.remove('hidden');
        }

        renderPokemonGrid();
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Error loading Pokémon from PokeAPI:', error);
        updateConnectionStatus(false);
    } finally {
        showLoading(false);
        isLoading = false;
    }
}

// ==========================================================================
// RENDERING CARDS GRID
// ==========================================================================
function renderPokemonGrid() {
    const filtered = getFilteredPokemon();
    specimensCount.textContent = filtered.length;

    pokemonGrid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        loadMoreContainer.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    if (searchQuery || activeTypeFilter !== 'all') {
        loadMoreContainer.classList.add('hidden');
    } else if (currentOffset < GENERATIONS[currentGen].limit) {
        loadMoreContainer.classList.remove('hidden');
    }

    filtered.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokemonGrid.appendChild(card);
    });
}

function createPokemonCard(pokemon) {
    const card = document.createElement('article');
    card.className = 'pokemon-card';
    card.setAttribute('data-id', pokemon.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View details for ${pokemon.name}`);

    // Extract official high-resolution artwork
    const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default 
        || pokemon.sprites.other?.home?.front_default 
        || pokemon.sprites.front_default 
        || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

    // Types and colors
    const primaryType = pokemon.types[0]?.type?.name || 'normal';
    const hpStat = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0;
    const atkStat = pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0;
    const defStat = pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0;

    const typesHtml = pokemon.types.map(t => {
        const typeName = t.type.name;
        const translated = TYPE_TRANSLATIONS[typeName] || typeName;
        return `<span class="type-badge type-${typeName}">${translated}</span>`;
    }).join('');

    card.innerHTML = `
        <div class="card-top-bar">
            <span class="pokemon-id-tag">#${String(pokemon.id).padStart(3, '0')}</span>
            <span class="pokemon-hp-tag">HP: <strong>${hpStat}</strong></span>
        </div>
        <div class="card-image-box">
            <div class="card-ambient-glow" style="background-color: var(--type-${primaryType}, var(--pk-blue));"></div>
            <img 
                src="${artworkUrl}" 
                alt="Official artwork of ${pokemon.name}" 
                class="card-pokemon-img"
                loading="lazy"
            >
        </div>
        <div class="card-content">
            <div class="card-title-row">
                <h3 class="pokemon-name">${pokemon.name}</h3>
                <div class="types-badge-list">
                    ${typesHtml}
                </div>
            </div>
            <div class="card-stats-mini">
                <div class="mini-stat">
                    <span class="mini-stat-label">ATTACK</span>
                    <span class="mini-stat-val">${atkStat}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">DEFENSE</span>
                    <span class="mini-stat-val">${defStat}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">HEIGHT</span>
                    <span class="mini-stat-val">${(pokemon.height / 10).toFixed(1)}m</span>
                </div>
            </div>
            <div class="card-footer-prompt">
                <span>VIEW BIOLOGICAL FILE</span>
                <span class="arrow">&raquo;</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openPokemonModal(pokemon));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPokemonModal(pokemon);
        }
    });

    return card;
}

// ==========================================================================
// FILTERING AND SEARCH
// ==========================================================================
function getFilteredPokemon() {
    return allLoadedPokemon.filter(pokemon => {
        const matchesType = activeTypeFilter === 'all' || 
            pokemon.types.some(t => t.type.name === activeTypeFilter);

        if (!searchQuery) return matchesType;

        const query = searchQuery.toLowerCase().trim();
        const matchesName = pokemon.name.toLowerCase().includes(query);
        const matchesId = `#${pokemon.id}`.includes(query) || String(pokemon.id) === query;
        const matchesTypes = pokemon.types.some(t => {
            const rawType = t.type.name.toLowerCase();
            const translatedType = (TYPE_TRANSLATIONS[rawType] || '').toLowerCase();
            return rawType.includes(query) || translatedType.includes(query);
        });

        return matchesType && (matchesName || matchesId || matchesTypes);
    });
}

// ==========================================================================
// DETAILED MODAL POPUP (ENDPOINTS 2 & 3)
// ==========================================================================
async function openPokemonModal(pokemon) {
    // 1. Populate immediate data from Endpoint 1 (/pokemon)
    modalPokemonId.textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    modalPokemonName.textContent = pokemon.name;
    modalHeight.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
    modalWeight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;

    const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default 
        || pokemon.sprites.other?.home?.front_default 
        || pokemon.sprites.front_default;
    modalPokemonImg.src = artworkUrl;
    modalPokemonImg.alt = `Official artwork of ${pokemon.name}`;

    const primaryType = pokemon.types[0]?.type?.name || 'normal';
    modalGlow.style.backgroundColor = `var(--type-${primaryType}, var(--pk-blue))`;

    // Type badges
    modalTypes.innerHTML = pokemon.types.map(t => {
        const typeName = t.type.name;
        const translated = TYPE_TRANSLATIONS[typeName] || typeName;
        return `<span class="type-badge type-${typeName}">${translated}</span>`;
    }).join('');

    // Cry Audio
    const cryUrl = pokemon.cries?.latest || pokemon.cries?.legacy;
    if (cryUrl) {
        pokemonCryAudio.src = cryUrl;
        playCryBtn.classList.remove('hidden');
    } else {
        playCryBtn.classList.add('hidden');
    }

    renderModalStats(pokemon.stats);

    // Interim values while loading Endpoints 2 & 3
    modalPokemonGenus.textContent = 'Analyzing...';
    modalHabitat.textContent = 'Querying...';
    modalCaptureRate.textContent = 'Querying...';
    modalDescription.textContent = 'Accessing PokeAPI biological archive...';
    modalEvolutionChain.innerHTML = '<div class="evo-loading">Querying evolutionary chain on PokeAPI...</div>';

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 2. Composite API JOIN Step 2: Query /pokemon-species/{id} using primary key pokemon.id
    try {
        const speciesData = await fetchSpeciesData(pokemon.id);
        renderSpeciesDetails(speciesData);

        // 3. Composite API JOIN Step 3: Query /evolution-chain/{id} via foreign key speciesData.evolution_chain.url
        let evoData = null;
        if (speciesData.evolution_chain?.url) {
            evoData = await fetchEvolutionChain(speciesData.evolution_chain.url);
            renderEvolutionChain(evoData, pokemon.id);
        } else {
            modalEvolutionChain.innerHTML = '<div class="evo-loading">This specimen has no registered evolution line.</div>';
        }

        // Informative logging for API JOIN pattern verification (Inspectable in browser DevTools Console)
        console.groupCollapsed(`%c[REST API JOIN] Composite Specimen #${pokemon.id} - ${pokemon.name.toUpperCase()}`, 'color: #3b82f6; font-weight: bold;');
        console.log('%c[Step 1 - Primary Endpoint]: GET /pokemon/%s', 'color: #10b981; font-weight: bold;', pokemon.id, {
            id: pokemon.id,
            name: pokemon.name,
            types: pokemon.types.map(t => t.type.name),
            stats: pokemon.stats.map(s => ({ stat: s.stat.name, value: s.base_stat }))
        });
        console.log('%c[Step 2 - Joined Relation]: GET /pokemon-species/%s (Joined on pokemon.id)', 'color: #f59e0b; font-weight: bold;', pokemon.id, {
            genus: speciesData.genera?.find(g => g.language.name === 'en')?.genus,
            habitat: speciesData.habitat?.name,
            captureRate: speciesData.capture_rate,
            evolutionChainForeignKey: speciesData.evolution_chain?.url
        });
        console.log('%c[Step 3 - Nested Joined Relation]: GET %s (Joined on evolution_chain.url)', 'color: #8b5cf6; font-weight: bold;', speciesData.evolution_chain?.url, evoData);
        console.groupEnd();
    } catch (error) {
        console.error('Error retrieving detailed PokeAPI composite data:', error);
        modalDescription.textContent = 'Could not load detailed biological description from PokeAPI at this moment.';
        modalEvolutionChain.innerHTML = '<div class="evo-loading">Evolutionary information unavailable.</div>';
    }
}

// Fetch Endpoint 2 with caching
async function fetchSpeciesData(pokemonId) {
    if (speciesCache.has(pokemonId)) {
        return speciesCache.get(pokemonId);
    }
    const response = await fetch(`${ENDPOINTS.SPECIES}/${pokemonId}`);
    if (!response.ok) throw new Error(`Species error: ${response.status}`);
    const data = await response.json();
    speciesCache.set(pokemonId, data);
    return data;
}

// Fetch Endpoint 3 with caching
async function fetchEvolutionChain(evolutionUrl) {
    if (evolutionCache.has(evolutionUrl)) {
        return evolutionCache.get(evolutionUrl);
    }
    const response = await fetch(evolutionUrl);
    if (!response.ok) throw new Error(`Evolution-chain error: ${response.status}`);
    const data = await response.json();
    evolutionCache.set(evolutionUrl, data);
    return data;
}

// Render description and lore from Endpoint 2
function renderSpeciesDetails(species) {
    // 1. Classification / Genus (English preferred)
    const genusEn = species.genera?.find(g => g.language.name === 'en')
        || species.genera?.find(g => g.language.name === 'es');
    modalPokemonGenus.textContent = genusEn ? genusEn.genus : 'Pokémon Species';

    // 2. Habitat
    modalHabitat.textContent = species.habitat?.name 
        ? species.habitat.name.toUpperCase() 
        : 'Unknown';

    // 3. Capture Rate
    modalCaptureRate.textContent = `${species.capture_rate || '--'} / 255`;

    // 4. Description in English (flavor_text)
    const flavorEntry = species.flavor_text_entries?.find(entry => entry.language.name === 'en')
        || species.flavor_text_entries?.find(entry => entry.language.name === 'es');

    if (flavorEntry) {
        const cleanDescription = flavorEntry.flavor_text
            .replace(/[\n\f\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        modalDescription.textContent = `"${cleanDescription}"`;
    } else {
        modalDescription.textContent = 'No registered biological description for this specimen.';
    }
}

// Render base combat stat bars
function renderModalStats(stats) {
    modalStatsGrid.innerHTML = '';
    const maxStat = 255;

    stats.forEach(s => {
        const statKey = s.stat.name;
        const displayName = STAT_NAMES[statKey] || statKey;
        const value = s.base_stat;
        const percentage = Math.min(100, Math.round((value / maxStat) * 100));

        const row = document.createElement('div');
        row.className = 'stat-bar-row';
        row.innerHTML = `
            <span class="stat-name">${displayName}</span>
            <span class="stat-number">${value}</span>
            <div class="stat-track">
                <div class="stat-fill" style="width: ${percentage}%;"></div>
            </div>
        `;
        modalStatsGrid.appendChild(row);
    });
}

// Render evolutionary chain from Endpoint 3
function renderEvolutionChain(evoData, currentPokemonId) {
    const evoStages = [];
    let currentStage = evoData.chain;

    while (currentStage) {
        const speciesName = currentStage.species.name;
        const parts = currentStage.species.url.split('/').filter(Boolean);
        const speciesId = parseInt(parts[parts.length - 1], 10);

        const minLevel = currentStage.evolution_details?.[0]?.min_level || null;
        const trigger = currentStage.evolution_details?.[0]?.trigger?.name || null;

        evoStages.push({
            id: speciesId,
            name: speciesName,
            minLevel,
            trigger,
            isCurrent: speciesId === currentPokemonId
        });

        currentStage = currentStage.evolves_to?.[0] || null;
    }

    if (evoStages.length <= 1) {
        modalEvolutionChain.innerHTML = '<div class="evo-loading">This specimen has no evolutionary chain.</div>';
        return;
    }

    const evoListContainer = document.createElement('div');
    evoListContainer.className = 'evo-stages-list';

    evoStages.forEach((stage, index) => {
        const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stage.id}.png`;

        const evoCard = document.createElement('div');
        evoCard.className = `evo-card ${stage.isCurrent ? 'current' : ''}`;
        evoCard.title = stage.isCurrent ? 'Current specimen' : `View ${stage.name}`;
        evoCard.innerHTML = `
            <img src="${spriteUrl}" alt="${stage.name}" class="evo-sprite">
            <span class="evo-name">${stage.name}</span>
            <span class="phys-label">#${String(stage.id).padStart(3, '0')}</span>
        `;

        if (!stage.isCurrent) {
            evoCard.addEventListener('click', async () => {
                await loadAndOpenSpecificPokemon(stage.id);
            });
        }

        evoListContainer.appendChild(evoCard);

        if (index < evoStages.length - 1) {
            const nextStage = evoStages[index + 1];
            const arrow = document.createElement('div');
            arrow.className = 'evo-arrow';
            const detailText = nextStage.minLevel ? `Lv. ${nextStage.minLevel}` : '➜';
            arrow.innerHTML = `<span>${detailText}</span>`;
            evoListContainer.appendChild(arrow);
        }
    });

    modalEvolutionChain.innerHTML = '';
    modalEvolutionChain.appendChild(evoListContainer);
}

// Load and open a specific Pokémon when selected from evolution chain
async function loadAndOpenSpecificPokemon(pokemonId) {
    try {
        let pokemon = allLoadedPokemon.find(p => p.id === pokemonId);
        if (!pokemon) {
            const res = await fetch(`${ENDPOINTS.POKEMON}/${pokemonId}`);
            if (!res.ok) throw new Error('Not found');
            pokemon = await res.json();
        }
        openPokemonModal(pokemon);
    } catch (e) {
        console.error('Error navigating evolutionary chain:', e);
    }
}

// Close Modal
function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    pokemonCryAudio.pause();
    pokemonCryAudio.currentTime = 0;
}

// ==========================================================================
// ==========================================================================
// DEBOUNCING ENGINE (4-SECOND DELAY)
// ==========================================================================
function startDebouncedSearch() {
    clearDebounceTimers();

    const rawValue = searchInput.value;
    clearSearchBtn.classList.toggle('hidden', rawValue.length === 0);

    if (rawValue.trim().length === 0) {
        searchQuery = '';
        renderPokemonGrid();
        hideDebounceIndicator();
        return;
    }

    showDebounceIndicator(DEBOUNCE_DELAY_MS / 1000);
    debounceStartTime = Date.now();

    // Update real-time countdown every 100ms
    debounceIntervalId = setInterval(() => {
        const elapsed = Date.now() - debounceStartTime;
        const remaining = Math.max(0, (DEBOUNCE_DELAY_MS - elapsed) / 1000);
        if (debounceText) {
            debounceText.textContent = `Debouncing request: ${remaining.toFixed(1)}s`;
        }
    }, 100);

    // Trigger search after 4000ms inactivity
    debounceTimeoutId = setTimeout(() => {
        clearDebounceTimers();
        hideDebounceIndicator();
        executeSearch();
    }, DEBOUNCE_DELAY_MS);
}

function clearDebounceTimers() {
    if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
        debounceTimeoutId = null;
    }
    if (debounceIntervalId) {
        clearInterval(debounceIntervalId);
        debounceIntervalId = null;
    }
}

function showDebounceIndicator(initialSeconds) {
    if (debounceIndicator && debounceText) {
        debounceText.textContent = `Debouncing request: ${initialSeconds.toFixed(1)}s`;
        debounceIndicator.classList.remove('hidden');
    }
}

function hideDebounceIndicator() {
    if (debounceIndicator) {
        debounceIndicator.classList.add('hidden');
    }
}

function executeSearch() {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderPokemonGrid();
    if (searchQuery) {
        handleDirectSearch();
    }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
    // 4-Second Debounced Search on input
    searchInput.addEventListener('input', startDebouncedSearch);

    // Bypass debouncing on Enter key or explicit search button click
    searchBtn.addEventListener('click', () => {
        clearDebounceTimers();
        hideDebounceIndicator();
        executeSearch();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearDebounceTimers();
            hideDebounceIndicator();
            executeSearch();
        }
    });

    // Clear search button immediately cancels debounce and resets
    clearSearchBtn.addEventListener('click', () => {
        clearDebounceTimers();
        hideDebounceIndicator();
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderPokemonGrid();
        searchInput.focus();
    });

    // Reset search button immediately cancels debounce and resets
    resetSearchBtn.addEventListener('click', () => {
        clearDebounceTimers();
        hideDebounceIndicator();
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        activeTypeFilter = 'all';
        updateActiveTypeChip('all');
        renderPokemonGrid();
    });

    // Generation filter
    genFilter.addEventListener('change', async (e) => {
        currentGen = e.target.value;
        currentOffset = 0;
        allLoadedPokemon = [];
        await loadPokemonBatch();
    });

    // Quick type filters
    typeFilters.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        const type = chip.getAttribute('data-type');
        activeTypeFilter = type;
        updateActiveTypeChip(type);
        renderPokemonGrid();
    });

    // Load More Button
    loadMoreBtn.addEventListener('click', () => {
        loadPokemonBatch();
    });

    // Play Cry Audio
    playCryBtn.addEventListener('click', () => {
        if (pokemonCryAudio.src) {
            pokemonCryAudio.currentTime = 0;
            pokemonCryAudio.play().catch(err => console.log('Autoplay blocked:', err));
        }
    });

    // Close Modal triggers
    modalCloseBtn.addEventListener('click', closeModal);
    modalFooterCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function updateActiveTypeChip(selectedType) {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-type') === selectedType);
    });
}

// Remote direct search by name or ID if not already loaded in local batch
async function handleDirectSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;

    const alreadyFound = allLoadedPokemon.some(p => 
        p.name.toLowerCase() === query || String(p.id) === query
    );

    if (!alreadyFound) {
        showLoading(true);
        try {
            const res = await fetch(`${ENDPOINTS.POKEMON}/${query}`);
            if (res.ok) {
                const pokemonData = await res.json();
                allLoadedPokemon.unshift(pokemonData);
                renderPokemonGrid();
                openPokemonModal(pokemonData);
            }
        } catch (e) {
            console.log('Not found in remote PokeAPI:', e);
        } finally {
            showLoading(false);
        }
    }
}

// UI Helpers
function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}

function updateConnectionStatus(online) {
    if (online) {
        connectionStatus.textContent = 'SYSTEM ONLINE';
        connectionStatus.style.color = 'var(--pk-green)';
    } else {
        connectionStatus.textContent = 'POKEAPI CONNECTION ERROR';
        connectionStatus.style.color = 'var(--pk-red)';
    }
}

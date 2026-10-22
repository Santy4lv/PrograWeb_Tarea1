/**
 * ==========================================================================
 * POKÉDEX ARCHIVES // POKEAPI CONSUMPTION ENGINE (TAREA 1)
 * Frontend en JavaScript Vanilla Puro
 * 
 * Consumo explícito de 3 Endpoints REST de PokeAPI:
 * 1. https://pokeapi.co/api/v2/pokemon/{id_o_nombre}
 *    -> Datos básicos, tipos, estadísticas de combate, medidas, cries (audio) y sprites/artwork oficial en alta resolución.
 * 2. https://pokeapi.co/api/v2/pokemon-species/{id_o_nombre}
 *    -> Descripción oficial / lore en Español (flavor_text), género/clasificación, hábitat, ratio de captura y enlace a evolución.
 * 3. https://pokeapi.co/api/v2/evolution-chain/{id}
 *    -> Estructura completa de la cadena evolutiva (etapas, niveles y desencadenantes).
 * ==========================================================================
 */

// Configuración y Endpoints
const API_BASE = 'https://pokeapi.co/api/v2';
const ENDPOINTS = {
    POKEMON: `${API_BASE}/pokemon`,
    SPECIES: `${API_BASE}/pokemon-species`,
    EVOLUTION: `${API_BASE}/evolution-chain`
};

// Rangos de generaciones
const GENERATIONS = {
    '1': { offset: 0, limit: 151, startId: 1, endId: 151 },
    '2': { offset: 151, limit: 100, startId: 152, endId: 251 },
    '3': { offset: 251, limit: 135, startId: 252, endId: 386 },
    '4': { offset: 386, limit: 107, startId: 387, endId: 493 },
    'all': { offset: 0, limit: 1025, startId: 1, endId: 1025 }
};

// Traducción de tipos al español para visualización
const TYPE_TRANSLATIONS = {
    normal: 'Normal',
    fire: 'Fuego',
    water: 'Agua',
    grass: 'Planta',
    electric: 'Eléctrico',
    ice: 'Hielo',
    fighting: 'Lucha',
    poison: 'Veneno',
    ground: 'Tierra',
    flying: 'Volador',
    psychic: 'Psíquico',
    bug: 'Bicho',
    rock: 'Roca',
    ghost: 'Fantasma',
    dragon: 'Dragón',
    steel: 'Acero',
    fairy: 'Hada',
    dark: 'Siniestro'
};

// Nombres legibles para estadísticas
const STAT_NAMES = {
    hp: 'PS',
    attack: 'Ataque',
    defense: 'Defensa',
    'special-attack': 'Atq. Esp',
    'special-defense': 'Def. Esp',
    speed: 'Velocidad'
};

// Estado global de la aplicación
let allLoadedPokemon = [];
let currentOffset = 0;
const BATCH_SIZE = 24;
let currentGen = '1';
let activeTypeFilter = 'all';
let searchQuery = '';
let isLoading = false;

// Caché de detalles adicionales para rendimiento (species y evolution)
const speciesCache = new Map();
const evolutionCache = new Map();

// Referencias del DOM
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

// Referencias del Modal
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
// INICIALIZACIÓN DE LA APLICACIÓN
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
// ENDPOINT 1: /pokemon (Listado y detalles básicos de combate)
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

        // Llamada al endpoint 1 para obtener lista paginada
        const response = await fetch(`${ENDPOINTS.POKEMON}?offset=${offset}&limit=${fetchCount}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        // Obtener detalles individuales concurrentemente usando /pokemon/{id}
        const detailPromises = data.results.map(p => fetch(p.url).then(r => r.json()));
        const pokemonDetails = await Promise.all(detailPromises);

        // Almacenar en el arreglo global
        allLoadedPokemon.push(...pokemonDetails);
        currentOffset += fetchCount;

        // Si ya cargamos todos los de la generación, ocultar botón de cargar más
        if (currentOffset >= genInfo.limit) {
            loadMoreContainer.classList.add('hidden');
        } else {
            loadMoreContainer.classList.remove('hidden');
        }

        renderPokemonGrid();
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Error al cargar Pokémon desde PokeAPI:', error);
        updateConnectionStatus(false);
    } finally {
        showLoading(false);
        isLoading = false;
    }
}

// ==========================================================================
// RENDERIZADO DEL GRID DE TARJETAS (RESPONSIVO MEDIANTE MEDIA QUERIES)
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
    card.setAttribute('aria-label', `Ver detalles de ${pokemon.name}`);

    // Extraer imagen oficial en alta resolución
    const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default 
        || pokemon.sprites.other?.home?.front_default 
        || pokemon.sprites.front_default 
        || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

    // Tipos y colores
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
            <span class="pokemon-hp-tag">PS: <strong>${hpStat}</strong></span>
        </div>
        <div class="card-image-box">
            <div class="card-ambient-glow" style="background-color: var(--type-${primaryType}, var(--pk-blue));"></div>
            <img 
                src="${artworkUrl}" 
                alt="Ilustración oficial de ${pokemon.name}" 
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
                    <span class="mini-stat-label">ATAQUE</span>
                    <span class="mini-stat-val">${atkStat}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">DEFENSA</span>
                    <span class="mini-stat-val">${defStat}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">ALTURA</span>
                    <span class="mini-stat-val">${(pokemon.height / 10).toFixed(1)}m</span>
                </div>
            </div>
            <div class="card-footer-prompt">
                <span>VER ARCHIVO BIOLÓGICO</span>
                <span class="arrow">&raquo;</span>
            </div>
        </div>
    `;

    // Abrir popup con descripción detallada al hacer click
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
// FILTRADO Y BÚSQUEDA
// ==========================================================================
function getFilteredPokemon() {
    return allLoadedPokemon.filter(pokemon => {
        // Filtro por tipo
        const matchesType = activeTypeFilter === 'all' || 
            pokemon.types.some(t => t.type.name === activeTypeFilter);

        // Filtro por búsqueda de texto (nombre, id o tipo)
        if (!searchQuery) return matchesType;

        const query = searchQuery.toLowerCase().trim();
        const matchesName = pokemon.name.toLowerCase().includes(query);
        const matchesId = `#${pokemon.id}`.includes(query) || String(pokemon.id) === query;
        const matchesTypes = pokemon.types.some(t => {
            const rawType = t.type.name.toLowerCase();
            const esType = (TYPE_TRANSLATIONS[rawType] || '').toLowerCase();
            return rawType.includes(query) || esType.includes(query);
        });

        return matchesType && (matchesName || matchesId || matchesTypes);
    });
}

// ==========================================================================
// MODAL / POPUP CON DESCRIPCIÓN DETALLADA (ENDPOINTS 2 Y 3)
// ==========================================================================
async function openPokemonModal(pokemon) {
    // 1. Llenar datos inmediatos desde Endpoint 1 (/pokemon)
    modalPokemonId.textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    modalPokemonName.textContent = pokemon.name;
    modalHeight.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
    modalWeight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;

    const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default 
        || pokemon.sprites.other?.home?.front_default 
        || pokemon.sprites.front_default;
    modalPokemonImg.src = artworkUrl;
    modalPokemonImg.alt = `Ilustración oficial de ${pokemon.name}`;

    const primaryType = pokemon.types[0]?.type?.name || 'normal';
    modalGlow.style.backgroundColor = `var(--type-${primaryType}, var(--pk-blue))`;

    // Badges de tipos
    modalTypes.innerHTML = pokemon.types.map(t => {
        const typeName = t.type.name;
        const translated = TYPE_TRANSLATIONS[typeName] || typeName;
        return `<span class="type-badge type-${typeName}">${translated}</span>`;
    }).join('');

    // Audio rugido (Cry de PokeAPI)
    const cryUrl = pokemon.cries?.latest || pokemon.cries?.legacy;
    if (cryUrl) {
        pokemonCryAudio.src = cryUrl;
        playCryBtn.classList.remove('hidden');
    } else {
        playCryBtn.classList.add('hidden');
    }

    // Estadísticas base de combate
    renderModalStats(pokemon.stats);

    // Valores provisionales mientras carga Endpoint 2 y 3
    modalPokemonGenus.textContent = 'Analizando...';
    modalHabitat.textContent = 'Consultando...';
    modalCaptureRate.textContent = 'Consultando...';
    modalDescription.textContent = 'Accediendo al registro biológico de PokeAPI...';
    modalEvolutionChain.innerHTML = '<div class="evo-loading">Consultando cadena evolutiva en PokeAPI...</div>';

    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 2. Consultar ENDPOINT 2: /pokemon-species/{id}
    try {
        const speciesData = await fetchSpeciesData(pokemon.id);
        renderSpeciesDetails(speciesData);

        // 3. Consultar ENDPOINT 3: /evolution-chain/{id}
        if (speciesData.evolution_chain?.url) {
            const evoData = await fetchEvolutionChain(speciesData.evolution_chain.url);
            renderEvolutionChain(evoData, pokemon.id);
        } else {
            modalEvolutionChain.innerHTML = '<div class="evo-loading">Este espécimen no posee evoluciones registradas.</div>';
        }
    } catch (error) {
        console.error('Error al obtener datos detallados de PokeAPI:', error);
        modalDescription.textContent = 'No fue posible cargar la descripción detallada desde PokeAPI en este momento.';
        modalEvolutionChain.innerHTML = '<div class="evo-loading">Información evolutiva no disponible.</div>';
    }
}

// Llamada a Endpoint 2 con caché
async function fetchSpeciesData(pokemonId) {
    if (speciesCache.has(pokemonId)) {
        return speciesCache.get(pokemonId);
    }
    const response = await fetch(`${ENDPOINTS.SPECIES}/${pokemonId}`);
    if (!response.ok) throw new Error(`Error en species: ${response.status}`);
    const data = await response.json();
    speciesCache.set(pokemonId, data);
    return data;
}

// Llamada a Endpoint 3 con caché
async function fetchEvolutionChain(evolutionUrl) {
    if (evolutionCache.has(evolutionUrl)) {
        return evolutionCache.get(evolutionUrl);
    }
    const response = await fetch(evolutionUrl);
    if (!response.ok) throw new Error(`Error en evolution-chain: ${response.status}`);
    const data = await response.json();
    evolutionCache.set(evolutionUrl, data);
    return data;
}

// Renderizar descripción y lore desde Endpoint 2
function renderSpeciesDetails(species) {
    // 1. Clasificación / Género (en español)
    const genusEs = species.genera?.find(g => g.language.name === 'es') 
        || species.genera?.find(g => g.language.name === 'en');
    modalPokemonGenus.textContent = genusEs ? genusEs.genus : 'Especie Pokémon';

    // 2. Hábitat
    modalHabitat.textContent = species.habitat?.name 
        ? species.habitat.name.toUpperCase() 
        : 'Desconocido';

    // 3. Ratio de captura
    modalCaptureRate.textContent = `${species.capture_rate || '--'} / 255`;

    // 4. Descripción en Español (flavor_text)
    const flavorEntry = species.flavor_text_entries?.find(entry => entry.language.name === 'es')
        || species.flavor_text_entries?.find(entry => entry.language.name === 'en');

    if (flavorEntry) {
        // Limpiar saltos de línea molestos y caracteres especiales
        const cleanDescription = flavorEntry.flavor_text
            .replace(/[\n\f\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        modalDescription.textContent = `"${cleanDescription}"`;
    } else {
        modalDescription.textContent = 'No se encontró descripción registrada para este espécimen.';
    }
}

// Renderizar barras de estadísticas base
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

// Renderizar cadena evolutiva desde Endpoint 3
function renderEvolutionChain(evoData, currentPokemonId) {
    const evoStages = [];
    let currentStage = evoData.chain;

    while (currentStage) {
        const speciesName = currentStage.species.name;
        // Extraer id de especie desde la URL (ej: https://pokeapi.co/api/v2/pokemon-species/1/)
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

        // Tomar la siguiente evolución
        currentStage = currentStage.evolves_to?.[0] || null;
    }

    if (evoStages.length <= 1) {
        modalEvolutionChain.innerHTML = '<div class="evo-loading">Este espécimen no posee evoluciones registradas en su línea.</div>';
        return;
    }

    const evoListContainer = document.createElement('div');
    evoListContainer.className = 'evo-stages-list';

    evoStages.forEach((stage, index) => {
        // Sprite oficial de la etapa
        const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stage.id}.png`;

        const evoCard = document.createElement('div');
        evoCard.className = `evo-card ${stage.isCurrent ? 'current' : ''}`;
        evoCard.title = stage.isCurrent ? 'Espécimen actual' : `Ver ${stage.name}`;
        evoCard.innerHTML = `
            <img src="${spriteUrl}" alt="${stage.name}" class="evo-sprite">
            <span class="evo-name">${stage.name}</span>
            <span class="phys-label">#${String(stage.id).padStart(3, '0')}</span>
        `;

        // Al hacer clic en un miembro de la evolución, abrir sus datos
        if (!stage.isCurrent) {
            evoCard.addEventListener('click', async () => {
                await loadAndOpenSpecificPokemon(stage.id);
            });
        }

        evoListContainer.appendChild(evoCard);

        // Flecha conectora si no es el último
        if (index < evoStages.length - 1) {
            const nextStage = evoStages[index + 1];
            const arrow = document.createElement('div');
            arrow.className = 'evo-arrow';
            const detailText = nextStage.minLevel ? `Nv. ${nextStage.minLevel}` : '➜';
            arrow.innerHTML = `<span>${detailText}</span>`;
            evoListContainer.appendChild(arrow);
        }
    });

    modalEvolutionChain.innerHTML = '';
    modalEvolutionChain.appendChild(evoListContainer);
}

// Cargar y abrir un Pokémon específico al seleccionarlo desde la cadena evolutiva
async function loadAndOpenSpecificPokemon(pokemonId) {
    try {
        let pokemon = allLoadedPokemon.find(p => p.id === pokemonId);
        if (!pokemon) {
            const res = await fetch(`${ENDPOINTS.POKEMON}/${pokemonId}`);
            if (!res.ok) throw new Error('No encontrado');
            pokemon = await res.json();
        }
        openPokemonModal(pokemon);
    } catch (e) {
        console.error('Error al navegar en la evolución:', e);
    }
}

// Cerrar Modal
function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    pokemonCryAudio.pause();
    pokemonCryAudio.currentTime = 0;
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
    // Búsqueda en tiempo real
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
        renderPokemonGrid();
    });

    // Búsqueda remota directa si se presiona Enter o botón de buscar y no está cargado
    searchBtn.addEventListener('click', handleDirectSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleDirectSearch();
        }
    });

    // Botón para limpiar búsqueda
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderPokemonGrid();
        searchInput.focus();
    });

    // Botón reiniciar búsqueda
    resetSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        activeTypeFilter = 'all';
        updateActiveTypeChip('all');
        renderPokemonGrid();
    });

    // Filtro de Generación
    genFilter.addEventListener('change', async (e) => {
        currentGen = e.target.value;
        currentOffset = 0;
        allLoadedPokemon = [];
        await loadPokemonBatch();
    });

    // Filtros Rápidos por Tipo
    typeFilters.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        const type = chip.getAttribute('data-type');
        activeTypeFilter = type;
        updateActiveTypeChip(type);
        renderPokemonGrid();
    });

    // Botón Cargar Más
    loadMoreBtn.addEventListener('click', () => {
        loadPokemonBatch();
    });

    // Reproducir Rugido
    playCryBtn.addEventListener('click', () => {
        if (pokemonCryAudio.src) {
            pokemonCryAudio.currentTime = 0;
            pokemonCryAudio.play().catch(err => console.log('Autoplay bloqueado:', err));
        }
    });

    // Cerrar Modal (Botón X, Botón Footer, Backdrop o tecla Escape)
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

// Búsqueda remota por nombre o ID si no está cargado localmente en el lote
async function handleDirectSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;

    // Verificar si ya está en memoria
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
            console.log('No encontrado en PokeAPI remota:', e);
        } finally {
            showLoading(false);
        }
    }
}

// Helpers de interfaz
function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}

function updateConnectionStatus(online) {
    if (online) {
        connectionStatus.textContent = 'SISTEMA CONECTADO';
        connectionStatus.style.color = 'var(--pk-green)';
    } else {
        connectionStatus.textContent = 'ERROR DE CONEXIÓN POKEAPI';
        connectionStatus.style.color = 'var(--pk-red)';
    }
}

# Pokédex Archives // PokeAPI Database (Tarea 1)

Aplicación Web interactiva de alto rendimiento desarrollada en **HTML5, Vanilla CSS3 y Vanilla JavaScript**, que consume y combina información en tiempo real de **3 endpoints REST de PokeAPI**, con diseño responsivo basado en media queries idénticas a la primera entrega, visualización de ilustraciones oficiales en alta resolución y ventana modal (popup) con descripción biológica completa.

---

## 🚀 3 Endpoints de PokeAPI Implementados

El proyecto consume de manera explícita y coordinada los siguientes 3 endpoints oficiales de PokeAPI:

1. **`GET https://pokeapi.co/api/v2/pokemon/{id o nombre}`**
   - **Propósito**: Obtención de datos biológicos y de combate básicos.
   - **Campos utilizados**:
     - `sprites.other['official-artwork'].front_default`: Ilustración oficial en alta definición.
     - `cries.latest`: Audio del rugido oficial del Pokémon (reproducible en el modal).
     - `types`: Lista de tipos elementales (Fuego, Agua, Planta, etc.).
     - `stats`: PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad.
     - `height` y `weight`: Medidas físicas del espécimen.

2. **`GET https://pokeapi.co/api/v2/pokemon-species/{id o nombre}`**
   - **Propósito**: Obtención del lore, descripción biológica en español y taxonomía.
   - **Campos utilizados**:
     - `flavor_text_entries`: Descripción oficial de la Pokédex filtrada en idioma Español (`es`).
     - `genera`: Clasificación formal (ejemplo: *"Pokémon Semilla"*, *"Pokémon Llama"*).
     - `habitat`: Hábitat natural del espécimen.
     - `capture_rate`: Índice de dificultad de captura (0 - 255).
     - `evolution_chain.url`: Enlace al árbol de evolución del espécimen.

3. **`GET https://pokeapi.co/api/v2/evolution-chain/{id}`**
   - **Propósito**: Obtención y despliegue del árbol evolutivo completo.
   - **Campos utilizados**:
     - `chain`: Recorrido recursivo de las etapas evolutivas, requisitos de nivel (`min_level`), métodos de evolución y enlaces a cada etapa con sus respectivos sprites interactivos.

---

## 📱 Sistema de Grid Responsivo (Media Queries)

El diseño de las tarjetas se adapta de forma fluida a cualquier dispositivo utilizando la misma arquitectura de **CSS Grid** de la Tarea 1:

| Dispositivo / Pantalla | Breakpoint Media Query | Tarjetas por Fila |
| :--- | :--- | :--- |
| **Móviles / Teléfonos** | Por defecto (`< 640px`) | **1 Tarjeta** por fila |
| **Tablets / Pantallas intermedias** | `@media (min-width: 640px)` | **2 Tarjetas** por fila |
| **Escritorio / Vistas 1080p** | `@media (min-width: 1024px)` | **3 Tarjetas** por fila |
| **Monitores Ultrawide / 2K / 4K** | `@media (min-width: 1440px)` | **4 Tarjetas** por fila |

---

## ✨ Características Principales

- **Galería con Ilustraciones Oficiales**: Todas las tarjetas cuentan con el artwork de alta resolución provisto por PokeAPI con resplandor ambiental adaptado al tipo primario del Pokémon.
- **Modal / Popup Interactivo Detallado**:
  - Al hacer clic en cualquier tarjeta, se abre una ventana emergente que consulta y combina los datos de los 3 endpoints.
  - Lore en español oficial de la franquicia.
  - Gráfico de barras animadas de estadísticas de combate.
  - Reproductor interactivo del sonido/rugido (*Cry*) de cada Pokémon.
  - Visualización de la cadena evolutiva con navegación interactiva entre etapas.
- **Búsqueda y Filtros Rápidos**:
  - Búsqueda en tiempo real por nombre, número de Pokédex o tipo.
  - Búsqueda remota inteligente para cualquier Pokémon del 1 al 1025.
  - Filtro por tipos elementales (Fuego, Agua, Planta, Eléctrico, Psíquico, Dragón, Fantasma, Lucha).
  - Selector de generaciones (Kanto Gen 1, Johto Gen 2, Hoenn Gen 3, Sinnoh Gen 4 o Todas).
- **Estética Cyber-Pokédex**: Modo oscuro con tipografías Google Fonts (`Orbitron`, `Rajdhani`, `Share Tech Mono`), efecto holograma/CRT sutil y transiciones fluidas.

---

## 🛠️ Cómo Ejecutar el Proyecto

Al ser un proyecto desarrollado puramente en tecnologías web estándar, no requiere compiladores, bases de datos externas ni gestores de paquetes:

1. Simplemente abre el archivo `index.html` en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).
2. O alternativamente, usa una extensión como **Live Server** en VS Code / tu editor preferido.

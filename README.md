# Programación Web - Tarea 1 (Monorepo)

Monorepo estructurado que consolida las dos partes de la **Tarea 1**:

1. **Parte 1 (`monsters/`)**: Aplicación Fullstack Resident Evil B.O.W. Database (Backend en Java Spring Boot con persistencia y frontend web en HTML5/CSS3/JavaScript).
2. **Parte 2 (`pokeapi/`)**: Pokédex interactiva OS que consume y coordina 3 endpoints REST oficiales de PokeAPI, aplicando CSS Grid responsivo, diseño holográfico y modal de lore biológico.

---

## 📁 Estructura del Proyecto

```text
Tarea 1/
├── monsters/                             # PARTE 1: Backend Spring Boot + Frontend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/re/monsters/    # Controladores, Servicios, Modelos y Repositorios
│   │   │   └── resources/
│   │   │       ├── application.properties.example
│   │   │       ├── init.sql
│   │   │       └── static/              # Frontend web de Monsters
│   │   │           ├── index.html
│   │   │           ├── css/styles.css   # Estilos organizados en recursos
│   │   │           └── js/script.js     # Lógica organizada en recursos
│   │   └── test/
│   ├── pom.xml
│   └── mvnw / mvnw.cmd
│
├── pokeapi/                              # PARTE 2: Pokédex Frontend Vanilla
│   ├── index.html                        # Entrada principal
│   ├── resources/                        # Recursos web estandarizados
│   │   ├── css/
│   │   │   └── styles.css                # Estilos y Media Queries responsivas
│   │   └── js/
│   │       └── script.js                 # Motor de consumo de PokeAPI con Debouncing & JOIN
│   └── README.md                         # Documentación técnica de PokeAPI
│
├── .gitignore                            # Exclusiones de build, IDEs y temporales
└── README.md                             # Este documento
```

---

## 🚀 Ejecución

### Parte 1 (Monsters)
1. Navega a `monsters/`.
2. Configura tu base de datos con `src/main/resources/init.sql` y `application.properties`.
3. Ejecuta `./mvnw spring-boot:run`.
4. Abre `http://localhost:8080` en el navegador.

### Parte 2 (PokeAPI)
1. Navega a `pokeapi/`.
2. Abre `index.html` en cualquier navegador web o mediante una extensión como Live Server.

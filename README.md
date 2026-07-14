# Sistema Académico

Aplicación de escritorio para la gestión interna de un instituto que dicta cursos y talleres (programación, impresión 3D, multimedia, entre otros).

## ¿Qué es este proyecto?

Es una herramienta de uso exclusivamente interno, instalada en las computadoras del instituto, que permite administrar la operación diaria: cursos, talleres, horarios, docentes, aulas/recursos y demás información administrativa.

Los alumnos y sus inscripciones **no se gestionan desde esta aplicación**. Esa información provendrá de APIs externas todavía no desarrolladas. Durante el desarrollo se utiliza un **Mock Provider** que simula esos datos.

Todas las instalaciones se conectan a una **única base de datos MongoDB** ubicada en un servidor central del instituto. No existe una API REST propia: la comunicación se resuelve enteramente dentro de la aplicación de escritorio.

## Tecnologías

- **Electron** — empaquetado y ejecución como aplicación de escritorio.
- **React + TypeScript** — interfaz de usuario (proceso renderer).
- **Vite / electron-vite** — build y servidor de desarrollo para main, preload y renderer.
- **Tailwind CSS + shadcn/ui** — estilos y componentes de UI.
- **React Router** — enrutamiento dentro del renderer.
- **Zod** — validación de datos.
- **Mongoose** — acceso a MongoDB desde el proceso main.
- **Electron IPC** — comunicación entre la interfaz (renderer) y el proceso principal, mediante `contextBridge`.
- **MongoDB** — base de datos central, compartida por todas las instalaciones.
- **Mock Provider** — simulación temporal de datos de alumnos e inscripciones.
- **ESLint + Prettier + Husky + lint-staged** — calidad y formato de código.
- **Electron Builder** — empaquetado del instalador para Windows.

Flujo de datos:

```
React → Electron IPC → Servicios → MongoDB
```

## Cómo ejecutar el proyecto

Requiere Node.js LTS instalado.

```bash
npm install        # instalar dependencias
npm run dev         # levantar la app en modo desarrollo (hot reload)
npm run typecheck   # chequeo de tipos de TypeScript (main + renderer)
npm run lint         # ESLint
npm run format       # Prettier (escribe los cambios)
npm run build         # build de producción (main, preload y renderer) en /out
npm run start          # previsualizar el build de producción
npm run build:win       # build + genera el instalador de Windows en /release
```

Los hooks de Git (Husky + lint-staged) corren ESLint y Prettier automáticamente sobre los archivos modificados antes de cada commit.

## Estructura general

```
/src
  /main            → proceso principal de Electron (índice y preload)
  /renderer        → aplicación React (Vite root)
  /shared          → tipos compartidos entre main y renderer
/docs              → documentación del proyecto
electron.vite.config.ts   → configuración de build para main, preload y renderer
components.json           → configuración de shadcn/ui
electron-builder.yml       → configuración del instalador de Windows
```

Más detalle en [docs/architecture.md](docs/architecture.md).

Todavía no existe funcionalidad de negocio (cursos, talleres, etc.): esta es solo la infraestructura inicial del proyecto. Las carpetas `/ipc`, `/services`, `/db` y `/providers` descritas en [CLAUDE.md](CLAUDE.md) se crearán cuando exista contenido real que ordenar (ver [docs/roadmap.md](docs/roadmap.md)).

## Documentación

- [CLAUDE.md](CLAUDE.md) — reglas permanentes de desarrollo del proyecto.
- [docs/architecture.md](docs/architecture.md) — arquitectura completa del sistema.
- [docs/database.md](docs/database.md) — entidades previstas en la base de datos.
- [docs/roadmap.md](docs/roadmap.md) — fases de desarrollo hasta el MVP.
- [docs/mvp.md](docs/mvp.md) — alcance exacto del MVP.

## Roadmap

Ver [docs/roadmap.md](docs/roadmap.md) para el detalle completo de fases. Resumen:

1. Inicialización del proyecto (Electron + React + estructura base).
2. Conexión a MongoDB y capa de servicios.
3. Mock Provider de alumnos e inscripciones.
4. Gestión de cursos y talleres.
5. Gestión de docentes, horarios y aulas/recursos.
6. Versión MVP funcional para uso interno del instituto.

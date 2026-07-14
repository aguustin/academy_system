# CLAUDE.md

Este archivo define las reglas permanentes de trabajo para este proyecto. Aplica a cualquier persona o modelo que genere código, documentación o decisiones técnicas dentro de este repositorio. Ante cualquier duda, estas reglas tienen prioridad sobre preferencias personales o "mejores prácticas" genéricas.

---

# Filosofía del sistema

El sistema debe representar cómo trabaja el instituto.

La navegación y la interfaz deben responder a tareas reales del usuario, no a entidades técnicas de la base de datos.

La interfaz debe utilizar siempre el lenguaje del instituto.

Ejemplos de módulos visibles:

- Dashboard
- Profesores
- Catálogo de Cursos
- Ediciones
- Asistencias
- Reportes

Evitar exponer conceptos internos del dominio como:

- CourseTemplate
- CourseEdition
- Enrollment
- AttendanceRecord

Estos conceptos pertenecen únicamente al dominio y nunca deben aparecer como módulos o pantallas independientes, salvo que exista un requerimiento funcional que lo justifique.

Siempre que sea posible, las entidades relacionadas deben administrarse desde la pantalla de la entidad principal.

Ejemplo:

- Los alumnos inscriptos se administran desde una Edición.
- Las asistencias se administran desde la Edición o desde el módulo de Asistencias.

# Evolución del proyecto

El proyecto debe crecer de forma incremental.

Cada ticket debe aportar una funcionalidad completa y utilizable.

Evitar crear infraestructura "para el futuro" si todavía no existe un caso de uso concreto.

Aplicar siempre los principios:

- KISS
- YAGNI
- DRY (cuando no aumente la complejidad)

Antes de crear nuevas capas, abstracciones o componentes reutilizables, verificar que exista al menos un segundo caso de uso que justifique su existencia.

## 1. Objetivo del sistema

Aplicación de escritorio para uso interno de un instituto que dicta cursos y talleres (programación, impresión 3D, multimedia, etc.).

La aplicación permite gestionar la operación diaria del instituto: cursos, talleres, inscripciones a nivel operativo, horarios, docentes, aulas/recursos, y demás entidades administrativas propias del instituto.

Puntos clave que condicionan todo el diseño:

- Es una app de **uso interno exclusivo**, instalada en las computadoras del instituto. No es un producto público ni multi-tenant.
- **No existe API REST propia.** No se debe crear un backend HTTP.
- **Los alumnos NO son administrados por esta aplicación.** Sus datos (nombre, DNI) provendrán de APIs externas que todavía no existen; mientras tanto se usa un **Mock Provider** (`StudentProvider`). La inscripción de un alumno a una `CourseEdition` (`Enrollment`) sí es información propia del instituto y se persiste en MongoDB, referenciando al alumno solo por su identificador.
- Todas las instalaciones comparten **una única base de datos MongoDB** en un servidor central. No hay bases de datos locales ni sincronización offline.

## 2. Stack tecnológico

- **Electron**: shell de escritorio, empaquetado (Electron Builder) y ciclo de vida de la app.
- **React + TypeScript**: interfaz de usuario (proceso de renderer).
- **Vite / electron-vite**: build y servidor de desarrollo para main, preload y renderer.
- **Tailwind CSS + shadcn/ui**: estilos y componentes de UI.
- **React Router**: enrutamiento dentro del renderer.
- **Zod**: validación de datos y fuente de tipos del dominio (ver sección 11).
- **Electron IPC**: único canal de comunicación entre el renderer (React) y el proceso principal.
- **Servicios (capa de negocio)**: funciones de Node.js que corren en el proceso principal y encapsulan la lógica de acceso a datos.
- **MongoDB + Mongoose**: base de datos única y central, accedida solo desde el proceso principal (ver sección 15).

Flujo de datos obligatorio:

```
React (renderer)
   ↓ (IPC)
Electron Main Process
   ↓
Servicios
   ↓
MongoDB
```

No se agregan capas adicionales (sin GraphQL, sin REST, sin microservicios, sin colas de mensajes) salvo que una necesidad real y concreta lo justifique.

## 3. Arquitectura

Ver [docs/architecture.md](docs/architecture.md) para el detalle completo. Reglas de alto nivel:
Este proyecto prioriza decisiones de arquitectura explícitas por sobre suposiciones.

Si durante el desarrollo aparece alguna contradicción entre:

- los requerimientos,
- el dominio,
- la arquitectura,
- la documentación,
- o la implementación existente,

NO tomar una decisión de manera automática.

En ese caso:

1. Continuar únicamente hasta el punto donde exista certeza.
2. Detener la implementación de aquello que requiera una decisión funcional o arquitectónica.
3. Documentar claramente el conflicto encontrado.
4. Explicar las alternativas posibles junto con sus ventajas y desventajas.
5. Esperar confirmación antes de continuar.

No modificar el dominio ni la arquitectura únicamente porque una solución parezca "más correcta".

Las decisiones funcionales pertenecen al propietario del proyecto.

- El **renderer (React) nunca accede a MongoDB directamente**. Todo pasa por IPC.
- El **proceso principal (main)** es el único que tiene el driver de MongoDB y las credenciales de conexión.
- Los **servicios** son funciones simples organizadas por entidad/dominio (ej. `cursosService`, `talleresService`), no clases abstractas ni "repositorios genéricos" innecesarios.
- El **Mock Provider** de alumnos/inscripciones vive detrás de una interfaz mínima para poder reemplazarse por la API externa real sin tocar el resto del sistema. Mínima no significa elaborada: alcanza con una función o módulo que pueda sustituirse.

## 4. Workflow de desarrollo (obligatorio)

Cada ticket de trabajo debe seguir este flujo:

1. Leer este archivo (`CLAUDE.md`) completo.
2. Analizar el estado actual del proyecto antes de tocar nada.
3. Entender el alcance exacto del ticket.
4. Implementar únicamente lo pedido.
5. Dejar el proyecto siempre en estado funcional (compila, typecheck y lint limpios).

## 5. Regla de tickets

Cada ticket debe:

- Tener alcance acotado y explícito.
- Dejar el proyecto en estado funcional al finalizar.
- No depender de un ticket futuro para compilar o pasar las verificaciones.
- No introducir código incompleto, deshabilitado o a medio terminar.

## 6. Filosofía KISS (Keep It Simple, Stupid)

- Elegir siempre la solución más simple que resuelva el problema actual.
- Si una función hace lo que se necesita en 10 líneas, no se convierte en 50 "por prolijidad".
- Preferir funciones y módulos planos antes que jerarquías de clases.
- El código debe poder entenderse leyéndolo una sola vez, sin saltar entre múltiples capas de indirección.
- Ante dos soluciones posibles, se elige siempre la más simple. Solo se introduce complejidad cuando hay una razón técnica concreta, está explícitamente justificada, y la solución simple demostró no ser suficiente.

## 7. Filosofía YAGNI (You Aren't Gonna Need It)

- No se construye nada "por si en el futuro se necesita".
- No se generalizan soluciones para casos hipotéticos que no están confirmados en el roadmap.
- Ejemplo: no armar un sistema de plugins, ni un motor de permisos configurable, ni multi-idioma, si nadie lo pidió.
- Cuando surja una necesidad futura real, se implementa en ese momento, con el contexto real disponible en ese momento.

## 8. Principios SOLID — uso restringido

Los principios SOLID se aplican **únicamente cuando reducen complejidad real**, nunca como regla de estilo obligatoria.

- Se prioriza la simplicidad y la legibilidad por sobre la pureza de un principio.
- **SRP** (responsabilidad única): sí, a nivel de módulo/servicio (ej. no mezclar lógica de cursos con lógica de talleres). No implica crear una clase por cada verbo.
- **OCP/LSP/ISP/DIP**: solo se aplican cuando hay una razón concreta y actual (por ejemplo, el Mock Provider de alumnos que debe poder sustituirse por una API real). No se aplican de forma preventiva ni como ejercicio académico.
- Si aplicar un principio SOLID hace el código más difícil de leer o agrega archivos/abstracciones sin beneficio inmediato, **no se aplica**.

## 9. Revisión inteligente antes de implementar

Antes de implementar un ticket:

- Evaluar si existe alguna mejora pequeña y directamente relacionada con su alcance.
- Aplicarla únicamente si simplifica el código y no modifica la arquitectura ni la estructura de carpetas.
- Si una mejora detectada afecta la arquitectura, no implementarla: reportarla al finalizar el ticket para que se decida por separado.

## 10. Convenciones de nombres

- **Archivos y carpetas**: `kebab-case` (ej. `cursos-service.ts`, `ipc-handlers/`).
- **Componentes React**: `PascalCase` (ej. `ListaCursos.tsx`).
- **Funciones y variables**: `camelCase` (ej. `obtenerCursos`, `cursoActual`).
- **Tipos e interfaces (TypeScript)**: `PascalCase`.
- **Constantes globales**: `UPPER_SNAKE_CASE` (ej. `IPC_CHANNELS`).
- **Canales IPC**: string descriptivo con namespace y acción, formato `dominio:accion` (ej. `cursos:crear`, `cursos:listar`, `talleres:eliminar`, `system:getVersion`).
- **Colecciones de MongoDB**: `snake_case` en plural (ej. `cursos`, `talleres`, `inscripciones_mock`).
- **Código del dominio (`/src/shared`)**: entidades, tipos, enums (incluidos sus valores) y propiedades se escriben íntegramente en **inglés** (ej. `Teacher`, `CourseTemplate`, `CourseEdition`, `Schedule`, `Attendance`, `dayOfWeek: 'monday' | ...`). Esto mantiene el dominio desacoplado del idioma de la interfaz.
- El resto del código (nombres de archivos/carpetas fuera del dominio, canales IPC, colecciones de MongoDB) sigue en **español**, salvo términos técnicos estándar (`id`, `service`, `handler`, etc.) que se mantienen en inglés por convención de la industria.
- La **interfaz de usuario** (textos, labels, mensajes visibles) permanece siempre en **español**, sin importar el idioma del dominio.

## 11. Principios de modelado del dominio

- El dominio **no depende de la base de datos**: los tipos y schemas en `/src/shared` no importan Mongoose ni conocen la forma de un documento de Mongo.
- Los `id` se tipan como `string`, independientes del formato que use la persistencia (`ObjectId`, UUID, etc.).
- **Zod es la fuente de validación** de cada entidad; el tipo de TypeScript se infiere del schema (`z.infer`) y nunca se duplica a mano.
- Fechas como `Date`. Horarios puntuales como string `"HH:mm"`. Días de la semana en inglés (`monday`...`sunday`), según la convención de idioma del dominio (sección 10).

## Estabilidad del dominio

No modificar entidades existentes por preferencias de implementación.

Toda modificación del dominio debe responder a un requerimiento funcional o a una mejora clara de la arquitectura.

Toda modificación del dominio debe justificarse en el resumen final.

## 13. Organización de carpetas

Estructura base, sin anticipar carpetas que todavía no tienen contenido real:

```
/src
  /main            → proceso principal de Electron
    /ipc           → definición y registro de handlers IPC
    /services      → lógica de negocio y acceso a datos (por dominio)
    /db            → conexión a MongoDB
    /providers     → Mock Provider y futura integración con API externa
  /renderer         → aplicación React
    /pages
    /components
    /hooks
  /shared           → tipos, constantes y entidades de dominio compartidos entre main y renderer
/docs               → documentación del proyecto
```

Reglas:

- No crear carpetas vacías "para el futuro".
- No crear una carpeta nueva por cada entidad si no aporta claridad (ej. no `/services/cursos/handlers/crear/index.ts`).
- Una carpeta se crea cuando existe contenido real que ordenar, no antes.
- No sobre-segmentar módulos ni reorganizar la arquitectura sin que un ticket lo pida explícitamente.

## 14. Cómo trabajar con Electron

- El proceso **main** es el único con acceso a Node.js completo, MongoDB y el sistema de archivos.
- El proceso **renderer** (React) corre con `contextIsolation` habilitado y `nodeIntegration` **siempre deshabilitado**. Nunca se expone Node.js directamente al renderer.
- Toda comunicación entre renderer y main pasa por `preload.js` usando `contextBridge`, exponiendo únicamente las funciones necesarias (nunca `ipcRenderer` completo).
- No se abren ventanas ni procesos adicionales sin una necesidad concreta.

## 15. Cómo trabajar con IPC

- Cada canal IPC representa una acción de negocio concreta (ej. `cursos:crear`), no un CRUD genérico reflejado automáticamente.
- Los nombres de canales se centralizan en `/src/shared` para evitar strings mágicos duplicados entre main y renderer.
- El **preload** expone una API mínima y tipada al renderer (ej. `window.api.cursos.crear(datos)`), nunca acceso directo a `ipcRenderer.invoke`.
- La validación de datos de entrada ocurre en el proceso main, antes de llegar al servicio correspondiente.
- Los handlers IPC son delgados: reciben la petición, llaman al servicio correspondiente y devuelven el resultado. La lógica de negocio vive en los servicios, no en el handler.

## 16. Cómo trabajar con MongoDB

- Se usa **Mongoose** como capa de acceso a MongoDB. Es una decisión explícita del proyecto.
- Una única conexión (o pool de conexión) gestionada en `/src/main/db`, reutilizada por todos los servicios.
- Los servicios son responsables de los modelos y queries de su propio dominio. No se comparten repositorios genéricos tipo "repositorio universal" sin necesidad concreta.
- Las credenciales de conexión se gestionan mediante variables de entorno, nunca hardcodeadas en el código.
- Nunca se expone Mongoose, sus modelos ni el driver de MongoDB al renderer.
- Los **alumnos nunca se guardan en esta base de datos** (ni nombre, ni apellido, ni DNI): esa información se obtiene siempre del provider activo (Mock Provider hoy, API externa a futuro). Las **inscripciones (`Enrollment`) sí se persisten**, guardando únicamente el identificador del alumno junto con la `CourseEdition` correspondiente.

## 17. Qué NO hacer

- No crear una API REST ni GraphQL propia.
- No introducir microservicios, colas de mensajes, ni arquitecturas distribuidas.
- No administrar alumnos ni inscripciones reales dentro de esta aplicación.
- No sobreingenierizar: nada de patrones de diseño complejos (Factory, Strategy, Repository genérico, Dependency Injection containers, etc.) sin una razón concreta y actual.
- No crear abstracciones prematuras ni "frameworks internos" propios.
- No agregar librerías nuevas solo porque son populares; cada dependencia debe justificar su costo de mantenimiento.
- No duplicar lógica de negocio entre main y renderer.
- No exponer el driver de MongoDB ni operaciones de base de datos al renderer.
- No reorganizar la arquitectura sin que un ticket lo pida explícitamente.
- No dejar código muerto, comentado, `TODO`/`FIXME`, o implementaciones a medio terminar.

## 18. Reglas para generar código

- Priorizar claridad y legibilidad por sobre "elegancia" o patrones de diseño.
- Preferir funciones puras y simples, con bajo acoplamiento y cohesión simple, antes que clases con estado.
- No agregar manejo de errores para escenarios que no pueden ocurrir; validar solo en los límites del sistema (entrada del usuario, datos externos, IPC).
- No agregar comentarios que expliquen qué hace el código (el código ya lo dice); solo comentar el porqué cuando no sea obvio.
- No agregar feature flags, configuraciones opcionales o parámetros "por las dudas" que no se usan.
- Reutilizar código existente antes de crear una nueva función equivalente.
- Cuando exista una duda entre una solución simple y una solución "correcta" pero compleja, se prioriza la simple, salvo que la complejidad esté justificada por un requerimiento real.

## 19. Definition of Done

Una tarea se considera terminada cuando:

- La funcionalidad cumple exactamente lo solicitado, ni más ni menos.
- TypeScript compila sin errores.
- ESLint no reporta errores.
- El build de producción (`npm run build`) funciona correctamente.
- La app corre en Electron: se probó manualmente el flujo real, no solo la compilación.
- El código sigue las convenciones de nombres y organización de carpetas de este documento.
- No introduce dependencias, abstracciones o carpetas innecesarias.
- El flujo de datos respeta la arquitectura definida (React → IPC → Servicios → MongoDB).
- No hay acceso directo del renderer a Node.js o a MongoDB.
- No queda código incompleto, muerto, comentado o de debug.
- No quedan `TODO` ni `FIXME`.
- La documentación relevante en `/docs` se actualiza si la tarea cambia arquitectura, entidades o alcance del MVP.

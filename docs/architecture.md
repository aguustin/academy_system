# Arquitectura

Este documento describe la arquitectura completa de la aplicación. Es la referencia técnica principal sobre cómo se comunican los distintos componentes del sistema.

## Visión general

La aplicación es un cliente de escritorio construido con Electron, con una interfaz en React, sin backend HTTP propio. Todas las instalaciones se comunican directamente con una única base de datos MongoDB central, a través del proceso principal de Electron.

```
┌─────────────────────────────┐
│         Renderer            │
│   (React - interfaz UI)     │
└──────────────┬───────────────┘
               │  window.api.* (expuesto por preload)
               ▼
┌─────────────────────────────┐
│          Preload            │
│   (contextBridge - puente   │
│    seguro renderer ↔ main)  │
└──────────────┬───────────────┘
               │  IPC (ipcRenderer.invoke / ipcMain.handle)
               ▼
┌─────────────────────────────┐
│      Main Process           │
│  ┌─────────────────────┐    │
│  │   IPC Handlers       │    │
│  └──────────┬───────────┘    │
│             ▼                │
│  ┌─────────────────────┐    │
│  │      Servicios        │    │
│  └──────────┬───────────┘    │
│             ▼                │
│  ┌─────────────────────┐    │
│  │  Driver de MongoDB    │    │
│  └──────────┬───────────┘    │
└─────────────┼─────────────────┘
              ▼
   ┌─────────────────────┐
   │   MongoDB (servidor   │
   │   central, único)     │
   └─────────────────────┘
```

Además, dentro del proceso main existe una capa de **providers** que resuelve el acceso a datos de alumnos detrás de la interfaz `StudentProvider`. Desde el Ticket 015 la implementación activa es `MongoStudentProvider` (antes `MockStudentProvider`); en el futuro podría reemplazarse por un provider que consuma una API externa, sin cambios en el resto del sistema. Las inscripciones (`Enrollment`) no dependen del provider: se administran como entidad propia en MongoDB (ver [database.md](database.md)).

## Capas del sistema

### 1. Renderer (React)

- Contiene toda la interfaz de usuario: páginas, componentes y hooks.
- No tiene acceso a Node.js, al sistema de archivos ni a MongoDB.
- Se comunica exclusivamente a través de la API expuesta por el `preload` (`window.api`).
- Corre con `contextIsolation: true` y `nodeIntegration: false`.

### 2. Preload

- Único punto de exposición controlada entre renderer y main.
- Usa `contextBridge.exposeInMainWorld` para exponer funciones específicas y tipadas (ej. `window.api.cursos.crear`), nunca `ipcRenderer` completo.
- No contiene lógica de negocio; es un puente delgado hacia IPC.

### 3. Main Process (Electron)

Responsable del ciclo de vida de la aplicación (ventanas, menús, empaquetado) y de toda la lógica que requiere acceso a Node.js y MongoDB. Se divide en tres sub-capas:

**IPC Handlers**

- Reciben las invocaciones desde el renderer (`ipcMain.handle`).
- Validan la forma básica de los datos de entrada.
- Delegan la lógica de negocio al servicio correspondiente.
- Devuelven la respuesta (o el error) al renderer.

**Servicios**

- Contienen la lógica de negocio, organizada por dominio (cursos, talleres, docentes, horarios, aulas/recursos, etc.).
- Son responsables de las operaciones sobre MongoDB relacionadas a su dominio.
- Para leer y escribir datos de alumnos, consultan al **provider** activo (`StudentProvider`) en lugar de acceder a MongoDB directamente — así el resto del sistema (inscripciones, asistencias, consultas, y el propio `student-service.ts` de la pantalla "Alumnos") no conoce ni le importa si detrás hay un mock o Mongo (Ticket 015.1). `db/student.ts` sigue siendo la única capa de persistencia, pero ya no la consume nadie salvo `MongoStudentProvider`. Las inscripciones (`Enrollment`) y las asistencias (`Attendance`) se administran como entidades propias en MongoDB, referenciando al alumno solo por `studentId`.

**Providers**

- Encapsulan el origen de los datos de alumnos, detrás de la interfaz `StudentProvider` (`getAll`, `findById`, `findByDni`, `create`, `update`, `delete` — ampliada en el Ticket 015.1 para cubrir también la escritura, no solo la lectura).
- Implementación actual: **`MongoStudentProvider`** (Ticket 015), que persiste alumnos en MongoDB delegando en `db/student.ts`.
- Implementación futura posible: un provider que consuma una API externa real, si el instituto la incorpora.
- El resto del sistema (servicios, IPC, UI) no necesita cambios al reemplazar la implementación activa; solo cambia qué provider se instancia.

### 4. MongoDB

- Instancia única, alojada en un servidor central del instituto.
- Todas las computadoras del instituto se conectan a la misma base de datos.
- Solo el proceso main tiene el driver y las credenciales de conexión.
- Almacena las entidades propias del instituto (cursos, talleres, docentes, horarios, aulas/recursos, usuarios, inscripciones, asistencias) y, desde el Ticket 015, también los alumnos (colección `alumnos`), administrados por `db/student.ts` a través de `MongoStudentProvider`.

## Comunicación IPC

- Cada acción de negocio corresponde a un canal IPC específico (ej. `cursos:crear`, `cursos:listar`, `talleres:eliminar`).
- Los nombres de los canales se definen una sola vez en `/src/shared` y se reutilizan tanto en el preload como en los handlers del main, evitando strings duplicados.
- El patrón de uso es siempre `invoke`/`handle` (comunicación request-response), no se usan eventos `send`/`on` salvo que exista una necesidad concreta de notificación asincrónica no solicitada por el renderer.

## StudentProvider y gestión de alumnos (Ticket 015)

La decisión pendiente documentada desde el Ticket A01 (alta/edición de alumnos desde la app, que contradecía CLAUDE.md §1/§15 en su redacción original) fue confirmada por el instituto e implementada en el Ticket 015, exactamente en la dirección que esta documentación proponía como default: la interfaz `StudentProvider` (`getAll`, `findById`, `findByDni`) no cambió, pero su implementación activa pasó de `MockStudentProvider` a `MongoStudentProvider`.

- `src/main/providers/mongo-student-provider.ts` implementa `StudentProvider` delegando en `src/main/db/student.ts` (modelo Mongoose, colección `alumnos`).
- `MockStudentProvider` se eliminó (dejó de tener ningún consumidor): todo el sistema — `ipc/student.ts` (lectura) y `attendance-service.ts` (registro por DNI) — pasó a importar `mongoStudentProvider` en lugar de `mockStudentProvider`. Ningún otro archivo necesitó cambios: exactamente el punto que esta documentación garantizaba desde el principio ("el resto del sistema no necesita cambios al reemplazar la implementación").
- No se diseña un mecanismo de configuración para elegir provider en tiempo de ejecución: alcanza con seleccionar la implementación en el punto donde se instancia (como ya se hacía).

**Actualización (Ticket 015.1):** el alta/edición/baja de alumnos, que en el Ticket 015 llamaba directamente a `db/student.ts` desde `student-service.ts`, ahora también pasa por `StudentProvider` — la interfaz se amplió con `create`/`update`/`delete` además de `getAll`/`findById`/`findByDni`, y `student-service.ts` pasó a depender únicamente de `mongoStudentProvider` (no de `db/student.ts`). `StudentProvider` quedó así como el único punto de entrada al módulo de alumnos, sea para leer o para escribir; `db/student.ts` sigue siendo la única capa de persistencia, pero ahora solo la consume `MongoStudentProvider`. Sin cambio de comportamiento: mismas validaciones (DNI único), mismos canales IPC, misma UI.

## Autenticación (implementado — Ticket 013)

Se implementó login, logout, cambio de contraseña obligatorio en el primer inicio de sesión, protección de rutas y protección de todos los handlers IPC (recuperación de contraseña y permisos específicos por rol quedan para tickets posteriores, ver más abajo). No cambió el patrón general de la arquitectura (sigue siendo React → IPC → Servicios → MongoDB): se agregó una capa transversal de sesión en el proceso main.

- **`src/main/auth/session.ts`**: módulo de sesión en memoria (single-user, propio de una app de escritorio de una sola ventana). Expone `setSession`, `clearSession`, `getSession`, y nunca guarda el password ni su hash — solo `id`, `username`, `role`, `teacherId` y `mustChangePassword` (tipo `AuthUser` en `src/shared/auth.ts`).
- **`src/main/auth/password.ts`**: hashing y comparación de contraseñas con `bcryptjs` (ver justificación en la tabla de decisiones más abajo).
- **`src/main/auth/require-session.ts`**: `handleAuthenticated(channel, handler)`, un reemplazo directo de `ipcMain.handle` que exige sesión activa antes de ejecutar el handler. Se usa en **todos** los canales IPC existentes (incluido `system:getVersion`), evitando duplicar la validación de sesión en cada archivo de `ipc/`.
- **`src/main/services/auth-service.ts`**: `login`, `logout`, `changePassword`, `getCurrentUser` — sigue el mismo patrón que `attendance-service.ts` (servicio con lógica de orquestación real, no un CRUD delgado).
- **Renderer**: `AuthContext` (`src/renderer/auth/AuthContext.tsx`) mantiene el usuario autenticado en memoria durante la ejecución de la app (SPA de una sola ventana, sin recarga de página) y lo sincroniza con `auth:getSession` al montar. `RequireAuth`/`RequireChangePassword` (`src/renderer/auth/RequireAuth.tsx`) protegen las rutas: sin sesión → `/login`; con `mustChangePassword` → `/cambiar-contrasena`; body normal solo si hay sesión y la contraseña ya no está pendiente de cambio.

Pendiente para tickets futuros (fuera de alcance del Ticket 013): recuperación de contraseña y permisos específicos por pantalla/rol más allá del gate de sesión genérico (ver excepción puntual del Ticket 014 justo abajo).

## CRUD de Usuarios (implementado — Ticket 014)

Pantalla "Usuarios" (solo visible/accesible para rol `admin`) que permite administrar las cuentas que inician sesión. Reutiliza sin modificar toda la infraestructura de autenticación del Ticket 013 (`session.ts`, `password.ts`, `require-session.ts`, `AuthContext`, `RequireAuth`); el script `npm run seed:admin` sigue siendo necesario solo para crear el primer admin (bootstrap), ya que no puede haber CRUD de usuarios sin al menos un admin que inicie sesión primero.

- **`src/main/auth/require-admin.ts`** (nuevo, no reemplaza a `require-session.ts`): `handleAdminOnly(channel, handler)` — igual que `handleAuthenticated`, pero además exige `session.role === 'admin'`. Es la primera vez que un canal IPC distingue por rol, no solo por sesión activa; se implementó como wrapper aparte en vez de generalizar `handleAuthenticated` para no modificar la infraestructura del Ticket 013.
- **`src/main/services/user-service.ts`** (nuevo): `listUsers`, `createUser`, `updateUser`, `deleteUser`, `resetPassword`. Nunca devuelve el password (hash incluido) al renderer — mapea a `UserListItem` (`User` sin el campo `password`). `createUser` fuerza `mustChangePassword: true`; `resetPassword` genera una contraseña temporal simple, la hashea con la infraestructura existente y vuelve a poner `mustChangePassword: true`; `deleteUser` rechaza eliminar al usuario de la sesión activa.
- **`src/main/db/user.ts`**: se agregó `getUsers()` (listar) y `updateUser` ahora acepta `teacherId: null` como señal explícita para desvincular el profesor (vía `$unset` de Mongo) cuando un usuario pasa de rol `teacher` a `admin` — antes solo soportaba `undefined` (“no tocar este campo”).
- **Renderer**: `RequireAdmin` (`src/renderer/auth/RequireAdmin.tsx`, nuevo, no toca `RequireAuth.tsx`) protege la ruta `/usuarios`; el ítem del Sidebar solo se agrega cuando `user.role === 'admin'`.

## Almacenamiento de archivos (programa del curso) — decisión pendiente

La carga/descarga del programa de un curso introduce un tipo de dato nuevo para el sistema: archivos binarios. Ninguna capa actual (MongoDB vía Mongoose, providers) resuelve este caso. El mecanismo de almacenamiento (filesystem local accesible desde el proceso main, GridFS de MongoDB, u otro) queda como decisión pendiente para el ticket que implemente esta función; no se resuelve ni se diseña en esta revisión.

## Empaquetado y distribución

- La aplicación se empaqueta con Electron para Windows, que es el sistema operativo utilizado en las computadoras del instituto.
- No se distribuye a través de tiendas de aplicaciones ni actualizaciones automáticas remotas, salvo que el instituto lo requiera en el futuro.
- La configuración de conexión a MongoDB (host, credenciales) se gestiona mediante variables de entorno o un archivo de configuración local, no hardcodeada en el código fuente.

## Decisiones de arquitectura y motivos

| Decisión                                                            | Motivo                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin API REST propia                                                 | La app es de uso exclusivamente interno; agregar una API HTTP sería complejidad innecesaria (YAGNI).                                                                                                                                                                                                                                                            |
| MongoDB único y central                                             | Todas las computadoras deben ver la misma información en tiempo real; no se requiere trabajo offline.                                                                                                                                                                                                                                                           |
| Acceso a MongoDB solo desde main                                    | El renderer no debe tener credenciales de base de datos ni acceso directo por razones de seguridad y de arquitectura de Electron.                                                                                                                                                                                                                               |
| `StudentProvider` como único punto de acceso a alumnos              | Aunque los alumnos ya se persisten en MongoDB (Ticket 015), todo el sistema -incluida la gestión desde la pantalla "Alumnos" (Ticket 015.1)- lee y escribe a través de esta interfaz en vez de acceder a `db/student.ts` directamente, para no atar el resto del código a una implementación concreta si el instituto incorpora una API externa a futuro.       |
| Servicios organizados por dominio, no por capas genéricas           | Mantiene el código simple y fácil de ubicar (KISS), evitando repositorios genéricos u otras abstracciones prematuras.                                                                                                                                                                                                                                           |
| `bcryptjs` en lugar de `bcrypt`                                     | `bcrypt` es un módulo nativo que requiere recompilarse contra el ABI de Electron; este proyecto no tiene configurado ese paso de build (`electron-rebuild`/`electron-builder install-app-deps`), por lo que instalarlo tal cual rompería `npm run dev`. `bcryptjs` es una implementación en JS puro, mismo algoritmo y API compatible, sin paso de compilación. |
| Sesión en memoria en el proceso main, sin persistir entre reinicios | Es una app de escritorio de una sola ventana (no hay múltiples pestañas ni usuarios concurrentes en el mismo proceso); "sesión activa durante toda la ejecución" se cumple con una variable en memoria, sin necesidad de tokens, cookies ni almacenamiento en disco (YAGNI).                                                                                    |

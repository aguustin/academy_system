# Base de datos

Este documento describe las entidades previstas para el sistema y su origen de datos. **No define modelos, esquemas ni colecciones definitivas** — es documentación conceptual para guiar el diseño futuro.

MongoDB es la base de datos central y única, compartida por todas las instalaciones del instituto. Desde el Ticket 015 todas las entidades descritas aquí, incluidos los alumnos, se persisten en MongoDB. El alumno se sigue consultando a través de la interfaz `StudentProvider` en vez de acceder a su colección directamente desde cada consumidor, para mantener la posibilidad de reemplazar esa implementación por una API externa sin tocar el resto del sistema (ver [architecture.md](architecture.md)).

## Resumen de origen de datos

| Origen                             | Entidades                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MongoDB (propio del instituto)** | CourseTemplate, CourseEdition (con Schedule embebido), Teacher, Aula/Recurso, Categoría/Área temática, User, Attendance, Enrollment, ClassSession, Evaluation, StudentEvaluation, Student |

Todas se persisten en MongoDB, pero no todas se acceden de la misma forma: la inscripción (`Enrollment`) y la asistencia (`Attendance`) se consultan directamente vía `db/`, mientras que el alumno (`Student`) se sigue consultando a través de `StudentProvider` — la única entidad que pasa por esa capa de indirección, porque es la única cuyo origen podría volver a cambiar en el futuro (API externa).

> **Entidades definidas en código:** User, Teacher, CourseTemplate, CourseEdition, Schedule, Attendance, Student, Enrollment, ClassSession, Evaluation y StudentEvaluation ya tienen su tipo TypeScript y su schema de Zod en `src/shared/` (`users.ts`, `teachers.ts`, `courses.ts`, `attendance.ts`, `students.ts`, `enrollments.ts`, `class-sessions.ts`, `evaluations.ts`). Ese código es la fuente de verdad sobre los campos exactos de cada entidad; esta página se mantiene a nivel conceptual y de relaciones.

---

## Revisión de vigencia de entidades (Ticket A01)

El instituto amplió el alcance del sistema (autenticación por rol, gestión completa de alumnos, evaluaciones, certificación, programa del curso). Esta tabla resume, para cada entidad ya definida, si se mantiene sin cambios, si evoluciona, o si depende de una decisión pendiente. No se crea ni se elimina ninguna entidad como parte de esta revisión.

| Entidad                   | Estado                                | Justificación                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CourseTemplate            | Se mantiene                           | Sin cambios respecto al alcance actual.                                                                                                                                                                                                                                                                          |
| CourseEdition + Schedule  | Se mantiene, evoluciona               | El modelo actual alcanza para el catálogo y las ediciones. Falta el concepto de "clase concreta" (una ocurrencia real de un `Schedule` en una fecha) para poder marcar asistencia por clase y armar la matriz de "Total de Asistencias". No se crea esa entidad ahora; queda identificada para un ticket futuro. |
| Teacher                   | Se mantiene, evoluciona               | Sin cambios en sus campos. A futuro se vinculará con un `User` de rol `teacher` para permitir el login del tallerista; esa vinculación es nueva pero no reemplaza a `Teacher`.                                                                                                                                   |
| Aula / Recurso            | Se mantiene                           | Sigue fuera de alcance funcional (YAGNI); los nuevos requerimientos no la mencionan.                                                                                                                                                                                                                             |
| Categoría / Área temática | Se mantiene                           | Sigue fuera de alcance funcional (YAGNI); los nuevos requerimientos no la mencionan.                                                                                                                                                                                                                             |
| User                      | Se mantiene, deja de ser YAGNI        | Ya existía el tipo con rol `admin`/`teacher`, pero su alcance de permisos estaba explícitamente diferido. Ahora hay requerimiento concreto: login, cambio de contraseña obligatorio en el primer inicio de sesión, recuperación de contraseña, y paneles diferenciados por rol.                                  |
| Attendance                | Se mantiene, cambia de comportamiento | Los campos actuales (`status`, `registeredBy`, etc.) siguen siendo válidos. El flujo principal de registro cambia (ver módulos funcionales en [roadmap.md](roadmap.md)) y depende conceptualmente de que exista el concepto de "clase concreta" mencionado arriba.                                               |
| Enrollment                | Se mantiene, evoluciona               | El flujo se amplía para permitir dar de alta un alumno nuevo en el mismo paso de inscripción (ver `Student` debajo).                                                                                                                                                                                             |
| Student                   | Evoluciona — resuelto en Ticket 015   | Ver "Gestión de Alumnos (Ticket 015)" más abajo.                                                                                                                                                                                                                                                                 |

### Decisión resuelta: Student (Ticket 015)

Los requerimientos pedían crear/editar alumnos desde la app, lo que contradecía el principio original de que los alumnos eran de solo lectura vía `StudentProvider` (CLAUDE.md §1, §15 en su redacción previa a este ticket). El instituto confirmó el cambio y se implementó en el Ticket 015, en la dirección que esta revisión ya proponía como default: `StudentProvider` mantuvo su interfaz de solo lectura intacta; la implementación activa detrás de ella pasó de `MockStudentProvider` a `MongoStudentProvider`, y el alta/edición/baja se agregó como una operación nueva que no pasa por esa interfaz (ver detalle en "Gestión de Alumnos (Ticket 015)" más abajo y en [architecture.md](architecture.md)).

### Conceptos que siguen sin modelarse

- **Certificación / aptitud para certificado**: no se modela como entidad propia. Se representa a través de la relación entre `Attendance` (para el porcentaje de asistencia) y `StudentEvaluation` (para la aprobación de evaluaciones); su cálculo es lógica de negocio y queda fuera de alcance del dominio. A definir en el ticket que implemente la Fase 12 del roadmap.
- **Programa del curso**: archivo cargado por el instituto (asociado a `CourseTemplate` o `CourseEdition`, a confirmar) para descarga posterior. Depende de la decisión de almacenamiento de archivos (ver [architecture.md](architecture.md)); no se modela hasta que esa decisión se resuelva.

---

## Actualización del dominio (Ticket A02)

A partir de la revisión de arquitectura del Ticket A01, se actualizó el modelo de dominio en `src/shared/` para representar el nuevo alcance. Cambios realizados:

- **User (modificada)**: se agregaron los campos `email` (contacto para recuperación de contraseña), `mustChangePassword` (fuerza el cambio de contraseña en el primer inicio de sesión), `teacherId` (opcional; vincula el usuario con su `Teacher` cuando `role === 'teacher'`), y `createdAt`/`updatedAt`, para quedar consistente con el resto de las entidades administrativas.
- **ClassSession (nueva)**: ocurrencia concreta de un `Schedule` en una fecha determinada de una `CourseEdition` (`courseEditionId`, `date`, `startTime`, `endTime`, `createdAt`). Habilita a futuro "marcar asistencia por clase" y la tabla "Total de Asistencias", sin que este ticket implemente ninguna de las dos.
- **Evaluation (nueva)**: instancia de evaluación de una `CourseEdition` (`courseEditionId`, `type`: `process` | `final`, `name`, `createdAt`, `updatedAt`).
- **StudentEvaluation (nueva)**: resultado de un alumno en una `Evaluation` (`evaluationId`, `studentId`, `passed`, `createdAt`, `updatedAt`).

**Decisiones que se dejaron explícitamente afuera de este ticket** (por alcance, no por olvido):

- `Attendance` no se modificó para referenciar `ClassSession`. Es la entidad activa del flujo de registro por DNI ya implementado; vincularla implicaría tocar servicios, IPC y UI existentes, lo cual excede "actualizar el dominio". Esa migración queda para el ticket que implemente la Fase 10 del roadmap.
- `Student` no se modificó (y sigue sin modificarse en el Ticket 015: mismos tres campos, DNI/nombre/apellido). La decisión pendiente sobre su evolución era sobre el _origen de los datos_ (mock vs. persistencia propia), no sobre su forma; se resolvió en el Ticket 015 (ver más abajo) sin tocar el dominio.
- `Certificación` sigue sin modelarse como entidad — se representa por relación, no por persistencia (ver arriba).

## Gestión de Alumnos (Ticket 015)

`Student` pasó de leerse desde un `MockStudentProvider` en memoria a persistirse en MongoDB (colección `alumnos`), gestionable desde una pantalla "Alumnos" (solo admin). El dominio (`src/shared/students.ts`) no cambió: sigue siendo `{ id, dni, firstName, lastName }`, sin campos nuevos.

- El **DNI es único**: se valida antes de crear/editar (mensaje de error si ya existe otro alumno con el mismo DNI) y además a nivel de índice único en Mongo, como defensa en profundidad.
- La interfaz `StudentProvider` en su momento (Ticket 015) siguió siendo de solo lectura (`getAll`, `findById`, `findByDni`); el alta/edición/baja llamaba directamente a `db/student.ts` desde `student-service.ts`. Esto se unificó en el **Ticket 015.1**: `StudentProvider` se amplió con `create`/`update`/`delete`, y `student-service.ts` pasó a depender únicamente de la interfaz — `db/student.ts` ahora solo lo consume `MongoStudentProvider`. Sin cambio de comportamiento.
- Todo el código que ya consumía `StudentProvider` de solo lectura (inscripciones, registro de asistencia por DNI, consulta de asistencias) siguió funcionando sin cambios funcionales — solo cambió qué provider está detrás de la interfaz.
- `MockStudentProvider` se eliminó del código: no tenía más consumidores una vez que `MongoStudentProvider` lo reemplazó en los dos lugares que lo usaban (`ipc/student.ts` y `attendance-service.ts`).

## Entidades propias del instituto (MongoDB)

### Curso (CourseTemplate) y Cursada (CourseEdition)

La pregunta de diseño abierta sobre Curso/Taller se resolvió separando dos conceptos:

- **CourseTemplate**: el curso genérico que dicta el instituto (ej. "React", "Python Inicial", "Blender", "Impresión 3D"), sin fecha ni docente asignado. Conceptos asociados: nombre, descripción, estado (activo/inactivo).
- **CourseEdition**: una cursada concreta de un `CourseTemplate` (ej. "React — comisión de marzo 2026"), con docente, fechas de inicio/fin, horarios y estado (`upcoming`, `active`, `finished`).

Un mismo `CourseTemplate` puede tener múltiples `CourseEdition` a lo largo del tiempo (distintas comisiones, distintos docentes). Los horarios (`Schedule`) están embebidos en cada `CourseEdition`: cada uno indica día de la semana, hora de inicio y hora de fin, y una cursada puede tener varios (ej. `monday` y `wednesday` de 18 a 20). El dominio guarda `dayOfWeek` con valores canónicos en inglés (`monday`...`sunday`); la traducción a "Lunes", "Miércoles", etc. es responsabilidad exclusiva de la interfaz, que sigue completamente en español.

### Docente (Teacher)

Persona que dicta una o más cursadas. Es un dato administrativo interno del instituto (no un alumno). No tiene especialidad: un docente puede ser asignado a cualquier `CourseEdition`.

Conceptos asociados: nombre y apellido, DNI, email, teléfono, estado (activo/inactivo).

### Aula / Recurso

Espacio físico o recurso material necesario para dictar una actividad (aula, laboratorio, impresora 3D, equipamiento multimedia, etc.). Todavía no está vinculada a `Schedule`/`CourseEdition` en el modelo definido en código; se incorporará esa relación cuando exista el requerimiento concreto (YAGNI).

Conceptos asociados: nombre, tipo (aula, equipo, herramienta), capacidad (si aplica), disponibilidad.

### Categoría / Área temática

Clasificación temática de los cursos y talleres (ej. Programación, Impresión 3D, Multimedia). Todavía no está vinculada a `CourseTemplate` en el modelo definido en código; se incorporará esa relación cuando exista el requerimiento concreto (YAGNI).

Conceptos asociados: nombre, descripción. Permite agrupar y filtrar cursos/talleres por área.

### Usuario del sistema (User)

Persona del instituto que inicia sesión en la aplicación. No debe confundirse con "alumno". Tiene dos roles posibles: `admin` (personal administrativo/coordinación) y `teacher` (un docente que también accede al sistema, ej. para tomar asistencia).

Conceptos asociados: nombre de usuario (único), contraseña (hasheada con `bcryptjs` desde el Ticket 013 — nunca se guarda en texto plano ni se expone al renderer), email (contacto para recuperación de contraseña, todavía no implementada), rol, `teacherId` (opcional, vincula el usuario con su `Teacher` cuando el rol es `teacher`), `mustChangePassword` (indica si debe cambiar la contraseña en el próximo inicio de sesión — ej. tras el alta), estado (activo/inactivo). El alcance fino de permisos por rol se define en una fase posterior (ver [roadmap.md](roadmap.md)); por ahora todo canal IPC exige sesión activa, pero no distingue por rol.

### Clase / sesión concreta (ClassSession)

Ocurrencia real de una clase de una `CourseEdition` en una fecha determinada — a diferencia de `Schedule`, que solo describe el patrón recurrente (día de la semana, horario), `ClassSession` representa un evento puntual en el calendario.

Conceptos asociados: cursada (`courseEditionId`), fecha, hora de inicio y fin. Es la base sobre la que a futuro se construirá "marcar asistencia por clase" y la tabla "Total de Asistencias" (alumnos × clases) — ninguna de las dos está implementada todavía.

**Persistencia (Ticket 016):** se persiste en MongoDB (colección `class_sessions`, índices por `courseEditionId` y `date`). Las sesiones de una edición se generan automáticamente a partir de `startDate`, `endDate` y `schedules` de su `CourseEdition` (una `ClassSession` por cada coincidencia de día de la semana dentro del rango); la generación es idempotente — si la edición ya tiene sesiones generadas, no se crean duplicados. No hay edición ni eliminación manual de sesiones individuales todavía.

### Evaluación (Evaluation)

Instancia de evaluación definida por el tallerista para una `CourseEdition`. Puede ser de proceso o de proyecto/final; ambos tipos son obligatorios para el curso, pero esa regla ("debe existir al menos una de cada tipo") es lógica de negocio, no una validación estructural, y no se aplica en el dominio todavía.

Conceptos asociados: cursada (`courseEditionId`), tipo (`process` | `final`), nombre.

### Resultado de evaluación por alumno (StudentEvaluation)

Vínculo entre un Alumno y una `Evaluation`, con el resultado (aprobada/desaprobada).

Conceptos asociados: evaluación (`evaluationId`, propia), alumno (`studentId`, vía `StudentProvider`), `passed` (booleano). Sigue el mismo patrón que `Enrollment` y `Attendance`: el alumno se referencia solo por id, nunca se duplican sus datos.

### Asistencia (Attendance)

Registro de la presencia de un alumno en una clase concreta de una `CourseEdition`. El alumno referenciado (`studentId`) se resuelve vía `StudentProvider` — la Asistencia solo guarda su identificador, igual que una Inscripción.

Conceptos asociados: alumno (vía `StudentProvider`), cursada, fecha y hora, estado (`present`, `absent`, `justified`), y quién la registró (`system` o `teacher`). Todavía no referencia a `ClassSession` (ver "Actualización del dominio (Ticket A02)" más arriba); sigue identificando la clase por `courseEditionId` + fecha, como lo usa hoy el flujo de registro por DNI.

### Inscripción (Enrollment)

Vínculo entre un Alumno y una `CourseEdition` (propia del instituto). A diferencia de lo que se planteaba originalmente (ver nota histórica más abajo), esta relación **sí se persiste en MongoDB**: es información operativa propia del instituto (qué alumno cursa qué edición).

Conceptos asociados: identificador de alumno (`studentId` — nunca se duplica nombre, apellido ni DNI en `Enrollment`), identificador de cursada (`courseEditionId`, propio), fecha de alta. Al mostrarla en la interfaz, el nombre del alumno se resuelve en el momento consultando al `StudentProvider` — nunca se duplica ese dato en la base.

### Alumno (Student)

Persona inscripta en la institución como estudiante. Desde el Ticket 015 se persiste en MongoDB (colección `alumnos`, gestionable desde la pantalla "Alumnos") igual que el resto de las entidades propias — pero, a diferencia de ellas, ningún consumidor accede a su colección directamente: toda operación (lectura y, desde el Ticket 015.1, también escritura) pasa por la interfaz `StudentProvider` (`getAll`, `findById`, `findByDni`, `create`, `update`, `delete`).

Conceptos asociados: DNI (único), nombre y apellido — sin cambios desde el inicio del proyecto. La implementación activa de `StudentProvider` es `MongoStudentProvider`; si el instituto incorporara una API externa de alumnos en el futuro, alcanzaría con implementar la misma interfaz y cambiar cuál provider se instancia, sin tocar el resto del sistema.

> **Nota histórica:** en una versión anterior de este documento se planteaba que la inscripción tampoco debía persistirse localmente hasta que existiera un requerimiento concreto (YAGNI). Ese requerimiento ya existe (gestión de inscriptos por edición) y se implementó como la entidad `Enrollment` de esta sección. De forma similar, los alumnos se leían originalmente de un `MockStudentProvider` en memoria; desde el Ticket 015 se persisten en MongoDB a través de `MongoStudentProvider`, sin cambiar la interfaz `StudentProvider` que el resto del sistema consume.

---

## Relaciones conceptuales

```
                         User ──teacherId (opcional)──> Teacher

CourseTemplate ──< CourseEdition >── Teacher
                        │  (Schedule embebido: día, hora inicio, hora fin)
                        │
                        ├──< Enrollment >── studentId ──> Alumno (vía StudentProvider)
                        │
                        ├──< Attendance >── studentId ──> Alumno (vía StudentProvider)
                        │
                        ├──< ClassSession
                        │
                        └──< Evaluation ──< StudentEvaluation >── studentId ──> Alumno (vía StudentProvider)
```

- Un `CourseTemplate` tiene múltiples `CourseEdition` a lo largo del tiempo.
- Una `CourseEdition` tiene un `Teacher` y uno o más `Schedule` embebidos.
- Una `CourseEdition` tiene múltiples `Enrollment` (propios, en MongoDB), cada uno referenciando un Alumno solo por `studentId`.
- Una `CourseEdition` tiene múltiples registros de `Attendance`, cada uno vinculado a un Alumno de la misma forma. Todavía no referencia a `ClassSession` (ver nota en su sección).
- Una `CourseEdition` tiene múltiples `ClassSession` (una por clase concreta dictada).
- Una `CourseEdition` tiene múltiples `Evaluation`, y cada `Evaluation` tiene múltiples `StudentEvaluation` (uno por alumno inscripto), cada uno vinculado a un Alumno por `studentId`.
- Un `User` puede referenciar opcionalmente a un `Teacher` mediante `teacherId`, cuando su rol es `teacher`.

Categoría/Área temática y Aula/Recurso siguen documentadas como conceptos previstos, pero todavía no están vinculadas a ninguna entidad definida en código (ver notas en cada sección).

## Fuera de alcance por ahora

No se documentan (por no ser necesarias todavía, según YAGNI) entidades como: facturación/pagos, sedes múltiples, encuestas de satisfacción. Se incorporarán a esta documentación si el instituto confirma que forman parte de una fase futura.

> Certificados dejó de estar fuera de alcance: el instituto confirmó el requerimiento (aptitud para certificado según asistencia y evaluaciones). Ver "Entidades nuevas identificadas" más arriba — todavía no se modela porque no está definido si se persiste o se calcula.

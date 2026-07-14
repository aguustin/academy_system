# Roadmap

Este documento describe las fases de desarrollo previstas, desde la inicialización del proyecto hasta la primera versión utilizable del sistema (MVP). El alcance exacto del MVP está detallado en [mvp.md](mvp.md); este roadmap ordena el camino para llegar hasta ahí.

Las fases son secuenciales pero no rígidas: cada fase se da por completada cuando cumple su objetivo, sin agregar trabajo adicional que corresponda a una fase posterior (YAGNI).

## Fase 0 — Inicialización del proyecto

Objetivo: tener un esqueleto ejecutable de la aplicación, sin funcionalidad de negocio.

- Inicializar el proyecto Electron + React.
- Configurar el proceso main, el preload con `contextBridge`, y el renderer.
- Verificar que main y renderer se comunican correctamente por IPC con un caso mínimo de prueba.
- Definir la estructura de carpetas base descrita en [CLAUDE.md](../CLAUDE.md).

## Fase 1 — Conexión a MongoDB y capa de servicios

Objetivo: que el proceso main pueda leer y escribir en la base de datos central.

- Configurar la conexión a MongoDB desde `/src/main/db`, mediante variables de entorno.
- Crear el primer servicio real (por ejemplo, sobre la entidad Categoría/Área temática) como caso de referencia del patrón IPC → Servicio → MongoDB.
- Validar que múltiples instalaciones pueden conectarse a la misma base sin conflictos.

## Fase 2 — Mock Provider de alumnos e inscripciones

Objetivo: poder mostrar y vincular información de alumnos e inscripciones sin depender todavía de la API externa real.

- Definir la interfaz mínima que debe cumplir cualquier provider de alumnos/inscripciones.
- Implementar el Mock Provider con datos simulados representativos.
- Integrar el Mock Provider a la capa de servicios, dejando el punto de reemplazo listo para la futura API externa.

## Fase 3 — Gestión de cursos y talleres

Objetivo: administrar el núcleo de la operación del instituto.

- Alta, baja, modificación y listado de Cursos.
- Alta, baja, modificación y listado de Talleres.
- Asociación de Cursos/Talleres a una Categoría/Área temática.
- Pantallas React correspondientes en el renderer.

## Fase 4 — Docentes, horarios y aulas/recursos

Objetivo: completar la información operativa necesaria para dictar cursos y talleres.

- Alta, baja, modificación y listado de Docentes.
- Asignación de Docentes a Cursos/Talleres.
- Alta, baja, modificación y listado de Horarios, vinculados a Cursos/Talleres y a Aulas/Recursos.
- Alta, baja, modificación y listado de Aulas/Recursos.

## Fase 5 — Visualización de inscripciones

Objetivo: que el instituto pueda ver, dentro de esta aplicación, qué alumnos están inscriptos en cada curso/taller, usando la información que provee el Mock Provider.

- Listado de inscripciones por curso/taller, consumidas a través del provider activo.
- Visualización de datos básicos del alumno (solo lectura), obtenidos del provider.

## Fase 6 — Usuarios del sistema y acceso

Objetivo: que el personal del instituto pueda identificarse dentro de la aplicación.

- Alta y gestión de Usuarios del sistema (personal administrativo).
- Inicio de sesión dentro de la aplicación.
- Alcance de permisos por rol: a definir en el momento de esta fase, según necesidad real (evitar diseñar un sistema de permisos genérico de antemano).

## Fase 7 — MVP

Objetivo: versión funcional mínima, utilizable por el instituto en el día a día.

- Consolidación de las fases anteriores en una versión estable.
- Validación end-to-end del flujo completo: React → IPC → Servicios → MongoDB, y consumo del Mock Provider.
- Alcance exacto y exclusiones detalladas en [mvp.md](mvp.md).

## Después del MVP: fases confirmadas (Ticket A01)

El instituto confirmó un alcance ampliado (autenticación por rol, paneles diferenciados, gestión completa de alumnos, evaluaciones, certificación, programa del curso). A diferencia de la nota anterior de este documento, esta ampliación ya no es hipotética: se detalla en el gap analysis previo a este ticket. Las fases siguientes retoman el orden real de implementación, priorizando reutilizar lo construido en las Fases 0 a 7 antes que reemplazarlo. Ningún módulo existente se elimina: donde una fase nueva cambia el comportamiento de un flujo actual (por ejemplo, el registro de asistencia por DNI), el flujo anterior se conserva como complementario salvo indicación explícita en contrario.

### Estado de los módulos existentes

| Módulo                           | Estado                                            | Detalle                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profesores                       | Se mantiene                                       | Sin cambios; a futuro se vincula a `User` (Fase 8) sin reemplazar la pantalla actual.                                                                                  |
| Catálogo de Cursos               | Se mantiene, se amplía                            | Sin cambios en su alcance actual; en Fase 13 se le agrega carga/descarga de programa.                                                                                  |
| Ediciones                        | Se mantiene, núcleo del sistema                   | Sin cambios; sigue siendo el punto de entrada para inscripciones, asistencia y (a futuro) evaluaciones.                                                                |
| Inscripciones (por Edición)      | Se mantiene, se amplía                            | En Fase 9 se agrega alta de alumno nuevo en el mismo flujo, sin reemplazar el flujo actual de inscribir un alumno existente.                                           |
| Registro de Asistencia (por DNI) | Se mantiene como flujo complementario             | Deja de ser el único flujo de registro cuando exista "Marcar Asistencias por clase" (Fase 10), pero no se elimina: sigue siendo útil para registro rápido tipo kiosko. |
| Consulta de Asistencias          | Se mantiene, es la base de "Total de Asistencias" | Sin cambios en su alcance actual; Fase 10 construye la vista de matriz reutilizando esta misma consulta.                                                               |

### Fase 8 — Autenticación y roles

Objetivo: que el personal del instituto inicie sesión y el sistema distinga entre panel de administración y panel de tallerista.

- [x] Login, logout, cambio de contraseña obligatorio en el primer inicio de sesión, hash de contraseñas, protección de rutas y de todos los handlers IPC (Ticket 013). El primer usuario admin se crea con `npm run seed:admin` (script de bootstrap, no es CRUD de usuarios).
- [ ] Recuperación de contraseña.
- [x] CRUD de usuarios (alta, edición, eliminación, restablecer contraseña) desde un panel de administración, con selector de Profesor cuando el rol es `teacher` (Ticket 014).
- [x] Enrutamiento y visibilidad de módulos según rol (`admin` / `teacher`): al iniciar sesión, `teacher` aterriza en `/mis-cursos` (Ticket 017); Sidebar oculta Profesores/Catálogo de Cursos/Usuarios/Alumnos para ese rol. La validación de ownership (`courseEdition.teacherId === session.teacherId`) vive en `teacher-course-service.ts`, no solo en la UI. El resto de los canales IPC (Profesores, Catálogo de Cursos, Ediciones) sigue exigiendo únicamente sesión activa, sin distinguir rol a nivel backend — queda para un ticket futuro si se confirma que es necesario.
- Reemplaza el alcance "a definir" que tenía la Fase 6 sobre permisos por rol.

### Fase 9 — Alumnos administrables

Objetivo: resolver la decisión pendiente sobre `Student` (ver [architecture.md](architecture.md) y [database.md](database.md)) e implementar alta/edición de alumnos desde la app.

- [x] Confirmación explícita del instituto sobre la evolución de `StudentProvider` y persistencia en MongoDB vía `MongoStudentProvider` (Ticket 015).
- [x] CRUD completo de alumnos (alta, edición, baja, DNI único) desde una pantalla "Alumnos" dedicada, solo para administradores (Ticket 015).
- [ ] Alta de alumno nuevo _en el mismo flujo de inscripción_ (con autocompletado por DNI en inscripciones posteriores) — el Ticket 015 entregó una pantalla de gestión separada, no integrada todavía a `EnrollmentsSection`.
- [ ] Edición de datos personales del alumno desde el Panel Alumno (ese panel todavía no existe, ver Fase 14).
- Reutiliza la interfaz `StudentProvider` y todo el código que ya la consume (IPC, `window.api.student.*`, UI de inscripciones) — ningún consumidor existente necesitó cambios al reemplazar `MockStudentProvider` por `MongoStudentProvider`.

### Fase 10 — Clase concreta y asistencia por clase

Objetivo: poder marcar asistencia seleccionando una clase concreta (no solo por DNI) y ver el total de asistencias por curso.

- [x] Persistencia y generación automática de `ClassSession` a partir de `startDate`/`endDate`/`schedules` de una `CourseEdition`, con visualización básica (tabla) desde Ediciones (Ticket 016). Sin duplicados: generar dos veces sobre la misma edición devuelve las mismas sesiones.
- [ ] Pantalla "Marcar Asistencias" por clase, con toggle presente/ausente por alumno, para el panel tallerista.
- [ ] Pantalla "Total de Asistencias" (alumnos × clases).
- [ ] `Attendance` sigue sin referenciar `ClassSession` (ver [database.md](database.md)) — esa vinculación es necesaria para "marcar asistencia por clase" y queda para el ticket que la implemente.
- El registro de asistencia por DNI (Fase 4 del kiosko) se conserva como flujo complementario, no se elimina.

### Fase 11 — Evaluaciones

Objetivo: que el tallerista pueda gestionar evaluaciones de sus cursos.

- CRUD de evaluaciones (de proceso y de proyecto/final) por `CourseEdition`.
- Marcado de aprobada/desaprobada por alumno dentro de cada evaluación.

### Fase 12 — Certificación

Objetivo: calcular si un alumno es apto para certificado.

- Cálculo de porcentaje de asistencia sobre el total de clases y verificación del umbral (70%).
- Cruce con aprobación de evaluaciones obligatorias para determinar aptitud.
- Depende de las Fases 10 y 11.

### Fase 13 — Programa del curso

Objetivo: que el instituto pueda cargar y descargar el programa de un curso.

- Resolver la decisión pendiente de almacenamiento de archivos (ver [architecture.md](architecture.md)).
- Carga y descarga del archivo desde el Panel Curso.

### Fase 14 — Consolidación de paneles

Objetivo: dejar los paneles de administración y tallerista completos según el requerimiento original.

- [x] Panel Tallerista base: "Mis Cursos" (listado de ediciones propias con cantidad de alumnos/clases) y detalle de curso (Ticket 017). Falta agregarle accesos a marcar asistencia, evaluaciones y total de asistencias — dependen de fases futuras.
- [ ] Panel Curso: listado de inscriptos, alta de alumno, acceso al Panel Alumno.
- [ ] Panel Alumno: datos personales, asistencia, estado de evaluaciones, aptitud para certificado.
- Esta fase es principalmente de integración: reutiliza las pantallas y flujos construidos en las fases 8 a 13.

## Después de la Fase 14 (fuera de este roadmap)

Cualquier fase posterior (por ejemplo, reemplazo del Mock Provider por la API externa real, reportes adicionales, notificaciones, multi-sede) se planificará y documentará cuando exista una necesidad confirmada, no antes.

# MVP (Producto Mínimo Viable)

Este documento define exactamente qué funcionalidades forman parte de la primera versión utilizable del sistema y cuáles quedan explícitamente fuera. Sirve como límite de alcance: ninguna tarea de desarrollo debería exceder lo aquí descrito sin que el instituto lo confirme como un nuevo requerimiento.

## Criterio del MVP

El MVP debe permitir al personal del instituto reemplazar su gestión manual/informal de cursos y talleres por la aplicación, para las operaciones más frecuentes del día a día. No busca cubrir todos los casos posibles, sino los suficientes para que la app sea usable en la operación real.

---

## Incluido en el MVP

### Gestión de cursos y talleres

- Crear, ver, editar y eliminar Cursos.
- Crear, ver, editar y eliminar Talleres.
- Asociar un Curso/Taller a una Categoría/Área temática.
- Listar cursos y talleres, con filtro por categoría y por estado (activo/finalizado/planificado).

### Docentes

- Crear, ver, editar y eliminar Docentes.
- Asignar uno o más Docentes a un Curso/Taller.

### Horarios y aulas/recursos

- Crear, ver, editar y eliminar Horarios, asociados a un Curso/Taller.
- Crear, ver, editar y eliminar Aulas/Recursos.
- Asignar un Aula/Recurso a un Horario.

### Inscripciones (solo lectura, vía Mock Provider)

- Ver la lista de alumnos inscriptos en un Curso/Taller, obtenida a través del Mock Provider.
- Ver datos básicos de un alumno (nombre, contacto) tal como los provee el Mock Provider.
- No se permite crear, editar ni eliminar alumnos o inscripciones desde esta aplicación.

### Usuarios del sistema

- Inicio de sesión para el personal del instituto que usa la aplicación.
- Un único rol de uso general (sin sistema de permisos granular todavía).

### Infraestructura

- Conexión estable a la base de datos MongoDB central desde todas las instalaciones.
- Empaquetado de la aplicación como ejecutable de escritorio para las computadoras del instituto.

---

## Explícitamente fuera del MVP

- **Administración real de alumnos e inscripciones**: seguirá dependiendo del Mock Provider hasta que exista la API externa; esa integración no forma parte del MVP.
- **Reemplazo del Mock Provider por la API externa real**: es una fase posterior (ver [roadmap.md](roadmap.md)).
- **Sistema de permisos por rol**: el MVP tiene un único nivel de acceso para el personal del instituto.
- **Reportes y estadísticas** (ej. ocupación de aulas, asistencia, rendimiento de cursos).
- **Notificaciones** (email, recordatorios, alertas).
- **Facturación o pagos.**
- **Certificados de finalización.**
- **Multi-sede / múltiples ubicaciones físicas.**
- **Modo offline o sincronización local**: la app siempre requiere conexión a la base de datos central.
- **Internacionalización / multi-idioma.**
- **Auditoría o historial de cambios detallado.**
- **API REST propia o cualquier acceso externo al sistema.**

Estas exclusiones no son definitivas: si el instituto confirma alguna como necesidad real, se incorpora al roadmap como una fase nueva, con su propio análisis, en el momento en que se decida abordarla (YAGNI).

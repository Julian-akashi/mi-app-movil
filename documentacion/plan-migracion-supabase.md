# Plan de migración: SQLite local a Supabase

## Objetivo
Migrar la persistencia actual de la app hacia Supabase sin romper la experiencia móvil ni el estado funcional actual de la aplicación.

La estrategia recomendada no es reemplazar SQLite de golpe, sino pasar a un modelo híbrido: SQLite como caché local y Supabase como backend real y centralizado.

## Contexto actual detectado
- La lógica principal de persistencia está en [src/database.ts](../src/database.ts).
- La app usa autenticación local y sesión persistente a través de [src/contexts/auth-context.tsx](../src/contexts/auth-context.tsx).
- Ya existe infraestructura de Supabase en [supabase/config.toml](../supabase/config.toml).
- La primera migración de usuarios ya está en [supabase/migrations/20261020215000_crear_usuarios.sql](../supabase/migrations/20261020215000_crear_usuarios.sql).

## Decisión de arquitectura
Se recomienda una arquitectura híbrida:

1. SQLite: se mantiene como caché local, offline y para UX rápida.
2. Supabase: se usa como fuente de verdad para usuarios, objetos, conversaciones y mensajes.
3. Repositorios: una capa intermedia para desacoplar la UI del storage real.

Esto evita una migración agresiva que rompería la app actual.

---

## Fase 0 — Diagnóstico técnico

### Objetivo
Definir qué se mueve a Supabase y qué se queda en SQLite.

### Tareas
- Revisar estas funciones principales del proyecto:
  - registerUser
  - loginUser
  - createObject
  - getObjectById
  - getConversations
  - getConversationMessages
  - sendMessage
- Identificar qué datos deben vivir en la nube:
  - usuarios
  - objetos
  - conversaciones
  - mensajes
  - imágenes
- Definir qué datos pueden quedarse localmente:
  - cache de la última sesión
  - datos recientes
  - navegación offline
  - sincronización diferida

### Resultado esperado
- Mapa claro de backend remoto vs cache local.
- Decisión técnica: migración gradual y segura.

---

## Fase 1 — Configuración base de Supabase

### Objetivo
Preparar Supabase para la app móvil.

### Tareas
- Completar la configuración del proyecto local de Supabase.
- Crear variables de entorno:
  - EXPO_PUBLIC_SUPABASE_URL
  - EXPO_PUBLIC_SUPABASE_ANON_KEY
- Instalar el cliente de Supabase para Expo:
  - @supabase/supabase-js
- Crear un archivo de inicialización:
  - src/lib/supabase.ts
- Verificar conexión local:
  - login de prueba
  - consulta de prueba
  - upload de prueba al storage

### Resultado esperado
- Supabase funcionando correctamente en entorno local.
- La app capaz de conectarse al backend remoto.

---

## Fase 2 — Modelo de datos en Supabase

### Objetivo
Definir el esquema relacional equivalente al modelo actual de SQLite.

### Entidades recomendadas

#### usuarios
- id
- nombre
- email
- created_at

#### objetos
- id
- titulo
- descripcion
- categoria
- tipo_aviso
- facultad
- lugar
- fecha_suceso
- contacto
- imagen_url
- estado
- usuario_id
- created_at

#### conversaciones
- id
- objeto_id
- owner_id
- requester_id
- created_at
- updated_at

#### mensajes
- id
- conversacion_id
- sender_id
- recipient_id
- body
- created_at
- read_at

### Extras recomendados
- Bucket de storage: object-images
- Soporte para imágenes de perfil si se decide más adelante

### Políticas RLS
- Los usuarios solo pueden ver sus propios datos.
- Los objetos pueden ser públicos para la comunidad.
- Las conversaciones solo son visibles para los participantes.
- Los mensajes solo son visibles dentro de la conversación.
- Los updates y deletes solo deben permitirse al autor.

### Resultado esperado
- Base SQL lista, segura y consistente con la lógica de la app.

---

## Fase 3 — Autenticación de usuarios en Supabase

### Objetivo
Migrar la autenticación actual a Supabase Auth.

### Tareas
- Reemplazar registro local por Supabase Auth.
- Reemplazar login local por signInWithPassword.
- Mantener perfil de usuario en la tabla public.usuarios.
- Crear trigger para sincronizar auth.users con public.usuarios.
- Revisar la sesión del usuario en [src/contexts/auth-context.tsx](../src/contexts/auth-context.tsx).
- Mantener AsyncStorage como persistencia mínima local, pero con Supabase como fuente de verdad.

### Resultado esperado
- Registro e inicio de sesión funcionando con Supabase.
- El usuario queda autenticado y con perfil sincronizado.

---

## Fase 4 — Migración de objetos

### Objetivo
Mover los avisos a Supabase.

### Tareas
- Reescribir createObject para insertar en public.objetos.
- Reescribir getObjectById para leer desde Supabase.
- Revisar filtros actuales:
  - categoria
  - facultad
  - tipo_aviso
  - estado
  - búsqueda por texto
- Mapear los campos actuales del SQLite:
  - titulo
  - descripcion
  - categoria
  - tipo_aviso
  - facultad
  - lugar
  - fecha_suceso
  - contacto
  - imagen_url
  - estado
  - usuario_id

### Resultado esperado
- El flujo completo de crear, listar y ver avisos queda manejado por Supabase.

---

## Fase 5 — Migración de conversaciones y mensajes

### Objetivo
Mover el chat de la app a Supabase.

### Tareas
- Crear funciones para:
  - crear conversación
  - listar conversaciones del usuario
  - cargar mensajes
  - enviar mensaje
- Reemplazar las funciones locales:
  - getConversations
  - getConversationMessages
  - sendMessage
- Agregar soporte para read_at y mensajes no leídos.
- Verificar las relaciones entre:
  - owner_id
  - requester_id
  - objeto_id
  - usuario actual

### Resultado esperado
- El chat funciona con datos remotos.
- Se puede escalar a realtime si se decide más adelante.

---

## Fase 6 — Storage de imágenes

### Objetivo
Mover imágenes a Supabase Storage.

### Tareas
- Crear el bucket de imágenes para los objetos.
- Configurar permisos de lectura/escritura.
- Reemplazar la lógica local de persistImageUri con upload a Supabase Storage.
- Guardar la URL correcta en la tabla objetos.
- Mantener compatibilidad con imágenes ya guardadas localmente.

### Resultado esperado
- Las fotos de los objetos quedan almacenadas en Supabase y no solo en el dispositivo.

---

## Fase 7 — Capa de repositorios

### Objetivo
Desacoplar la UI de la persistencia actual.

### Tareas
- Crear una capa de acceso a datos:
  - authRepository.ts
  - objetosRepository.ts
  - mensajesRepository.ts
- Centralizar las llamadas a Supabase.
- Mantener SQLite solo para cache local y sincronización.
- Mantener la UI casi intacta.

### Resultado esperado
- La app queda más mantenible y fácil de migrar sin romper múltiples pantallas a la vez.

---

## Fase 8 — Sincronización offline y caché local

### Objetivo
Mantener la app funcional sin internet.

### Tareas
- Mantener SQLite como caché local para:
  - último estado de la sesión
  - objetos recientes
  - mensajes recientes
  - pantallas consultadas
- Definir sincronización:
  - cuando hay conexión: subir local -> Supabase
  - cuando no hay: seguir usando caché
- Guardar pending sync para:
  - crear avisos
  - enviar mensajes
  - editar estados

### Resultado esperado
- Experiencia móvil estable incluso con conexiones inestables.

---

## Fase 9 — Testing y validación

### Objetivo
Verificar que la migración no rompe la app.

### Tareas
Validar estos flujos:
- registro
- login
- creación de objeto
- listado de objetos
- detalle del objeto
- conversaciones
- envío de mensajes
- cierre de sesión

### Casos a probar
- conexión disponible
- conexión intermitente
- upload de imagen
- datos vacíos
- estados de objetos
- acceso por RLS
- validación de UUIDs y relaciones

### Resultado esperado
- App estable con backend remoto y caché local.

---

## Fase 10 — Release y evolución

### Objetivo
Preparar la solución para producción y crecimiento.

### Tareas
- Configurar el proyecto real de Supabase.
- Definir variables de entorno para producción.
- Preparar EAS si hace falta para despliegue.
- Documentar:
  - estructura de datos
  - reglas de negocio
  - flujo de acceso
  - política de storage
- Definir mejoras posteriores:
  - push notifications
  - moderación
  - filtros avanzados
  - roles de administración

### Resultado esperado
- Base sólida para continuar el proyecto más allá del prototipo.

---

## Recomendación práctica para este proyecto
La estrategia más segura es esta:

1. Mantener SQLite como caché local.
2. Mover usuarios y objetos a Supabase.
3. Mover conversaciones y mensajes a Supabase.
4. Usar Supabase Storage para imágenes.
5. Crear una capa de repositorios.
6. Solo después ampliar más funcionalidades.

Esto reduce riesgo y evita que la app se rompa durante la migración.

---

## Orden recomendado de implementación
1. Configuración de Supabase + variables de entorno
2. Usuarios + auth
3. Esquema de objetos
4. Storage para imágenes
5. Conversaciones + mensajes
6. Capa de repositorios
7. Sincronización offline
8. Validación final

---

## Conclusión
La migración a Supabase es viable y recomendable, pero para esta app conviene hacerla en etapas. No conviene eliminar SQLite de una vez porque la app ya está construida sobre esa estructura y funciona como prototipo funcional.

La mejor transición es migrar el backend a Supabase manteniendo SQLite como caché local, y luego ir dejando la lógica de negocio en repositorios para que la UI quede desacoplada del almacenamiento.

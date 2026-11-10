# Reporte de Proyecto — EncuentraFCC

## 2. Índice General
- 3. Introducción
  - 3.1 Contexto del Proyecto — Página pendiente
  - 3.2 Necesidad de desarrollar el proyecto — Página pendiente
  - 3.3 Importancia del diseño de Interfaces móviles — Página pendiente
  - 3.4 Justificación de utilizar Material Design — Página pendiente
  - 3.5 Descripción breve de las etapas que integran el proceso de diseño — Página pendiente
- 4. Descripción General del Proyecto
  - 4.1 Nombre de la app — Página pendiente
  - 4.2 Descripción de la app — Página pendiente
  - 4.3 Objetivo general — Página pendiente
  - 4.4 Objetivos específicos — Página pendiente
  - 4.5 Alcance del proyecto — Página pendiente
- 5. Identificación de necesidades y Usuarios
  - 5.1 Identificación del público objetivo — Página pendiente
  - 5.2 Características demográficas generales — Página pendiente
  - 5.3 Necesidades y expectativas — Página pendiente
  - 5.4 Problemas que presenta el usuario — Página pendiente
  - 5.5 Hábitos de uso de dispositivos móviles — Página pendiente
  - 5.6 Contexto en los que utilizará la app — Página pendiente
  - 5.7 Perfiles de Usuario — Página pendiente
  - 5.8 Historias de Usuario — Página pendiente
- Datos por confirmar — Página pendiente
- Archivos principales revisados — Página pendiente

## 3. Introducción

### 3.1 Contexto del Proyecto
EncuentraFCC es una aplicación móvil orientada a la gestión de objetos perdidos dentro de una comunidad universitaria. La evidencia del código indica que la app está diseñada para un entorno campus, con menciones a facultades, comunidad universitaria y recuperación de pertenencias. El sistema no presenta una arquitectura de backend remota ni un servicio en línea centralizado; en cambio, la información clave se almacena localmente mediante SQLite, y la sesión del usuario se guarda en almacenamiento del dispositivo. Esto sugiere un enfoque de prototipo funcional orientado a la experiencia de usuario (UX) móvil, con prioridad a la práctica operativa sobre la escalabilidad institucional.

La base de datos local incluye tablas para usuarios, objetos, conversaciones y mensajes, y todas las operaciones de almacenamiento se gestionan en SQLite. Esto permite que la solución funcione de forma autónoma en un entorno móvil sin depender de Supabase ni de un backend externo. El enfoque actual es, por tanto, de tipo local y educativo, con capacidad para demostrar la lógica de negocio y la interacción del usuario con la app dentro de una comunidad universitaria.

### 3.2 Necesidad de desarrollar el proyecto
La necesidad del proyecto se observa directamente en las pantallas de bienvenida, registro, listado de objetos y mensajes: la aplicación está centrada en resolver un problema cotidiano dentro del campus, que es la pérdida y localización de pertenencias. Los textos de la interfaz describen escenarios como “perdí un objeto”, “encontré un objeto” y “publica para la comunidad universitaria”. El problema no solo es la falta de visibilidad del objeto, sino también la dificultad para establecer contacto entre quien perdió algo y quien lo encontró.

En este contexto, la app responde a la necesidad de coordinar de forma rápida, clara y segura la recuperación de pertenencias. Su funcionalidad central no se limita a registrar un aviso, sino a conectar a dos usuarios dentro del mismo entorno universitario para establecer una comunicación inmediata y evitar pérdidas o retrasos en la recuperación.

### 3.3 Importancia del diseño de Interfaces móviles
El diseño de interfaces móviles es crítico en este proyecto porque la funcionalidad central depende de la rapidez, claridad y usabilidad en pantallas pequeñas. La app presenta varios patrones propios del diseño para dispositivos móviles: tarjetas de contenido, pestañas, listas de mensajes, filtros, formularios con validaciones, modales de selección y acciones primarias accesibles con un dedo.

Estas decisiones ayudan a reducir la fricción de uso en contextos reales, como buscar un objeto mientras se camina por el campus, reportarlo desde un celular o responder mensajes de forma rápida. La interacción se organiza de tal manera que el usuario pueda completar tareas en pocos pasos, sin necesidad de una navegación compleja ni de textos extensos. Este tipo de diseño favorece la operatividad en situaciones de urgencia o necesidad inmediata, que es precisamente el contexto del proyecto.

### 3.4 Justificación de utilizar Material Design
La aplicación presenta similitudes con Material Design, pero no se observa evidencia de una implementación formal del sistema Material 3 ni de una librería de diseño completa. Las similitudes son claramente verificables en la interfaz:

- Uso de tarjetas con esquinas redondeadas, sombras suaves y separación espacial consistente.
- Botones primarios con colores intensos sobre fondos neutros.
- Etiquetas y badges para estados como “Pendiente”, “Cerrado”, “Encontrado” y “Perdido”.
- Navegación por pestañas con indicadores visuales y iconografía simple.
- Formularios con jerarquía visual, campos agrupados y mensajes de ayuda.
- Selección por modal y listas desplegables para elegir facultades, categorías y estados.
- Paleta de colores coherente, fundamentada en azules, blancos y tonalidades de apoyo.

Estas decisiones ayudan al usuario porque mejoran la diferenciación de acciones, reducen la carga cognitiva y hacen más intuitiva la navegación entre pantallas, estados y filtros. Sin embargo, es importante señalar que el estilo visual parece ser una adaptación local del lenguaje de Material Design más que una implementación estricta del sistema oficial. Por ello, el informe debe describir estas cualidades como similitudes con Material Design y no como una adopción documental completa del estándar.

### 3.5 Descripción breve de las etapas que integran el proceso de diseño
No se observan evidencias de entrevistas formales, pruebas con usuarios, mapas de experiencia o documentación previa del proceso de diseño. Por lo tanto, la reconstrucción del proceso se debe basar únicamente en lo que sí es verificable mediante el código y la estructura del proyecto.

Las etapas que pueden reconstruirse son las siguientes:

1. Análisis funcional del problema: se identifican casos de uso principales como registro, inicio de sesión, publicación de avisos, búsqueda y comunicación.
2. Definición de la arquitectura de información: se establecen pantallas principales y rutas de navegación por tabs, rutas protegidas y pantallas de detalle.
3. Diseño de la interfaz móvil: se construyen pantallas con cards, formularios, filtros y componentes visuales repetidos para garantizar consistencia.
4. Implementación de validaciones y lógica de negocio: se incorporan validaciones en formularios, controles de sesión y gestión de avisos por usuario.
5. Persistencia local: se gestionan datos sobre usuarios, objetos y conversaciones mediante SQLite, con sesiones guardadas en el dispositivo.
6. Validación funcional local: la app permite probar la experiencia en un entorno móvil sin depender de un backend remoto.

Este proceso es congruente con una propuesta de aplicación enfocada en la experiencia del usuario, con fuerte componente de desarrollo iterativo y validación funcional, aunque sin evidencia documental de pruebas formales ni evaluación con usuarios reales.

## 4. Descripción General del Proyecto

### 4.1 Nombre de la app
EncuentraFCC

### 4.2 Descripción de la app
EncuentraFCC es una aplicación móvil para reportar y consultar objetos perdidos dentro del entorno universitario. Permite a los estudiantes registrar avisos sobre objetos extraviados o encontrados, filtrar publicaciones por categoría, facultad, tipo de aviso y tiempo transcurrido, consultar detalles y comunicarse directamente con el autor del aviso mediante mensajes dentro de la misma aplicación.

### 4.3 Objetivo general
Crear una solución móvil funcional para facilitar la recuperación de objetos perdidos dentro de la comunidad universitaria, utilizando una experiencia cercana a la navegación móvil y una base de datos local para su operación.

### 4.4 Objetivos específicos
- Permitir el registro e inicio de sesión de usuarios.
- Facilitar la publicación de avisos de objetos perdidos o encontrados.
- Permitir la consulta y búsqueda de avisos por diferentes filtros.
- Gestionar la relación entre usuarios mediante conversaciones de mensajes.
- Dar herramientas para editar y eliminar avisos propios.
- Mantener la sesión del usuario en el dispositivo y guardar la información localmente.
- Ofrecer una experiencia visual clara, con navegación orientada a tareas frecuentes.

### 4.5 Alcance del proyecto
El alcance verificado en el código incluye:

- Autenticación local con sesión persistente.
- Base de datos local en SQLite para usuarios, objetos, conversaciones y mensajes.
- Formulario de registro de usuario con selección de facultad.
- Formulario de publicación y edición de objetos.
- Listado con buscador y filtros.
- Detalle del objeto.
- Gestión de mensajes entre usuarios.
- Pantalla de perfil del usuario con métricas y cierre de sesión.
- Navegación basada en Expo Router y tabs nativos.

El alcance no incluye, al menos en la evidencia revisada, un sistema administrativo con roles de administrador, integración con servicios externos de geolocalización, un backend distribuido, notificaciones push ni un panel de administración institucional. También se observa que el proyecto está centrado en la base de datos local y no en un entorno cloud.

## 5. Identificación de necesidades y Usuarios

### 5.1 Identificación del público objetivo
El público objetivo es la comunidad universitaria, principalmente estudiantes y personal académico que puedan reportar o localizar objetos perdidos dentro del campus. La interfaz muestra una orientación claramente académica y grupal: facultades, comunidad universitaria, red segura y campus.

### 5.2 Características demográficas generales
No se cuenta con evidencia estadística ni entrevistas formales que permitan describir rangos de edad o procedencia con precisión. Sin embargo, el proyecto sugiere un entorno universitario con usuarios jóvenes y adultos jóvenes en educación superior. Se puede inferir que son usuarios que usan teléfonos inteligentes con conexión regular a internet y con hábitos de navegación móvil intensiva dentro del campus.

### 5.3 Necesidades y expectativas
- Reportar objetos perdidos o encontrados con rapidez.
- Ver avisos relevantes por facultad y tipo de pertenencia.
- Identificar el lugar y la fecha del suceso.
- Conocer el contacto del autor del aviso.
- Mantener una conversación directa para acordar la devolución.
- Gestionar su propia información y avisos en un mismo espacio.
- Recibir una experiencia simple y segura en un dispositivo móvil.

### 5.4 Problemas que presenta el usuario
- Pérdida de pertenencias en espacios universitarios.
- Falta de un medio centralizado para reportar objetos.
- Dificultad para localizar a la persona que encontró o perdió el objeto.
- Necesidad de comunicar detalles específicos del lugar, la facultad y la fecha.
- Ausencia de mecanismos de coordinación rápidos dentro del campus.
- Problemas de confianza y seguridad al momento de reunirse con otra persona.

### 5.5 Hábitos de uso de dispositivos móviles
La evidencia sugiere que los usuarios interactúan con la aplicación desde dispositivos móviles con uso frecuente durante la jornada universitaria. El diseño prioriza pantallas verticales, formularios compactos, listas largas con filtros y mensajes directos inmediatos. Se observa un patrón orientado a transacciones rápidas y accesibles desde una sola mano.

### 5.6 Contexto en los que utilizará la app
La app se usa en contextos cotidianos del campus, como:

- En pasillos, aulas o laboratorios cuando una persona ha perdido un objeto.
- En la recuperación de pertenencias en bibliotecas, edificios o espacios de estudio.
- En la comunicación con otros estudiantes para acordar la entrega o devolución.
- Al revisar avisos desde un teléfono móvil durante la jornada escolar.
- Al comprobar la disponibilidad de un objeto encontrado o reportado.

### 5.7 Perfiles de Usuario
Se identifican dos perfiles funcionales dentro del sistema, aunque no hay un rol administrativo formal en la evidencia revisada:

- Usuario no autenticado: puede crear una cuenta y acceder al flujo de registro e inicio de sesión.
- Usuario autenticado: puede reportar objetos, buscar avisos, editar publicaciones propias, cerrar sesión y comunicarse mediante mensajes.

También es posible distinguir dos roles de interacción dentro de la conversación:

- Propietario del aviso.
- Solicitante o usuario que contacta al propietario.

Estos perfiles son funcionales y se basan en la relación con el aviso, no en un sistema de roles institucional complejo.

### 5.8 Historias de Usuario
- Como estudiante universitario, quiero registrarme con mi correo y facultad para poder participar en la red de avisos del campus.
- Como usuario autenticado, quiero reportar un objeto perdido o encontrado para avisar a la comunidad.
- Como estudiante, quiero buscar objetos por palabra clave, categoría, facultad y tiempo para encontrar coincidencias relevantes.
- Como propietario de un aviso, quiero editar o eliminar mi publicación para mantener actualizado el estado del objeto.
- Como usuario interesado, quiero iniciar una conversación con el autor del aviso para coordinar la entrega o recuperación.
- Como usuario autenticado, quiero revisar mis avisos y mensajes para gestionar las publicaciones y comunicaciones en un solo lugar.
- Como usuario, quiero cerrar sesión de forma segura para proteger mi información personal en el dispositivo.

## Datos por confirmar
- Edad promedio y rango demográfico real del público objetivo.
- Número de facultades o dependencias que se contemplan oficialmente en la institución.
- Si la app será utilizada por estudiantes, docentes, personal administrativo o una combinación de ellos.
- Si existe un proceso real de validación con usuarios, entrevistas o pruebas de usabilidad.
- Si la marca “FCC” corresponde exactamente a una universidad o facultad específica.
- Si el proyecto requiere un flujo real de “entregas seguras” con coordinación institucional formal.
- Si se planea expandir la app a más campus, roles de administración o integración con un backend central.
- Si la aplicación debe tener un nombre oficial, logotipo institucional y una guía de marca más formal.

## Archivos principales revisados
- [package.json](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/package.json)
- [app.json](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/app.json)
- [src/database.ts](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/database.ts)
- [src/contexts/auth-context.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/contexts/auth-context.tsx)
- [src/components/app-tabs.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/components/app-tabs.tsx)
- [src/constants/catalogs.ts](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/constants/catalogs.ts)
- [src/app/_layout.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/_layout.tsx)
- [src/app/index.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/index.tsx)
- [src/app/login.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/login.tsx)
- [src/app/registro.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/registro.tsx)
- [src/app/crear.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/crear.tsx)
- [src/app/(tabs)/index.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/(tabs)/index.tsx)
- [src/app/(tabs)/avisos.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/(tabs)/avisos.tsx)
- [src/app/(tabs)/mensajes.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/(tabs)/mensajes.tsx)
- [src/app/(tabs)/perfil.tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/(tabs)/perfil.tsx)
- [src/app/objeto/[id].tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/objeto/%5Bid%5D.tsx)
- [src/app/mensajes/[id].tsx](C:/Users/jerry/Documents/GitHub/app-movil/mi-app-movil/src/app/mensajes/%5Bid%5D.tsx)

### Observación metodológica
Este reporte fue redactado a partir de la revisión del código y de la estructura funcional de la aplicación. Se priorizó la evidencia verificable del proyecto y se evitó incorporar elementos que no pudieran sustentarse en el código ni en la lógica de navegación, formularios y persistencia local. En consecuencia, la descripción del usuario, de la necesidad y del diseño se presenta como una reconstrucción académica del proyecto a partir de su implementación actual.

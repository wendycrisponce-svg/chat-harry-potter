# 📋 Tareas del Proyecto - Chat Harry Potter

## Bloque 1: Configuración Inicial y Login
- [ ] [Backend] 1.1 Inicializar servidor, dependencias y estructura MVC
- [ ] [Backend] 1.2 Configurar conexión a MongoDB y Modelos de Mongoose
- [ ] [Frontend] 1.3 Configurar URL base del API y Pantalla de Login

## Bloque 2: Semilla y Perfil
- [ ] [Backend] 2.1 Crear script seed.js con Usuario Único y 8+ personajes de Harry Potter
- [ ] [Backend] 2.2 Implementar ruta y controlador de Login (/api/auth/login)
- [ ] [Frontend] 2.3 Maquetar y conectar vista de Perfil Propio editable

## Bloque 3: Contactos y Listado
- [ ] [Backend] 3.1 Implementar endpoints GET y PUT de /api/perfil
- [ ] [Backend] 3.2 Implementar endpoint GET /api/contactos con último mensaje y no leídos
- [ ] [Frontend] 3.3 Maquetar y renderizar la lista dinámica de chats

## Bloque 4: Mensajería y Estados
- [ ] [Backend] 4.1 Implementar endpoint GET /api/mensajes/:contactoId
- [ ] [Backend] 4.2 Implementar endpoints PUT para marcar mensajes como leídos y cambiar estado
- [ ] [Frontend] 4.3 Implementar timestamps inteligentes y tildes/checks de estado

## Bloque 5: Bot Mágico y Respuestas Automáticas
- [ ] [Backend] 5.1 Crear función reutilizable de respuestas automáticas del bot por palabras clave
- [ ] [Backend] 5.2 Implementar POST /api/mensajes guardando usuario y disparando respuesta del bot
- [ ] [Frontend] 5.3 Implementar indicador "escribiendo..." y envío en vivo en la interfaz de chat

## Bloque 6: Extras y Auditoría Final
- [ ] [Backend] 6.1 Implementar endpoints para reacciones de emojis y Soft Delete (/api/mensajes/:id)
- [ ] [Frontend] 6.2 Maquetar selector de 5 emojis y menú para eliminar mensajes
- [ ] [General] 6.3 Auditoría final de criterios del TP, .env.example y redacción del README.md

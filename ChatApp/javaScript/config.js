// config.js

// ÚNICO lugar donde se define la URL del backend.
// Centraliza la configuración para que los demás archivos JavaScript
// puedan utilizar la misma dirección del servidor.

// Para apuntar a otro servidor solo se edita este archivo (ver README).
// Por ejemplo, si el backend cambia de puerto o se publica en otro servidor,
// alcanza con modificar API_URL.

// Si el propio Express sirve el frontend (mismo origen), puede quedar en "".
// Una cadena vacía indica que las solicitudes utilizarán el mismo origen
// desde el que se abrió la aplicación.
window.CHATAPP_CONFIG = {
    // Dirección base del backend.
    // Los demás archivos pueden acceder a este valor mediante:
    // window.CHATAPP_CONFIG.API_URL
    API_URL: "http://localhost:3000",
};

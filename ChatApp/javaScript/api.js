// api.js
// Conexión general con el backend (fetch + manejo de errores).
// Requiere que config.js se cargue ANTES que este archivo.

const CONFIG_APP = window.CHATAPP_CONFIG;

// Falla con un mensaje claro si falta config.js o API_URL
if (!CONFIG_APP || typeof CONFIG_APP.API_URL !== "string") {
    throw new Error(
        "Falta config.js: cargalo antes de api.js y definí CHATAPP_CONFIG.API_URL."
    );
}

// URL base del backend, sin barras finales ("http://localhost:3000/" -> "http://localhost:3000")
const API_URL = CONFIG_APP.API_URL.replace(/\/+$/, "");

// Solo se usa si el backend devuelve un token en el login (confirmar con Integrante 2)
const CLAVE_TOKEN = "chatapp_token";


// Crea un Error que además lleva el código HTTP (0 = sin conexión)
function crearError(mensaje, status) {

    const error = new Error(mensaje);

    error.status = status;

    return error;
}


// Mensaje por defecto según el código HTTP
function mensajePorDefecto(status) {

    switch (status) {
        case 400: return "La solicitud no es válida.";
        case 401: return "Credenciales o sesión inválidas.";
        case 404: return "No se encontró lo solicitado.";
        case 500: return "Error interno del servidor.";
        default: return "Ocurrió un error al realizar la solicitud.";
    }
}


// Lleva al login (la página puede estar en la raíz o dentro de /html/)
function irALogin() {

    const prefijo = window.location.pathname.includes("/html/") ? "" : "html/";

    window.location.href = `${prefijo}login.html`;
}


// Realiza solicitudes al backend
async function solicitarAPI(ruta, opciones = {}) {

    // Separa headers y body para poder combinarlos sin perder los valores por defecto
    const { headers: headersExtra, body, ...resto } = opciones;

    const configuracion = {
        method: "GET",
        ...resto,
        headers: {
            "Accept": "application/json",
            ...headersExtra
        }
    };

    // Adjunta el token si existe
    const token = localStorage.getItem(CLAVE_TOKEN);

    if (token) {
        configuracion.headers["Authorization"] = `Bearer ${token}`;
    }

    // Si se envía información, se prepara como JSON
    if (body !== undefined && body !== null) {
        configuracion.headers["Content-Type"] = "application/json";
        configuracion.body = JSON.stringify(body);
    }

    let respuesta;

    try {

        // Realiza la solicitud al backend
        respuesta = await fetch(`${API_URL}${ruta}`, configuracion);

    } catch (error) {

        // Backend apagado, URL incorrecta o CORS bloqueado
        throw crearError(
            "No se pudo conectar con el servidor. Verificá que el backend esté encendido y que la URL de config.js sea correcta.",
            0
        );
    }

    // Lee el cuerpo solo si es JSON (y sin romper si viene malformado)
    const tipoContenido = respuesta.headers.get("content-type") || "";

    let datos = null;

    if (tipoContenido.includes("application/json")) {

        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = null;
        }
    }

    // Comprueba si la solicitud fue exitosa
    if (!respuesta.ok) {

        // Sesión vencida o no autorizada (excepto en el propio login)
        if (respuesta.status === 401 && ruta !== "/api/auth/login") {
            localStorage.removeItem(CLAVE_TOKEN);
            irALogin();
        }

        const mensajeError =
            datos?.mensaje ||
            datos?.message ||
            (typeof datos?.error === "string" ? datos.error : null) ||
            mensajePorDefecto(respuesta.status);

        throw crearError(mensajeError, respuesta.status);
    }

    // Devuelve la información recibida (null si no había JSON)
    return datos;
}

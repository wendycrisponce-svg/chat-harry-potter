//api.js comentado

// =============================================
// CONEXIÓN GENERAL CON EL BACKEND
// =============================================
// Este archivo centraliza las solicitudes HTTP mediante fetch().
// También se encarga de preparar los datos, adjuntar el token
// de autenticación y manejar los errores.
//
// Requisito:
// config.js debe cargarse ANTES de api.js porque aquí
// se utiliza la configuración definida en ese archivo.
//
// Orden de carga:
// config.js -> api.js -> otros archivos JavaScript.

// =============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// =============================================

// Obtiene el objeto de configuración creado en config.js.
// CHATAPP_CONFIG contiene la dirección base del backend.
const CONFIG_APP = window.CHATAPP_CONFIG;

// Comprueba que exista la configuración y que API_URL
// sea una cadena de texto.
// Si falta, detiene la ejecución y muestra un error claro.
if (!CONFIG_APP || typeof CONFIG_APP.API_URL !== "string") {
    throw new Error(
        "Falta config.js: cargalo antes de api.js y definí CHATAPP_CONFIG.API_URL.",
    );
}

// =============================================
// URL BASE DEL BACKEND
// =============================================

// Guarda la dirección del servidor.
// replace(/\/+$/, "") elimina las barras finales.
//
// Ejemplo:
// "http://localhost:3000/" se convierte en
// "http://localhost:3000".
//
// Así evitamos construir rutas con barras duplicadas.
const API_URL = CONFIG_APP.API_URL.replace(/\/+$/, "");

// =============================================
// TOKEN DE AUTENTICACIÓN
// =============================================

// Nombre con el que se guarda el token en localStorage.
// Se utiliza si el backend devuelve un token al iniciar sesión.
//
// IMPORTANTE:
// Hay que confirmar con la persona que desarrolla el login
// si realmente se utilizará autenticación mediante token.
const CLAVE_TOKEN = "chatapp_token";

// =============================================
// CREAR ERRORES PERSONALIZADOS
// =============================================

// Crea un objeto Error y le agrega el código HTTP.
// Esto permite conocer tanto el mensaje como el estado
// de la respuesta del servidor.
//
// Ejemplo:
// error.message = "No se encontró lo solicitado."
// error.status = 404
//
// El código 0 se reserva para problemas de conexión.
function crearError(mensaje, status) {
    const error = new Error(mensaje);

    // Agrega el código de estado HTTP al error.
    error.status = status;

    return error;
}

// =============================================
// MENSAJES DE ERROR POR DEFECTO
// =============================================

// Devuelve un mensaje comprensible según el código HTTP.
// Se utiliza cuando el backend no proporciona
// un mensaje de error propio.
function mensajePorDefecto(status) {
    switch (status) {
        case 400:
            return "La solicitud no es válida.";
        case 401:
            return "Credenciales o sesión inválidas.";
        case 404:
            return "No se encontró lo solicitado.";
        case 500:
            return "Error interno del servidor.";
        default:
            return "Ocurrió un error al realizar la solicitud.";
    }
}

// =============================================
// REDIRIGIR AL LOGIN
// =============================================

// Envía al usuario a la página de inicio de sesión.
// Comprueba si la página actual está dentro de la carpeta html.
//
// Si está en /html/, utiliza "login.html".
// Si está en la raíz, utiliza "html/login.html".
//
// Esta función se utiliza cuando el servidor responde 401,
// es decir, cuando la sesión no está autorizada.
function irALogin() {
    const prefijo = window.location.pathname.includes("/html/") ? "" : "html/";

    window.location.href = `${prefijo}login.html`;
}

// =============================================
// FUNCIÓN GENERAL PARA SOLICITAR DATOS
// =============================================

// Esta es la función principal del archivo.
//
// Recibe:
// ruta: endpoint del backend que queremos consultar.
// opciones: configuración opcional de la solicitud.
//
// Ejemplos:
// solicitarAPI("/api/contactos")
// solicitarAPI("/api/mensajes", {
//     method: "POST",
//     body: { contacto: id, texto: "Hola" }
// })
//
// Al ser async, devuelve una promesa que puede utilizarse
// con await.
async function solicitarAPI(ruta, opciones = {}) {
    // =============================================
    // PREPARAR LA SOLICITUD
    // =============================================

    // Separa headers y body del resto de las opciones.
    // Esto permite tratar los encabezados y el cuerpo
    // de la solicitud de manera independiente.
    const { headers: headersExtra, body, ...resto } = opciones;

    // Configuración inicial de fetch().
    const configuracion = {
        // Si no se especifica otro método, utiliza GET.
        method: "GET",
        // Conserva otras opciones recibidas, por ejemplo:
        // credentials, signal o mode.
        ...resto,
        // Define los encabezados de la solicitud.
        headers: {
            Accept: "application/json",
            // Incorpora encabezados adicionales si fueron enviados.
            ...headersExtra,
        },
    };

    // =============================================
    // ADJUNTAR TOKEN DE AUTENTICACIÓN
    // =============================================

    // Busca el token guardado en el navegador.
    const token = localStorage.getItem(CLAVE_TOKEN);

    // Si existe un token, lo envía al backend.
    // El servidor puede utilizarlo para identificar
    // y autorizar al usuario.
    if (token) {
        configuracion.headers["Authorization"] = `Bearer ${token}`;
    }

    // =============================================
    // PREPARAR EL CUERPO DE LA SOLICITUD
    // =============================================

    // Si se enviaron datos, los convierte a JSON.
    // Por ejemplo, un objeto JavaScript se transforma
    // en una cadena JSON para enviarlo mediante fetch().
    if (body !== undefined && body !== null) {
        // Indica que el contenido enviado es JSON.
        configuracion.headers["Content-Type"] = "application/json";
        // Convierte el objeto a texto JSON.
        configuracion.body = JSON.stringify(body);
    }

    // =============================================
    // REALIZAR LA SOLICITUD
    // =============================================

    let respuesta;

    try {
        // fetch() realiza la petición al backend.
        // Combina la URL base con el endpoint solicitado.
        respuesta = await fetch(`${API_URL}${ruta}`, configuracion);
    } catch (error) {
        // Este bloque se ejecuta si no se puede obtener
        // una respuesta del servidor.
        //
        // Ejemplos:
        // - El backend está apagado.
        // - La dirección del servidor es incorrecta.
        // - El navegador bloquea la solicitud por CORS.
        //
        // status 0 indica que no hubo respuesta HTTP.
        throw crearError(
            "No se pudo conectar con el servidor. Verificá que el backend esté encendido y que la URL de config.js sea correcta.",
            0,
        );
    }

    // =============================================
    // LEER LA RESPUESTA DEL SERVIDOR
    // =============================================

    // Comprueba el tipo de contenido recibido.
    // Si el servidor devuelve JSON, se podrá interpretar.
    const tipoContenido = respuesta.headers.get("content-type") || "";

    // Inicializa los datos como null.
    // Si la respuesta no contiene JSON, seguirá siendo null.
    let datos = null;

    // Comprueba si el servidor indicó que envió JSON.
    if (tipoContenido.includes("application/json")) {
        try {
            // Convierte el JSON recibido en un objeto JavaScript.
            datos = await respuesta.json();
        } catch (error) {
            // Si el JSON está mal formado, evita que el programa
            // se interrumpa durante su lectura.
            datos = null;
        }
    }

    // =============================================
    // COMPROBAR SI HUBO UN ERROR HTTP
    // =============================================

    // respuesta.ok es true cuando el estado HTTP
    // está dentro del rango 200-299.
    if (!respuesta.ok) {
        // Si el servidor responde 401, puede significar
        // que el token venció o que la sesión no está autorizada.
        //
        // No redirige si el error ocurrió en el propio login,
        // porque el usuario todavía está intentando autenticarse.
        if (respuesta.status === 401 && ruta !== "/api/auth/login") {
            // Elimina el token inválido del navegador.
            localStorage.removeItem(CLAVE_TOKEN);
            // Redirige a la página de inicio de sesión.
            irALogin();
        }

        // Busca un mensaje de error enviado por el backend.
        // Acepta distintos nombres de propiedades:
        // mensaje, message o error.
        //
        // Si no encuentra ninguno, utiliza un mensaje por defecto.
        const mensajeError =
            datos?.mensaje ||
            datos?.message ||
            (typeof datos?.error === "string" ? datos.error : null) ||
            mensajePorDefecto(respuesta.status);

        // Lanza un error con el mensaje y el código HTTP.
        throw crearError(mensajeError, respuesta.status);
    }

    // =============================================
    // DEVOLVER LOS DATOS
    // =============================================

    // Si la solicitud fue exitosa, devuelve los datos
    // que respondió el backend.
    //
    // Los demás archivos pueden utilizar el resultado
    // mediante await solicitarAPI(...).
    //
    // Si la respuesta no contenía JSON, devuelve null.
    return datos;
}

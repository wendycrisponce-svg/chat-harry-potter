// utils.js
// Funciones compartidas por index.js y conversacion.js.
// Orden de carga en el HTML: config.js -> api.js -> utils.js -> (index.js | conversacion.js)

// Ruta de la foto por defecto (según si la página está en la raíz o en /html/)
function rutaImagenPorDefecto() {
    // Comprueba desde qué ubicación se está ejecutando la página.
    // Si está dentro de /html/, necesita subir un nivel para llegar a images/.
    // Si está en la raíz, utiliza directamente la carpeta images/.
    return window.location.pathname.includes("/html/")
        ? "../images/default.png"
        : "images/default.png";
}

// Devuelve una URL de imagen utilizable
// - Sin foto            -> imagen por defecto
// - URL absoluta (http) -> se usa tal cual
// - Ruta del backend    -> se antepone API_URL (ej: "/images/harry.png")
function resolverFoto(fotoUrl) {
    // Si el contacto no tiene una foto asignada, utiliza la imagen por defecto.
    if (!fotoUrl) {
        return rutaImagenPorDefecto();
    }
    // Comprueba si la dirección ya es una URL externa o una imagen codificada.
    // En esos casos no necesita agregar la dirección del backend.
    if (/^(https?:)?\/\//i.test(fotoUrl) || fotoUrl.startsWith("data:")) {
        return fotoUrl;
    }
    // Si es una ruta local del backend, agrega API_URL al comienzo.
    // También comprueba si la ruta ya comienza con "/" para evitar duplicarlo.
    return `${API_URL}${fotoUrl.startsWith("/") ? "" : "/"}${fotoUrl}`;
}

// Texto legible del estado de un contacto
function obtenerTextoEstado(estado) {
    // Relaciona los valores internos del estado con los textos que verá el usuario.
    const estados = {
        disponible: "Disponible",
        ocupado: "Ocupado",
        "no molestar": "No molestar",
    };
    // Devuelve el texto correspondiente.
    // Si el estado recibido no está definido, muestra un texto alternativo.
    return estados[estado] || "Estado desconocido";
}

// Claves de los temas de color que existen en el CSS ([data-tema="..."]).
// Si el CSS agrega un personaje nuevo, hay que sumar su clave acá.
const TEMAS_PERSONAJE = [
    "harry",
    "hermione",
    "hagrid",
    "draco",
    "snape",
    "voldemort",
    "luna",
    "tonks",
];

// Devuelve la clave del tema de color de un contacto (por ejemplo "snape").
// 1) Si el backend envía contacto.tema y es una clave válida, la usa.
// 2) Si no, la deduce del nombre: "Severus Snape" contiene "snape".
// 3) Si no encuentra coincidencia devuelve "" y el CSS usa sus colores por defecto.
function obtenerTema(contacto) {
    // Pasa a minúsculas y quita tildes para comparar sin diferencias.
    // normalize("NFD") separa las letras de sus tildes y replace elimina las tildes.
    const normalizar = (texto) =>
        String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    // Intenta usar el campo tema que podría enviar el backend.
    // El operador ?. evita un error si contacto no existe.
    const tema = normalizar(contacto?.tema);

    if (TEMAS_PERSONAJE.includes(tema)) {
        return tema;
    }

    // Si no hay tema válido, busca alguna clave dentro del nombre del contacto.
    // find devuelve la primera clave que está contenida en el nombre.
    const nombre = normalizar(contacto?.nombre);

    return TEMAS_PERSONAJE.find((clave) => nombre.includes(clave)) || "";
}

// Formatea la fecha de un mensaje.
// TODO (Integrante 6): reemplazar el cuerpo por el timestamp inteligente
// (hora / "Ayer HH:MM" / fecha completa). Ambas vistas ya usan esta función.
function formatearFecha(fecha) {
    // Si no se recibió una fecha, devuelve una cadena vacía.
    if (!fecha) {
        return "";
    }

    // Convierte el valor recibido en un objeto Date.
    const fechaMensaje = new Date(fecha);

    // Comprueba si la fecha es válida.
    // getTime() devuelve NaN cuando la fecha no puede interpretarse.
    if (Number.isNaN(fechaMensaje.getTime())) {
        return "";
    }

    // Devuelve la hora con formato de dos dígitos para horas y minutos.
    // es-AR aplica el formato regional de Argentina.
    return fechaMensaje.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}
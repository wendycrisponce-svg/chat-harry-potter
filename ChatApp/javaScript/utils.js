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

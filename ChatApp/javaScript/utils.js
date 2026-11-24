// utils.js
// Funciones compartidas por index.js y conversacion.js.
// Orden de carga en el HTML: config.js -> api.js -> utils.js -> (index.js | conversacion.js)


// Ruta de la foto por defecto (según si la página está en la raíz o en /html/)
function rutaImagenPorDefecto() {

    return window.location.pathname.includes("/html/")
        ? "../images/default.png"
        : "images/default.png";
}


// Devuelve una URL de imagen utilizable
// - Sin foto            -> imagen por defecto
// - URL absoluta (http) -> se usa tal cual
// - Ruta del backend    -> se antepone API_URL (ej: "/images/harry.png")
function resolverFoto(fotoUrl) {

    if (!fotoUrl) {
        return rutaImagenPorDefecto();
    }

    if (/^(https?:)?\/\//i.test(fotoUrl) || fotoUrl.startsWith("data:")) {
        return fotoUrl;
    }

    return `${API_URL}${fotoUrl.startsWith("/") ? "" : "/"}${fotoUrl}`;
}


// Texto legible del estado de un contacto
function obtenerTextoEstado(estado) {

    const estados = {
        disponible: "Disponible",
        ocupado: "Ocupado",
        "no molestar": "No molestar"
    };

    return estados[estado] || "Estado desconocido";
}


// Formatea la fecha de un mensaje.
// TODO (Integrante 6): reemplazar el cuerpo por el timestamp inteligente
// (hora / "Ayer HH:MM" / fecha completa). Ambas vistas ya usan esta función.
function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    const fechaMensaje = new Date(fecha);

    if (Number.isNaN(fechaMensaje.getTime())) {
        return "";
    }

    return fechaMensaje.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

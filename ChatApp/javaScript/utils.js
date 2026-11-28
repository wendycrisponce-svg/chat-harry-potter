// utils.js
// Funciones compartidas por index.js y conversacion.js.
// Orden de carga en el HTML: config.js -> api.js -> utils.js -> (index.js | conversacion.js)

function rutaImagenPorDefecto() {
    const prefijo = window.location.pathname.includes("/html/") ? "../" : "";
    return `${prefijo}img/harry.jpg`;
}

function resolverFoto(fotoUrl) {
    if (!fotoUrl) {
        return rutaImagenPorDefecto();
    }

    if (/^(https?:)?\/\//i.test(fotoUrl) || fotoUrl.startsWith("data:")) {
        return fotoUrl;
    }

    if (fotoUrl.startsWith("img/") || fotoUrl.startsWith("./img/") || fotoUrl.startsWith("../img/")) {
        return fotoUrl;
    }

    if (typeof API_URL === "string" && API_URL.trim() !== "") {
        return `${API_URL.replace(/\/+$/, "")}/${fotoUrl.replace(/^\/+/, "")}`;
    }

    return `img/${fotoUrl.replace(/^\/+/, "")}`;
}

function obtenerTextoEstado(estado) {
    const estados = {
        disponible: "Disponible",
        ocupado: "Ocupado",
        "no-molestar": "No molestar",
        "no molestar": "No molestar",
    };
    return estados[estado] || "Estado desconocido";
}

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

function obtenerTema(contacto) {
    const normalizar = (texto) =>
        String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    const tema = normalizar(contacto?.tema);

    if (TEMAS_PERSONAJE.includes(tema)) {
        return tema;
    }

    const nombre = normalizar(contacto?.nombre);

    return TEMAS_PERSONAJE.find((clave) => nombre.includes(clave)) || "";
}

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
        minute: "2-digit",
    });
}
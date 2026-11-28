//index.js
/*
 * Solicita los contactos al backend y construye la lista de chats.
 * Cada tarjeta muestra la información del contacto, su último mensaje,
 * la hora y la cantidad de mensajes no leídos.
 */

const listaContactos = document.getElementById("lista-contactos");
const buscador = document.getElementById("buscador");
const sinResultados = document.getElementById("sin-resultados");

let contactosCargados = [];

// Carga los contactos desde el backend
async function cargarContactos() {
    if (listaContactos.children.length === 0) {
        mostrarMensajeLista("Cargando contactos...", "text-body-secondary");
    }

    try {
        const contactos = await solicitarAPI("/api/contactos");

        if (!Array.isArray(contactos)) {
            throw new Error("La respuesta del servidor no es válida.");
        }

        contactosCargados = ordenarContactosPorFecha(contactos);
        renderizarContactos(contactosCargados);
    } catch (error) {
        mostrarErrorContactos(error.message);
    }
}

// Ordena los contactos por fecha del último mensaje (más reciente primero)
function ordenarContactosPorFecha(contactos) {
    return [...contactos].sort((contactoA, contactoB) => {
        const fechaA = contactoA.ultimoMensaje?.fecha;
        const fechaB = contactoB.ultimoMensaje?.fecha;
        const tiempoA = fechaA ? new Date(fechaA).getTime() : 0;
        const tiempoB = fechaB ? new Date(fechaB).getTime() : 0;
        return tiempoB - tiempoA;
    });
}

// Crea y muestra las tarjetas de contactos
function renderizarContactos(contactos) {
    if (contactos.length === 0) {
        mostrarMensajeLista("No hay contactos disponibles.", "text-body-secondary");
        if (sinResultados) sinResultados.classList.add("d-none");
        return;
    }

    if (sinResultados) sinResultados.classList.add("d-none");

    listaContactos.replaceChildren(
        ...contactos.map(crearTarjetaContacto),
    );
}

// Crea la tarjeta de un contacto
function crearTarjetaContacto(contacto) {
    const tarjeta = document.createElement("a");
    tarjeta.classList.add(
        "list-group-item",
        "list-group-item-action",
        "contacto",
        "d-flex",
        "align-items-center",
        "gap-3",
        "p-3",
    );
    tarjeta.dataset.casa = contacto.casa || "";
    tarjeta.dataset.estado = contacto.estado || "";
    if (contacto.tema || contacto.slug || contacto.id) {
        tarjeta.dataset.tema = contacto.tema || contacto.slug || contacto.id;
    }
    tarjeta.href = `conversacion.html?id=${encodeURIComponent(contacto._id)}`;

    // Avatar + punto de estado
    const avatarWrap = document.createElement("div");
    avatarWrap.classList.add("avatar-wrap", "position-relative", "flex-shrink-0");

    const imagen = document.createElement("img");
    imagen.alt = `Foto de ${contacto.nombre}`;
    imagen.classList.add("avatar", "avatar-lista", "rounded-circle", "object-fit-cover");
    imagen.width = 52;
    imagen.height = 52;

    imagen.addEventListener(
        "error",
        () => {
            imagen.src = rutaImagenPorDefecto();
        },
        { once: true },
    );
    imagen.src = resolverFoto(contacto.fotoUrl);

    const puntoEstado = document.createElement("span");
    puntoEstado.classList.add(
        "estado-punto",
        "position-absolute",
        "bottom-0",
        "end-0",
        "rounded-circle",
        "border",
        "border-2",
    );
    puntoEstado.dataset.estado = contacto.estado || "";
    puntoEstado.title = obtenerTextoEstado(contacto.estado);

    avatarWrap.append(imagen, puntoEstado);

    // Información textual: nombre, hora, último mensaje y badge de no leídos
    const informacion = document.createElement("div");
    informacion.classList.add("flex-grow-1", "overflow-hidden");

    const filaSuperior = document.createElement("div");
    filaSuperior.classList.add("d-flex", "justify-content-between", "align-items-baseline", "gap-2");

    const nombre = document.createElement("span");
    nombre.classList.add("contacto-nombre", "fs-5", "lh-sm", "text-truncate");
    nombre.textContent = contacto.nombre;

    const hora = document.createElement("time");
    hora.classList.add("contacto-hora", "small", "text-body-secondary", "flex-shrink-0");
    hora.textContent = formatearFecha(contacto.ultimoMensaje?.fecha);

    filaSuperior.append(nombre, hora);

    const filaInferior = document.createElement("div");
    filaInferior.classList.add("d-flex", "justify-content-between", "align-items-center", "gap-2");

    const ultimoMensaje = document.createElement("p");
    ultimoMensaje.classList.add("contacto-ultimo", "text-body-secondary", "text-truncate", "small", "mb-0");
    ultimoMensaje.textContent = obtenerTextoUltimoMensaje(contacto);

    const badge = crearBadgeNoLeidos(contacto.mensajesNoLeidos);

    filaInferior.append(ultimoMensaje, badge);
    informacion.append(filaSuperior, filaInferior);

    tarjeta.append(avatarWrap, informacion);
    return tarjeta;
}

// Obtiene el texto que se mostrará como último mensaje
function obtenerTextoUltimoMensaje(contacto) {
    const mensaje = contacto.ultimoMensaje;

    if (!mensaje) {
        return "Todavía no hay mensajes.";
    }

    if (mensaje.eliminado) {
        return "Mensaje eliminado";
    }

    if (mensaje.autor === "usuario") {
        return `Vos: ${mensaje.texto}`;
    }

    return mensaje.texto || "";
}

// Crea el indicador de mensajes no leídos
function crearBadgeNoLeidos(cantidad) {
    const badge = document.createElement("span");
    badge.classList.add("badge-no-leidos", "badge", "rounded-pill", "flex-shrink-0");

    const total = Number(cantidad);
    if (!Number.isFinite(total) || total <= 0) {
        badge.classList.add("d-none");
        return badge;
    }

    badge.textContent = total;
    return badge;
}

// Muestra un texto simple dentro de la lista (cargando, vacío)
function mostrarMensajeLista(texto, clase) {
    const aviso = document.createElement("p");
    aviso.classList.add("text-center", "p-4", "mb-0", clase);
    aviso.textContent = texto;
    listaContactos.replaceChildren(aviso);
}

// Muestra un mensaje de error con botón para reintentar
function mostrarErrorContactos(mensaje) {
    const aviso = document.createElement("p");
    aviso.classList.add("text-danger", "text-center", "pt-4", "px-3", "mb-2");
    aviso.textContent = `Error al cargar los contactos: ${mensaje}`;

    const reintentar = document.createElement("button");
    reintentar.type = "button";
    reintentar.classList.add("btn", "btn-outline-secondary", "btn-sm", "d-block", "mx-auto");
    reintentar.textContent = "Reintentar";

    reintentar.addEventListener("click", cargarContactos);
    listaContactos.replaceChildren(aviso, reintentar);
}

// Filtra los contactos cargados según el texto del buscador
if (buscador) {
    buscador.addEventListener("input", (evento) => {
        const termino = evento.target.value.trim().toLowerCase();
        const filtrados = contactosCargados.filter((contacto) =>
            (contacto.nombre || "").toLowerCase().includes(termino),
        );

        renderizarContactos(filtrados);

        if (sinResultados) {
            sinResultados.classList.toggle("d-none", filtrados.length > 0);
        }
    });
}

// Al volver con el botón "atrás" recarga para actualizar orden y no leídos
window.addEventListener("pageshow", (evento) => {
    if (evento.persisted) {
        cargarContactos();
    }
});

cargarContactos();
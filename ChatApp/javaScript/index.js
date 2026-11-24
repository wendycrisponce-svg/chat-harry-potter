//index.js
/*
 * Solicita los contactos al backend y construye la lista de chats.
 * Cada tarjeta muestra la información del contacto, su último mensaje,
 * la hora y la cantidad de mensajes no leídos.
 */


// Obtiene el contenedor donde se mostrarán los contactos
const listaContactos = document.getElementById("lista-contactos");


// Carga los contactos desde el backend
async function cargarContactos() {

    // Muestra "Cargando..." solo la primera vez (evita parpadeos al refrescar)
    if (listaContactos.children.length === 0) {
        mostrarMensajeLista("Cargando contactos...", "text-muted");
    }

    try {

        // Solicita la lista de contactos
        const contactos = await solicitarAPI("/api/contactos");

        // Comprueba que la respuesta sea un array
        if (!Array.isArray(contactos)) {
            throw new Error("La respuesta del servidor no es válida.");
        }

        // Muestra los contactos recibidos
        renderizarContactos(contactos);

    } catch (error) {

        // Muestra un mensaje si ocurre un error
        mostrarErrorContactos(error.message);
    }
}


// Crea y muestra las tarjetas de contactos
function renderizarContactos(contactos) {

    // Comprueba si existen contactos
    if (contactos.length === 0) {
        mostrarMensajeLista("No hay contactos disponibles.", "text-muted");
        return;
    }

    // Crea una copia ordenada: primero el contacto con el mensaje más reciente
    const contactosOrdenados = [...contactos].sort((contactoA, contactoB) => {

        const fechaA = contactoA.ultimoMensaje?.fecha;
        const fechaB = contactoB.ultimoMensaje?.fecha;

        const tiempoA = fechaA ? new Date(fechaA).getTime() : 0;
        const tiempoB = fechaB ? new Date(fechaB).getTime() : 0;

        return tiempoB - tiempoA;
    });

    // Reemplaza el contenido anterior por las tarjetas nuevas
    listaContactos.replaceChildren(
        ...contactosOrdenados.map(crearTarjetaContacto)
    );
}


// Crea la tarjeta de un contacto
function crearTarjetaContacto(contacto) {

    // Contenedor principal de la tarjeta
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("card", "mb-2");

    // Cuerpo de la tarjeta
    const cuerpo = document.createElement("div");
    cuerpo.classList.add("card-body", "d-flex", "align-items-center", "gap-3");

    // Imagen del contacto
    const imagen = document.createElement("img");

    imagen.alt = `Foto de ${contacto.nombre}`;
    imagen.classList.add("rounded-circle");
    imagen.width = 60;
    imagen.height = 60;

    // Si la foto falla, usa la imagen por defecto (una sola vez, sin bucles)
    imagen.addEventListener("error", () => {
        imagen.src = rutaImagenPorDefecto();
    }, { once: true });

    imagen.src = resolverFoto(contacto.fotoUrl);

    // Contenedor de la información
    const informacion = document.createElement("div");
    informacion.classList.add("flex-grow-1");

    // Nombre del contacto
    const nombre = document.createElement("h5");
    nombre.classList.add("card-title", "mb-1");
    nombre.textContent = contacto.nombre;

    // Estado del contacto
    const estado = document.createElement("small");
    estado.classList.add("text-muted");
    estado.textContent = `Estado: ${obtenerTextoEstado(contacto.estado)}`;

    // Último mensaje
    const ultimoMensaje = document.createElement("p");
    ultimoMensaje.classList.add("card-text", "text-muted", "mb-1");
    ultimoMensaje.textContent = obtenerTextoUltimoMensaje(contacto);

    // Hora del último mensaje
    const hora = document.createElement("small");
    hora.classList.add("text-muted");
    hora.textContent = formatearFecha(contacto.ultimoMensaje?.fecha);

    // Badge de mensajes no leídos
    const badge = crearBadgeNoLeidos(contacto.mensajesNoLeidos);

    // Enlace para abrir la conversación
    const enlace = document.createElement("a");
    enlace.classList.add("btn", "btn-primary");
    enlace.textContent = "Abrir chat";
    enlace.href = `html/conversacion.html?id=${encodeURIComponent(contacto._id)}`;

    // Arma la tarjeta
    informacion.append(nombre, estado, ultimoMensaje, hora);
    cuerpo.append(imagen, informacion, badge, enlace);
    tarjeta.appendChild(cuerpo);

    return tarjeta;
}


// Obtiene el texto que se mostrará como último mensaje
function obtenerTextoUltimoMensaje(contacto) {

    const mensaje = contacto.ultimoMensaje;

    // Comprueba si existe un mensaje
    if (!mensaje) {
        return "Todavía no hay mensajes.";
    }

    // Comprueba si el mensaje fue eliminado
    if (mensaje.eliminado) {
        return "Mensaje eliminado";
    }

    // Identifica si el mensaje fue enviado por el usuario
    if (mensaje.autor === "usuario") {
        return `Vos: ${mensaje.texto}`;
    }

    return mensaje.texto || "";
}


// Crea el indicador de mensajes no leídos
function crearBadgeNoLeidos(cantidad) {

    const badge = document.createElement("span");

    badge.classList.add("badge", "rounded-pill", "bg-success");

    // Acepta número o texto numérico ("3")
    const total = Number(cantidad);

    if (!Number.isFinite(total) || total <= 0) {

        // Oculta el indicador si no hay mensajes pendientes
        badge.classList.add("d-none");

        return badge;
    }

    badge.textContent = total;

    return badge;
}


// Muestra un texto simple dentro de la lista (cargando, vacío)
function mostrarMensajeLista(texto, clase) {

    const aviso = document.createElement("p");

    aviso.classList.add(clase);
    aviso.textContent = texto;

    listaContactos.replaceChildren(aviso);
}


// Muestra un mensaje de error con botón para reintentar
function mostrarErrorContactos(mensaje) {

    const aviso = document.createElement("p");

    aviso.classList.add("text-danger");
    aviso.textContent = `Error al cargar los contactos: ${mensaje}`;

    const reintentar = document.createElement("button");

    reintentar.type = "button";
    reintentar.classList.add("btn", "btn-outline-secondary", "btn-sm");
    reintentar.textContent = "Reintentar";
    reintentar.addEventListener("click", cargarContactos);

    listaContactos.replaceChildren(aviso, reintentar);
}


// Al volver con el botón "atrás" el navegador puede mostrar la página guardada
// sin ejecutar el script: se vuelve a cargar para actualizar orden y no leídos
window.addEventListener("pageshow", evento => {

    if (evento.persisted) {
        cargarContactos();
    }
});


// Ejecuta la carga inicial de contactos
cargarContactos();

//conversacion.js


// 🎨 HTML/CSS: esta clase la estiliza Integrante 1. Si necesita otra, pedirla acá.
// ⚙️ HTML: necesita un elemento con id="lista-contactos".


/* =========================================
   ELEMENTOS DEL DOM
========================================= */

// Datos del contacto
const nombreContacto = document.getElementById("nombre-contacto");
const fotoContacto = document.getElementById("foto-contacto");
const estadoContacto = document.getElementById("estado-contacto");

// Mensajes
const listaMensajes = document.getElementById("lista-mensajes");
const indicadorEscribiendo = document.getElementById("indicador-escribiendo");

// Formulario
const formularioMensaje = document.getElementById("formulario-mensaje");
const inputMensaje = document.getElementById("input-mensaje");
const botonEnviar = document.getElementById("btn-enviar");

// 🎨 CSS: tema del chat según la casa del personaje
document.body.dataset.casa = contacto.casa || "";


/* =========================================
   IDENTIFICAR CONTACTO Y ESTADO LOCAL
========================================= */

// Recupera el ID del contacto desde la URL
const parametrosURL = new URLSearchParams(window.location.search);
const contactoId = parametrosURL.get("id");

// Últimos mensajes recibidos del backend
let mensajesActuales = [];

// Cuánto se espera la respuesta automática (10 intentos x 1 s)
const INTENTOS_RESPUESTA = 10;
const PAUSA_RESPUESTA_MS = 1000;


/* =========================================
   CARGAR CONVERSACIÓN
========================================= */

async function cargarConversacion() {

    // Verifica que haya un ID
    if (!contactoId) {
        mostrarError("No se identificó el contacto.");
        return;
    }

    try {

        // Carga los datos del encabezado
        await cargarDatosContacto();

        // Marca los mensajes pendientes como leídos (no bloquea si falla)
        await marcarMensajesLeidos();

        // Obtiene el historial actualizado
        await cargarMensajes("auto");

    } catch (error) {

        mostrarError(error.message);

    }

}


/* =========================================
   CARGAR DATOS DEL CONTACTO
========================================= */

async function cargarDatosContacto() {

    // Obtiene los contactos
    const contactos = await solicitarAPI("/api/contactos");

    // Comprueba que la respuesta sea válida
    if (!Array.isArray(contactos)) {
        throw new Error("La respuesta del servidor no es válida.");
    }

    // Busca el contacto seleccionado
    const contacto = contactos.find(
        contacto => contacto._id === contactoId
    );

    // Comprueba que exista
    if (!contacto) {
        throw new Error("No se encontró el contacto.");
    }

    // Nombre y estado
    nombreContacto.textContent = contacto.nombre;
    estadoContacto.textContent = obtenerTextoEstado(contacto.estado);
    document.title = contacto.nombre;

    // Foto: primero el manejador de error, después el src
    fotoContacto.alt = `Foto de ${contacto.nombre}`;

    fotoContacto.addEventListener("error", () => {
        fotoContacto.src = rutaImagenPorDefecto();
    }, { once: true });

    fotoContacto.src = resolverFoto(contacto.fotoUrl);

}


/* =========================================
   MARCAR MENSAJES COMO LEÍDOS
========================================= */

async function marcarMensajesLeidos() {

    // Si falla, la conversación igual se muestra
    try {

        await solicitarAPI(
            `/api/mensajes/leer/${encodeURIComponent(contactoId)}`,
            { method: "PUT" }
        );

    } catch (error) {

        console.warn("No se pudieron marcar los mensajes como leídos:", error.message);

    }

}


/* =========================================
   OBTENER Y MOSTRAR HISTORIAL
========================================= */

// Pide el historial y lo devuelve ordenado de más antiguo a más nuevo
async function obtenerMensajes() {

    const respuesta = await solicitarAPI(
        `/api/mensajes/${encodeURIComponent(contactoId)}`
    );

    // Acepta array directo o propiedad mensajes (respuesta?. evita error si es null)
    const mensajes = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.mensajes;

    // Verifica los datos
    if (!Array.isArray(mensajes)) {
        throw new Error("No se pudieron interpretar los mensajes.");
    }

    return [...mensajes].sort(
        (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

}


// Dibuja la lista completa de mensajes
function renderizarMensajes(mensajes, comportamiento = "auto") {

    mensajesActuales = mensajes;

    // Limpia el contenedor
    listaMensajes.replaceChildren();

    // Conversación vacía
    if (mensajes.length === 0) {

        const mensajeVacio = document.createElement("p");

        mensajeVacio.textContent = "Todavía no hay mensajes.";
        mensajeVacio.classList.add("text-center", "text-muted", "mensaje-vacio");

        listaMensajes.append(mensajeVacio);

        return;
    }

    // Crea los mensajes
    mensajes.forEach(mensaje => {
        listaMensajes.append(crearMensaje(mensaje));
    });

    irAlFinal(comportamiento);

}


// Pide el historial y lo dibuja
async function cargarMensajes(comportamiento = "smooth") {

    renderizarMensajes(await obtenerMensajes(), comportamiento);

}


// Lleva la vista al último mensaje
function irAlFinal(comportamiento = "smooth") {

    listaMensajes.lastElementChild?.scrollIntoView({
        behavior: comportamiento,
        block: "end"
    });

}


/* =========================================
   CREAR MENSAJE
========================================= */

function crearMensaje(mensaje) {

    contenedor.classList.add(mensaje.autor === "usuario" ? "mensaje--usuario" : "mensaje--contacto");
    // Contenedor
    const contenedor = document.createElement("div");

    contenedor.classList.add(
        "mensaje",
        "p-3",
        "rounded",
        "border"
    );

    // Punto de enganche para reacciones / eliminar (Integrante 6)
    if (mensaje._id) {
        contenedor.dataset.id = mensaje._id;
    }

    // Diferencia mensajes propios y del contacto
    if (mensaje.autor === "usuario") {

        contenedor.classList.add("align-self-end");

    } else {

        contenedor.classList.add("align-self-start");

    }

    // Texto
    const texto = document.createElement("p");

    texto.classList.add("mb-1");

    if (mensaje.eliminado) {

        texto.textContent = "Mensaje eliminado";

        texto.classList.add("text-muted", "fst-italic");

    } else {

        texto.textContent = mensaje.texto || "";

    }

    contenedor.append(texto);

    // Hora
    const hora = document.createElement("small");

    hora.classList.add("text-muted");

    hora.textContent = formatearFecha(mensaje.fecha);

    contenedor.append(hora);

    // Estado de mensajes enviados por el usuario (leído = azul)
    if (mensaje.autor === "usuario") {

        const estado = document.createElement("small");

        estado.classList.add(
            "ms-2",
            mensaje.estado === "leido" ? "text-primary" : "text-muted"
        );

        estado.textContent = obtenerEstadoMensaje(mensaje.estado);

        contenedor.append(estado);

    }

    // Reacción
    if (mensaje.reaccion && !mensaje.eliminado) {

        const reaccion = document.createElement("span");

        reaccion.classList.add("ms-2");

        reaccion.textContent = mensaje.reaccion;

        contenedor.append(reaccion);

    }

    // Botones de reaccionar y eliminar (solo mensajes ya guardados en el backend)
    if (mensaje._id && !mensaje.eliminado) {

        agregarAccionesMensaje(contenedor, mensaje);

    }

    return contenedor;

}


/* =========================================
   ESTADOS DEL MENSAJE
========================================= */

function obtenerEstadoMensaje(estado) {

    const estados = {
        pendiente: "🕓",   // solo en pantalla, mientras el backend confirma
        enviado: "✓",
        entregado: "✓✓",
        leido: "✓✓"        // se diferencia por el color (text-primary)
    };

    return estados[estado] || "";

}


/* =========================================
   ENVIAR MENSAJE
========================================= */

async function enviarMensaje(evento) {

    // Evita que el formulario recargue la página
    evento.preventDefault();

    // Obtiene el texto sin espacios sobrantes
    const texto = inputMensaje.value.trim();

    // Evita enviar mensajes vacíos
    if (!texto) {
        return;
    }

    // Bloquea el formulario mientras se procesa
    bloquearFormulario(true);

    // Guarda cuántos mensajes había para detectar la respuesta nueva
    const cantidadAntes = mensajesActuales.length;

    // Muestra el mensaje enseguida, sin esperar al servidor
    mostrarMensajeProvisional(texto);
    inputMensaje.value = "";

    // Muestra "escribiendo..." mientras se genera la respuesta
    indicadorEscribiendo.hidden = false;

    let guardado = false;

    try {

        // Envía el mensaje al backend (dispara la respuesta automática)
        await solicitarAPI("/api/mensajes", {
            method: "POST",
            body: {
                contacto: contactoId,
                texto: texto
            }
        });

        guardado = true;

        // Espera la respuesta automática y actualiza la conversación
        await esperarRespuesta(cantidadAntes);

    } catch (error) {

        if (!guardado) {

            // No se envió: vuelve al estado anterior y devuelve el texto al input
            renderizarMensajes(mensajesActuales);
            inputMensaje.value = texto;

            alert(`No se pudo enviar el mensaje: ${error.message}`);

        } else {

            // Se envió, pero falló la actualización posterior
            alert(`El mensaje se envió, pero no se pudo actualizar la conversación: ${error.message}`);

        }

    } finally {

        // Oculta el indicador
        indicadorEscribiendo.hidden = true;

        // Habilita nuevamente el formulario
        bloquearFormulario(false);

        // Devuelve el foco al input
        inputMensaje.focus();

    }

}


// Dibuja el mensaje del usuario antes de que el servidor confirme
function mostrarMensajeProvisional(texto) {

    // Quita el cartel de "Todavía no hay mensajes"
    listaMensajes.querySelector(".mensaje-vacio")?.remove();

    const provisional = crearMensaje({
        autor: "usuario",
        texto: texto,
        estado: "pendiente",
        fecha: new Date().toISOString()
    });

    provisional.classList.add("opacity-75");

    listaMensajes.append(provisional);

    irAlFinal();

}


// Consulta el historial hasta que aparezca la respuesta del contacto.
// Funciona tanto si el backend responde al final (ya está lista)
// como si la genera con retraso (se la espera unos segundos).
async function esperarRespuesta(cantidadAntes) {

    for (let intento = 0; intento < INTENTOS_RESPUESTA; intento++) {

        const mensajes = await obtenerMensajes();
        const ultimo = mensajes[mensajes.length - 1];

        const llegoRespuesta =
            mensajes.length > cantidadAntes + 1 &&
            ultimo?.autor === "contacto";

        // Muestra el mensaje ya confirmado (y la respuesta si llegó)
        renderizarMensajes(mensajes, "smooth");

        if (llegoRespuesta) {
            return true;
        }

        await pausar(PAUSA_RESPUESTA_MS);

    }

    // Terminó el tiempo: el contacto puede no haber respondido
    return false;

}


// Espera una cantidad de milisegundos
function pausar(milisegundos) {

    return new Promise(resolver => setTimeout(resolver, milisegundos));

}


// Activa o desactiva el formulario
function bloquearFormulario(bloqueado) {

    inputMensaje.disabled = bloqueado;
    botonEnviar.disabled = bloqueado;

}


/* =========================================
   MOSTRAR ERROR
========================================= */

function mostrarError(mensaje) {

    const error = document.createElement("p");

    error.classList.add("text-danger", "text-center");

    error.textContent = mensaje;

    listaMensajes.replaceChildren(error);

}


/* =========================================
   EVENTOS
========================================= */

// Enviar mediante el formulario
formularioMensaje.addEventListener(
    "submit",
    enviarMensaje
);


/* =========================================
   INICIALIZACIÓN
========================================= */

// Carga la conversación al abrir la página
cargarConversacion();
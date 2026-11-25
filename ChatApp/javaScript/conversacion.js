// conversacion.js
// Administra la pantalla de conversación entre el usuario y un contacto.
// Se encarga de cargar los datos, mostrar el historial, enviar mensajes
// y actualizar visualmente la conversación.

// 🎨 HTML/CSS: esta clase la estiliza Integrante 1. Si necesita otra, pedirla acá.
// ⚙️ HTML: necesita un elemento con id="lista-contactos".

/* =========================================
   ELEMENTOS DEL DOM
========================================= */

// Datos del contacto
// Obtiene los elementos HTML donde se mostrarán los datos del contacto.
const nombreContacto = document.getElementById("nombre-contacto");
const fotoContacto = document.getElementById("foto-contacto");
const estadoContacto = document.getElementById("estado-contacto");

// Mensajes
// Contenedor donde se agregarán todos los mensajes de la conversación.
const listaMensajes = document.getElementById("lista-mensajes");
// Elemento que indica visualmente que el contacto está escribiendo.
const indicadorEscribiendo = document.getElementById("indicador-escribiendo");

// Formulario
// Obtiene el formulario, el campo donde se escribe y el botón para enviar.
const formularioMensaje = document.getElementById("formulario-mensaje");
const inputMensaje = document.getElementById("input-mensaje");
const botonEnviar = document.getElementById("btn-enviar");

// 🎨 CSS: tema del chat según la casa del personaje.
// dataset permite establecer atributos personalizados data-* en el HTML.
// Se utiliza para que CSS pueda aplicar estilos según la casa del personaje.
document.body.dataset.casa = contacto.casa || "";

/* =========================================
   IDENTIFICAR CONTACTO Y ESTADO LOCAL
========================================= */

// Recupera el ID del contacto desde la URL.
// URLSearchParams permite leer los parámetros de la dirección.
// Ejemplo: conversacion.html?id=123
const parametrosURL = new URLSearchParams(window.location.search);
const contactoId = parametrosURL.get("id");

// Últimos mensajes recibidos del backend.
// Este array conserva los mensajes que se cargaron en la conversación.
let mensajesActuales = [];

// Cuánto se espera la respuesta automática (10 intentos x 1 s).
// Establece la cantidad de consultas y el tiempo entre cada una.
const INTENTOS_RESPUESTA = 10;
const PAUSA_RESPUESTA_MS = 1000;

/* =========================================
   CARGAR CONVERSACIÓN
========================================= */

// Función principal que inicia la carga de la conversación.
// async permite utilizar await para esperar las solicitudes al backend.
async function cargarConversacion() {
    // Verifica que haya un ID.
    // Si no existe, no se puede saber qué contacto debe abrirse.
    if (!contactoId) {
        mostrarError("No se identificó el contacto.");
        return;
    }

    try {
        // Carga los datos del encabezado: nombre, estado y fotografía.
        await cargarDatosContacto();

        // Marca los mensajes pendientes como leídos.
        // Se ejecuta al entrar en la conversación.
        // Si falla, el código igualmente intenta mostrar el historial.
        await marcarMensajesLeidos();

        // Obtiene el historial actualizado y lo muestra.
        await cargarMensajes("auto");
    } catch (error) {
        // Si ocurre un error durante la carga, muestra su mensaje.
        mostrarError(error.message);
    }
}

/* =========================================
   CARGAR DATOS DEL CONTACTO
========================================= */

// Obtiene los datos del contacto seleccionado.
async function cargarDatosContacto() {
    // Solicita al backend la lista de contactos.
    const contactos = await solicitarAPI("/api/contactos");

    // Comprueba que la respuesta sea válida.
    // Array.isArray verifica que el resultado sea un array.
    if (!Array.isArray(contactos)) {
        throw new Error("La respuesta del servidor no es válida.");
    }

    // Busca el contacto cuyo ID coincide con el que se obtuvo de la URL.
    // find devuelve el primer elemento que cumple la condición.
    const contacto = contactos.find((contacto) => contacto._id === contactoId);

    // Comprueba que el contacto exista
    if (!contacto) {
        throw new Error("No se encontró el contacto.");
    }

    // Nombre y estado.
    // textContent muestra el contenido como texto y no como código HTML.
    nombreContacto.textContent = contacto.nombre;
    estadoContacto.textContent = obtenerTextoEstado(contacto.estado);

    // Cambia el título de la pestaña del navegador por el nombre del contacto.
    document.title = contacto.nombre;

    // Foto: primero el manejador de error, después el src.
    // alt proporciona una descripción alternativa de la imagen.
    fotoContacto.alt = `Foto de ${contacto.nombre}`;

    // El evento error se ejecuta si el navegador no puede cargar la imagen.
    // { once: true } hace que el evento se ejecute una sola vez.
    fotoContacto.addEventListener(
        "error",
        () => {
            fotoContacto.src = rutaImagenPorDefecto();
        },
        { once: true },
    );

    // Asigna la ruta de la fotografía del contacto.
    fotoContacto.src = resolverFoto(contacto.fotoUrl);
}

/* =========================================
   MARCAR MENSAJES COMO LEÍDOS
========================================= */

// Solicita al backend que marque como leídos los mensajes del contacto.
async function marcarMensajesLeidos() {
    // Si falla, la conversación igual se muestra.
    try {
        // PUT se utiliza para actualizar información existente.
        // encodeURIComponent prepara el ID para incluirlo en la URL.
        await solicitarAPI(
            `/api/mensajes/leer/${encodeURIComponent(contactoId)}`,
            { method: "PUT" },
        );
    } catch (error) {
        // Registra el error en la consola sin detener la carga de la conversación.
        console.warn(
            "No se pudieron marcar los mensajes como leídos:",
            error.message,
        );
    }
}

/* =========================================
   OBTENER Y MOSTRAR HISTORIAL
========================================= */

// Pide el historial y lo devuelve ordenado de más antiguo a más nuevo.
async function obtenerMensajes() {
    const respuesta = await solicitarAPI(
        `/api/mensajes/${encodeURIComponent(contactoId)}`,
    );
    // Acepta array directo o propiedad mensajes.
    // Si la respuesta es un array, lo utiliza directamente.
    // Si es un objeto, intenta obtener su propiedad mensajes.
    // El operador ?. evita un error si respuesta es null o undefined.
    const mensajes = Array.isArray(respuesta) ? respuesta : respuesta?.mensajes;

    // Verifica que los datos recibidos sean un array.
    if (!Array.isArray(mensajes)) {
        throw new Error("No se pudieron interpretar los mensajes.");
    }
    // Devuelve una copia del array ordenada cronológicamente.
    // Date transforma las fechas en objetos comparables.
    // No se modifica directamente el array recibido del backend.
    return [...mensajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

// Dibuja la lista completa de mensajes
function renderizarMensajes(mensajes, comportamiento = "auto") {
    // Guarda los mensajes recibidos en la variable global del archivo.
    // Se utilizan posteriormente para recuperar el historial.
    mensajesActuales = mensajes;

    // Limpia el contenido anterior del contenedor.
    listaMensajes.replaceChildren();

    // Conversación vacía.
    // Comprueba si el array no contiene mensajes.
    if (mensajes.length === 0) {
        // Crea un párrafo para informar que todavía no hay mensajes.
        const mensajeVacio = document.createElement("p");

        mensajeVacio.textContent = "Todavía no hay mensajes.";
        // Clases de Bootstrap y una clase propia para personalizar el aviso.
        mensajeVacio.classList.add(
            "text-center",
            "text-muted",
            "mensaje-vacio",
        );
        // Agrega el aviso al contenedor.
        listaMensajes.append(mensajeVacio);

        return;
    }

    // Crea los mensajes.
    // Recorre el array y utiliza crearMensaje() para construir cada uno.
    mensajes.forEach((mensaje) => {
        listaMensajes.append(crearMensaje(mensaje));
    });
    // Desplaza la vista hasta el último mensaj
    irAlFinal(comportamiento);
}

// Pide el historial y lo dibuja
async function cargarMensajes(comportamiento = "smooth") {
    // Espera a obtener los mensajes y luego los envía a la función de renderizado.
    renderizarMensajes(await obtenerMensajes(), comportamiento);
}

// Lleva la vista al último mensaje
function irAlFinal(comportamiento = "smooth") {
    // lastElementChild obtiene el último elemento HTML del contenedor.
    // scrollIntoView desplaza la vista hasta ese elemento.
    // El operador ?. evita ejecutar el método si no existe un último elemento.
    listaMensajes.lastElementChild?.scrollIntoView({
        behavior: comportamiento,
        block: "end",
    });
}

/* =========================================
   CREAR MENSAJE
========================================= */

// Construye visualmente un mensaje utilizando los datos recibidos.
function crearMensaje(mensaje) {
    // Agrega una clase según quién haya enviado el mensaje.
    // mensaje.autor permite distinguir entre el usuario y el contacto.
    contenedor.classList.add(
        mensaje.autor === "usuario" ? "mensaje--usuario" : "mensaje--contacto",
    );
    // Contenedor.
    // Crea el div que agrupa el texto, la hora, el estado y las reacciones.
    const contenedor = document.createElement("div");
    // Agrega clases de Bootstrap y una clase propia.
    contenedor.classList.add("mensaje", "p-3", "rounded", "border");

    // Punto de enganche para reacciones / eliminar (Integrante 6).
    // Comprueba si el mensaje tiene un ID asignado por el backend.
    if (mensaje._id) {
        // Guarda el ID en un atributo data-id del elemento HTML.
        contenedor.dataset.id = mensaje._id;
    }

    // Diferencia mensajes propios y los del contacto.
    // Las clases permiten alinearlos de manera diferente mediante CSS.
    if (mensaje.autor === "usuario") {
        contenedor.classList.add("align-self-end");
    } else {
        contenedor.classList.add("align-self-start");
    }

    // Texto.
    // Crea el párrafo que contendrá el texto del mensaje.
    const texto = document.createElement("p");
    // Comprueba si el mensaje fue eliminado.
    texto.classList.add("mb-1");

    if (mensaje.eliminado) {
        // Reemplaza el contenido por un aviso de mensaje eliminado.
        texto.textContent = "Mensaje eliminado";
        // Aplica estilos de Bootstrap para diferenciar el aviso.
        texto.classList.add("text-muted", "fst-italic");
    } else {
        // Muestra el texto original del mensaje.
        // Si no hay texto, utiliza una cadena vacía.
        texto.textContent = mensaje.texto || "";
    }
    // Agrega el párrafo al contenedor.
    contenedor.append(texto);

    // Hora.
    // Crea un elemento pequeño para mostrar la fecha del mensaje.
    const hora = document.createElement("small");

    hora.classList.add("text-muted");
    // formatearFecha() convierte la fecha en un formato legible.
    hora.textContent = formatearFecha(mensaje.fecha);
    // Agrega la hora al mensaje.
    contenedor.append(hora);
    // Estado de mensajes enviados por el usuario (leído = azul).
    // Los estados solamente se muestran en los mensajes propios.
    if (mensaje.autor === "usuario") {
        const estado = document.createElement("small");
        // Agrega separación y aplica un color según el estado.
        estado.classList.add(
            "ms-2",
            mensaje.estado === "leido" ? "text-primary" : "text-muted",
        );
        // Obtiene el símbolo que representa el estado del mensaje.
        estado.textContent = obtenerEstadoMensaje(mensaje.estado);

        contenedor.append(estado);
    }
    // Reacción.
    // Muestra el emoji asociado al mensaje, siempre que no haya sido eliminado.
    if (mensaje.reaccion && !mensaje.eliminado) {
        const reaccion = document.createElement("span");

        reaccion.classList.add("ms-2");
        // Inserta el emoji de la reacción.
        reaccion.textContent = mensaje.reaccion;

        contenedor.append(reaccion);
    }

    // Botones de reaccionar y eliminar (solo mensajes ya guardados en el backend).
    // Comprueba que el mensaje tenga ID y que no esté eliminado.
    if (mensaje._id && !mensaje.eliminado) {
        // Llama a una función definida en acciones-mensaje.js.
        // Esta función agrega los controles de reacción y eliminación.
        agregarAccionesMensaje(contenedor, mensaje);
    }
    // Devuelve el elemento completo para que pueda agregarse a la conversación.
    return contenedor;
}

/* =========================================
   ESTADOS DEL MENSAJE
========================================= */

// Convierte el estado recibido del backend en un símbolo visual.
function obtenerEstadoMensaje(estado) {
    // Objeto que relaciona cada estado con su representación.
    const estados = {
        pendiente: "🕓", // solo en pantalla, mientras el backend confirma
        enviado: "✓",
        entregado: "✓✓",
        leido: "✓✓", // se diferencia por el color (text-primary)
    };
    // Busca el símbolo correspondiente al estado.
    // Si el estado no está contemplado, devuelve una cadena vacía.
    return estados[estado] || "";
}

/* =========================================
   ENVIAR MENSAJE
========================================= */

// Se ejecuta cuando el usuario envía un mensaje desde el formulario.
async function enviarMensaje(evento) {
    // Evita que el formulario recargue la página al enviarse.
    evento.preventDefault();

    // Obtiene el texto y elimina espacios sobrantes al principio y al final.
    const texto = inputMensaje.value.trim();

    // Evita enviar mensajes vacíos
    if (!texto) {
        return;
    }

    // Bloquea el formulario mientras se procesa el envío.
    bloquearFormulario(true);

    // Guarda la cantidad de mensajes existentes antes del envío.
    // Se utiliza después para detectar si llegó una respuesta automática.
    const cantidadAntes = mensajesActuales.length;

    // Muestra el mensaje enseguida, sin esperar al servidor
    mostrarMensajeProvisional(texto);
    inputMensaje.value = "";

    // Muestra "escribiendo..." mientras se genera la respuesta
    indicadorEscribiendo.hidden = false;
    // Variable que permite saber si el mensaje llegó a guardarse.
    let guardado = false;

    try {
        // Envía el mensaje al backend (dispara la respuesta automática).
        // POST crea un nuevo mensaje.
        // El body contiene el ID del contacto y el texto escrito.
        await solicitarAPI("/api/mensajes", {
            method: "POST",
            body: {
                contacto: contactoId,
                texto: texto,
            },
        });
        // Indica que la solicitud de envío terminó sin lanzar un error.
        guardado = true;

        // Espera la respuesta automática y actualiza la conversación
        await esperarRespuesta(cantidadAntes);
    } catch (error) {
        if (!guardado) {
            // No se envió: vuelve al estado anterior y devuelve el texto al input.
            // Renderiza nuevamente los mensajes que estaban guardados.
            renderizarMensajes(mensajesActuales);
            // Recupera el texto para que el usuario pueda volver a intentarlo.
            inputMensaje.value = texto;
            // Informa que el envío falló.
            alert(`No se pudo enviar el mensaje: ${error.message}`);
        } else {
            // Se envió, pero falló la actualización posterior.
            // Informa que el mensaje se guardó, aunque no se pudo refrescar la conversación.
            alert(
                `El mensaje se envió, pero no se pudo actualizar la conversación: ${error.message}`,
            );
        }
    } finally {
        // Oculta el indicador de escritura.
        indicadorEscribiendo.hidden = true;

        // Habilita nuevamente el formulario.
        bloquearFormulario(false);

        // Devuelve el foco al campo de texto para continuar escribiendo.
        inputMensaje.focus();
    }
}

// Dibuja el mensaje del usuario antes de que el servidor confirme
function mostrarMensajeProvisional(texto) {
    // Quita el cartel de "Todavía no hay mensajes", si existe.
    listaMensajes.querySelector(".mensaje-vacio")?.remove();
    // Crea un mensaje temporal con los datos disponibles.
    // No incluye un ID porque todavía no fue confirmado por el backend.
    const provisional = crearMensaje({
        autor: "usuario",
        texto: texto,
        estado: "pendiente",
        fecha: new Date().toISOString(),
    });
    // Reduce la opacidad para diferenciarlo visualmente de los confirmados.
    provisional.classList.add("opacity-75");
    // Agrega el mensaje provisional a la conversación.
    listaMensajes.append(provisional);
    // Desplaza la vista hasta el mensaje nuevo.
    irAlFinal();
}

// Consulta el historial hasta que aparezca la respuesta del contacto.
// Funciona tanto si el backend responde al final (ya está lista)
// como si la genera con retraso (se la espera unos segundos).
async function esperarRespuesta(cantidadAntes) {
    // Repite la consulta hasta alcanzar la cantidad máxima de intentos.
    for (let intento = 0; intento < INTENTOS_RESPUESTA; intento++) {
        // Obtiene los mensajes actualizados del backend.
        const mensajes = await obtenerMensajes();
        // Identifica el último mensaje de la conversación.
        const ultimo = mensajes[mensajes.length - 1];
        // Comprueba si se agregaron al menos dos mensajes nuevos
        // y si el último fue enviado por el contacto.
        const llegoRespuesta =
            mensajes.length > cantidadAntes + 1 && ultimo?.autor === "contacto";

        // Muestra el mensaje ya confirmado (y la respuesta si llegó).
        renderizarMensajes(mensajes, "smooth");
        // Si llegó la respuesta automática, termina la espera.
        if (llegoRespuesta) {
            return true;
        }
        // Espera antes de consultar nuevamente al backend.
        await pausar(PAUSA_RESPUESTA_MS);
    }

    // Terminó el tiempo: el contacto puede no haber respondido.
    return false;
}

// Espera una cantidad de milisegundos
function pausar(milisegundos) {
    // Promise permite ejecutar una espera asincrónica.
    // setTimeout resuelve la promesa cuando transcurre el tiempo indicado.
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

// Activa o desactiva el formulario
function bloquearFormulario(bloqueado) {
    // Si bloqueado es true, deshabilita ambos controles.
    // Si es false, permite volver a escribir y enviar.
    inputMensaje.disabled = bloqueado;
    botonEnviar.disabled = bloqueado;
}

/* =========================================
   MOSTRAR ERROR
========================================= */

// Muestra un mensaje de error dentro del área de conversación.
function mostrarError(mensaje) {
    const error = document.createElement("p");
    // Clases de Bootstrap para mostrar el error en rojo y centrado.
    error.classList.add("text-danger", "text-center");
    // Inserta el contenido del error como texto.
    error.textContent = mensaje;
    // Limpia el contenedor y muestra el error.
    listaMensajes.replaceChildren(error);
}

/* =========================================
   EVENTOS
========================================= */

// Escucha el evento submit del formulario.
// Cuando el usuario lo envía, ejecuta la función enviarMensaje.
formularioMensaje.addEventListener("submit", enviarMensaje);

/* =========================================
   INICIALIZACIÓN
========================================= */

// Carga la conversación al abrir la página
cargarConversacion();

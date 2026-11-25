// acciones-mensaje.js
// Reacciones con emojis y eliminación de mensajes (Integrante 3).
// Orden de carga: config.js -> api.js -> utils.js -> acciones-mensaje.js -> conversacion.js
// Usa crearMensaje() de conversacion.js (se llama cuando ya está cargado).

// Los 5 emojis que pide la consigna
//es una contante por que la lista no necesita cambiar durante la ejecucion.
//si quieren modificar los emojis, se cambia este array
const EMOJIS_REACCION = ["👍", "❤️", "😂", "😮", "😢"];

// Agrega los botones de reaccionar y eliminar a un mensaje ya dibujado
//recibe 2 parametros:
//el contenedor :elemento HTML que contiene el mensaje
//mensaje: objeto con los datos del mensaje
// Crea los botones de reacción y eliminación y los agrega
// debajo del contenido del mensaje.
function agregarAccionesMensaje(contenedor, mensaje) {
    //Crea una fila para agrupar los botones de acciones.
    const acciones = document.createElement("div");
    // Aplica clases de Bootstrap para alinear y separar los botones.
    acciones.classList.add("d-flex", "align-items-center", "gap-1", "mt-2");

    // =============================================
    // SELECTOR DE EMOJIS
    // =============================================

    // Crea el contenedor donde aparecerán los emojis.
    const selector = document.createElement("div");
    // Lo oculta inicialmente.
    // La propiedad hidden permite mostrarlo u ocultarlo desde JavaScript.
    // No se agrega d-flex porque podría interferir con hidden.
    selector.hidden = true;
    // Recorre el array de emojis disponibles.
    EMOJIS_REACCION.forEach((emoji) => {
        // Crea un botón para cada emoji.
        //No necesita que cada botón esté escrito previamente en el HTML.
        const botonEmoji = document.createElement("button");

        // Indica que es un botón común y no un botón de envío de formulario.
        botonEmoji.type = "button";
        // Aplica estilos de Bootstrap.
        botonEmoji.classList.add("btn", "btn-sm", "btn-light", "me-1");
        // Muestra el emoji dentro del botón.
        botonEmoji.textContent = emoji;
        // Agrega un texto descriptivo al pasar el cursor.
        botonEmoji.title = `Reaccionar con ${emoji}`;
        // Cuando se hace clic, guarda la reacción en el backend.
        botonEmoji.addEventListener("click", () => {
            reaccionarMensaje(contenedor, mensaje, emoji, botonEmoji);
        });
        // Incorpora el botón al selector.
        selector.append(botonEmoji);
    });

    // =============================================
    // BOTÓN PARA MOSTRAR LOS EMOJIS
    // =============================================

    // Botón que muestra u oculta el selector
    const botonReaccion = document.createElement("button");

    botonReaccion.type = "button";
    // Clases visuales de Bootstrap.
    botonReaccion.classList.add("btn", "btn-sm", "btn-outline-secondary");
    // Emoji que representa la acción de reaccionar.
    botonReaccion.textContent = "😊";
    // Texto descriptivo.
    botonReaccion.title = "Reaccionar";
    // Alterna entre mostrar y ocultar el selector.
    botonReaccion.addEventListener("click", () => {
        //Si está oculto, lo muestra.
        selector.hidden = !selector.hidden;
    });

    // =============================================
    // BOTÓN PARA ELIMINAR
    // =============================================

    const botonEliminar = document.createElement("button");

    botonEliminar.type = "button";
    // Clases de Bootstrap: botón pequeño con borde rojo.
    botonEliminar.classList.add("btn", "btn-sm", "btn-outline-danger");
    // Icono de papelera.
    botonEliminar.textContent = "🗑️";
    botonEliminar.title = "Eliminar mensaje";
    // Al hacer clic, solicita eliminar el mensaje.
    botonEliminar.addEventListener("click", () => {
        eliminarMensaje(contenedor, mensaje, botonEliminar);
    });

    // =============================================
    // AGREGAR ACCIONES AL MENSAJE
    // =============================================

    // Agrupa el botón de reacción, el selector de emojis
    // y el botón de eliminación.
    acciones.append(botonReaccion, selector, botonEliminar);
    // Agrega la fila de acciones al contenedor del mensaje.
    contenedor.append(acciones);
}

// =============================================
// GUARDAR UNA REACCIÓN
// =============================================

// Recibe:
// contenedor: mensaje que se está modificando.
// mensaje: objeto del mensaje.
// emoji: reacción elegida.
// boton: botón que se pulsó.
//
// Envía la reacción al backend y actualiza el mensaje
// en la interfaz cuando la operación tiene éxito.
async function reaccionarMensaje(contenedor, mensaje, emoji, boton) {
    // Deshabilita el botón para evitar varios clics
    // mientras se procesa la solicitud.
    boton.disabled = true;

    try {
        // Solicita al backend actualizar la reacción.
        // Método PUT: modifica un recurso existente.
        //
        // Ruta: /api/mensajes/:id/reaccion
        // Body: { reaccion: emoji }
        await solicitarAPI(
            `/api/mensajes/${encodeURIComponent(mensaje._id)}/reaccion`,
            {
                method: "PUT",
                body: { reaccion: emoji },
            },
        );

        // Actualiza el dato local y redibuja únicamente este mensaje
        mensaje.reaccion = emoji;

        // Reemplaza el mensaje anterior por uno actualizado.
        // crearMensaje() vuelve a construir su representación HTML.
        contenedor.replaceWith(crearMensaje(mensaje));
    } catch (error) {
        // Si ocurre un error, vuelve a habilitar el botón.
        boton.disabled = false;
        // Informa el problema al usuario.
        alert(`No se pudo guardar la reacción: ${error.message}`);
    }
}

// =============================================
// ELIMINAR UN MENSAJE
// =============================================

// Recibe:
// contenedor: elemento HTML del mensaje.
// mensaje: objeto del mensaje que se quiere eliminar.
// boton: botón de eliminación.
//
// No elimina físicamente el registro de la base de datos.
// Realiza un borrado lógico: cambia eliminado a true.
async function eliminarMensaje(contenedor, mensaje, boton) {
    // Pide confirmación antes de realizar la acción.
    // Si el usuario cancela, termina la función.
    if (!confirm("¿Eliminar este mensaje?")) {
        return;
    }
    // Evita que se vuelva a pulsar mientras se procesa.
    boton.disabled = true;

    try {
        // DELETE /api/mensajes/:id (el backend marca eliminado: true)
        // Solicita al backend marcar el mensaje como eliminado.
        // Método DELETE: solicita eliminar el recurso.
        //
        // En este proyecto se espera que el backend
        // cambie eliminado a true en lugar de borrarlo definitivamente
        await solicitarAPI(`/api/mensajes/${encodeURIComponent(mensaje._id)}`, {
            method: "DELETE",
        });

        // crearMensaje() ya muestra "Mensaje eliminado" cuando eliminado es true
        // Actualiza el objeto local.
        mensaje.eliminado = true;
        // Vuelve a dibujar el mensaje.
        // crearMensaje() debe mostrar "Mensaje eliminado"
        // cuando la propiedad eliminado es true.
        contenedor.replaceWith(crearMensaje(mensaje));
    } catch (error) {
        // Si falla la solicitud, habilita nuevamente el botón.
        boton.disabled = false;
        // Informa el error.
        alert(`No se pudo eliminar el mensaje: ${error.message}`);
    }
}

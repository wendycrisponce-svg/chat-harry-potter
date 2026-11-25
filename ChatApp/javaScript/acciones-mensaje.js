// acciones-mensaje.js
// Reacciones con emojis y eliminación de mensajes (Integrante 3).
// Orden de carga: config.js -> api.js -> utils.js -> acciones-mensaje.js -> conversacion.js
// Usa crearMensaje() de conversacion.js (se llama cuando ya está cargado).


// Los 5 emojis que pide la consigna
const EMOJIS_REACCION = ["👍", "❤️", "😂", "😮", "😢"];


// Agrega los botones de reaccionar y eliminar a un mensaje ya dibujado
function agregarAccionesMensaje(contenedor, mensaje) {

    // Fila de acciones
    const acciones = document.createElement("div");
    acciones.classList.add("d-flex", "align-items-center", "gap-1", "mt-2");

    // Selector de emojis, oculto hasta que se pulsa el botón de reaccionar
    // (no se le pone d-flex: Bootstrap lo haría ignorar el atributo hidden)
    const selector = document.createElement("div");
    selector.hidden = true;

    EMOJIS_REACCION.forEach(emoji => {

        const botonEmoji = document.createElement("button");

        botonEmoji.type = "button";
        botonEmoji.classList.add("btn", "btn-sm", "btn-light", "me-1");
        botonEmoji.textContent = emoji;
        botonEmoji.title = `Reaccionar con ${emoji}`;

        botonEmoji.addEventListener("click", () => {
            reaccionarMensaje(contenedor, mensaje, emoji, botonEmoji);
        });

        selector.append(botonEmoji);
    });

    // Botón que muestra u oculta el selector
    const botonReaccion = document.createElement("button");

    botonReaccion.type = "button";
    botonReaccion.classList.add("btn", "btn-sm", "btn-outline-secondary");
    botonReaccion.textContent = "😊";
    botonReaccion.title = "Reaccionar";

    botonReaccion.addEventListener("click", () => {
        selector.hidden = !selector.hidden;
    });

    // Botón de eliminar
    const botonEliminar = document.createElement("button");

    botonEliminar.type = "button";
    botonEliminar.classList.add("btn", "btn-sm", "btn-outline-danger");
    botonEliminar.textContent = "🗑️";
    botonEliminar.title = "Eliminar mensaje";

    botonEliminar.addEventListener("click", () => {
        eliminarMensaje(contenedor, mensaje, botonEliminar);
    });

    acciones.append(botonReaccion, selector, botonEliminar);

    contenedor.append(acciones);
}


// Guarda la reacción en el backend y actualiza solo ese mensaje
async function reaccionarMensaje(contenedor, mensaje, emoji, boton) {

    // Evita clics repetidos mientras se procesa
    boton.disabled = true;

    try {

        // PUT /api/mensajes/:id/reaccion
        await solicitarAPI(
            `/api/mensajes/${encodeURIComponent(mensaje._id)}/reaccion`,
            {
                method: "PUT",
                body: { reaccion: emoji }
            }
        );

        // Actualiza el dato local y redibuja únicamente este mensaje
        mensaje.reaccion = emoji;

        contenedor.replaceWith(crearMensaje(mensaje));

    } catch (error) {

        boton.disabled = false;

        alert(`No se pudo guardar la reacción: ${error.message}`);

    }
}


// Elimina el mensaje (borrado lógico) y actualiza solo ese mensaje
async function eliminarMensaje(contenedor, mensaje, boton) {

    // Pide confirmación antes de borrar
    if (!confirm("¿Eliminar este mensaje?")) {
        return;
    }

    boton.disabled = true;

    try {

        // DELETE /api/mensajes/:id (el backend marca eliminado: true)
        await solicitarAPI(
            `/api/mensajes/${encodeURIComponent(mensaje._id)}`,
            { method: "DELETE" }
        );

        // crearMensaje() ya muestra "Mensaje eliminado" cuando eliminado es true
        mensaje.eliminado = true;

        contenedor.replaceWith(crearMensaje(mensaje));

    } catch (error) {

        boton.disabled = false;

        alert(`No se pudo eliminar el mensaje: ${error.message}`);

    }
}

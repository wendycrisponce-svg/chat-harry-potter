// acciones-mensaje.js
// Reacciones con emojis y eliminación de mensajes (Integrante 3).
// Orden de carga: config.js -> api.js -> utils.js -> acciones-mensaje.js -> conversacion.js
// Usa crearMensaje() de conversacion.js (se llama cuando ya está cargado).

// 🎨 HTML/CSS: los botones NO se crean acá. Ya están escritos dentro de los <template>
// de conversacion.html (barra .acciones-mensaje con los botones .btn-reaccion y .btn-eliminar).
// Los 5 emojis de la consigna se cambian en el HTML, en el atributo data-emoji de cada botón.
// Este archivo solo conecta esos botones con el backend.

// Conecta la barra de acciones de un mensaje ya dibujado.
// Recibe 2 parámetros:
// contenedor: elemento HTML que contiene el mensaje (clonado de la plantilla).
// mensaje: objeto con los datos del mensaje.
function agregarAccionesMensaje(contenedor, mensaje) {
    // Busca dentro del mensaje la burbuja y la barra de acciones.
    const burbuja = contenedor.querySelector(".burbuja");
    const barra = contenedor.querySelector(".acciones-mensaje");

    // =============================================
    // MOSTRAR Y OCULTAR LA BARRA
    // =============================================

    // Función que abre la barra de este mensaje y cierra las de los demás.
    const alternarBarra = () => {
        // d-none es la clase de Bootstrap que oculta un elemento.
        // Si la barra la tiene, significa que está cerrada y hay que abrirla.
        const abrir = barra.classList.contains("d-none");

        // Cierra todas las barras para que solo haya una abierta a la vez.
        document.querySelectorAll(".acciones-mensaje").forEach((otra) => {
            otra.classList.add("d-none");
        });

        // Si estaba cerrada, la muestra quitando d-none.
        if (abrir) {
            barra.classList.remove("d-none");
        }
    };

    // La barra se abre al hacer clic en la burbuja.
    burbuja.addEventListener("click", alternarBarra);

    // También se abre con el teclado (Enter o Espacio), para que sea accesible.
    // La burbuja tiene tabindex="0" en el HTML, por eso puede recibir el foco.
    burbuja.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            // Evita que la tecla Espacio desplace la página.
            evento.preventDefault();
            alternarBarra();
        }
    });

    // =============================================
    // BOTONES DE EMOJIS
    // =============================================

    // Recorre los botones de reacción que vienen de la plantilla.
    barra.querySelectorAll(".btn-reaccion").forEach((boton) => {
        // Cuando se hace clic, guarda la reacción en el backend.
        // dataset.emoji lee el valor del atributo data-emoji del HTML.
        boton.addEventListener("click", () => {
            reaccionarMensaje(contenedor, mensaje, boton.dataset.emoji, boton);
        });
    });

    // =============================================
    // BOTÓN PARA ELIMINAR
    // =============================================

    // Al hacer clic, solicita eliminar el mensaje.
    // evento.currentTarget es el botón al que se le asignó el evento.
    barra
        .querySelector(".btn-eliminar")
        .addEventListener("click", (evento) => {
            eliminarMensaje(contenedor, mensaje, evento.currentTarget);
        });
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
        // crearMensaje() vuelve a clonar la plantilla con los datos nuevos
        // (la barra queda cerrada otra vez).
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

        // Actualiza el objeto local.
        mensaje.eliminado = true;
        // Vuelve a dibujar el mensaje.
        // crearMensaje() muestra "Mensaje eliminado"
        // cuando la propiedad eliminado es true.
        contenedor.replaceWith(crearMensaje(mensaje));
    } catch (error) {
        // Si falla la solicitud, habilita nuevamente el botón.
        boton.disabled = false;
        // Informa el error.
        alert(`No se pudo eliminar el mensaje: ${error.message}`);
    }
}
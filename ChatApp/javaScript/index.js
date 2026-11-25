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
        // Solicita la lista de contactos mediante la función general de api.js
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
    // Se utiliza una copia para no modificar el array original recibido del backend.
    const contactosOrdenados = [...contactos].sort((contactoA, contactoB) => {
        // Obtiene las fechas del último mensaje de cada contacto.
        // El operador ?. evita un error si ultimoMensaje no existe.
        const fechaA = contactoA.ultimoMensaje?.fecha;
        const fechaB = contactoB.ultimoMensaje?.fecha;
        // Convierte las fechas a milisegundos para poder compararlas.
        // Si no hay fecha, utiliza 0.
        const tiempoA = fechaA ? new Date(fechaA).getTime() : 0;
        const tiempoB = fechaB ? new Date(fechaB).getTime() : 0;
        // Orden descendente: el mensaje más reciente aparece primero.
        return tiempoB - tiempoA;
    });

    // Reemplaza el contenido anterior por las tarjetas nuevas.
    // map() genera una tarjeta por cada contacto.
    listaContactos.replaceChildren(
        ...contactosOrdenados.map(crearTarjetaContacto),
    );
}

// Crea la tarjeta de un contacto
function crearTarjetaContacto(contacto) {
    // 🎨 CSS: permite colorear la tarjeta por casa y por estado
    tarjeta.dataset.casa = contacto.casa || ""; // "gryffindor", "slytherin", "hufflepuff", "ravenclaw"
    tarjeta.dataset.estado = contacto.estado || "";

    // Contenedor principal de la tarjeta
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("card", "mb-2");

    // Cuerpo de la tarjeta
    const cuerpo = document.createElement("div");
    cuerpo.classList.add("card-body", "d-flex", "align-items-center", "gap-3");

    // Imagen del contacto
    const imagen = document.createElement("img");
    // Texto alternativo para accesibilidad.
    imagen.alt = `Foto de ${contacto.nombre}`;
    // Clases de Bootstrap para redondear la imagen.
    imagen.classList.add("rounded-circle");
    // Establece las dimensiones de la imagen.
    imagen.width = 60;
    imagen.height = 60;

    // Si la foto falla, usa la imagen por defecto (una sola vez, sin bucles).
    // { once: true } evita que este evento se ejecute repetidamente.
    imagen.addEventListener(
        "error",
        () => {
            imagen.src = rutaImagenPorDefecto();
        },
        { once: true },
    );
    // Asigna la ruta de la foto del contacto.
    // resolverFoto() se encarga de adaptar la ruta de la imagen.
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
    // Recibe la cantidad de mensajes pendientes de lectura.
    const badge = crearBadgeNoLeidos(contacto.mensajesNoLeidos);

    // Enlace para abrir la conversación
    const enlace = document.createElement("a");
    enlace.classList.add("btn", "btn-primary");
    enlace.textContent = "Abrir chat";

    // Envía el ID del contacto en la URL para identificar qué conversación abrir.
    // encodeURIComponent() permite incluir el identificador de forma segura en la URL.
    enlace.href = `html/conversacion.html?id=${encodeURIComponent(contacto._id)}`;

    // Arma la tarjeta.
    // append() agrega varios elementos en el orden indicado.
    informacion.append(nombre, estado, ultimoMensaje, hora);
    cuerpo.append(imagen, informacion, badge, enlace);
    tarjeta.appendChild(cuerpo);
    // Devuelve la tarjeta construida para mostrarla en la lista.
    return tarjeta;
}

// Obtiene el texto que se mostrará como último mensaje
function obtenerTextoUltimoMensaje(contacto) {
    // Recupera el último mensaje asociado al contacto.
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
    // Si el mensaje fue enviado por el contacto, muestra su texto.
    return mensaje.texto || "";
}

// Crea el indicador de mensajes no leídos
function crearBadgeNoLeidos(cantidad) {
    // Crea un elemento span para mostrar el número.
    const badge = document.createElement("span");
    // Clases de Bootstrap para darle apariencia de insignia redondeada y verde.
    badge.classList.add("badge", "rounded-pill", "bg-success");

    // Acepta número o texto numérico ("3").
    // Number() convierte el valor recibido a tipo numérico.
    const total = Number(cantidad);
    // Comprueba que sea un número válido y mayor que cero.
    if (!Number.isFinite(total) || total <= 0) {
        // Oculta el indicador si no hay mensajes pendientes
        badge.classList.add("d-none");

        return badge;
    }
    // Muestra la cantidad de mensajes no leídos.
    badge.textContent = total;

    return badge;
}

// Muestra un texto simple dentro de la lista (cargando, vacío)
function mostrarMensajeLista(texto, clase) {
    // Crea el elemento que contendrá el aviso.
    const aviso = document.createElement("p");

    // Aplica la clase recibida y establece el texto.
    aviso.classList.add(clase);
    aviso.textContent = texto;
    // Reemplaza el contenido de la lista por el aviso.
    listaContactos.replaceChildren(aviso);
}

// Muestra un mensaje de error con botón para reintentar
function mostrarErrorContactos(mensaje) {
    // Crea el elemento que mostrará el error.
    const aviso = document.createElement("p");

    aviso.classList.add("text-danger");
    aviso.textContent = `Error al cargar los contactos: ${mensaje}`;

    // Crea un botón para volver a solicitar los contactos.
    const reintentar = document.createElement("button");

    reintentar.type = "button";
    reintentar.classList.add("btn", "btn-outline-secondary", "btn-sm");
    reintentar.textContent = "Reintentar";

    // Cuando el usuario hace clic, vuelve a ejecutar cargarContactos().
    reintentar.addEventListener("click", cargarContactos);
    // Muestra el error y el botón dentro del contenedor.
    listaContactos.replaceChildren(aviso, reintentar);
}

// Al volver con el botón "atrás" el navegador puede mostrar la página guardada
// sin ejecutar el script: se vuelve a cargar para actualizar orden y no leídos
window.addEventListener("pageshow", (evento) => {
    // persisted indica si la página se recuperó desde la caché de navegación.
    if (evento.persisted) {
        cargarContactos();
    }
});

// Ejecuta la carga inicial de contactos
cargarContactos();

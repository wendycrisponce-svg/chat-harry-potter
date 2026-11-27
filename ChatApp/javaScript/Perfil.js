// perfil.js
// Carga, edición y guardado del perfil en perfil.html.
// Orden de carga: config.js -> api.js -> utils.js -> sesion.js -> perfil.js

// IIFE: evita que las constantes de este archivo choquen con las de otros scripts.
(function () {
    "use strict";

    // Página privada: si no hay sesión, redirige al login y detiene el archivo.
    if (!Sesion.exigirSesion()) return;

    // =============================================
    // ELEMENTOS DE LA PÁGINA (ids de perfil.html)
    // =============================================

    const form = document.getElementById("form-perfil");
    const avatar = document.getElementById("perfil-avatar");      // círculo de la foto
    const guardado = document.getElementById("perfil-guardado");  // mensaje debajo del botón
    const inputFoto = document.getElementById("perfil-foto");     // input de archivo oculto

    // Guarda el SVG de la silueta que viene en el HTML, para volver a ponerlo si no hay foto.
    const siluetaPorDefecto = avatar.innerHTML;

    // Foto actual del perfil (URL, ruta del backend o data URL). "" = sin foto.
    let fotoActual = "";

    // =============================================
    // FUNCIONES DE PANTALLA
    // =============================================

    // Muestra la foto en el círculo, o la silueta si no hay.
    function pintarAvatar(fotoUrl) {
        fotoActual = fotoUrl || "";
        if (fotoActual) {
            // resolverFoto() (utils.js) acepta URL absoluta, ruta del backend o data:.
            // La clase .avatar-perfil del CSS ya tiene background-size: cover.
            avatar.style.backgroundImage = `url("${resolverFoto(fotoActual)}")`;
            avatar.innerHTML = ""; // quita la silueta
         } else {
            avatar.style.backgroundImage = "";
            avatar.innerHTML = siluetaPorDefecto;
        }
    }

    // Completa el formulario con los datos de un perfil.
    function pintarFormulario(p) {
        form.nombre.value = p.nombre;
        form.descripcion.value = p.descripcion;

        // Busca el radio de estado correspondiente. Convierte "no molestar" a "no-molestar",
        // que es el value que usa el HTML.
        const radio = form.querySelector(
            `input[name="estado"][value="${Sesion.estadoARadio(p.estado)}"]`,
        );
        if (radio) radio.checked = true;

        pintarAvatar(p.fotoUrl);
    }

    // Muestra un mensaje debajo del botón: verde si salió bien, rojo si hubo error.
    function mensaje(texto, esError) {
        guardado.textContent = texto;
        guardado.classList.toggle("text-danger", esError);
        guardado.classList.toggle("text-success", !esError);
        guardado.classList.remove("d-none");
    }

    // =============================================
    // FOTO
    // =============================================

    // Convierte el archivo elegido en una imagen cuadrada de 256 px (JPEG, data URL).
    // Se hace porque en lo recibido no hay endpoint para subir archivos,
    // y una foto original pesada no entraría en localStorage.
    // Devuelve una promesa porque leer y cargar la imagen es asíncrono.
    function reducirImagen(archivo) {
        return new Promise(function (ok, fail) {
            const lector = new FileReader();
            lector.onerror = fail;
            lector.onload = function () {
                const img = new Image();
                img.onerror = fail;
                img.onload = function () {
                    const lado = 256;
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = lado;

                    // Recorta un cuadrado centrado y lo dibuja a 256x256.
                    const min = Math.min(img.width, img.height);
                    canvas.getContext("2d").drawImage(
                        img,
                        (img.width - min) / 2, (img.height - min) / 2, min, min,
                        0, 0, lado, lado,
                    );

                    // 0.8 = calidad JPEG (equilibrio entre peso y nitidez).
                    ok(canvas.toDataURL("image/jpeg", 0.8));
                };
                img.src = lector.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    // Cuando el usuario elige una foto (botón de la cámara), la reduce y la muestra.
    // Todavía no se guarda: se guarda al enviar el formulario.
    inputFoto.addEventListener("change", async function () {
        if (!inputFoto.files[0]) return;
        try {
            pintarAvatar(await reducirImagen(inputFoto.files[0]));
         } catch (e) {
            mensaje("No se pudo leer la imagen.", true);
        }
    });

    // =============================================
    // GUARDAR CAMBIOS
    // =============================================

    form.addEventListener("submit", async function (e) {
        // Evita que el navegador recargue la página.
        e.preventDefault();
        guardado.classList.add("d-none");

        // Muestra los mensajes de validación de Bootstrap (por ejemplo "Escribí un nombre.").
        form.classList.add("was-validated");
        if (!form.checkValidity()) return;

        try {
            // Sesion.guardarPerfil valida, envía a la API si hay endpoint y guarda localmente.
            const perfil = await Sesion.guardarPerfil({
                nombre: form.nombre.value,
                descripcion: form.descripcion.value,
                // form.estado.value es el radio elegido (con guion); se convierte al formato del modelo.
                estado: Sesion.radioAEstado(form.estado.value),
                fotoUrl: fotoActual,
            });

            // Vuelve a mostrar los datos ya limpios y validados (por ejemplo, textos recortados).
            pintarFormulario(perfil);
            mensaje("Cambios guardados", false);
         } catch (err) {
            mensaje(err.message, true);
        }
    });

    // =============================================
    // CARGA INICIAL
    // =============================================

    // Al abrir la página, obtiene el perfil (del servidor si hay endpoint, o el local)
    // y completa el formulario.
    Sesion.cargarPerfil().then(pintarFormulario);
})();
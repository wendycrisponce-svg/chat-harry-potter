// login.js
// Maneja el formulario de login de login.html.
// Orden de carga: config.js -> api.js -> utils.js -> sesion.js -> login.js

// IIFE: evita que las constantes de este archivo choquen con las de otros scripts.
(function () {
    "use strict";

    // Si el usuario ya tiene sesión iniciada, lo manda al inicio y corta la ejecución.
    // (return dentro de la función detiene el resto del archivo).
    if (Sesion.redirigirSiHaySesion()) return;

    // =============================================
    // CONTRATO CON LA API (SUPUESTOS A CONFIRMAR)
    // =============================================
    // De api.js solo se sabe que existe la ruta "/api/auth/login".
    // El método, los nombres de los campos del body y la forma de la respuesta
    // NO aparecen en ningún archivo recibido: hay que confirmarlos con la consigna.
    // Se dejan juntos acá para ajustarlos en un solo lugar.

    // Método y ruta del login.
    const LOGIN = { metodo: "POST", ruta: "/api/auth/login" };

    // Arma el body que se envía al backend. Ajustar los nombres de los campos si son otros.
    const armarBody = (usuario, clave) => ({ usuario: usuario, clave: clave });

    // Interpreta la respuesta del login y devuelve { token, usuario }.
    // Acepta "token" o "accessToken"; si la API no devuelve datos del usuario,
    // usa el nombre que se escribió en el formulario.
    const leerRespuesta = (resp, usuario) => ({
        token: (resp && (resp.token || resp.accessToken)) || null,
        usuario: (resp && (resp.usuario || resp.user)) || { nombre: usuario },
    });

    // =============================================
    // ELEMENTOS DE LA PÁGINA
    // =============================================

    // Formulario, aviso de error y botón de enviar (ids y estructura de login.html).
    const form = document.getElementById("form-login");
    const error = document.getElementById("login-error");
    const boton = form.querySelector("button[type=submit]");

    // =============================================
    // ENVÍO DEL FORMULARIO
    // =============================================

    // async porque espera la respuesta del servidor (await).
    form.addEventListener("submit", async function (e) {
        // Evita que el navegador recargue la página al enviar el formulario.
        e.preventDefault();

        // Oculta el error de un intento anterior.
        error.classList.add("d-none");

        // was-validated hace que Bootstrap muestre los mensajes "Ingresá tu usuario/contraseña".
        form.classList.add("was-validated");

        // checkValidity() es false si falta algún campo con "required". En ese caso no envía nada.
        if (!form.checkValidity()) return;

        const usuario = form.usuario.value.trim();

        // Deshabilita el botón para evitar enviar dos veces mientras se espera la respuesta.
        boton.disabled = true;

        try {
            // solicitarAPI (api.js) hace el fetch, convierte el body a JSON y maneja los errores.
            const resp = await solicitarAPI(LOGIN.ruta, {
                method: LOGIN.metodo,
                body: armarBody(usuario, form.clave.value),
            });

            // Guarda token y usuario (sesion.js) y va al inicio.
            Sesion.guardarSesion(leerRespuesta(resp, usuario));
            Sesion.irAInicio();
        } catch (err) {
            // api.js ya entrega un mensaje claro: credenciales inválidas,
            // servidor apagado, etc. Se muestra en el aviso rojo del formulario.
            error.textContent = err.message;
            error.classList.remove("d-none");
        } finally {
            // Se ejecuta siempre: vuelve a habilitar el botón.
            boton.disabled = false;
        }
    });
})();
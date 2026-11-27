// sesion.js
// Gestiona la sesión del usuario y el modelo de Perfil.
// Orden de carga: config.js -> api.js -> utils.js -> sesion.js -> (login.js | perfil.js | index.js | conversacion.js)
//
// Reutiliza lo que ya existe en api.js para no duplicar lógica:
// - solicitarAPI(): hace las solicitudes al backend.
// - CLAVE_TOKEN: nombre con el que api.js guarda el token en localStorage.
// - irALogin(): redirige a la página de login.

// Se envuelve todo en una función que se ejecuta sola (IIFE).
// Así las constantes y funciones de abajo no chocan con las de otros archivos
// (todos los scripts comparten el mismo espacio global).
(function () {
    "use strict";

    // =============================================
    // CONSTANTES
    // =============================================

    // Clave de localStorage donde se guardan los datos del usuario que devolvió el login.
    // El token NO se guarda acá: lo maneja api.js con CLAVE_TOKEN ("chatapp_token").
    const CLAVE_USUARIO = "chatapp_usuario";

    // Clave de localStorage donde se guarda el perfil (nombre, descripción, estado, foto).
    const CLAVE_PERFIL = "chatapp_perfil";

    // Límites de caracteres. Son los mismos maxlength de perfil.html.
    const MAX_NOMBRE = 30;
    const MAX_DESCRIPCION = 100;

    // Estados válidos del perfil. Son los mismos valores que usa utils.js
    // en obtenerTextoEstado(). OJO: "no molestar" lleva espacio, no guion.
    const ESTADOS = ["disponible", "ocupado", "no molestar"];

    // Endpoints del backend para perfil y logout.
    // NO aparecen en ningún archivo recibido, por eso están en null.
    // Cuando la consigna los defina, se completan así:
    //   { metodo: "PUT", ruta: "/api/..." }
    // Mientras sean null, el perfil se guarda solo en el navegador
    // y el logout se hace solo de forma local.
    const ENDPOINTS = {
        obtenerPerfil: null,
        actualizarPerfil: null,
        logout: null,
    };

    // =============================================
    // localStorage SEGURO
    // =============================================

    // Lee una clave de localStorage y la convierte de texto JSON a objeto.
    // Si no existe, o el JSON está roto, devuelve null en vez de lanzar un error.
    function leer(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave));
        } catch (e) {
            return null;
        }
    }

    // Convierte un valor a JSON y lo guarda en localStorage.
    // Devuelve true si se pudo guardar y false si falló
    // (por ejemplo, si el almacenamiento está lleno por una foto muy pesada).
    function escribir(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (e) {
            return false;
        }
    }

    // =============================================
    // RUTAS
    // =============================================

    // Lleva al usuario a index.html.
    // Usa la misma lógica que irALogin() de api.js: index.html está en la raíz
    // y el resto de las páginas en la carpeta /html/.
    // replace() evita que el botón "atrás" vuelva a la página anterior (por ejemplo, el login).
    function irAInicio() {
        const dentroDeHtml = window.location.pathname.includes("/html/");
        window.location.replace(dentroDeHtml ? "../index.html" : "index.html");
    }

    // =============================================
    // MODELO DE PERFIL
    // =============================================

    // Recibe datos sueltos (del formulario, de la API o del login) y devuelve
    // un objeto de perfil limpio y con valores válidos.
    // Los nombres de las propiedades coinciden con los de los contactos del backend
    // (nombre, estado, fotoUrl) para poder usar resolverFoto() de utils.js.
    function crearPerfil(datos) {
        // Si no llega nada, trabaja con un objeto vacío para no fallar.
        datos = datos || {};

        return {
            // Identificador del backend (null si todavía no existe).
            _id: datos._id || null,
            // trim() saca espacios de los extremos; slice() corta al máximo permitido.
            nombre: String(datos.nombre || "").trim().slice(0, MAX_NOMBRE),
            descripcion: String(datos.descripcion || "").trim().slice(0, MAX_DESCRIPCION),
            // Si el estado no es uno de los 3 válidos, usa "disponible".
            estado: ESTADOS.includes(datos.estado) ? datos.estado : "disponible",
            // URL de la foto, ruta del backend o data URL. "" significa sin foto.
            fotoUrl: datos.fotoUrl || "",
        };
    }

    // Los radios de perfil.html usan value="no-molestar" (con guion, igual que el CSS),
    // pero el modelo usa "no molestar" (con espacio, igual que utils.js).
    // Estas dos funciones convierten de un formato al otro.
    function estadoARadio(estado) {
        return estado.replace(/ /g, "-");
    }
    function radioAEstado(valor) {
        return valor.replace(/-/g, " ");
    }

    // =============================================
    // SESIÓN
    // =============================================

    // Indica si hay una sesión activa: existe el token de api.js
    // o hay datos de usuario guardados. Devuelve true o false.
    function haySesion() {
        return !!(localStorage.getItem(CLAVE_TOKEN) || leer(CLAVE_USUARIO));
    }

    // Devuelve los datos del usuario logueado (o null si no hay).
    function obtenerUsuario() {
        return leer(CLAVE_USUARIO);
    }

    // Guarda la sesión después de un login correcto.
    // datos = { token, usuario }, armado en login.js a partir de la respuesta de la API.
    function guardarSesion(datos) {
        // El token se guarda con la clave de api.js para que solicitarAPI()
        // lo envíe automáticamente en cada solicitud siguiente.
        if (datos.token) {
            localStorage.setItem(CLAVE_TOKEN, datos.token);
        }
        if (datos.usuario) {
            escribir(CLAVE_USUARIO, datos.usuario);
            // Si todavía no hay un perfil guardado, crea uno inicial con los datos del usuario.
            // Si ya existe, no lo pisa (se conservan los cambios hechos por el usuario).
            if (!leer(CLAVE_PERFIL)) {
                escribir(CLAVE_PERFIL, crearPerfil(datos.usuario));
            }
        }
    }

    // Borra el token y los datos del usuario.
    // El perfil editado NO se borra: hay un único usuario, y sin endpoint
    // de perfil se perderían los cambios al cerrar sesión.
    function limpiarSesion() {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
    }

    // Protege las páginas privadas (index, perfil, conversación).
    // Se llama al cargar la página: si no hay sesión, redirige al login.
    // Devuelve true si hay sesión y false si redirigió.
    function exigirSesion() {
        if (haySesion()) {
            return true;
        }
        irALogin();
        return false;
    }

    // Se usa en login.html: si el usuario ya inició sesión,
    // no tiene sentido mostrarle el login, así que va directo al inicio.
    // Devuelve true si redirigió.
    function redirigirSiHaySesion() {
        if (!haySesion()) {
            return false;
        }
        irAInicio();
        return true;
    }

    // Cierra la sesión. Es async porque puede esperar la respuesta del servidor.
    async function cerrarSesion() {
        try {
            // Si el equipo definió un endpoint de logout, se avisa al backend.
            if (ENDPOINTS.logout) {
                await solicitarAPI(ENDPOINTS.logout.ruta, {
                    method: ENDPOINTS.logout.metodo || "POST",
                });
            }
        } catch (e) {
            // Si el servidor falla, igual se cierra la sesión en este navegador.
        }
        limpiarSesion();
        irALogin();
    }

    // =============================================
    // PERFIL: CARGAR Y GUARDAR
    // =============================================

    // Devuelve el perfil guardado en este navegador (o null si no hay).
    // Pasa por crearPerfil() para asegurar que los datos sean válidos.
    function obtenerPerfilLocal() {
        const perfil = leer(CLAVE_PERFIL);
        return perfil ? crearPerfil(perfil) : null;
    }

    // Obtiene el perfil para mostrarlo en pantalla.
    // 1) Si hay endpoint, lo pide al servidor y actualiza la copia local.
    // 2) Si no hay endpoint o falla, usa el perfil local.
    // 3) Si tampoco hay perfil local, arma uno con los datos del usuario logueado.
    async function cargarPerfil() {
        if (ENDPOINTS.obtenerPerfil) {
            try {
                const remoto = await solicitarAPI(ENDPOINTS.obtenerPerfil.ruta);
                // Combina lo local con lo remoto (lo remoto tiene prioridad).
                const perfil = crearPerfil({ ...obtenerPerfilLocal(), ...remoto });
                escribir(CLAVE_PERFIL, perfil);
                return perfil;
            } catch (e) {
                console.warn("No se pudo cargar el perfil del servidor:", e.message);
            }
        }
        return obtenerPerfilLocal() || crearPerfil(obtenerUsuario());
    }

    // Guarda los cambios del perfil.
    // cambios = los campos que editó el usuario (nombre, descripción, estado, fotoUrl).
    async function guardarPerfil(cambios) {
        // Mezcla el perfil actual con los cambios y valida con crearPerfil().
        const perfil = crearPerfil({ ...obtenerPerfilLocal(), ...cambios });

        // El nombre es obligatorio (en perfil.html el input tiene "required").
        if (!perfil.nombre) {
            throw new Error("Escribí un nombre.");
        }

        // Si hay endpoint de actualización, envía el perfil al servidor.
        // Si el servidor responde con error, solicitarAPI lanza una excepción
        // y no se llega a guardar localmente.
        if (ENDPOINTS.actualizarPerfil) {
            await solicitarAPI(ENDPOINTS.actualizarPerfil.ruta, {
                method: ENDPOINTS.actualizarPerfil.metodo || "PUT",
                body: perfil,
            });
        }

        // Guarda la copia local. Puede fallar si la foto es demasiado pesada.
        if (!escribir(CLAVE_PERFIL, perfil)) {
            throw new Error("No se pudo guardar el perfil (foto demasiado pesada).");
        }
        return perfil;
    }

    // =============================================
    // BOTÓN "CERRAR SESIÓN" DE index.html
    // =============================================

    // Cuando la página terminó de cargar, busca el enlace con id="cerrar-sesion"
    // (está en el menú de usuario de index.html). Si existe, al hacer clic
    // evita la navegación normal del enlace y ejecuta cerrarSesion().
    document.addEventListener("DOMContentLoaded", function () {
        const enlace = document.getElementById("cerrar-sesion");
        if (enlace) {
            enlace.addEventListener("click", function (e) {
                e.preventDefault();
                cerrarSesion();
            });
        }
    });

    // =============================================
    // LO QUE SE EXPONE A LOS OTROS ARCHIVOS
    // =============================================

    // Todo lo de arriba es privado. Solo se publica lo que otros archivos necesitan,
    // dentro del objeto global Sesion. Ejemplo de uso: Sesion.exigirSesion();
    window.Sesion = {
        MAX_NOMBRE, MAX_DESCRIPCION, ESTADOS, ENDPOINTS,
        crearPerfil, estadoARadio, radioAEstado,
        haySesion, obtenerUsuario, guardarSesion, exigirSesion,
        redirigirSiHaySesion, irAInicio, cerrarSesion,
        cargarPerfil, guardarPerfil,
    };
})();
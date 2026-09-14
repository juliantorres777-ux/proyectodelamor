/**
 * config.js
 * Configuración central del proyecto.
 * Cambia aquí el número de WhatsApp, las actividades disponibles
 * y los límites de fecha/hora sin tocar el resto del código.
 *
 * Script clásico (sin type="module"): así el sitio funciona abriendo
 * index.html con doble clic, sin necesitar un servidor local. Todo se
 * expone bajo el namespace global `JohaConfig` para no ensuciar `window`.
 */
window.JohaConfig = {
  /** Número de WhatsApp en formato internacional, sin "+" ni espacios. */
  PHONE: "573015201972",

  /** Nombre mostrado en textos de la interfaz. */
  INVITEE_NAME: "Joha",

  /** Cuántos días hacia adelante (incluyendo hoy) se pueden agendar. */
  MAX_DAYS_AHEAD: 7,

  /** Actividades seleccionables en el paso de planeación. */
  ACTIVITIES: [
    { id: "pizza", label: "Pizza", emoji: "\u{1F355}" },
    { id: "sushi", label: "Sushi", emoji: "\u{1F363}" },
    { id: "hamburguesa", label: "Hamburguesa", emoji: "\u{1F354}" },
    { id: "perro-caliente", label: "Perro caliente", emoji: "\u{1F32D}" },
    { id: "pasta", label: "Pasta", emoji: "\u{1F35D}" },
    { id: "cafe", label: "Café", emoji: "\u2615" },
    { id: "tomar-algo", label: "Tomar algo", emoji: "\u{1F379}" },
    { id: "cine", label: "Cine", emoji: "\u{1F3AC}" },
    { id: "helado", label: "Helado", emoji: "\u{1F366}" },
    { id: "parrilla", label: "Parrilla", emoji: "\u{1F356}" },
    { id: "tacos", label: "Tacos", emoji: "\u{1F32E}" },
    { id: "comida-japonesa", label: "Comida japonesa", emoji: "\u{1F371}" },
  ],

  /** Frases juguetonas que aparecen cada vez que el botón "No" escapa. */
  NO_BUTTON_TEASES: [
    "¿Segura, segura? 👀",
    "¡Ese no era el plan! 😅",
    "Mejor prueba con el Sí ❤️",
    "¡Casi me atrapas! 🏃",
    "No, no, no 💔",
    "¿En serio, en serio? 🤔",
    "Yo que tú, presionaría el otro 😌",
    "¡Uy, por poquito!",
    "Ese botón está de vacaciones 🏖️",
    "El Sí se ve mejor desde aquí 👉",
  ],

  /** Franja horaria permitida en el selector de hora (formato 24h). */
  TIME_RANGE: { startHour: 7, endHour: 23, stepMinutes: 5 },

  /** Duración estándar (ms) de las microinteracciones. */
  ANIMATION_DURATION: 320,

  /** Nombres de los días y meses en español para formatear fechas. */
  WEEKDAYS: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  WEEKDAYS_SHORT: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  MONTHS: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
};

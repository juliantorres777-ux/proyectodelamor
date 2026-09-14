/**
 * whatsapp.js
 * Construye el mensaje final y abre WhatsApp con los datos de la cita.
 * Expone `window.JohaWhatsapp`.
 *
 * Script clásico (sin type="module"): debe cargarse después de config.js.
 */
(function () {
  const { PHONE } = window.JohaConfig;

  /**
   * Arma el texto del mensaje a partir de los datos recolectados.
   * Sin emojis a propósito: en algunos navegadores/dispositivos no cargan
   * bien dentro del mensaje de WhatsApp (aparecen como "�"), así que el
   * mensaje se mantiene en texto plano para que llegue siempre legible.
   * @param {{dateLabel: string, time: string, activities: {label:string, emoji:string}[], comment: string}} data
   */
  function buildMessage({ dateLabel, time, activities, comment }) {
    const activitiesText = activities.map((a) => a.label).join(", ");
    const lines = [
      "Hola",
      "Acepté tu invitación.",
      "",
      `Fecha: ${dateLabel}`,
      `Hora: ${time}`,
      `Actividades: ${activitiesText}`,
    ];

    if (comment && comment.trim()) {
      lines.push(`Comentario: ${comment.trim()}`);
    }

    lines.push("", "Nos vemos");
    return lines.join("\n");
  }

  /** Construye la URL final de wa.me con el mensaje codificado. */
  function buildWhatsAppURL(data) {
    const message = buildMessage(data);
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Abre WhatsApp (app o web) con el mensaje ya listo.
   * Debe llamarse de forma síncrona dentro del gesto de clic del usuario:
   * si pasa por un `await`/`setTimeout` antes, los navegadores pierden el
   * permiso de "interacción del usuario" y bloquean la ventana en silencio
   * (por eso el mensaje "nunca llegaba"). Si aun así el navegador bloquea la
   * ventana nueva, se cae a una navegación directa en la misma pestaña.
   *
   * IMPORTANTE: WhatsApp nunca envía el mensaje solo; abre el chat con el
   * texto ya escrito y la persona debe tocar "Enviar" dentro de WhatsApp.
   * Es una restricción del propio WhatsApp, no de esta página.
   */
  function sendToWhatsApp(data) {
    const url = buildWhatsAppURL(data);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = url;
    }
    return url;
  }

  window.JohaWhatsapp = { buildMessage, buildWhatsAppURL, sendToWhatsApp };
})();

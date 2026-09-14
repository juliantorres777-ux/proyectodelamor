/**
 * script.js
 * Punto de entrada: orquesta pantallas, formulario, toasts, modal,
 * loading y la integración con WhatsApp.
 *
 * Script clásico (sin type="module"): debe cargarse último, después de
 * config.js, calendar.js, activities.js, animations.js y whatsapp.js.
 */
(function () {
  const { INVITEE_NAME, NO_BUTTON_TEASES } = window.JohaConfig;
  const { initCalendar, getScheduleData, isScheduleComplete, resetSchedule } = window.JohaCalendar;
  const { renderActivities, getSelectedActivities, hasSelectedActivities, resetActivitiesSelection } =
    window.JohaActivities;
  const { sendToWhatsApp, buildWhatsAppURL } = window.JohaWhatsapp;
  const {
    revealNow,
    createRipple,
    initGlowHover,
    initFloating,
    initNoButtonEvasion,
    springAnimate,
  } = window.JohaAnimations;

  /* ---------- Referencias DOM ---------- */
  const screenInvite = document.getElementById("screen-invite");
  const screenPlan = document.getElementById("screen-plan");
  const btnYes = document.getElementById("btn-yes");
  const btnNo = document.getElementById("btn-no");
  const dateOptions = document.getElementById("date-options");
  const timeOptions = document.getElementById("time-options");
  const activitiesGrid = document.getElementById("activities-grid");
  const commentBox = document.getElementById("comment");
  const planForm = document.getElementById("plan-form");
  const btnConfirm = document.getElementById("btn-confirm");
  const loadingOverlay = document.getElementById("loading-overlay");
  const toastContainer = document.getElementById("toast-container");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalPrimary = document.getElementById("modal-primary");
  const modalDialog = modal.querySelector(".modal__dialog");

  let lastWhatsAppURL = "";
  let lastFocusedBeforeModal = null;
  let modalOnClose = null;
  let noButtonEvasion = null;

  /* ---------- Toasts ---------- */

  /**
   * Muestra un toast temporal accesible.
   * @param {string} message
   * @param {"success"|"error"|"info"} type
   */
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "status");

    const icon = { success: "✅", error: "⚠️", info: "💬" }[type] || "💬";
    toast.innerHTML = `<span class="toast__icon" aria-hidden="true">${icon}</span><span class="toast__text"></span>`;
    toast.querySelector(".toast__text").textContent = message;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));

    const remove = () => {
      toast.classList.remove("is-visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    };
    const timer = setTimeout(remove, 3200);
    toast.addEventListener("click", () => {
      clearTimeout(timer);
      remove();
    });
  }

  /* ---------- Modal ---------- */

  function openModal({ title, desc, primaryLabel, icon, onClose }) {
    lastFocusedBeforeModal = document.activeElement;
    modalOnClose = typeof onClose === "function" ? onClose : null;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalPrimary.textContent = primaryLabel;
    document.getElementById("modal-icon").textContent = icon || "❤️";

    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    springAnimate(modalDialog, [
      { opacity: 0, transform: "scale(0.9) translateY(10px)" },
      { opacity: 1, transform: "scale(1) translateY(0)" },
    ]);
    modalDialog.focus();
    document.addEventListener("keydown", handleModalKeydown);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.removeEventListener("keydown", handleModalKeydown);
    modal.addEventListener(
      "transitionend",
      () => {
        modal.hidden = true;
      },
      { once: true }
    );
    if (lastFocusedBeforeModal instanceof HTMLElement) lastFocusedBeforeModal.focus();

    if (modalOnClose) {
      const callback = modalOnClose;
      modalOnClose = null;
      callback();
    }
  }

  function handleModalKeydown(e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") trapFocus(e, modalDialog);
  }

  function trapFocus(e, container) {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  modal.querySelectorAll("[data-modal-close]").forEach((el) => el.addEventListener("click", closeModal));
  modalPrimary.addEventListener("click", () => {
    if (lastWhatsAppURL) window.open(lastWhatsAppURL, "_blank", "noopener,noreferrer");
    closeModal();
  });

  /* ---------- Loading ---------- */

  function showLoading() {
    loadingOverlay.classList.add("is-visible");
    loadingOverlay.setAttribute("aria-hidden", "false");
  }

  function hideLoading() {
    loadingOverlay.classList.remove("is-visible");
    loadingOverlay.setAttribute("aria-hidden", "true");
  }

  /* ---------- Transición de pantallas ---------- */

  function goToPlanScreen() {
    screenInvite.classList.add("is-leaving");
    const anim = springAnimate(screenInvite, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.96)" },
    ]);
    anim?.finished?.then(finishTransition).catch(finishTransition);

    // Salvaguarda por si Web Animations no está disponible.
    setTimeout(finishTransition, 500);

    function finishTransition() {
      if (screenInvite.hidden) return;
      screenInvite.hidden = true;
      screenInvite.classList.remove("is-active", "is-leaving");
      screenPlan.hidden = false;
      screenPlan.classList.add("is-active");
      // La pantalla ya está garantizada visible (recién se activó), así que
      // se revela de inmediato en vez de esperar un IntersectionObserver:
      // eso evitaba que el formulario tardara en aparecer o pareciera
      // "desaparecido" justo después de dar clic en "Sí".
      revealNow(screenPlan);
      const planTitle = document.getElementById("plan-title");
      planTitle.setAttribute("tabindex", "-1");
      planTitle.focus();
      document.title = "Perfecto ❤️ | Para Joha";
    }
  }

  /** Vuelve de la pantalla de planeación a la pantalla inicial de invitación. */
  function goToInviteScreen() {
    screenPlan.classList.add("is-leaving");
    const anim = springAnimate(screenPlan, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.96)" },
    ]);
    anim?.finished?.then(finishTransition).catch(finishTransition);

    // Salvaguarda por si Web Animations no está disponible.
    setTimeout(finishTransition, 500);

    function finishTransition() {
      if (screenPlan.hidden) return;
      screenPlan.hidden = true;
      screenPlan.classList.remove("is-active", "is-leaving");
      screenInvite.hidden = false;
      screenInvite.classList.add("is-active");
      noButtonEvasion?.reset();
      revealNow(screenInvite);
      const inviteTitle = document.getElementById("invite-title");
      inviteTitle.setAttribute("tabindex", "-1");
      inviteTitle.focus();
      document.title = `¿Aceptas salir conmigo? ❤️ | Para ${INVITEE_NAME}`;
    }
  }

  /* ---------- Validación y envío ---------- */

  function shakeInvalidGroup(el) {
    el.classList.add("is-shake");
    el.addEventListener("animationend", () => el.classList.remove("is-shake"), { once: true });
  }

  function validatePlan() {
    const errors = [];
    if (!isScheduleComplete()) errors.push("fecha y hora");
    if (!hasSelectedActivities()) errors.push("al menos una actividad");
    return errors;
  }

  async function handleConfirm(e) {
    e.preventDefault();
    const errors = validatePlan();

    if (errors.length) {
      showToast(`Falta seleccionar: ${errors.join(" y ")}.`, "error");
      if (!isScheduleComplete()) shakeInvalidGroup(dateOptions.closest(".field-group"));
      if (!hasSelectedActivities()) shakeInvalidGroup(activitiesGrid.closest(".field-group"));
      return;
    }

    const schedule = getScheduleData();
    const activities = getSelectedActivities();
    const comment = commentBox.value;
    const payload = { dateLabel: schedule.dateLabel, time: schedule.time, activities, comment };

    // WhatsApp se abre AQUÍ, de forma síncrona, todavía dentro del gesto de
    // clic del usuario. Si esto se retrasara con un await/setTimeout antes,
    // el navegador pierde el permiso de "interacción del usuario" y bloquea
    // la ventana sin avisar — así el mensaje nunca llegaba.
    lastWhatsAppURL = buildWhatsAppURL(payload);
    sendToWhatsApp(payload);

    btnConfirm.disabled = true;
    showLoading();

    // Pequeña espera para que el loading se sienta intencional, no instantáneo.
    await new Promise((resolve) => setTimeout(resolve, 900));

    hideLoading();
    btnConfirm.disabled = false;
    showToast("¡Invitación enviada! 💌", "success");
    openModal({
      title: "¡Cita confirmada! ❤️",
      desc: `Nos vemos ${schedule.dateLabel.toLowerCase()} a las ${schedule.time}.`,
      primaryLabel: "Abrir WhatsApp",
      icon: "🎉",
      // Al cerrar (por cualquier vía: X, fondo, Escape o el botón), la app
      // vuelve a la pantalla inicial y queda lista para una nueva invitación.
      onClose: () => {
        resetPlanForm();
        goToInviteScreen();
      },
    });
  }

  /* ---------- Inicialización ---------- */

  function initInviteScreen() {
    initFloating(document.querySelector(".floating-heart--1"), 0);
    initFloating(document.querySelector(".floating-heart--2"), 400);
    initFloating(document.querySelector(".floating-heart--3"), 800);
    initFloating(document.querySelector(".floating-heart--4"), 200);

    initGlowHover(btnYes);
    noButtonEvasion = initNoButtonEvasion(btnNo, screenInvite, btnYes, NO_BUTTON_TEASES);

    btnYes.addEventListener("click", (e) => {
      createRipple(e, btnYes);
      springAnimate(btnYes, [{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }], {
        duration: 260,
      });
      setTimeout(goToPlanScreen, 180);
    });
  }

  function renderPlanWidgets() {
    initCalendar(dateOptions, timeOptions, {
      onDateChange: () => dateOptions.closest(".field-group").classList.remove("has-error"),
    });
    renderActivities(activitiesGrid, () => {
      activitiesGrid.closest(".field-group").classList.remove("has-error");
    });
  }

  /** Limpia fecha, hora, actividades y comentario para volver a empezar desde cero. */
  function resetPlanForm() {
    resetSchedule();
    resetActivitiesSelection();
    commentBox.value = "";
    renderPlanWidgets();
  }

  function initPlanScreen() {
    renderPlanWidgets();
    planForm.addEventListener("submit", handleConfirm);
  }

  function init() {
    document.title = `¿Aceptas salir conmigo? ❤️ | Para ${INVITEE_NAME}`;
    revealNow(screenInvite);
    initInviteScreen();
    initPlanScreen();
  }

  // Este script se carga al final de <body> sin defer, así que al momento de
  // ejecutarse el DOM ya está disponible; por seguridad se comprueba
  // readyState en vez de depender solo de DOMContentLoaded (que podría
  // haberse disparado ya en navegadores muy rápidos).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

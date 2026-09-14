/**
 * activities.js
 * Renderiza el grid de actividades seleccionables (multi-selección).
 * Expone `window.JohaActivities`.
 *
 * Script clásico (sin type="module"): debe cargarse después de config.js.
 */
(function () {
  const { ACTIVITIES } = window.JohaConfig;

  const selectedIds = new Set();

  /** Crea una card de actividad. */
  function createActivityCard(activity, onToggle) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "activity-card";
    card.dataset.id = activity.id;
    card.setAttribute("role", "checkbox");
    card.setAttribute("aria-checked", "false");
    card.setAttribute("aria-label", activity.label);

    card.innerHTML = `
      <span class="activity-card__check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="activity-card__emoji" aria-hidden="true">${activity.emoji}</span>
      <span class="activity-card__label">${activity.label}</span>
    `;

    card.addEventListener("click", () => toggleCard(card, activity.id, onToggle));

    return card;
  }

  function toggleCard(card, id, onToggle) {
    const isSelected = selectedIds.has(id);
    if (isSelected) {
      selectedIds.delete(id);
      card.classList.remove("is-selected");
      card.setAttribute("aria-checked", "false");
    } else {
      selectedIds.add(id);
      card.classList.add("is-selected", "is-popping");
      card.setAttribute("aria-checked", "true");
      card.addEventListener("animationend", () => card.classList.remove("is-popping"), { once: true });
    }
    if (typeof onToggle === "function") onToggle(getSelectedActivities());
  }

  /**
   * Renderiza todas las actividades dentro de containerEl.
   * @param {HTMLElement} containerEl
   * @param {Function} [onToggle] callback(selectedActivities)
   */
  function renderActivities(containerEl, onToggle) {
    containerEl.innerHTML = "";
    containerEl.setAttribute("role", "group");
    containerEl.setAttribute("aria-label", "Selecciona una o varias actividades");

    ACTIVITIES.forEach((activity) => {
      containerEl.appendChild(createActivityCard(activity, onToggle));
    });
  }

  /** Devuelve las actividades actualmente seleccionadas (objetos completos). */
  function getSelectedActivities() {
    return ACTIVITIES.filter((a) => selectedIds.has(a.id));
  }

  /** true si al menos una actividad está seleccionada. */
  function hasSelectedActivities() {
    return selectedIds.size > 0;
  }

  /** Limpia la selección de actividades (para volver a empezar desde cero). */
  function resetActivitiesSelection() {
    selectedIds.clear();
  }

  window.JohaActivities = {
    renderActivities,
    getSelectedActivities,
    hasSelectedActivities,
    resetActivitiesSelection,
  };
})();

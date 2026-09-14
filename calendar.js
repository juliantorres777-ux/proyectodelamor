/**
 * calendar.js
 * Selector de fecha (hoy + próximos 7 días) y selector de hora (HH:mm).
 * Sin dependencias externas. Expone `window.JohaCalendar`.
 *
 * Script clásico (sin type="module"): debe cargarse después de config.js.
 */
(function () {
  const { MAX_DAYS_AHEAD, TIME_RANGE, WEEKDAYS_SHORT, MONTHS } = window.JohaConfig;

  let state = {
    selectedDateISO: null,
    selectedDateLabel: null,
    selectedHour: null,
    selectedMinute: null,
  };

  /** Devuelve YYYY-MM-DD en horario local (evita desfases de UTC). */
  function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function buildDateLabel(date, offset) {
    if (offset === 0) return "Hoy";
    if (offset === 1) return "Mañana";
    const weekday = WEEKDAYS_SHORT[date.getDay()];
    return `${weekday} ${date.getDate()}`;
  }

  function buildFullLabel(date) {
    const weekday = WEEKDAYS_SHORT[date.getDay()];
    const month = MONTHS[date.getMonth()];
    return `${weekday} ${date.getDate()} de ${month}`;
  }

  /**
   * Genera las opciones de fecha válidas: hoy + los próximos MAX_DAYS_AHEAD días.
   * Nunca incluye fechas pasadas ni fechas más allá del rango permitido.
   */
  function getAvailableDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];
    for (let offset = 0; offset <= MAX_DAYS_AHEAD; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      dates.push({
        iso: toISODate(d),
        offset,
        shortLabel: buildDateLabel(d, offset),
        fullLabel: buildFullLabel(d),
      });
    }
    return dates;
  }

  /** Renderiza los chips de fecha dentro de containerEl. */
  function renderDateChips(containerEl, onSelect) {
    const dates = getAvailableDates();
    containerEl.innerHTML = "";
    containerEl.setAttribute("role", "radiogroup");
    containerEl.setAttribute("aria-label", "Selecciona una fecha para la cita");

    dates.forEach((dateInfo, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "date-chip";
      chip.dataset.iso = dateInfo.iso;
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", "false");
      chip.setAttribute("tabindex", index === 0 ? "0" : "-1");
      chip.innerHTML = `<span class="date-chip__label">${dateInfo.shortLabel}</span>`;

      chip.addEventListener("click", () => selectDateChip(containerEl, chip, dateInfo, onSelect));
      chip.addEventListener("keydown", (e) => handleChipKeydown(e, containerEl));

      containerEl.appendChild(chip);
    });
  }

  function selectDateChip(containerEl, chip, dateInfo, onSelect) {
    containerEl.querySelectorAll(".date-chip").forEach((el) => {
      el.classList.remove("is-selected");
      el.setAttribute("aria-checked", "false");
      el.setAttribute("tabindex", "-1");
    });
    chip.classList.add("is-selected", "is-pulsing");
    chip.setAttribute("aria-checked", "true");
    chip.setAttribute("tabindex", "0");
    chip.addEventListener("animationend", () => chip.classList.remove("is-pulsing"), { once: true });

    state.selectedDateISO = dateInfo.iso;
    state.selectedDateLabel = dateInfo.fullLabel;
    if (typeof onSelect === "function") onSelect(dateInfo);
  }

  function handleChipKeydown(e, containerEl) {
    const chips = Array.from(containerEl.querySelectorAll(".date-chip"));
    const currentIndex = chips.indexOf(e.target);
    let nextIndex = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") nextIndex = (currentIndex + 1) % chips.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nextIndex = (currentIndex - 1 + chips.length) % chips.length;
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.target.click();
      return;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      chips[nextIndex].focus();
    }
  }

  /** Genera la lista de horas/minutos disponibles según TIME_RANGE. */
  function buildTimeUnits() {
    const hours = [];
    for (let h = TIME_RANGE.startHour; h <= TIME_RANGE.endHour; h++) hours.push(h);
    const minutes = [];
    for (let m = 0; m < 60; m += TIME_RANGE.stepMinutes) minutes.push(m);
    return { hours, minutes };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** Construye una columna de selección tipo rueda (listbox accesible). */
  function buildTimeColumn(values, formatFn, label, onPick) {
    const wrapper = document.createElement("div");
    wrapper.className = "time-column";
    wrapper.setAttribute("role", "listbox");
    wrapper.setAttribute("aria-label", label);
    wrapper.tabIndex = 0;

    values.forEach((value) => {
      const option = document.createElement("div");
      option.className = "time-option";
      option.setAttribute("role", "option");
      option.dataset.value = value;
      option.setAttribute("aria-selected", "false");
      option.textContent = formatFn(value);
      wrapper.appendChild(option);
    });

    function selectOption(option, silent) {
      wrapper.querySelectorAll(".time-option").forEach((el) => {
        el.classList.remove("is-selected");
        el.setAttribute("aria-selected", "false");
      });
      option.classList.add("is-selected");
      option.setAttribute("aria-selected", "true");
      option.scrollIntoView({ block: "center", behavior: "smooth" });
      if (!silent) onPick(Number(option.dataset.value));
    }

    wrapper.addEventListener("click", (e) => {
      const option = e.target.closest(".time-option");
      if (option) selectOption(option, false);
    });

    wrapper.addEventListener("keydown", (e) => {
      const options = Array.from(wrapper.querySelectorAll(".time-option"));
      const current = wrapper.querySelector(".is-selected") || options[0];
      let idx = options.indexOf(current);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        idx = Math.min(idx + 1, options.length - 1);
        selectOption(options[idx], false);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        idx = Math.max(idx - 1, 0);
        selectOption(options[idx], false);
      }
    });

    return { wrapper, selectOption };
  }

  /** Renderiza el selector de hora elegante (formato HH:mm) dentro de containerEl. */
  function renderTimePicker(containerEl, onChange) {
    containerEl.innerHTML = "";
    containerEl.classList.add("time-picker");

    const { hours, minutes } = buildTimeUnits();

    const emitChange = () => {
      if (state.selectedHour === null || state.selectedMinute === null) return;
      const formatted = `${pad2(state.selectedHour)}:${pad2(state.selectedMinute)}`;
      if (typeof onChange === "function") onChange(formatted);
    };

    const hourCol = buildTimeColumn(hours, pad2, "Hora", (value) => {
      state.selectedHour = value;
      emitChange();
    });
    const minuteCol = buildTimeColumn(minutes, pad2, "Minutos", (value) => {
      state.selectedMinute = value;
      emitChange();
    });

    const separator = document.createElement("span");
    separator.className = "time-picker__separator";
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = ":";

    containerEl.appendChild(hourCol.wrapper);
    containerEl.appendChild(separator);
    containerEl.appendChild(minuteCol.wrapper);

    // Preselecciona una hora sugerida (próxima hora redonda, dentro del rango).
    const now = new Date();
    let suggestedHour = Math.min(Math.max(now.getHours() + 1, TIME_RANGE.startHour), TIME_RANGE.endHour);
    const hourOption = hourCol.wrapper.querySelector(`[data-value="${suggestedHour}"]`);
    const minuteOption = minuteCol.wrapper.querySelector(`[data-value="0"]`);
    if (hourOption) hourCol.selectOption(hourOption, true);
    if (minuteOption) minuteCol.selectOption(minuteOption, true);
    state.selectedHour = suggestedHour;
    state.selectedMinute = 0;

    requestAnimationFrame(() => {
      hourOption?.scrollIntoView({ block: "center" });
      minuteOption?.scrollIntoView({ block: "center" });
    });
  }

  /**
   * Inicializa calendario y selector de hora.
   * @param {HTMLElement} dateContainer
   * @param {HTMLElement} timeContainer
   * @param {{onDateChange?: Function, onTimeChange?: Function}} callbacks
   */
  function initCalendar(dateContainer, timeContainer, callbacks = {}) {
    renderDateChips(dateContainer, callbacks.onDateChange);
    renderTimePicker(timeContainer, callbacks.onTimeChange);
  }

  /** Devuelve la fecha/hora seleccionada actualmente. */
  function getScheduleData() {
    const time = state.selectedHour !== null && state.selectedMinute !== null
      ? `${pad2(state.selectedHour)}:${pad2(state.selectedMinute)}`
      : null;
    return {
      dateISO: state.selectedDateISO,
      dateLabel: state.selectedDateLabel,
      time,
    };
  }

  /** true si tanto fecha como hora fueron seleccionadas. */
  function isScheduleComplete() {
    const data = getScheduleData();
    return Boolean(data.dateISO && data.time);
  }

  /** Limpia la selección de fecha/hora (para volver a empezar desde cero). */
  function resetSchedule() {
    state = { selectedDateISO: null, selectedDateLabel: null, selectedHour: null, selectedMinute: null };
  }

  window.JohaCalendar = {
    getAvailableDates,
    initCalendar,
    getScheduleData,
    isScheduleComplete,
    resetSchedule,
  };
})();

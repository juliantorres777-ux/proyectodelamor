/**
 * animations.js
 * Utilidades de animación reutilizables (Web Animations API + CSS).
 * Todas operan sobre transform/opacity/filter para mantenerse a 60 FPS.
 *
 * Script clásico (sin type="module") para funcionar con doble clic sobre
 * index.html, sin servidor. Expone su API pública en `window.JohaAnimations`.
 */
(function () {
  const SPRING_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const SMOOTH_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

  /** Respeta la preferencia de reducción de movimiento del usuario. */
  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function animate(el, keyframes, options) {
    if (!el) return null;
    if (prefersReducedMotion()) {
      const last = keyframes[keyframes.length - 1];
      Object.assign(el.style, last);
      return null;
    }
    // fill:"both" mantiene el resultado final (opacity:1, etc.) una vez
    // termina, sin necesidad de "confirmar y cancelar" la animación después:
    // esa limpieza se probó y en algunos navegadores/dispositivos resolvía
    // en un momento inconsistente, provocando que el contenido apareciera
    // y volviera a desaparecer. Si más adelante se anima `transform`/`filter`
    // en un elemento que además tenga hijos con position:absolute (como
    // pasa con el botón "No" dentro de .invite-actions), usa un tipo de
    // reveal que NO toque transform/filter para ese elemento (p. ej.
    // "fade-in"), porque mientras la animación esté activa/rellenando,
    // el elemento se vuelve containing block de esos hijos.
    return el.animate(keyframes, { duration: 400, easing: SMOOTH_EASING, fill: "both", ...options });
  }

  function fadeIn(el, options = {}) {
    return animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, ...options });
  }

  function fadeUp(el, options = {}) {
    return animate(
      el,
      [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 600, ...options }
    );
  }

  function slideIn(el, direction = "left", options = {}) {
    const distance = direction === "left" ? "-40px" : "40px";
    return animate(
      el,
      [{ opacity: 0, transform: `translateX(${distance})` }, { opacity: 1, transform: "translateX(0)" }],
      { duration: 550, ...options }
    );
  }

  function scaleIn(el, options = {}) {
    return animate(
      el,
      [{ opacity: 0, transform: "scale(0.85)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 500, easing: SPRING_EASING, ...options }
    );
  }

  function rotateIn(el, options = {}) {
    return animate(
      el,
      [
        { opacity: 0, transform: "rotate(-8deg) scale(0.92)" },
        { opacity: 1, transform: "rotate(0deg) scale(1)" },
      ],
      { duration: 550, easing: SPRING_EASING, ...options }
    );
  }

  function blurReveal(el, options = {}) {
    return animate(
      el,
      [
        { opacity: 0, filter: "blur(14px)", transform: "translateY(12px)" },
        { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" },
      ],
      { duration: 700, ...options }
    );
  }

  /** Animación tipo resorte genérica para keyframes personalizados. */
  function springAnimate(el, keyframes, options = {}) {
    return animate(el, keyframes, { duration: 600, easing: SPRING_EASING, ...options });
  }

  // Tipos de reveal soportados en [data-animate]: fade-in, fade-up,
  // slide-left, slide-right, scale-in, rotate-in, blur-reveal.
  const revealRunners = {
    "fade-in": fadeIn,
    "fade-up": fadeUp,
    "slide-left": (el, o) => slideIn(el, "left", o),
    "slide-right": (el, o) => slideIn(el, "right", o),
    "scale-in": scaleIn,
    "rotate-in": rotateIn,
    "blur-reveal": blurReveal,
  };

  /**
   * Revela elementos con [data-animate] cuando entran en el viewport.
   * Pensado para contenido largo al que se llega haciendo scroll.
   */
  function initScrollReveal(root = document) {
    const targets = root.querySelectorAll("[data-animate]");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const type = el.dataset.animate;
          const delay = Number(el.dataset.animateDelay || 0);
          const runner = revealRunners[type] || fadeUp;
          runner(el, { delay });
          observer.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => {
      el.style.opacity = "0";
      observer.observe(el);
    });
  }

  /**
   * Revela elementos con [data-animate] de inmediato (sin esperar a un
   * IntersectionObserver), respetando cada data-animate-delay. Para
   * pantallas completas que ya están garantizadas visibles al momento de
   * llamarla (p. ej. justo después de una transición de pantalla): esperar
   * a un callback de intersección ahí solo agrega demora y hace que el
   * contenido tarde en aparecer o parezca "desaparecido".
   */
  function revealNow(root = document) {
    const targets = root.querySelectorAll("[data-animate]");
    targets.forEach((el) => {
      const type = el.dataset.animate;
      const delay = Number(el.dataset.animateDelay || 0);
      const runner = revealRunners[type] || fadeUp;
      el.style.opacity = "0";
      runner(el, { delay });
    });
  }

  /** Efecto ripple en clic, contenido dentro del propio elemento (overflow hidden). */
  function createRipple(event, el) {
    if (prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const x = (event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    el.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  /** Glow que sigue al cursor mediante custom properties CSS. */
  function initGlowHover(el) {
    if (!el) return;
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    });
  }

  /** Flotación idle sutil (aplica la clase CSS .is-floating con retardo aleatorio). */
  function initFloating(el, delay = 0) {
    if (!el || prefersReducedMotion()) return;
    el.style.animationDelay = `${delay}ms`;
    el.classList.add("is-floating");
  }

  /** Parallax ligero según la posición del cursor dentro de un contenedor. */
  function initParallax(container, targets, strength = 16) {
    if (!container || prefersReducedMotion()) return;
    let ticking = false;
    container.addEventListener("pointermove", (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        targets.forEach((el) => {
          const depth = Number(el.dataset.parallaxDepth || 1);
          el.style.transform = `translate3d(${relX * strength * depth}px, ${relY * strength * depth}px, 0)`;
        });
        ticking = false;
      });
    });
    container.addEventListener("pointerleave", () => {
      targets.forEach((el) => (el.style.transform = "translate3d(0,0,0)"));
    });
  }

  /**
   * Lógica de evasión del botón "No": nunca debe poder presionarse.
   * Desktop: huye cuando el cursor se acerca.
   * Móvil: huye al primer intento de toque, sin permitir el tap.
   * @param {HTMLElement} noBtn
   * @param {HTMLElement} container
   * @param {HTMLElement} [avoidEl] elemento que la nueva posición nunca debe tapar (el botón "Sí").
   * @param {string[]} [teases] frases divertidas que aparecen junto al botón cada vez que escapa.
   */
  function initNoButtonEvasion(noBtn, container, avoidEl, teases = []) {
    if (!noBtn || !container) return;

    const PROXIMITY = 130;
    const MARGIN = 12;
    const AVOID_PADDING = 18;
    const SHRINK_SCALE = 0.8;
    const DODGE_MS = 420;
    const TEASE_MS = 1500;
    const TEASE_COOLDOWN_MS = 900;
    let isAbsolute = false;
    let dodgeCount = 0;
    let settleTimer = null;
    let teaseTimer = null;
    let teaseEl = null;
    let lastTeaseAt = 0;

    // El "contenedor de referencia" real para left/top absolutos es el
    // offsetParent que el navegador resuelva (puede no coincidir con
    // `container` si algún ancestro intermedio crea su propio contexto de
    // posicionamiento), así que siempre se consulta en el momento, nunca se asume.
    function referenceBox() {
      const ref = noBtn.offsetParent || container;
      return ref.getBoundingClientRect();
    }

    function toAbsolutePosition() {
      if (isAbsolute) return;
      const btnRect = noBtn.getBoundingClientRect();
      noBtn.style.position = "absolute";
      noBtn.style.margin = "0";
      noBtn.style.zIndex = "5";
      isAbsolute = true;
      // offsetParent solo existe una vez el elemento está fuera del flujo;
      // se recalcula aquí, tras aplicar position:absolute.
      const refRect = referenceBox();
      noBtn.style.left = `${btnRect.left - refRect.left}px`;
      noBtn.style.top = `${btnRect.top - refRect.top}px`;
    }

    function rectsOverlap(a, b) {
      return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    /** Rect del elemento a evitar, en el mismo sistema de coordenadas que x/y (relativo al refRect). */
    function avoidRectRelative(refRect) {
      if (!avoidEl) return null;
      const r = avoidEl.getBoundingClientRect();
      return {
        left: r.left - refRect.left - AVOID_PADDING,
        right: r.right - refRect.left + AVOID_PADDING,
        top: r.top - refRect.top - AVOID_PADDING,
        bottom: r.bottom - refRect.top + AVOID_PADDING,
      };
    }

    function clampedRandomPoint() {
      const refRect = referenceBox();
      const btnRect = noBtn.getBoundingClientRect();
      const maxX = Math.max(MARGIN, refRect.width - btnRect.width - MARGIN);
      const maxY = Math.max(MARGIN, refRect.height - btnRect.height - MARGIN);
      const avoid = avoidRectRelative(refRect);

      let point = { x: MARGIN, y: MARGIN };
      const MAX_ATTEMPTS = 14;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const x = MARGIN + Math.random() * (maxX - MARGIN);
        const y = MARGIN + Math.random() * (maxY - MARGIN);
        point = { x, y };
        if (!avoid) break;
        const candidate = { left: x, right: x + btnRect.width, top: y, bottom: y + btnRect.height };
        if (!rectsOverlap(candidate, avoid)) break;
      }
      return point;
    }

    function ensureTeaseEl() {
      if (teaseEl) return teaseEl;
      teaseEl = document.createElement("div");
      teaseEl.className = "no-tease";
      teaseEl.setAttribute("aria-hidden", "true");
      container.appendChild(teaseEl);
      return teaseEl;
    }

    /** Muestra una frase divertida flotando junto a la nueva posición del botón. */
    function showTease(x, y, btnWidth, refRect) {
      if (!teases.length) return;
      const el = ensureTeaseEl();
      el.textContent = teases[Math.floor(Math.random() * teases.length)];
      el.classList.remove("is-visible");

      const halfWidth = Math.max(el.offsetWidth, 90) / 2;
      const centerX = x + btnWidth / 2;
      const left = Math.min(Math.max(centerX, halfWidth + MARGIN), refRect.width - halfWidth - MARGIN);
      const above = y - 52;
      const rawTop = above > MARGIN ? above : y + 70;
      const top = Math.min(Math.max(rawTop, MARGIN), refRect.height - 44);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;

      requestAnimationFrame(() => el.classList.add("is-visible"));
      clearTimeout(teaseTimer);
      teaseTimer = setTimeout(() => el.classList.remove("is-visible"), TEASE_MS);
    }

    function dodge() {
      toAbsolutePosition();
      const refRect = referenceBox();
      const { x, y } = clampedRandomPoint();
      dodgeCount += 1;
      const rotation = (Math.random() * 16 - 8).toFixed(1);

      const now = performance.now();
      if (now - lastTeaseAt > TEASE_COOLDOWN_MS) {
        lastTeaseAt = now;
        showTease(x, y, noBtn.offsetWidth, refRect);
      }

      clearTimeout(settleTimer);
      // Fase 1: se mueve encogiéndose un poco, para que la huida se sienta ágil y divertida.
      noBtn.style.transition = `left ${DODGE_MS}ms ${SPRING_EASING}, top ${DODGE_MS}ms ${SPRING_EASING}, transform ${DODGE_MS}ms ${SPRING_EASING}`;
      noBtn.style.left = `${x}px`;
      noBtn.style.top = `${y}px`;
      noBtn.style.transform = `scale(${SHRINK_SCALE}) rotate(${rotation}deg)`;
      noBtn.dataset.dodgeCount = String(dodgeCount);

      // Fase 2: al llegar, recupera su tamaño normal con un pequeño rebote.
      settleTimer = setTimeout(() => {
        noBtn.style.transition = `transform 0.3s ${SPRING_EASING}`;
        noBtn.style.transform = "scale(1) rotate(0deg)";
      }, DODGE_MS);

      if (dodgeCount >= 3 && noBtn.dataset.teaseShown !== "true") {
        noBtn.dataset.teaseShown = "true";
        noBtn.classList.add("is-shy");
      }
    }

    // Throttle por tiempo (no por rAF): rAF se pausa en pestañas en segundo
    // plano y dejaría de proteger el botón, así que usamos un reloj real.
    const MOVE_THROTTLE_MS = 16;
    let lastCheck = 0;
    function handlePointerMove(e) {
      const now = performance.now();
      if (now - lastCheck < MOVE_THROTTLE_MS) return;
      lastCheck = now;
      const rect = noBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < PROXIMITY) dodge();
    }

    container.addEventListener("mousemove", handlePointerMove);

    // Móvil: no hay hover, así que huye apenas detecta el toque, antes del tap.
    noBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        dodge();
      },
      { passive: false }
    );

    // Salvaguarda: si por cualquier motivo se registra un click, jamás actúa como "No".
    noBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dodge();
    });

    window.addEventListener("resize", () => {
      if (!isAbsolute) return;
      const { x, y } = clampedRandomPoint();
      noBtn.style.left = `${x}px`;
      noBtn.style.top = `${y}px`;
    });

    /** Devuelve el botón a su posición natural (para volver a empezar desde cero). */
    function reset() {
      clearTimeout(settleTimer);
      clearTimeout(teaseTimer);
      noBtn.style.position = "";
      noBtn.style.left = "";
      noBtn.style.top = "";
      noBtn.style.margin = "";
      noBtn.style.zIndex = "";
      noBtn.style.transform = "";
      noBtn.style.transition = "";
      noBtn.classList.remove("is-shy");
      delete noBtn.dataset.dodgeCount;
      delete noBtn.dataset.teaseShown;
      if (teaseEl) teaseEl.classList.remove("is-visible");
      isAbsolute = false;
      dodgeCount = 0;
      lastTeaseAt = 0;
    }

    return { reset };
  }

  window.JohaAnimations = {
    prefersReducedMotion,
    fadeIn,
    fadeUp,
    slideIn,
    scaleIn,
    rotateIn,
    blurReveal,
    springAnimate,
    initScrollReveal,
    revealNow,
    createRipple,
    initGlowHover,
    initFloating,
    initParallax,
    initNoButtonEvasion,
  };
})();

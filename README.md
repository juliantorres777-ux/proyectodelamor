# Project Joha ❤️

Una experiencia web premium para invitar a Joha a salir. HTML5, CSS3 y JavaScript ES6 puro — sin frameworks, sin dependencias de build.

## Vista previa sugerida

- Pantalla 1: invitación a pantalla completa con botones "Sí" / "No" (el "No" nunca se deja presionar).
- Pantalla 2: selección de fecha, hora, actividades y comentario, con envío directo a WhatsApp.

Sugerencia de capturas para el README final: `docs/screenshot-mobile.png` (390×844) y `docs/screenshot-desktop.png` (1440×900).

## Estructura del proyecto

```
Project-Joha/
├── index.html
├── README.md
├── favicon.ico
├── robots.txt
├── sitemap.xml
├── manifest.json
├── assets/
│   ├── fonts/          # (Inter y Poppins se cargan vía Google Fonts, ver abajo)
│   ├── icons/           # heart.svg, whatsapp.svg, iconos PWA
│   └── images/          # og-image.jpg / og-image.png
├── styles/
│   └── style.css
└── scripts/
    ├── config.js         # número de WhatsApp, actividades, constantes
    ├── calendar.js        # selector de fecha y hora
    ├── activities.js       # grid de actividades
    ├── animations.js        # utilidades de animación reutilizables
    ├── whatsapp.js           # construcción del mensaje y enlace wa.me
    └── script.js              # orquestación principal (UI, toasts, modal, loading)
```

## Instalación

No requiere `npm install` ni build. Es un sitio 100% estático.

**La forma más simple: doble clic en `index.html`.** Los scripts se cargan como scripts clásicos (sin `type="module"`), así que el proyecto funciona directamente desde el explorador de archivos, sin instalar nada ni levantar un servidor.

Si prefieres servirlo igual (por ejemplo para probar el `manifest.json` o el service worker de un futuro PWA), cualquiera de estas opciones funciona igual de bien:

### Con Live Server (VS Code)

1. Instala la extensión **Live Server**.
2. Clic derecho sobre `index.html` → **Open with Live Server**.

### Con Python (alternativa)

```bash
cd Project-Joha
python3 -m http.server 5500
```

Luego abre `http://localhost:5500`.

## Configuración

### Cambiar el número de WhatsApp

Edita `scripts/config.js`:

```js
PHONE: "573XXXXXXXXX", // código de país + número, sin "+" ni espacios
```

> **Importante sobre cómo llega el mensaje:** WhatsApp nunca permite que una página web envíe un mensaje por sí sola (es una restricción del propio WhatsApp contra el spam, no de este proyecto). Al confirmar la cita, la página abre WhatsApp con el chat y el texto **ya escritos**; la persona que confirma debe tocar **Enviar** dentro de WhatsApp para que el mensaje realmente llegue al número configurado. Automatizar el envío sin ese toque manual requeriría un backend pago con la API oficial de WhatsApp Business, fuera del alcance de este sitio estático.

### Agregar o quitar actividades

Edita el arreglo `ACTIVITIES` en `scripts/config.js`:

```js
ACTIVITIES: [
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  // agrega tu propia actividad:
  { id: "picnic", label: "Picnic", emoji: "🧺" },
],
```

Cada objeto necesita un `id` único (sin espacios), un `label` visible y un `emoji`. El grid se genera automáticamente.

### Cambiar el rango de fechas u horas

En `scripts/config.js`:

```js
MAX_DAYS_AHEAD: 7, // hoy + 7 días
TIME_RANGE: { startHour: 7, endHour: 23, stepMinutes: 5 },
```

### Cambiar las frases del botón "No"

También en `scripts/config.js`, en el arreglo `NO_BUTTON_TEASES`. Cada vez que el botón "No" escapa, aparece una frase aleatoria de esa lista.

### Cambiar los colores

Todos los colores están centralizados como variables CSS en `styles/style.css`, sección `:root`:

```css
:root {
  --color-black: #000000;
  --color-black-soft: #090909;
  --color-black-elevated: #111111;
  --color-white: #ffffff;
  --color-grey: #d6d6d6;
}
```

Cambia estos valores y se propagan a todo el sitio (botones, fondos, tarjetas, textos).

### Cambiar la tipografía

Se usan **Inter** y **Poppins** desde Google Fonts (declaradas en el `<head>` de `index.html`). Para usarlas sin conexión, descarga los `.woff2` correspondientes en `assets/fonts/` y reemplaza el `<link>` de Google Fonts por reglas `@font-face` en `styles/style.css`.

### Cambiar textos e imágenes de SEO

En `index.html`, actualiza:

- `<title>`, `meta[name="description"]`, `meta[name="keywords"]`
- `link[rel="canonical"]` y las URLs `og:url` / `og:image` / `twitter:image` con tu dominio real de GitHub Pages
- `sitemap.xml` y `robots.txt` con la misma URL

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `Project-Joha`).
2. Inicializa git y sube el proyecto:

   ```bash
   cd Project-Joha
   git init
   git add .
   git commit -m "Project Joha: primera versión"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/Project-Joha.git
   git push -u origin main
   ```

3. En GitHub, ve a **Settings → Pages**.
4. En **Source**, selecciona la rama `main` y la carpeta `/ (root)`.
5. Guarda. Tu sitio quedará publicado en:

   ```
   https://TU-USUARIO.github.io/Project-Joha/
   ```

6. Actualiza `index.html`, `robots.txt` y `sitemap.xml` reemplazando `tu-usuario` por tu usuario real de GitHub, y vuelve a hacer commit/push.

## Accesibilidad

- Navegación completa por teclado (Tab, flechas en fecha/hora, Escape en el modal).
- Roles ARIA (`radiogroup`, `listbox`, `dialog`, `status`) y `aria-live` en anuncios dinámicos.
- Contraste AA sobre fondo negro absoluto.
- Respeta `prefers-reduced-motion`.

## Rendimiento

- Sin frameworks ni librerías externas: JS puro (~escasos KB por módulo).
- Animaciones limitadas a `transform`/`opacity`/`filter` para evitar *layout thrashing*.
- Imágenes optimizadas (`favicon.ico`, iconos PWA y `og-image` generados en tamaños ajustados).
- `IntersectionObserver` para animaciones on-scroll en vez de listeners de `scroll` costosos.

## Licencia

Uso personal. Hazlo tuyo, cambia los textos y compártelo con cariño.

# Auditoría SEO — gonzalobos.com

**Fecha:** 18-11-2026 · **Contexto:** después de migrar de Firebase a Vercel
**Fuentes:** código del repositorio, build de producción (`npm run build` → `dist/`) y revisión en vivo del dominio con `curl`.
**Datos de Search Console / Ads:** **no hay** CSV en el proyecto (ni `./seo-data/` ni en la raíz). Por eso esta auditoría se basa en el código y en el sitio publicado, sin datos reales de consultas. Ver la sección 6 para saber cómo exportarlos.

---

## 1. Diagnóstico en simple

### Lo que ya está bien (no hay que tocarlo)

| Área | Estado |
|---|---|
| **Google ve el contenido sin JavaScript** | ✅ `dist/es/index.html` y `dist/en/index.html` traen todo el texto, el título, la descripción, el canonical, los hreflang (`es`, `en`, `x-default`), Open Graph, Twitter Cards y JSON-LD ya escritos en el HTML. |
| **Idioma del documento** | ✅ `<html lang="es-CL">` en `/es` y `<html lang="en-US">` en `/en`. No queda fijo en español. |
| **Textos diferenciados por idioma** | ✅ Título, descripción, `jobTitle` del schema y `alt` de las imágenes están traducidos en cada versión. |
| **Dominio único** | ✅ `robots.txt`, `sitemap.xml`, canonical, hreflang y schema apuntan solo a `https://gonzalobos.com`. No hay referencias a `*.vercel.app` ni a Firebase en el código que se publica. |
| **Redirecciones** | ✅ `/` → `/es` (301), `/es/` → `/es` (308), las URL inexistentes devuelven un 404 real con `noindex`. Todo coincide con el canonical y el `x-default`. |
| **Encabezados** | ✅ Un solo `<h1>` por idioma, `<h2>` por sección y `<h3>` por elemento. |
| **Imágenes** | ✅ Formato WebP, versión de 960 px para móvil, `width`/`height` declarados (no hay saltos de diseño) y `alt` descriptivos. |
| **PDF del CV** | ✅ Tienen `noindex`, así que no compiten con la página principal. |

**Conclusión técnica:** la migración quedó sólida. Ninguno de los problemas de abajo impide que Google indexe el sitio.

### Lo que hoy frena el tráfico y los clientes

1. **El sitio está escrito como CV, no como una oferta de servicios.** El cierre de "Sobre mí" dice *"Busco trabajar con equipos innovadores…"* y el contacto dice *"Si te interesa colaborar…"*. Le habla a un reclutador, no a una empresa que necesita resultados en Google Ads o una web que venda. Google posiciona según lo que la página promete, y hoy promete **"un profesional disponible"**, no **"un servicio que resuelve un problema"**.
2. **Una sola página por idioma.** Con una sola URL solo se puede competir por el nombre ("Gonzalo Lobos") y, con suerte, por 1 o 2 búsquedas genéricas. Quien busca *"consultor Google Ads Santiago"* o *"desarrollo web para estudio jurídico"* espera una página dedicada a eso, y hoy no existe.
3. **El `<h1>` es solo el nombre.** "Gonzalo Lobos" es la señal más fuerte de la página y no dice qué haces. La especialidad está en un `<div>` aparte, que pesa menos para Google.
4. **El contenido aparece tarde en móviles lentos.** Todas las secciones salen del servidor con `opacity:0` y solo se ven cuando carga un JavaScript de **528 kB** (165 kB comprimido). Google lo indexa igual, pero el visitante con 4G lento ve una página vacía unos segundos, y eso afecta la tasa de rebote y las métricas de Core Web Vitals.
5. **Copias del sitio fuera del dominio principal.** `gonzalo-lobos-ba5e7.web.app` (Firebase) sigue publicando el sitio completo. Tiene canonical hacia gonzalobos.com, así que el daño es bajo, pero lo correcto es una redirección 301. Además, `www.gonzalobos.com` redirige con un **307 (temporal)** en vez de un 301/308 (permanente).

---

## 2. Hallazgos priorizados

### 🔴 Crítico (afecta directamente la captación de clientes)

| # | Hallazgo | Dónde | Por qué importa |
|---|---|---|---|
| C1 | **Posicionamiento de "busco trabajo" en vez de "ofrezco servicios"** | `about.callToAction`, `contact.subtitle` (`src/data/*/translation.json`) | Un cliente potencial que llega desde Google no encuentra una oferta ni una razón para escribirte. Es el mayor freno a la conversión. **Requiere tu decisión (ver sección 5).** |
| C2 | **El `<h1>` no contiene la especialidad** | `src/sections/Hero.jsx` | Es la señal on-page más fuerte. Debería decir algo como *"Gonzalo Lobos — Consultor en Google Ads, E-commerce y Desarrollo Web"* sin cambiar el diseño (la especialidad sigue viéndose como la etiqueta verde, pero dentro del `<h1>`). |
| C3 | **No hay ningún CTA de contacto en la primera pantalla** | `Hero.jsx` | Los dos botones son "Ver trabajos" y "Descargar CV". El botón de contacto/WhatsApp (`hero.secondaryButton` ya existe en las traducciones) no se usa. |

### 🟠 Importante

| # | Hallazgo | Dónde | Propuesta |
|---|---|---|---|
| I1 | **Secciones invisibles hasta que carga JS** (`opacity:0` en el HTML prerenderizado) | `src/components/AnimatedSection.jsx` | Animar solo el desplazamiento y no la opacidad, o usar CSS que respete `prefers-reduced-motion`. El contenido se ve al instante. |
| I2 | **Bundle de 528 kB** (aviso de Vite) | `PortfolioLayout-*.js` | a) Cargar solo el idioma activo (hoy van ES y EN juntos, ~68 kB de JSON); b) `LazyMotion` + `m` de framer-motion en lugar de `motion` (~-60 kB); c) separar `react`/`swiper`/`framer-motion` en chunks propios para que el navegador los guarde en caché entre deploys. |
| I3 | **Google Fonts bloquea el primer pintado** (3 familias: Inter, Oswald, Space Mono) | `index.html` | Autoalojar las fuentes en `/public/fonts` con `preload` de Oswald (la del `<h1>`), o al menos reducir los pesos cargados. |
| I4 | **Firebase sigue publicando una copia completa** | `gonzalo-lobos-ba5e7.web.app` | Desplegar en Firebase una configuración que solo haga 301 → `https://gonzalobos.com`, o desactivar el hosting (`firebase hosting:disable`). Se hace fuera de este repo. |
| I5 | **`www` → raíz con 307 (temporal) y doble salto** (`www/` → `/` → `/es`) | Panel de Vercel → Domains | Cambiar la redirección de `www.gonzalobos.com` a **308 permanente**. Es un ajuste de panel, no de código. |
| I6 | **Falta el schema `ProfessionalService`** (lo pediste; hoy hay `Person`, `WebSite`, `ProfilePage` e `ItemList`) | `src/seo.js` | Agregarlo **solo si** decides captar clientes (C1): servicios ofrecidos, `areaServed: Chile`, idiomas y contacto. Declararlo sin una oferta visible en la página no aporta. |

### 🟢 Mejora

| # | Hallazgo | Propuesta |
|---|---|---|
| M1 | Las tarjetas del slider (Swiper con `loop`) duplican "OSCAR" y otras tarjetas en el HTML → `<h3>` repetidos | Desactivar `loop` en el render del servidor o usar `rewind`. |
| M2 | El proyecto "OSCAR" enlaza a un WhatsApp distinto (`56988318443`) del de contacto (`56965961086`) | Confirmar cuál es el correcto. |
| M3 | `meta keywords`: Google la ignora desde 2009 | Se puede quitar; no hace daño. |
| M4 | El build publica `assets/prerender-*.js` (72 kB, no se usa en el navegador) | Excluirlo del output. |
| M5 | Imágenes que no se usan: `proyecto-lobos.jpg` (204 kB), `lobosMiniexcavadoras-web.webp`, `expansis-pro-web.webp`, `logo_GonzaloLobos_15x15.png` | Borrarlas (no afectan la velocidad, solo ordenan el repositorio). |
| M6 | `.firebase/hosting.*.cache` sigue en git y `prerender.jsx` menciona `firebase.json` | Limpiar el archivo y el comentario. |
| M7 | La foto de "Sobre mí" se carga desde `src/assets` con hash | Pasarla a WebP (~43 kB → ~15 kB). |
| M8 | `site.webmanifest` solo en español | No es relevante para SEO. Se puede dejar así. |

---

## 3. Tabla de oportunidades clave

> Sin datos de Search Console, son **hipótesis de demanda** para Chile. Se validan con los CSV (sección 6) antes de crear páginas.

| Búsqueda objetivo (ES) | Intención | Página que la responde | Estado |
|---|---|---|---|
| gonzalo lobos / gonzalo lobos ramírez | Marca personal | `/es` (portada) | ✅ Ya cubierta |
| consultor google ads santiago / freelance google ads chile | Contratar servicio | **Nueva:** `/es/consultor-google-ads` | ❌ No existe |
| desarrollo web para pymes chile / landing page que convierta | Contratar servicio | **Nueva:** `/es/desarrollo-web` | ❌ No existe |
| consultor e-commerce chile / especialista ecommerce | Contratar servicio | **Nueva:** `/es/consultor-ecommerce` | ❌ No existe |
| automatización whatsapp con IA para ventas | Contratar o informarse | **Nueva:** `/es/casos/oscar-agente-ia` | ❌ Solo es una tarjeta |
| caso de éxito google ads estudio jurídico | Prueba social | **Nueva:** `/es/casos/estudio-brkovic` | ❌ Solo es una tarjeta |
| google ads consultant chile (EN) | Cliente extranjero | `/en/google-ads-consultant` | ❌ (segunda prioridad) |

**Ojo con la canibalización:** si estos servicios ya se venden desde **expansispro.com**, las páginas de servicio en gonzalobos.com competirían con tu propia agencia en Google. En ese caso conviene que gonzalobos.com se enfoque en **marca personal + casos de éxito** y que cada caso termine con un enlace o CTA hacia Expansis Pro.

---

## 4. Plan de acción en 3 prioridades

### Prioridad 1 — Arreglos técnicos rápidos (1 sesión, sin cambio visual)
1. `<h1>` con la especialidad (C2), manteniendo el mismo estilo visual.
2. Botón de contacto/WhatsApp en el Hero (C3).
3. Contenido visible sin esperar al JS (I1).
4. Reducir el bundle: idioma bajo demanda, `LazyMotion` y chunks de proveedores (I2).
5. Fuentes autoalojadas con `preload` (I3).
6. Limpieza: `loop` de Swiper en SSR, `meta keywords`, `prerender-*.js`, imágenes sin uso, `.firebase/` (M1, M3–M6).
7. **Tú, en paneles externos:** `www` → 308 en Vercel (I5) y 301 o desactivar Firebase (I4).

### Prioridad 2 — Mejorar los textos actuales
1. Reescribir el cierre de "Sobre mí" y el subtítulo de Contacto con una propuesta orientada al cliente (C1).
2. Ajustar `seo.title` y `seo.description` hacia la intención comercial. Ejemplo ES: *"Gonzalo Lobos | Consultor Google Ads, E-commerce y Desarrollo Web en Chile"* (≤ 60 caracteres), con una descripción que cierre con un beneficio y un llamado a la acción.
3. Agregar a cada proyecto 1 resultado medible (CPA, conversión, leads, tiempo de respuesta). Es lo que convierte a un visitante en cliente.
4. Schema `ProfessionalService` (I6).

### Prioridad 3 — Páginas nuevas (después de validar con datos)
1. **Casos de éxito con URL propia** (`/es/casos/...`): las 2 o 3 mejores historias, con problema, solución, resultado y CTA. Es la opción más segura porque no compite con Expansis Pro.
2. **Páginas de servicio** (`/es/consultor-google-ads`, etc.): solo si decides captar clientes directamente en gonzalobos.com.
3. Cada página nueva va en el `sitemap.xml` con sus `hreflang`, se enlaza desde el menú y la portada, y termina en el formulario o WhatsApp.

> Técnicamente es viable: el prerender ya funciona por rutas, así que basta con agregar las rutas nuevas en `vite.config.js` (`additionalPrerenderRoutes`) y en `App.jsx`.

---

## 5. Decisión que necesito de ti

**¿Para quién es gonzalobos.com?**
- **A) Captar clientes directos** (freelance/consultoría): se reescriben los textos en ese tono, se agrega `ProfessionalService` y se crean páginas de servicio.
- **B) Marca personal que deriva a Expansis Pro** *(mi recomendación si Expansis es tu vehículo comercial)*: textos orientados a resultados, casos de éxito con URL propia y CTA hacia Expansis/WhatsApp, sin páginas de servicio que compitan con la agencia.
- **C) Perfil para empleadores:** se mantiene el tono actual y solo se aplica la Prioridad 1.

---

## 6. Para la próxima auditoría: exportar datos de Search Console

1. Search Console → **Rendimiento** → **Resultados de búsqueda** → rango "Últimos 16 meses" → **Exportar → CSV**.
2. Descomprimir en `./seo-data/` (`Consultas.csv`, `Páginas.csv`, `Gráfico.csv`, `Dispositivos.csv`, `Países.csv`).
3. Con esos datos se pueden detectar consultas en posiciones 4 a 20 (mejoras rápidas), demanda sin cubrir y URLs antiguas de Firebase que sigan apareciendo.

---

## 7. Implementación (Fase 2 — 18-11-2026)

**Decisión:** Opción C, sitio personal y CV orientado a reclutadores y empleadores. No se agregan `ProfessionalService` ni páginas de servicios. WhatsApp oficial: **+56 9 6596 1086**.

| Hallazgo | Estado | Cambio |
|---|---|---|
| C2 `<h1>` | ✅ | `<h1>` = nombre + especialidad (ES y EN), con el mismo aspecto visual. |
| C3 CTA en Hero | ✅ | Descargar CV + botón LinkedIn + enlace "¿Conversamos?" a #contact. |
| I1 Contenido invisible | ✅ | `AnimatedSection` sin `opacity:0` en el HTML; la animación solo se aplica tras hidratar y a secciones fuera de pantalla. También se quitaron los `opacity:0` de Experiencia, Estudios y Footer. |
| I2 Bundle | ✅ parcial | Separado en chunks de librerías (react, motion, swiper, i18n) para el caché; desaparece el aviso de 500 kB. El JS total sigue en ~530 kB (167 kB gzip): cargar las traducciones bajo demanda solo ahorraba ~8 kB gzip y retrasaba la hidratación. |
| I3 Fuentes | ✅ | Google Fonts → fuentes autoalojadas (`@fontsource`), sin conexión a terceros. |
| I4 Firebase | ⏳ Manual | Ver instrucciones en el resumen de la Fase 2. |
| I5 `www` 307 | ⏳ Manual | Se cambia en el panel de Vercel (Domains). |
| I6 Schema | ✅ | `Person` enriquecido: `hasOccupation`, `email`, `knowsLanguage`, `worksFor` con `@id` y `knowsAbout` ampliado. Sin `ProfessionalService`. |
| M1 Slider duplicado | ✅ Proyectos | Un solo carrusel Swiper en todos los tamaños. Quedan 2 `<h3>` repetidos (primer ítem de Experiencia y de Estudios, por la versión móvil): impacto mínimo. |
| M2 WhatsApp | ✅ | Número personal unificado en `seo.js` (`WHATSAPP_URL`) para Contacto y Footer. El proyecto OSCAR mantiene a propósito su propio número (`56988318443`). |
| M3 `meta keywords` | ✅ | Eliminada. |
| M4 `prerender-*.js` | ✅ | Ya no se publica en `dist/`. |
| M5 Imágenes sin uso | ✅ | Eliminadas (4 archivos). |
| M6 Restos de Firebase | ✅ | `.firebase/` fuera de git; comentario corregido. |

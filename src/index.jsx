// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Fuentes autoalojadas (mismo dominio, font-display: swap): no bloquean el primer render
import '@fontsource-variable/inter';
import '@fontsource-variable/oswald';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './index.css';
import i18n from './i18n.js';

const container = document.getElementById('root');

// El idioma lo dicta la URL (/es o /en), igual que en el prerender → hidratación sin desajustes
const urlLang = window.location.pathname.split('/').filter(Boolean)[0];
const lang = urlLang === 'en' ? 'en' : 'es';

const app = (
	<React.StrictMode>
		<App />
	</React.StrictMode>
);

i18n.changeLanguage(lang).then(() => {
	if (container.hasChildNodes()) {
		// HTML prerenderizado: se reutiliza (mejor LCP, sin parpadeo ni CLS)
		ReactDOM.hydrateRoot(container, app);
	} else {
		// Desarrollo (npm start): no hay HTML prerenderizado
		ReactDOM.createRoot(container).render(app);
	}
});

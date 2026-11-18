import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import path from 'path';

export default defineConfig({
	plugins: [
		react(),
		vitePrerenderPlugin({
			// Tu index.html usa <div id="root">, así que apuntamos ahí
			renderTarget: '#root',
			// Script de prerender (SEO estático)
			prerenderScript: path.resolve(process.cwd(), 'src/prerender.jsx'),
			// Rutas de idioma generadas explícitamente
			additionalPrerenderRoutes: ['/es', '/en'],
		}),
	],
	server: {
		// Con `vercel dev`, Vercel atiende /api/* con las funciones de api/ antes de llegar a Vite,
		// así que este proxy no interviene. Con `npm start` (Vite solo), /api/* se reenvía a un
		// `vercel dev` corriendo aparte (por defecto en :3000). Configurable con API_PROXY_TARGET.
		proxy: {
			'/api': {
				target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
				changeOrigin: true,
			},
		},
	},
});

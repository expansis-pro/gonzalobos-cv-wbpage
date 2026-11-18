import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import path from 'path';
import fs from 'fs/promises';

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
		// El script de prerender solo se usa durante el build: no se publica en dist/assets
		{
			name: 'drop-prerender-chunk',
			apply: 'build',
			// writeBundle corre después de que el prerender ya generó el HTML
			async writeBundle(opts, bundle) {
				for (const [fileName, output] of Object.entries(bundle)) {
					if (output.type === 'chunk' && output.facadeModuleId?.endsWith('prerender.jsx')) {
						await fs.rm(path.join(opts.dir, fileName), { force: true });
					}
				}
			},
		},
	],
	build: {
		rolldownOptions: {
			output: {
				// Librerías en chunks propios: cambian poco, así el navegador las mantiene en caché
				// entre deploys y solo vuelve a descargar el código propio del sitio.
				codeSplitting: {
					groups: [
						{
							name: 'vendor-react',
							// Excluye react-dom/server: solo lo usa el prerender en el build, no el navegador
							test: (id) =>
								/node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id) &&
								!/react-dom[\\/](server|cjs[\\/]react-dom-server)/.test(id),
							priority: 30,
						},
						{ name: 'vendor-motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
						{ name: 'vendor-swiper', test: /node_modules[\\/]swiper[\\/]/, priority: 20 },
						{ name: 'vendor-i18n', test: /node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/, priority: 20 },
					],
				},
			},
		},
	},
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

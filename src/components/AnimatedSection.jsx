// src/components/AnimatedSection.jsx
import React, { useEffect, useRef } from 'react';

/*
 * Animación de entrada sin ocultar el HTML prerenderizado.
 * El contenido sale del servidor VISIBLE (sin opacity:0), así se pinta desde el primer frame
 * aunque el JS aún no cargue. Tras hidratar, solo las secciones que están fuera de la pantalla
 * se preparan para animarse al entrar en el viewport (no hay parpadeo porque no se ven).
 */
const AnimatedSection = ({ children }) => {
	const ref = useRef(null);

	useEffect(() => {
		const el = ref.current;
		if (!el || typeof IntersectionObserver === 'undefined') return undefined;
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
		// Ya visible (o por encima del viewport): no se toca
		if (el.getBoundingClientRect().top < window.innerHeight) return undefined;

		el.classList.add('reveal-pending');
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				el.classList.remove('reveal-pending');
				el.classList.add('reveal-in');
				observer.disconnect();
			},
			{ rootMargin: '0px 0px -10% 0px' },
		);
		observer.observe(el);

		return () => {
			observer.disconnect();
			el.classList.remove('reveal-pending');
		};
	}, []);

	return <div ref={ref}>{children}</div>;
};

export default AnimatedSection;

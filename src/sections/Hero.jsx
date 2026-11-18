// src/sections/Hero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaLinkedin } from 'react-icons/fa';
import PrintCVButton from '../components/PrintCVButton';
import { LINKEDIN_URL } from '../seo';

const ButtonIcon = ({ children }) => <div className='w-5 h-5 flex-shrink-0'>{children}</div>;

const Hero = () => {
	const { t } = useTranslation();

	// Desplazamiento animado propio (requestAnimationFrame, ease-in-out ~600 ms) que descuenta
	// la altura del <nav> fijo; no depende de la configuración de movimiento del sistema operativo.
	const handleScroll = (e, targetId) => {
		e.preventDefault();
		const targetElement = document.querySelector(targetId);
		if (!targetElement) return;

		const navHeight = document.querySelector('nav')?.offsetHeight || 0;
		const startY = window.pageYOffset;
		const targetY = Math.max(0, targetElement.getBoundingClientRect().top + startY - navHeight);
		const distance = targetY - startY;
		const duration = 600;
		const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
		let startTime = null;

		const step = (now) => {
			if (startTime === null) startTime = now;
			const progress = Math.min((now - startTime) / duration, 1);
			window.scrollTo({ top: startY + distance * easeInOutCubic(progress), behavior: 'instant' });
			if (progress < 1) window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	};

	return (
		<section id='home' className='relative min-h-screen flex items-center justify-start bg-concrete bg-textura-prehispanica overflow-hidden'>
			<div className='container mx-auto px-6 text-left max-w-5xl'>
				<motion.div initial={{ x: -30 }} animate={{ x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className='space-y-4'>
					{/* H1 = nombre + especialidad (señal principal para Google), con el mismo aspecto visual de antes */}
					<h1 className='flex flex-col items-start gap-4'>
						<span className='uppercase text-5xl md:text-7xl lg:text-8xl font-black font-display text-structural tracking-tighter leading-none'>{t('hero.name')}</span>
						<span className='sr-only'> — </span>
						<span className='inline-block bg-primary text-white px-3 py-1 text-sm md:text-base font-black uppercase tracking-wider'>{t('hero.title')}</span>
					</h1>
					<p className='uppercase text-xs md:text-sm font-medium tracking-widest max-w-2xl text-structural/80 leading-relaxed pt-2'>{t('hero.subtitle')}</p>

					{/* BOTONES */}
					<div className='mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4 pt-4'>
						<motion.a
							href='#projects'
							onClick={(e) => handleScroll(e, '#projects')}
							className='flex items-center justify-center gap-3 border-structural hover:border-primary bg-structural border-2 hover:bg-primary  text-white font-black py-3.5 px-8 text-xs uppercase tracking-widest transition-colors duration-200 shadow-none'
							whileTap={{ scale: 0.98 }}>
							<ButtonIcon>
								<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2.5} stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0A2.25 2.25 0 015.625 7.5h12.75c1.243 0 2.25.992 2.25 2.224v.002z'
									/>
								</svg>
							</ButtonIcon>
							{t('hero.primaryButton')}
						</motion.a>

						<PrintCVButton />

						<motion.a
							href={LINKEDIN_URL}
							target='_blank'
							rel='noopener noreferrer me'
							whileTap={{ scale: 0.98 }}
							className='border-structural flex items-center justify-center gap-3 border-2 hover:border-primary hover:bg-primary hover:text-white text-structural font-black py-3.5 px-8 text-xs uppercase tracking-widest transition-all duration-200 w-full sm:w-auto'>
							<FaLinkedin className='h-4 w-4 flex-shrink-0' aria-hidden='true' />
							<span>{t('hero.linkedinButton')}</span>
						</motion.a>
					</div>

					<motion.a
						href='#contact'
						onClick={(e) => handleScroll(e, '#contact')}
						whileTap={{ scale: 0.98 }}
						className='inline-block pt-2 text-[11px] font-black uppercase tracking-widest text-structural underline underline-offset-4 decoration-2 decoration-primary hover:text-primary transition-colors'>
						{t('hero.contactLink')}
					</motion.a>
				</motion.div>
			</div>
		</section>
	);
};

export default Hero;

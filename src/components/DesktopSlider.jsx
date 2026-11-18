// src/components/DesktopSlider.jsx
import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import 'swiper/css';
import 'swiper/css/pagination';

const ArrowIcon = (props) => (
	<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={3} stroke='currentColor' {...props}>
		<path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
	</svg>
);

const DesktopSlider = ({ items, renderItem, sectionId, slidesPerView = 1 }) => {
	const { i18n } = useTranslation();
	const isEn = i18n.language === 'en';
	// Las flechas controlan la instancia directamente (sin buscar botones por clase CSS)
	const swiperRef = useRef(null);
	const arrowClass =
		'p-2.5 bg-[#eae7e2] border border-stone-300 text-structural hover:bg-structural hover:border-structural hover:text-white transition-colors rounded-none';

	return (
		<div className='relative w-full'>
			<Swiper
				modules={[Pagination]}
				onSwiper={(swiper) => {
					swiperRef.current = swiper;
				}}
				loop={true}
				// Cada clic cuenta aunque la transición anterior no haya terminado
				loopPreventsSliding={false}
				pagination={{ clickable: true }}
				spaceBetween={32}
				slidesPerView={slidesPerView}
				id={`${sectionId}-slider`}
				className='!py-4 !pb-14'>
				{items.map((item) => (
					<SwiperSlide key={item.id}>{renderItem(item)}</SwiperSlide>
				))}
			</Swiper>

			{/* Controles laterales estilo plano técnico */}
			{/* Móvil/tablet: en la fila de la paginación, bajo la tarjeta (no tapan contenido). Desktop: a los costados */}
			<div className='absolute bottom-1 left-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:-left-5 z-10'>
				<button
					type='button'
					onClick={() => swiperRef.current?.slidePrev()}
					aria-controls={`${sectionId}-slider`}
					className={arrowClass}
					aria-label={isEn ? 'Previous' : 'Anterior'}>
					<ArrowIcon className='h-5 w-5 transform rotate-180' />
				</button>
			</div>
			<div className='absolute bottom-1 right-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:-right-5 z-10'>
				<button
					type='button'
					onClick={() => swiperRef.current?.slideNext()}
					aria-controls={`${sectionId}-slider`}
					className={arrowClass}
					aria-label={isEn ? 'Next' : 'Siguiente'}>
					<ArrowIcon className='h-5 w-5' />
				</button>
			</div>
		</div>
	);
};

export default DesktopSlider;

// src/sections/Projects.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import SectionTitle from '../components/SectionTitle';
import ProjectCard from '../components/ProjectCard';
import AnimatedSection from '../components/AnimatedSection';
import DesktopSlider from '../components/DesktopSlider';

const Projects = () => {
	const { t } = useTranslation();
	const projects = t('projects.items', { returnObjects: true }) || [];
	const validProjects = Array.isArray(projects) ? projects.filter((item) => item && typeof item === 'object') : [];

	const renderSlideCard = (project) => (
		<div className='text-left'>
			<ProjectCard key={project.id} project={project} />
		</div>
	);

	return (
		<section id='projects' className='py-16 sm:py-20 bg-concrete'>
			<AnimatedSection>
				<div className='container mx-auto px-2 max-w-6xl text-left'>
					<SectionTitle title={t('projects.title')} />

					{/* Un solo carrusel (Swiper, táctil en móvil): cada proyecto aparece una sola vez en el HTML */}
					<div className='mt-12'>
						{validProjects.length > 1 ? (
							<DesktopSlider items={validProjects} renderItem={renderSlideCard} sectionId='projects' slidesPerView={1} />
						) : (
							validProjects.map(renderSlideCard)
						)}
					</div>
				</div>
			</AnimatedSection>
		</section>
	);
};

export default Projects;

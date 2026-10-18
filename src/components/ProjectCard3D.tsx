import React, { useRef, useState } from 'react';
import { ArrowUpRight, ExternalLink, Github, Layers } from 'lucide-react';
import { ProjectItem } from '../data/portfolioData';

interface ProjectCard3DProps {
  project: ProjectItem;
  customLinks: { github?: string; live?: string };
  onSelectProject: (project: ProjectItem) => void;
  onConfigureLinks: (project: ProjectItem) => void;
  reducedMotion: boolean;
}

export const ProjectCard3D: React.FC<ProjectCard3DProps> = ({
  project,
  customLinks,
  onSelectProject,
  onConfigureLinks,
  reducedMotion,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [imageError, setImageError] = useState<boolean>(false);

  const githubHref = customLinks.github || project.githubUrl;
  const liveHref = customLinks.live || project.liveUrl;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;
    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`
    );
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#160A2E]/90 to-[#0B0418]/90 backdrop-blur-xl border border-[#A855F7]/30 hover:border-[#C084FC]/70 overflow-hidden shadow-2xl shadow-[#7C3AED]/15"
    >
      <div>
        <div
          onClick={() => onSelectProject(project)}
          className="relative aspect-[4/3] w-full overflow-hidden bg-[#070312] cursor-pointer"
        >
          {!imageError ? (
            <img
              src={project.image}
              alt={`${project.title} — ${project.visualConcept}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#09070E] via-[#050505] to-[#A855F7]/20">
              <Layers className="w-10 h-10 text-[#A855F7] mb-3" />
              <span className="text-sm font-semibold text-[#FAF8FF]">{project.title}</span>
              <span className="text-xs text-[#A1A1AA] mt-1">{project.visualConcept}</span>
            </div>
          )}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09070E] via-[#09070E]/30 to-transparent"
          />

          <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-xs text-[#FAF8FF]/90">
            <span className="font-mono-tabular font-medium text-[#C084FC]">
              {project.index} · {project.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#FAF8FF] opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Inspect Architecture</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C084FC]" />
            </span>
          </div>
        </div>

        <div className="p-6 pb-4">
          <h3 className="text-xl font-bold text-[#FAF8FF] tracking-tight mb-2 group-hover:text-[#C084FC] transition-colors">
            <button
              type="button"
              onClick={() => onSelectProject(project)}
              className="text-left focus:outline-none focus-visible:underline cursor-pointer"
            >
              {project.title}
            </button>
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono-tabular text-[#C084FC] mb-3">
            {project.technologies.map((tech, idx) => (
              <React.Fragment key={tech}>
                <span>{tech}</span>
                {idx < project.technologies.length - 1 && (
                  <span aria-hidden="true" className="text-[#A1A1AA]/50">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            {project.description}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-3 mt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectProject(project)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>View Project</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2">
          {githubHref ? (
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
            >
              <Github className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>GitHub</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onConfigureLinks(project)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Repository URL placeholder — click to view status or attach link"
            >
              <Github className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>GitHub (Pending)</span>
            </button>
          )}

          {liveHref ? (
            <a
              href={liveHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Live Demo</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onConfigureLinks(project)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Live demo URL placeholder — click to view status or attach link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Demo (Pending)</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Github, Layers, Link2, X } from 'lucide-react';
import { ProjectItem } from '../data/portfolioData';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  initialFocusLinks?: boolean;
  customLinks: { github?: string; live?: string };
  onSaveLinks: (projectId: string, links: { github?: string; live?: string }) => void;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  initialFocusLinks = false,
  customLinks,
  onSaveLinks,
  onClose,
}) => {
  const [githubInput, setGithubInput] = useState<string>('');
  const [liveInput, setLiveInput] = useState<string>('');
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [showLinkEditor, setShowLinkEditor] = useState<boolean>(false);

  useEffect(() => {
    if (project) {
      setGithubInput(customLinks.github || project.githubUrl || '');
      setLiveInput(customLinks.live || project.liveUrl || '');
      setShowLinkEditor(initialFocusLinks);
      setSavedToast(false);
    }
  }, [project, customLinks, initialFocusLinks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  const activeGithub = customLinks.github || project.githubUrl;
  const activeLive = customLinks.live || project.liveUrl;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLinks(project.id, {
      github: githubInput.trim() || undefined,
      live: liveInput.trim() || undefined,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#050505]/85 backdrop-blur-lg overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl bg-[#09070E] border border-[#A855F7]/35 shadow-2xl overflow-hidden my-8"
      >
        <div className="relative h-60 sm:h-72 w-full bg-[#050505] overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09070E] via-[#09070E]/45 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-[#050505]/80 hover:bg-[#A855F7] text-[#FAF8FF] border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="text-xs font-mono-tabular text-[#C084FC] mb-1">
              {project.index} · {project.category}
            </div>
            <h2 id="modal-project-title" className="text-2xl sm:text-3xl font-bold text-[#FAF8FF]">
              {project.title}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono-tabular text-[#C084FC]">
            <span className="text-[#A1A1AA]">Stack:</span>
            {project.technologies.map((tech, index) => (
              <React.Fragment key={tech}>
                <span>{tech}</span>
                {index < project.technologies.length - 1 && (
                  <span aria-hidden="true" className="text-[#A1A1AA]/50">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#FAF8FF]">Project Overview</h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">{project.description}</p>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">{project.methodology}</p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-[#FAF8FF] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A855F7]" />
              <span>Key Technical Implementation</span>
            </h3>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              {project.architectureHighlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-[#C084FC] font-mono-tabular mt-0.5">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {activeGithub ? (
                <a
                  href={activeGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                >
                  <Github className="w-4 h-4" />
                  <span>Open GitHub Repository</span>
                </a>
              ) : (
                <span className="text-xs text-[#A1A1AA]">
                  GitHub Repository: <strong className="text-[#FAF8FF] font-normal">Placeholder (Not Linked Yet)</strong>
                </span>
              )}

              {activeLive ? (
                <a
                  href={activeLive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9333EA] hover:bg-[#7E22CE] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Live Deployment</span>
                </a>
              ) : (
                <span className="text-xs text-[#A1A1AA]">
                  · Live Demo: <strong className="text-[#FAF8FF] font-normal">Placeholder (Not Linked Yet)</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLinkEditor((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>{showLinkEditor ? 'Hide Link Manager' : 'Attach Real URLs'}</span>
            </button>
          </div>

          {showLinkEditor && (
            <form
              onSubmit={handleSave}
              className="p-4 rounded-xl bg-[#050505] border border-white/10 space-y-3"
            >
              <div className="text-xs text-[#A1A1AA]">
                Attach your verified GitHub repository or live deployment URLs below:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    placeholder="https://github.com/sameena/..."
                    className="w-full px-3 py-2 rounded-lg bg-[#09070E] border border-white/10 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={liveInput}
                    onChange={(e) => setLiveInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-[#09070E] border border-white/10 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                {savedToast && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#C084FC]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Links updated for this session</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors cursor-pointer"
                >
                  Save Project Links
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

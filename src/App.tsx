import React, { useEffect, useState } from 'react';
import {
  Award,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Github,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Linkedin,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Trophy,
  X,
} from 'lucide-react';
import defaultBackdropPortrait from './assets/images/hero_purple_portrait_backdrop_1791738221468.jpg';
import {
  ACHIEVEMENTS_AND_CERTS,
  EXPERIENCE_TIMELINE,
  FEATURED_PROJECTS,
  PERSONAL_BRAND,
  ProjectItem,
  SKILL_CATEGORIES,
} from './data/portfolioData';
import {
  CloudInquiryRecord,
  SavedResearchRecord,
  User,
  auth,
  createCloudInquiry,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  subscribeSavedResearch,
  subscribeUserInquiries,
} from './lib/firebase';
import { HeroCharacter3D } from './components/HeroCharacter3D';
import { ContactOrb3D } from './components/ContactOrb3D';
import { MovingBackground3D } from './components/MovingBackground3D';
import { ProjectCard3D } from './components/ProjectCard3D';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ScienceWorkbench } from './components/ScienceWorkbench';
import { GroundingExplorer } from './components/GroundingExplorer';
import { GeminiChatbot } from './components/GeminiChatbot';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'science', label: 'Science Lab' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
] as const;

export default function App() {
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [loadingOverlay, setLoadingOverlay] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [headlineIndex, setHeadlineIndex] = useState<number>(0);

  // Fixed Backside Portrait Image State (Persisted in localStorage so user's uploaded photo stays on scroll)
  const [backdropPhoto, setBackdropPhoto] = useState<string>(() => {
    try {
      localStorage.removeItem('sameena_backdrop_portrait');
      return localStorage.getItem('sameena_backdrop_portrait_purple_v2') || defaultBackdropPortrait;
    } catch {
      return defaultBackdropPortrait;
    }
  });
  const [isCustomBackdrop, setIsCustomBackdrop] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('sameena_backdrop_portrait_purple_v2'));
    } catch {
      return false;
    }
  });
  const [backdropBrightness, setBackdropBrightness] = useState<'subtle' | 'balanced' | 'vivid'>('balanced');

  // Firebase Auth & Firestore Real-Time State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [savedResearch, setSavedResearch] = useState<SavedResearchRecord[]>([]);
  const [cloudInquiries, setCloudInquiries] = useState<CloudInquiryRecord[]>([]);

  // Skill & Project Filter States
  const [selectedSkillCat, setSelectedSkillCat] = useState<string>('all');
  const [activeSkillDetail, setActiveSkillDetail] = useState<{
    name: string;
    category: string;
    context: string;
  } | null>(null);
  const [selectedProjectCat, setSelectedProjectCat] = useState<string>('All');
  const [modalProject, setModalProject] = useState<ProjectItem | null>(null);
  const [modalFocusLinks, setModalFocusLinks] = useState<boolean>(false);
  const [customProjectLinks, setCustomProjectLinks] = useState<
    Record<string, { github?: string; live?: string }>
  >(() => {
    try {
      const saved = localStorage.getItem('sameena_portfolio_project_links');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Social Profile Placeholder Links State
  const [socialLinks, setSocialLinks] = useState<{ linkedin: string; github: string }>(() => {
    try {
      const saved = localStorage.getItem('sameena_portfolio_social_links');
      return saved ? JSON.parse(saved) : { linkedin: '', github: '' };
    } catch {
      return { linkedin: '', github: '' };
    }
  });
  const [socialModalOpen, setSocialModalOpen] = useState<boolean>(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [contactResult, setContactResult] = useState<{
    ok: boolean;
    dispatchedExternally?: boolean;
    savedToFirestore?: boolean;
    notice: string;
  } | null>(null);

  // Custom Desktop Cursor Coordinates
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: -100,
    y: -100,
    visible: false,
  });

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        setContactForm((prev) => ({
          ...prev,
          name: prev.name || currentUser.displayName || '',
          email: prev.email || currentUser.email || '',
        }));
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners once authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setSavedResearch([]);
      setCloudInquiries([]);
      return;
    }

    const unsubResearch = subscribeSavedResearch(user.uid, (records) => {
      setSavedResearch(records);
    });
    const unsubInquiries = subscribeUserInquiries(user.uid, (records) => {
      setCloudInquiries(records);
    });

    return () => {
      unsubResearch();
      unsubInquiries();
    };
  }, [authReady, user]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Brief non-blocking entrance screen ("SAMEENA P")
  useEffect(() => {
    if (reducedMotion) {
      setLoadingOverlay(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingOverlay(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  // Cycle Hero Headlines
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % PERSONAL_BRAND.cyclingHeadlines.length);
    }, 3400);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Scroll listener for backside portrait parallax & active section indicator
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > 24);
      const scrollPos = y + 260;

      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const el = document.getElementById(NAV_ITEMS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(NAV_ITEMS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Desktop custom cursor tracking
  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY, visible: true });
    };
    const handleMouseLeave = () => {
      setCursorPos((prev) => ({ ...prev, visible: false }));
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion]);

  const handleUpdateBackdropPhoto = (dataUrl: string) => {
    setBackdropPhoto(dataUrl);
    setIsCustomBackdrop(true);
    try {
      localStorage.setItem('sameena_backdrop_portrait_purple_v2', dataUrl);
    } catch {
      // ignore quota errors
    }
  };

  const handleDirectBackdropFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateBackdropPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetBackdropPhoto = () => {
    setBackdropPhoto(defaultBackdropPortrait);
    setIsCustomBackdrop(false);
    try {
      localStorage.removeItem('sameena_backdrop_portrait_purple_v2');
    } catch {
      // ignore
    }
  };

  const handleSaveProjectLinks = (projectId: string, links: { github?: string; live?: string }) => {
    setCustomProjectLinks((prev) => {
      const updated = { ...prev, [projectId]: links };
      try {
        localStorage.setItem('sameena_portfolio_project_links', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleSaveSocialLinks = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('sameena_portfolio_social_links', JSON.stringify(socialLinks));
    } catch {
      // ignore storage errors
    }
    setSocialModalOpen(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setContactResult(null);

    let savedToFirestore = false;
    if (user) {
      try {
        await createCloudInquiry({
          authorName: contactForm.name,
          subject: contactForm.subject,
          message: contactForm.message,
        });
        savedToFirestore = true;
      } catch {
        // continue with backend submission as well
      }
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setContactResult({
          ok: false,
          notice: data.error || 'Please check your form inputs and try again.',
        });
      } else {
        setContactResult({
          ok: true,
          dispatchedExternally: data.dispatchedExternally,
          savedToFirestore,
          notice: savedToFirestore
            ? `Persisted in your Cloud Firestore database & server queue. ${data.externalNotice}`
            : data.externalNotice,
        });
      }
    } catch {
      setContactResult({
        ok: savedToFirestore,
        savedToFirestore,
        notice: savedToFirestore
          ? 'Saved directly to Cloud Firestore.'
          : 'Could not reach the backend server. Please use the direct Email Me button below to message sameena3437@gmail.com.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSkillCategories =
    selectedSkillCat === 'all'
      ? SKILL_CATEGORIES
      : SKILL_CATEGORIES.filter((cat) => cat.id === selectedSkillCat);

  const filteredProjects =
    selectedProjectCat === 'All'
      ? FEATURED_PROJECTS
      : FEATURED_PROJECTS.filter((p) => p.category === selectedProjectCat);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'programming':
        return <Terminal className="w-5 h-5 text-[#A855F7]" />;
      case 'ai-ml':
        return <Cpu className="w-5 h-5 text-[#C084FC]" />;
      case 'frameworks':
        return <Code2 className="w-5 h-5 text-[#A855F7]" />;
      case 'databases':
        return <Database className="w-5 h-5 text-[#C084FC]" />;
      default:
        return <Layers className="w-5 h-5 text-[#A855F7]" />;
    }
  };

  // Calculate fixed backside portrait opacity & parallax transform
  const portraitOpacityClass =
    backdropBrightness === 'vivid'
      ? 'opacity-65'
      : backdropBrightness === 'balanced'
      ? 'opacity-45'
      : 'opacity-28';

  const parallaxOffset = reducedMotion ? 0 : Math.min(scrollY * 0.04, 48);
  const parallaxScale = reducedMotion ? 1 : 1.03 + Math.min(scrollY * 0.00004, 0.06);

  return (
    <div className="relative min-h-screen bg-[#070312] text-[#FAF8FF]">
      {/* =====================================================================
          FIXED FULL-VIEWPORT BACKSIDE PORTRAIT LAYER (STAYS VISIBLE ON SCROLL)
         ===================================================================== */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#070312]"
      >
        <img
          src={backdropPhoto}
          alt="Sameena P Portrait Backdrop"
          referrerPolicy="no-referrer"
          style={{
            transform: `translate3d(0, -${parallaxOffset}px, 0) scale(${parallaxScale})`,
            transition: 'transform 120ms ease-out',
          }}
          className={`w-full h-full object-cover object-top ${portraitOpacityClass} transition-opacity duration-500`}
        />

        {/* Rich Royal-Purple & Violet-Obsidian Atmospheric Scrims */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070312]/92 via-[#12072B]/55 to-[#070312]/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070312]/70 via-[#160836]/25 to-[#070312]/92" />
        <div className="absolute -top-32 left-1/4 w-[540px] h-[540px] rounded-full bg-[#9333EA]/18 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[520px] h-[520px] rounded-full bg-[#A855F7]/15 blur-[130px]" />
        <div className="absolute inset-0 bg-fine-grid opacity-75" />
      </div>

      {/* FULL-SCREEN MOVING 3D SPATIAL LAYER (Grid Horizon, Floating 3D Polyhedra & Starfield) */}
      <MovingBackground3D scrollY={scrollY} />

      {/* Subtle Custom Desktop Cursor Ring (Amethyst Purple) */}
      {!reducedMotion && cursorPos.visible && (
        <div
          aria-hidden="true"
          style={{
            transform: `translate3d(${cursorPos.x - 16}px, ${cursorPos.y - 16}px, 0)`,
          }}
          className="pointer-events-none fixed top-0 left-0 z-50 hidden lg:block w-8 h-8 rounded-full border border-[#A855F7]/50 bg-[#A855F7]/10 transition-transform duration-75 ease-out"
        />
      )}

      {/* Elegant Initial Loading Overlay featuring "SAMEENA P" */}
      {loadingOverlay && (
        <div
          aria-label="Loading Sameena P Portfolio"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-300"
        >
          <div className="text-xs font-mono-tabular tracking-widest text-[#C084FC] mb-3">
            AI &amp; DATA SCIENCE PORTFOLIO
          </div>
          <div className="text-3xl sm:text-5xl font-bold font-display tracking-tight text-[#FAF8FF] mb-4">
            SAMEENA P
          </div>
          <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#C084FC] origin-left animate-pulse" />
          </div>
          <button
            type="button"
            onClick={() => setLoadingOverlay(false)}
            className="mt-6 text-xs text-[#A1A1AA] hover:text-[#FAF8FF] underline cursor-pointer"
          >
            Enter Portfolio Immediately
          </button>
        </div>
      )}

      {/* SLEEK GLASS-LIKE NAVBAR (Strict 3-Zone Contract) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-16 transition-colors duration-200 ${
          scrolled
            ? 'bg-[#0B041C]/90 backdrop-blur-xl border-b border-[#A855F7]/35 shadow-lg shadow-[#7C3AED]/15'
            : 'bg-[#0B041C]/55 backdrop-blur-md border-b border-[#A855F7]/20'
        }`}
      >
        <div className="max-w-[1360px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#home"
            className="text-lg font-bold font-display tracking-tight text-[#FAF8FF] hover:text-[#C084FC] transition-colors whitespace-nowrap shrink-0"
          >
            Sameena P
          </a>

          {/* Zone 2: Clean Single-Line Text Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#C084FC]'
                      : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (Google Auth / Connect) + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[#A855F7]/40 text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={`Signed in as ${user.email}`}
              >
                <LogOut className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>Sign Out ({user.displayName?.split(' ')[0] || 'User'})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-[#FAF8FF] hover:border-[#A855F7]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#09070E]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  activeSection === item.id ? 'text-[#C084FC]' : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* FOREGROUND SCROLLING CONTENT LAYER (GLIDES OVER FIXED PORTRAIT BACKDROP) */}
      <main className="relative z-10">
        {/* 3. HERO SECTION */}
        <section
          id="home"
          className="relative min-h-screen pt-24 pb-16 flex flex-col justify-center overflow-hidden"
        >
          <div className="max-w-[1360px] mx-auto w-full px-4 sm:px-8">
            {/* Backside Portrait Customization Bar */}
            <div className="mb-8 inline-flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[#09070E]/85 backdrop-blur-xl border border-[#A855F7]/30">
              <span className="px-2 text-xs text-[#FAF8FF] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>Scrolling Backside Portrait:</span>
              </span>

              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload My Personal Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDirectBackdropFileChange}
                  className="sr-only"
                />
              </label>

              {(['subtle', 'balanced', 'vivid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBackdropBrightness(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                    backdropBrightness === mode
                      ? 'bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/50'
                      : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                  }`}
                >
                  {mode}
                </button>
              ))}

              {isCustomBackdrop && (
                <button
                  type="button"
                  onClick={handleResetBackdropPhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#A1A1AA] hover:text-[#FAF8FF] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Studio Portrait</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Brand Typography & Introduction */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-mono-tabular tracking-wider text-[#C084FC] font-semibold">
                  <span>AI &amp; DATA SCIENCE ENGINEER</span>
                  <span aria-hidden="true" className="text-[#A1A1AA]">
                    ·
                  </span>
                  <span className="text-[#FAF8FF]/80 font-normal">CHENNAI, INDIA</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold font-display tracking-tight text-[#FAF8FF] leading-[1.04]">
                    SAMEENA P
                  </h1>

                  {/* Animated Cycling Headline in Amethyst Purple & Lavender-Orchid */}
                  <div className="min-h-[3.5rem] sm:min-h-[4rem] flex items-center">
                    <p
                      key={headlineIndex}
                      className="text-xl sm:text-2xl lg:text-[26px] font-semibold font-display bg-gradient-to-r from-[#FAF8FF] via-[#C084FC] to-[#A855F7] bg-clip-text text-transparent transition-opacity duration-300"
                    >
                      {PERSONAL_BRAND.cyclingHeadlines[headlineIndex]}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#FAF8FF]/90 leading-relaxed font-medium">
                  AI &amp; Data Science Engineer · Full-Stack Developer · AI/ML Enthusiast · UI/UX Designer · SEO Analyst
                </p>

                <p className="text-base text-[#A1A1AA] leading-relaxed max-w-2xl">
                  {PERSONAL_BRAND.intro}
                </p>

                {/* Two Prominent Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <a
                    href="#projects"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-sm font-semibold text-[#FAF8FF] shadow-lg shadow-[#A855F7]/25 transition-all whitespace-nowrap shrink-0"
                  >
                    <span>Explore My Work</span>
                  </a>

                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#09070E]/85 hover:bg-white/10 border border-[#A855F7]/40 hover:border-[#C084FC] text-sm font-semibold text-[#FAF8FF] transition-all whitespace-nowrap shrink-0"
                  >
                    <span>Let’s Connect</span>
                  </a>
                </div>

                <div className="pt-2 text-xs font-mono-tabular text-[#C084FC]/90">
                  “{PERSONAL_BRAND.philosophy}”
                </div>
              </div>

              {/* Right Column: Interactive 3D Character Centerpiece */}
              <div className="lg:col-span-6">
                <HeroCharacter3D
                  reducedMotion={reducedMotion}
                  onUpdateBackdropPhoto={handleUpdateBackdropPhoto}
                />
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-10 flex justify-center">
              <a
                href="#about"
                aria-label="Scroll to About Me section"
                className="inline-flex flex-col items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#C084FC] transition-colors"
              >
                <span>Scroll Details Over Portrait</span>
                <ChevronDown className="w-4 h-4 text-[#A855F7] animate-bounce" />
              </a>
            </div>
          </div>
        </section>

        {/* 4. ABOUT ME — BEYOND THE CODE (Translucent over Backside Portrait) */}
        <section id="about" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-14">
            {/* Key Academic & Hackathon Proof Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-2xl glass-panel-interactive flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-4">
                  <span>ACADEMIC EXCELLENCE</span>
                  <GraduationCap className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-bold font-mono-tabular text-[#FAF8FF] tracking-tight">
                    8.5 <span className="text-lg font-normal text-[#C084FC]">CGPA</span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-2">
                    B.Tech in Artificial Intelligence &amp; Data Science · DMI College of Engineering
                  </p>
                </div>
              </div>

              <div className="p-7 rounded-2xl glass-panel-interactive flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-4">
                  <span>EXPECTED GRADUATION</span>
                  <Sparkles className="w-5 h-5 text-[#C084FC]" />
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-bold font-mono-tabular text-[#FAF8FF] tracking-tight">
                    2028
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-2">
                    Undergraduate Cohort · Chennai, Tamil Nadu, India
                  </p>
                </div>
              </div>

              <div className="p-7 rounded-2xl glass-panel-interactive flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-4">
                  <span>NATIONAL HACKATHON HONOR</span>
                  <Trophy className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-display text-[#FAF8FF] tracking-tight">
                    First Prize
                  </div>
                  <p className="text-xs text-[#C084FC] font-medium mt-1">
                    She Hackathon 2025 · March 8, 2025
                  </p>
                </div>
              </div>
            </div>

            {/* Narrative Card Gliding Over Portrait */}
            <div className="p-8 sm:p-12 rounded-2xl glass-panel grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                  01. BEYOND THE CODE
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                  A Little About Me
                </h2>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Bridging analytical data science rigor with full-stack product engineering and human-centered interface design.
                </p>
              </div>

              <div className="lg:col-span-7 space-y-6 text-base text-[#A1A1AA] leading-relaxed">
                <p>
                  I am an <strong className="text-[#FAF8FF] font-semibold">AI &amp; Data Science undergraduate</strong> at{' '}
                  <strong className="text-[#FAF8FF] font-semibold">DMI College of Engineering</strong> in Chennai, Tamil Nadu, maintaining an{' '}
                  <span className="font-mono-tabular text-[#C084FC]">8.5 CGPA</span> (Expected Graduation: <span className="font-mono-tabular text-[#C084FC]">2028</span>).
                </p>
                <p>
                  My hands-on experience spans <strong className="text-[#FAF8FF] font-semibold">software development</strong>,{' '}
                  <strong className="text-[#FAF8FF] font-semibold">business analysis</strong>,{' '}
                  <strong className="text-[#FAF8FF] font-semibold">software testing</strong>,{' '}
                  <strong className="text-[#FAF8FF] font-semibold">SEO analysis</strong>, and{' '}
                  <strong className="text-[#FAF8FF] font-semibold">research and development (R&amp;D)</strong>. Whether training convolutional neural networks for medical imaging, comparing supervised classifiers on clinical datasets, or engineering full-stack React.js, Node.js, and FastAPI web applications, I focus on building reliable, well-tested digital products that solve real problems.
                </p>

                <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#A1A1AA] block mb-1">Degree &amp; Institution</span>
                    <span className="text-[#FAF8FF] font-medium">
                      B.Tech AI &amp; Data Science · DMI College of Engineering
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block mb-1">Core Focus Areas</span>
                    <span className="text-[#FAF8FF] font-medium">
                      AI/ML · Full-Stack Dev · Business &amp; SEO Analysis · QA Testing · R&amp;D
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TECHNICAL SKILLS — INTERACTIVE SKILL UNIVERSE */}
        <section id="skills" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                  02. INTERACTIVE SKILL UNIVERSE
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                  Technical Skills &amp; Architecture Stack
                </h2>
                <p className="text-sm text-[#A1A1AA] max-w-2xl">
                  Organized across core programming languages, deep learning workflows, full-stack frameworks, databases, and supervised machine learning algorithms. Click any skill node to inspect its practical application context.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#09070E]/90 backdrop-blur-xl border border-white/10"
                role="group"
                aria-label="Filter skills by category"
              >
                <button
                  type="button"
                  onClick={() => setSelectedSkillCat('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedSkillCat === 'all'
                      ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                      : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                  }`}
                >
                  All Domains
                </button>
                {SKILL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedSkillCat(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedSkillCat === cat.id
                        ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                        : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {activeSkillDetail && (
              <div className="p-5 rounded-xl glass-panel border-[#A855F7]/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono-tabular text-[#C084FC]">
                    {activeSkillDetail.category} · Applied Engineering Context
                  </div>
                  <div className="text-base font-bold text-[#FAF8FF]">{activeSkillDetail.name}</div>
                  <p className="text-sm text-[#A1A1AA]">{activeSkillDetail.context}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSkillDetail(null)}
                  className="text-xs text-[#A1A1AA] hover:text-[#FAF8FF] px-2 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkillCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-6 rounded-2xl glass-panel-interactive flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold font-display text-[#FAF8FF]">
                        {category.title}
                      </h3>
                      {getCategoryIcon(category.id)}
                    </div>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{category.subtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {category.skills.map((skill) => {
                      const isSelected = activeSkillDetail?.name === skill.name;
                      return (
                        <button
                          key={skill.name}
                          type="button"
                          onClick={() => setActiveSkillDetail(skill)}
                          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#FAF8FF]'
                              : 'bg-[#050505]/70 border-white/10 hover:border-[#A855F7]/50 text-[#FAF8FF]'
                          }`}
                        >
                          <div className="text-xs font-semibold tracking-tight">{skill.name}</div>
                          <div className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                            {skill.context}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. PROJECTS — FEATURED WORK */}
        <section id="projects" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                  03. FEATURED WORK
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                  Selected AI, Data Science &amp; Full-Stack Projects
                </h2>
                <p className="text-sm text-[#A1A1AA] max-w-2xl">
                  Interactive showcase of real academic and engineering projects across clinical machine learning, deep learning diagnostics, SaaS SEO analytics, digital safety, and full-stack web hospitality.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#09070E]/90 backdrop-blur-xl border border-white/10"
                role="group"
                aria-label="Filter projects by domain"
              >
                {(['All', 'AI & Machine Learning', 'Full-Stack & SaaS', 'Web Application'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedProjectCat(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedProjectCat === cat
                          ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                          : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredProjects.map((project) => (
                <ProjectCard3D
                  key={project.id}
                  project={project}
                  customLinks={customProjectLinks[project.id] || {}}
                  onSelectProject={(proj) => {
                    setModalFocusLinks(false);
                    setModalProject(proj);
                  }}
                  onConfigureLinks={(proj) => {
                    setModalFocusLinks(true);
                    setModalProject(proj);
                  }}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CLINICAL BIOINFORMATICS & SCIENCE WORKBENCH + SEARCH & MAPS GROUNDING */}
        <section id="science" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-14">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                04. SCIENTIFIC BIOINFORMATICS &amp; GROUNDED AI LAB
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                Clinical Biomarker Workbench &amp; Grounded Intelligence
              </h2>
              <p className="text-sm text-[#A1A1AA]">
                Extending Sameena P’s healthcare machine learning work (<strong className="text-[#FAF8FF]">Diabetes Prediction System</strong> &amp; <strong className="text-[#FAF8FF]">Brain Tumor MRI Detection</strong>) with live AlphaFold DB 3D protein structures, UniProtKB functional domains, Europe PMC citations, and live Google Search &amp; Google Maps grounding.
              </p>
            </div>

            {/* Science Workbench (AlphaFold DB + UniProtKB + Europe PMC + Firestore Bookmarks) */}
            <ScienceWorkbench
              user={user}
              savedRecords={savedResearch}
              reducedMotion={reducedMotion}
            />

            {/* Google Search Grounding + Google Maps Grounding */}
            <GroundingExplorer />
          </div>
        </section>

        {/* 7. EXPERIENCE — MY PROFESSIONAL JOURNEY */}
        <section id="experience" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-12">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                05. MY PROFESSIONAL JOURNEY
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                Experience &amp; Internships
              </h2>
              <p className="text-sm text-[#A1A1AA]">
                Hands-on industry internships across software engineering, business analysis, quality assurance, SEO analysis, R&amp;D, and AI/ML.
              </p>
            </div>

            <div className="relative pl-6 sm:pl-10 border-l border-[#A855F7]/35 space-y-10">
              {EXPERIENCE_TIMELINE.map((exp, index) => (
                <div key={exp.id} className="relative group">
                  <div
                    aria-hidden="true"
                    className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#050505] border-2 border-[#A855F7] group-hover:border-[#C084FC] transition-colors"
                  />

                  <div className="p-6 sm:p-8 rounded-2xl glass-panel-interactive space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4 text-[#A855F7]" />
                        <h3 className="text-xl font-bold font-display text-[#FAF8FF]">
                          {exp.company}
                        </h3>
                      </div>
                      <span className="text-xs font-mono-tabular text-[#C084FC]">
                        0{index + 1} · {exp.period}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-[#FAF8FF]">{exp.role}</div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono-tabular text-[#C084FC]">
                      <span className="text-[#A1A1AA]">Focus Areas:</span>
                      {exp.areas.map((area, idx) => (
                        <React.Fragment key={area}>
                          <span>{area}</span>
                          {idx < exp.areas.length - 1 && (
                            <span aria-hidden="true" className="text-[#A1A1AA]/50">
                              ·
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <p className="text-sm text-[#A1A1AA] leading-relaxed">{exp.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. ACHIEVEMENTS AND CERTIFICATIONS */}
        <section id="achievements" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-12">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                06. HONORS &amp; CREDENTIALS
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                Achievements &amp; Certifications
              </h2>
              <p className="text-sm text-[#A1A1AA]">
                Hackathon awards, technical training programs, and verified internship credentials.
              </p>
            </div>

            {/* Prominent First-Prize Spotlight Card */}
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#09070E]/90 via-[#9333EA]/20 to-[#C084FC]/15 backdrop-blur-xl border border-[#A855F7]/50 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono-tabular text-[#C084FC] font-semibold">
                  <Trophy className="w-4 h-4 text-[#A855F7]" />
                  <span>FIRST PRIZE WINNER · MARCH 8, 2025</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#FAF8FF]">
                  First Prize — She Hackathon 2025
                </h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Awarded First Prize at She Hackathon 2025 on March 8, 2025, recognizing technical execution, problem-solving innovation, and end-to-end engineering presentation.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-4 px-5 py-4 rounded-xl bg-[#050505]/85 border border-[#A855F7]/35">
                <Award className="w-8 h-8 text-[#C084FC]" />
                <div>
                  <div className="text-xs text-[#A1A1AA]">Event Date</div>
                  <div className="text-sm font-mono-tabular font-semibold text-[#FAF8FF]">
                    March 8, 2025
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Achievements & Certifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ACHIEVEMENTS_AND_CERTS.filter((item) => !item.highlight).map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl glass-panel-interactive flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-mono-tabular text-[#C084FC]">
                      {item.organization} · {item.type}
                    </div>
                    <h3 className="text-lg font-bold font-display text-[#FAF8FF]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#A1A1AA] leading-relaxed">{item.details}</p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#A1A1AA]">
                    <span>Verified Credential</span>
                    <span className="font-mono-tabular text-[#FAF8FF]">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. CONTACT — LET'S BUILD SOMETHING */}
        <section id="contact" className="py-24 border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Headline, Direct Details & Interactive 3D Orb */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-3">
                  <div className="text-xs font-mono-tabular text-[#C084FC] font-semibold">
                    07. LET’S BUILD SOMETHING
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#FAF8FF] tracking-tight">
                    Have an Idea? Let’s Make It Real.
                  </h2>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    I’m always interested in exploring innovative ideas, building useful applications, and collaborating on meaningful technology projects.
                  </p>
                </div>

                <ContactOrb3D reducedMotion={reducedMotion} />

                <div className="p-6 rounded-2xl glass-panel space-y-4">
                  <div className="flex items-center gap-3.5">
                    <Mail className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <div className="text-sm">
                      <span className="text-xs text-[#A1A1AA] block">Email</span>
                      <a
                        href={`mailto:${PERSONAL_BRAND.email}`}
                        className="text-[#FAF8FF] hover:text-[#C084FC] font-mono-tabular transition-colors"
                      >
                        {PERSONAL_BRAND.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Phone className="w-4 h-4 text-[#C084FC] shrink-0" />
                    <div className="text-sm">
                      <span className="text-xs text-[#A1A1AA] block">Phone</span>
                      <a
                        href={`tel:+91${PERSONAL_BRAND.phone}`}
                        className="text-[#FAF8FF] hover:text-[#C084FC] font-mono-tabular transition-colors"
                      >
                        {PERSONAL_BRAND.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <MapPin className="w-4 h-4 text-[#A855F7] shrink-0" />
                    <div className="text-sm">
                      <span className="text-xs text-[#A1A1AA] block">Location</span>
                      <span className="text-[#FAF8FF]">{PERSONAL_BRAND.location}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5">
                    <a
                      href={`mailto:${PERSONAL_BRAND.email}?subject=Technology%20Collaboration%20%E2%80%94%20Sameena%20P`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Me</span>
                    </a>

                    {socialLinks.linkedin ? (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-[#C084FC]" />
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSocialModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-[#C084FC]" />
                        <span>LinkedIn (Placeholder)</span>
                      </button>
                    )}

                    {socialLinks.github ? (
                      <a
                        href={socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Github className="w-3.5 h-3.5 text-[#A855F7]" />
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSocialModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Github className="w-3.5 h-3.5 text-[#A855F7]" />
                        <span>GitHub (Placeholder)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Functional Contact Form + Cloud Firestore Persistence */}
              <div className="lg:col-span-7 space-y-6">
                <form
                  onSubmit={handleContactSubmit}
                  className="p-6 sm:p-10 rounded-2xl glass-panel space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold font-display text-[#FAF8FF]">
                        Send a Direct Inquiry
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        Connected to Cloud Firestore &amp; the portfolio backend with input validation.
                      </p>
                    </div>
                    {user && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-[#C084FC]">
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Firestore Sync Active</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-[#FAF8FF] mb-2"
                      >
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="e.g., Priya Sharma"
                        className="w-full px-4 py-3 rounded-xl bg-[#050505]/90 border border-white/15 text-sm text-[#FAF8FF] placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#A855F7]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-[#FAF8FF] mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#050505]/90 border border-white/15 text-sm text-[#FAF8FF] placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#A855F7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-medium text-[#FAF8FF] mb-2"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      minLength={3}
                      maxLength={160}
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      placeholder="Internship Opportunity / AI Project Collaboration"
                      className="w-full px-4 py-3 rounded-xl bg-[#050505]/90 border border-white/15 text-sm text-[#FAF8FF] placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#A855F7]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-medium text-[#FAF8FF] mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      required
                      minLength={10}
                      maxLength={2000}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="Share details about your project, role, or collaboration idea..."
                      className="w-full px-4 py-3 rounded-xl bg-[#050505]/90 border border-white/15 text-sm text-[#FAF8FF] placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#A855F7] resize-y"
                    />
                  </div>

                  {contactResult && (
                    <div
                      role="status"
                      className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                        contactResult.ok
                          ? 'bg-[#A855F7]/15 border-[#A855F7]/40 text-[#FAF8FF]'
                          : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#C084FC] shrink-0" />
                        <span>
                          {contactResult.ok
                            ? contactResult.dispatchedExternally
                              ? 'Message Dispatched via Configured Email Service'
                              : 'Inquiry Validated & Logged'
                            : 'Submission Error'}
                        </span>
                      </div>
                      <p className="text-[#A1A1AA]">{contactResult.notice}</p>
                      {contactResult.ok && !contactResult.dispatchedExternally && (
                        <div className="pt-1">
                          <a
                            href={`mailto:${PERSONAL_BRAND.email}?subject=${encodeURIComponent(
                              contactForm.subject
                            )}&body=${encodeURIComponent(
                              `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message}`
                            )}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A855F7] text-[#FAF8FF] font-semibold hover:bg-[#9333EA] transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Open in Default Email Client to Send Immediately</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] disabled:opacity-50 text-sm font-semibold text-[#FAF8FF] shadow-lg shadow-[#A855F7]/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Validating & Saving...' : 'Send Message'}</span>
                    </button>

                    <span className="text-xs text-[#A1A1AA]">
                      Direct Inbox:{' '}
                      <a
                        href={`mailto:${PERSONAL_BRAND.email}`}
                        className="text-[#C084FC] hover:underline font-mono-tabular"
                      >
                        {PERSONAL_BRAND.email}
                      </a>
                    </span>
                  </div>
                </form>

                {/* User's Submitted Firestore Inquiries History */}
                {user && cloudInquiries.length > 0 && (
                  <div className="p-6 rounded-2xl glass-panel space-y-3">
                    <div className="text-xs font-mono-tabular text-[#C084FC]">
                      YOUR CLOUD FIRESTORE INQUIRIES ({cloudInquiries.length})
                    </div>
                    <div className="space-y-2">
                      {cloudInquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-3.5 rounded-xl bg-[#050505]/80 border border-white/10 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#FAF8FF]">{inq.subject}</span>
                            <span className="font-mono-tabular text-[#C084FC]">{inq.status}</span>
                          </div>
                          <p className="text-[#A1A1AA]">{inq.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* CLEAN EDITORIAL FOOTER */}
      <footer className="relative z-10 py-10 border-t border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A1A1AA]">
          <div>
            <span className="font-semibold text-[#FAF8FF]">Sameena P</span> · AI &amp; Data Science Engineer · Chennai, Tamil Nadu, India
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#home" className="hover:text-[#C084FC] transition-colors">
              Back to Top
            </a>
            <a href="#projects" className="hover:text-[#C084FC] transition-colors">
              Projects
            </a>
            <a href="#science" className="hover:text-[#C084FC] transition-colors">
              Science Lab
            </a>
            <a
              href={`mailto:${PERSONAL_BRAND.email}`}
              className="hover:text-[#C084FC] transition-colors"
            >
              {PERSONAL_BRAND.email}
            </a>
          </div>
        </div>
      </footer>

      {/* MULTI-TURN GEMINI CHATBOT */}
      <GeminiChatbot />

      {/* PROJECT DETAIL & LINK CONFIGURATION MODAL */}
      <ProjectDetailModal
        project={modalProject}
        initialFocusLinks={modalFocusLinks}
        customLinks={modalProject ? customProjectLinks[modalProject.id] || {} : {}}
        onSaveLinks={handleSaveProjectLinks}
        onClose={() => setModalProject(null)}
      />

      {/* SOCIAL PROFILE PLACEHOLDER CONFIGURATION MODAL */}
      {socialModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setSocialModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#09070E] border border-[#A855F7]/35 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-[#FAF8FF]">
                Configure Social Profile Links
              </h3>
              <button
                type="button"
                onClick={() => setSocialModalOpen(false)}
                className="p-1 text-[#A1A1AA] hover:text-[#FAF8FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Paste your official LinkedIn and GitHub profile URLs below to activate them:
            </p>
            <form onSubmit={handleSaveSocialLinks} className="space-y-3">
              <div>
                <label className="block text-xs text-[#FAF8FF] mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={socialLinks.linkedin}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({ ...prev, linkedin: e.target.value }))
                  }
                  placeholder="https://www.linkedin.com/in/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-white/10 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#FAF8FF] mb-1">GitHub Profile URL</label>
                <input
                  type="url"
                  value={socialLinks.github}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({ ...prev, github: e.target.value }))
                  }
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-white/10 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[#A1A1AA] hover:text-[#FAF8FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#A855F7] text-xs font-semibold text-[#FAF8FF] hover:bg-[#9333EA] cursor-pointer"
                >
                  Save Profile URLs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

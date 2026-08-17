import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortfolioFooter } from '../components/PortfolioFooter';
import { profile, projects } from '../data/content';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4';
const SENSITIVITY = 0.8;

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousX = useRef<number | null>(null);
  const pendingTime = useRef<number | null>(null);
  const isSeeking = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const startSeek = useCallback(() => {
    const video = videoRef.current;
    const targetTime = pendingTime.current;
    if (!video || targetTime === null || isSeeking.current) return;

    if (Math.abs(video.currentTime - targetTime) < 0.003) {
      pendingTime.current = null;
      return;
    }

    isSeeking.current = true;
    video.currentTime = targetTime;
  }, []);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    isSeeking.current = false;
    if (pendingTime.current !== null && Math.abs(video.currentTime - pendingTime.current) >= 0.003) {
      startSeek();
    } else {
      pendingTime.current = null;
    }
  }, [startSeek]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

      if (previousX.current === null) {
        previousX.current = event.clientX;
        return;
      }

      const delta = event.clientX - previousX.current;
      previousX.current = event.clientX;
      if (delta === 0) return;

      const baseTime = pendingTime.current ?? video.currentTime;
      const offset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      pendingTime.current = Math.min(video.duration, Math.max(0, baseTime + offset));
      startSeek();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [startSeek]);

  const navigateToSection = (id: string) => {
    setMenuOpen(false);
    window.setTimeout(() => scrollToSection(id), 150);
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-black">
      <video
        ref={videoRef}
        className="fixed inset-0 z-0 h-full w-full object-cover object-[70%_center]"
        muted
        playsInline
        preload="auto"
        onSeeked={handleSeeked}
        aria-hidden="true"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 md:px-10">
        <Link to="/" className="text-[18px] tracking-tight text-black sm:text-[22px]" style={{ fontFamily: 'var(--font-heading)' }}>Rayn｜AI产品作品集</Link>
        <nav className="hidden items-center gap-7 text-base text-black md:flex" aria-label="作品集导航">
          <button type="button" className="transition-opacity hover:opacity-60" onClick={() => scrollToSection('profile')}>基本信息</button>
          <button type="button" className="transition-opacity hover:opacity-60" onClick={() => scrollToSection('work')}>作品集</button>
        </nav>
        <button
          type="button"
          className="flex flex-col gap-[5px] p-1 md:hidden"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
        >
          <span className={`h-[2px] w-6 bg-black transition duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`h-[2px] w-6 bg-black transition duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`h-[2px] w-6 bg-black transition duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </header>

      <nav
        className={`fixed inset-0 z-[9] flex flex-col justify-center gap-8 bg-[#f4f1eb]/95 px-8 text-left text-[32px] text-black backdrop-blur-sm transition-opacity duration-300 md:hidden ${menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-label="移动端作品集导航"
      >
        <button type="button" className="w-fit text-left" onClick={() => navigateToSection('profile')}>基本信息</button>
        <button type="button" className="w-fit text-left" onClick={() => navigateToSection('work')}>作品集</button>
      </nav>

      <section className="relative z-[1] flex h-screen items-center justify-center overflow-hidden px-5 pt-20 text-center sm:px-8 md:px-10">
        <div className="absolute inset-0 bg-[#f4f1eb]/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="text-5xl leading-none text-black sm:text-7xl md:text-8xl" style={{ fontFamily: 'var(--font-heading)' }}>ABOUT ME</p>
          <h1 className="mx-auto mt-8 max-w-[1280px] text-[18px] font-normal leading-relaxed text-black sm:text-[20px] md:text-[22px]">
            {profile.introLines.map((line) => <span key={line} className="block xl:whitespace-nowrap">{line}</span>)}
          </h1>
          <div className="mt-10 flex flex-wrap justify-center gap-y-1">
            <button type="button" onClick={() => scrollToSection('profile')} className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-[0.45em] text-[14px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:text-[15px]">
              我的基本信息
            </button>
            <button type="button" onClick={() => scrollToSection('work')} className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-[0.45em] text-[14px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:text-[15px]">
              我的作品集
            </button>
          </div>
        </div>
      </section>

      <section id="profile" className="relative z-[1] bg-[#f4f1eb] px-5 py-20 text-black sm:px-8 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="border-b border-black/20 pb-10">
            <p className="text-sm text-black/60">我的基本信息 / PROFILE</p>
            <h2 className="mt-3 max-w-3xl text-4xl leading-[1.04] tracking-tight sm:text-6xl">教育、实践与产品能力。</h2>
          </div>
          <div className="grid border-b border-black/20 lg:grid-cols-[1.1fr_1.2fr_1fr]">
            <section className="border-b border-black/20 py-8 lg:border-b-0 lg:border-r lg:pr-8">
              <p className="text-xs text-black/55">教育背景</p>
              <div className="mt-6 grid gap-6">
                {profile.education.map((item) => (
                  <div key={item.school}>
                    <p className="text-lg leading-tight">{item.school}</p>
                    <p className="mt-2 text-sm leading-relaxed text-black/65">{item.program}</p>
                    <p className="mt-2 text-sm text-black/50">{item.period}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="border-b border-black/20 py-8 lg:border-b-0 lg:border-r lg:px-8">
              <p className="text-xs text-black/55">实践经历</p>
              <div className="mt-6 grid gap-6">
                {profile.experiences.map((item) => (
                  <div key={item.organization}>
                    <p className="text-lg leading-tight">{item.organization}</p>
                    <p className="mt-2 text-sm leading-relaxed text-black/65">{item.focus}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="py-8 lg:pl-8">
              <p className="text-xs text-black/55">能力与联系</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.skillTags.map((skill) => <span key={skill} className="rounded-full border border-black/20 px-3 py-1.5 text-sm text-black/70">{skill}</span>)}
              </div>
              <div className="mt-8 grid gap-2 text-sm text-black/65">
                <span>{profile.role}</span>
                <span>{profile.location}</span>
                <a className="w-fit text-black underline underline-offset-4 transition-opacity hover:opacity-60" href={`mailto:${profile.emailLabel}`}>{profile.emailLabel}</a>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="work" className="relative z-[1] bg-[#f4f1eb] px-5 py-20 text-black sm:px-8 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-black/60">我的作品集 / SELECTED WORK</p>
              <h2 className="mt-3 max-w-3xl text-4xl leading-[1.04] tracking-tight sm:text-6xl">从知识、数据到产品迭代。</h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-black/65">四个可独立演示的 AI 投研产品案例，展示问题定义、实现路径与实际产出。</p>
          </div>
          <div className="grid border-t border-black/20 md:grid-cols-2">
            {projects.map((project, index) => (
              <Link key={project.id} to={project.route} className="group border-b border-black/20 py-7 transition-opacity hover:opacity-60 md:px-7 md:even:border-l md:odd:pl-0">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-sm text-black/55">0{index + 1}</span>
                  <span className="text-sm text-black/55">查看案例 →</span>
                </div>
                <h3 className="mt-14 max-w-md text-3xl leading-none tracking-tight sm:text-4xl">{project.title}</h3>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-black/65">{project.summary}</p>
                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {project.metrics.slice(0, 2).map((metric) => <span key={metric.label}><b className="font-medium">{metric.value}</b> {metric.label}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <PortfolioFooter />
    </div>
  );
};

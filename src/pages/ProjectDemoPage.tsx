import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CaseNarrative } from '../components/CaseNarrative';
import { PortfolioFooter } from '../components/PortfolioFooter';
import { projectById, projects } from '../data/content';
import type { ProjectId } from '../types';

type ProjectDemoPageProps = { projectId: ProjectId };

type OriginalDemoFrameProps = {
  src: string;
  title: string;
  showLoadingNotice: boolean;
};

const demoPath = (name: string) => new URL(`demos/${name}/`, window.location.href).toString();

const OriginalDemoFrame = ({ src, title, showLoadingNotice }: OriginalDemoFrameProps) => {
  const [loaded, setLoaded] = useState(!showLoadingNotice);

  return (
    <div className="relative overflow-hidden border border-black/20 bg-white">
      <iframe
        className="block h-[760px] w-full border-0 bg-white md:h-[820px]"
        src={src}
        title={title}
        onLoad={() => setLoaded(true)}
      />
      {showLoadingNotice && !loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f4f1eb] px-6 text-center" role="status" aria-live="polite">
          <p className="text-lg text-black">正在加载 FinClaw 前端</p>
          <p className="mt-2 text-sm leading-relaxed text-black/60">首次打开约需 10 秒，请稍候。</p>
        </div>
      )}
    </div>
  );
};

const originalDemoSources: Record<ProjectId, { src: string; source: string; note: string }> = {
  wiki: {
    src: demoPath('wiki'),
    source: 'Stock Analysis · LLM Wiki',
    note: '此处仅展示 LLM Wiki 的功能 Demo，其余功能如问股与首页已屏蔽。',
  },
  'skill-eval': {
    src: demoPath('skill-eval'),
    source: '金融数据 Skill 评测工作台',
    note: '保留原项目的交互 Demo 与 mock 数据。',
  },
  'feedback-agent': {
    src: demoPath('feedback-agent'),
    source: '多模态反馈归因 Dashboard',
    note: '保留原项目的交互 Demo 与本地脱敏 mock 数据。',
  },
  'web-forge': {
    src: demoPath('web-forge'),
    source: 'FinClaw 前端复刻 Skill',
    note: '保留原项目的交互与本地脱敏样例。首次加载约需 10 秒，请稍候。',
  },
};

export const ProjectDemoPage = ({ projectId }: ProjectDemoPageProps) => {
  const project = projectById(projectId);
  const demo = originalDemoSources[projectId];
  const projectIndex = projects.findIndex((item) => item.id === projectId) + 1;
  const nextProject = projects[projectIndex % projects.length];
  const isLastProject = projectIndex === projects.length;

  if (!project) return null;

  return (
    <div className="bg-[#f4f1eb] text-black">
      <section className="bg-black px-5 pb-14 pt-16 text-white sm:px-8 md:px-10 md:pb-20 md:pt-24">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm text-white/55">案例 {String(projectIndex).padStart(2, '0')} / {project.eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-4xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">{project.title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-white/70 sm:text-xl">{project.summary}</p>
          <div className="mt-10 grid border-t border-white/20 sm:grid-cols-4">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="border-b border-white/20 py-4 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
                <strong className="block text-2xl font-normal text-white">{metric.value}</strong>
                <span className="mt-1 block text-sm text-white/55">{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {project.tags.map((tag) => <span key={tag} className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/70">{tag}</span>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1400px] gap-12 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-20">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CaseNarrative project={project} />
            <Link className="mt-8 inline-flex border-b border-black pb-1 text-sm text-black transition-opacity hover:opacity-60" to="/">← 返回作品集</Link>
          </aside>
          <section className="min-w-0">
            <div className="mb-6 flex flex-col gap-3 border-b border-black/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-black/55">公开脱敏原始 DEMO</p>
                <h2 className="mt-2 text-2xl tracking-tight sm:text-3xl">{demo.source}</h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-black/60">{demo.note}</p>
            </div>
            <OriginalDemoFrame
              key={demo.src}
              src={demo.src}
              title={`${project.title} 原项目演示`}
              showLoadingNotice={projectId === 'web-forge'}
            />
            <div className="mt-8 flex justify-end">
              <Link
                to={nextProject.route}
                className="group inline-flex items-center gap-4 border-b border-black pb-2 text-right text-sm text-black transition-opacity hover:opacity-60"
              >
                <span className="text-black/55">{isLastProject ? '回到第一个案例' : '下一个案例'}</span>
                <span>{nextProject.navLabel}</span>
                <span aria-hidden="true" className="text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </section>
        </div>
      </section>
      <PortfolioFooter />
    </div>
  );
};

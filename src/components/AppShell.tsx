import { Link, Outlet, useLocation } from 'react-router-dom';
import { profile, projects } from '../data/content';

export const PortfolioFooter = () => (
  <footer className="border-t border-black/15 bg-[#f4f1eb] px-5 py-8 text-sm text-black/60 sm:px-8 md:px-10">
    <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span>Rayn｜AI产品作品集</span>
      <a className="w-fit text-black underline underline-offset-4 transition-opacity hover:opacity-60" href={`mailto:${profile.emailLabel}`}>{profile.emailLabel}</a>
    </div>
  </footer>
);

const PortfolioHeader = () => {
  const location = useLocation();
  const currentProject = projects.find((project) => project.route === location.pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-black/15 bg-[#f4f1eb]/95 px-5 py-4 backdrop-blur sm:px-8 md:px-10">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-5">
        <Link to="/" className="min-w-0 text-sm font-medium text-black sm:text-base">Rayn｜AI产品作品集</Link>
        <div className="flex min-w-0 items-center gap-4 text-xs text-black/60 sm:gap-8 sm:text-sm">
          <Link className="whitespace-nowrap text-black underline underline-offset-4" to="/">返回作品集</Link>
          {currentProject && <span className="truncate">{currentProject.navLabel}</span>}
        </div>
      </div>
    </header>
  );
};

export const AppShell = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-black">
      {location.pathname !== '/' && <PortfolioHeader />}
      <main><Outlet /></main>
    </div>
  );
};

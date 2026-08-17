import type { ProjectCase } from '../types';

interface CaseNarrativeProps {
  project: ProjectCase;
}

export const CaseNarrative = ({ project }: CaseNarrativeProps) => (
  <div className="border-t border-black/25" aria-label={`${project.title}项目说明`}>
    <section className="border-b border-black/15 py-5">
      <p className="text-xs text-black/55">问题</p>
      <p className="mt-3 text-sm leading-relaxed text-black/75">{project.problem}</p>
    </section>
    <section className="border-b border-black/15 py-5">
      <p className="text-xs text-black/55">工作流</p>
      <ol className="mt-3 grid gap-2 text-sm text-black/75">
        {project.workflow.map((item, index) => (
          <li key={item} className="grid grid-cols-[22px_1fr] gap-2 leading-relaxed">
            <span className="text-black/45">{String(index + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
    <section className="border-b border-black/15 py-5">
      <p className="text-xs text-black/55">成果产出</p>
      <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-black/75">
        {project.outcomes.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}
      </ul>
    </section>
  </div>
);

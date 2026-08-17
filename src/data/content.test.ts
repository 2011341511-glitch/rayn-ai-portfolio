import { describe, expect, it } from 'vitest';
import { profile, projectByRoute, projects } from './content';

describe('portfolio content', () => {
  it('exposes exactly four unique public project cases', () => {
    expect(projects).toHaveLength(4);
    expect(new Set(projects.map((project) => project.route)).size).toBe(4);
  });

  it('keeps the public contact information available to the portfolio', () => {
    expect(profile.emailLabel).toBe('18325018982@163.com');
    expect(profile.education).toHaveLength(2);
    expect(profile.experiences).toHaveLength(3);
  });

  it('resolves each configured case by its route', () => {
    expect(projectByRoute('/wiki')?.title).toContain('LLM Wiki');
    expect(projectByRoute('/skill-eval')?.metrics[0].value).toBe('963');
  });
});

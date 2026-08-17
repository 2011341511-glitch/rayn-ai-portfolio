export type DemoStatus = 'idle' | 'running' | 'complete' | 'blocked' | 'pending';

export interface ProfileContent {
  name: string;
  role: string;
  summary: string;
  location: string;
  emailLabel: string;
  skillTags: string[];
  introLines: string[];
  education: Array<{
    school: string;
    program: string;
    period: string;
  }>;
  experiences: Array<{
    organization: string;
    focus: string;
  }>;
}

export interface EvidenceAsset {
  src: string;
  alt: string;
  caption: string;
}

export interface DemoStep {
  title: string;
  detail: string;
}

export interface DemoScenario {
  title: string;
  description: string;
  steps: DemoStep[];
}

export type ProjectId = 'wiki' | 'skill-eval' | 'feedback-agent' | 'web-forge';

export interface ProjectCase {
  id: ProjectId;
  route: string;
  navLabel: string;
  title: string;
  eyebrow: string;
  summary: string;
  problem: string;
  workflow: string[];
  outcomes: string[];
  metrics: Array<{ value: string; label: string }>;
  tags: string[];
  scenario: DemoScenario;
  evidence?: EvidenceAsset;
}

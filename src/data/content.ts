import type { ProfileContent, ProjectCase, ProjectId } from '../types';

export const profile: ProfileContent = {
  name: 'Rayn',
  role: '2027 届硕士生 · AI 产品方向',
  summary:
    '我是 Rayn，一名具备量化金融与 AI 产品实践背景的 2027 届硕士生，曾在腾讯、蚂蚁集团及金融机构参与 AI 产品、资产配置、金融数据评测和风险管理项目，目前专注互联网 AI 产品方向，很开心认识您。',
  location: 'Hongkong/Shenzhen',
  emailLabel: '18325018982@163.com',
  skillTags: ['LLM Agent', 'RAG / 知识库', '金融数据评测', 'Python / SQL', '产品原型', 'React'],
  introLines: [
    '我是 Rayn，一名具备量化金融与 AI 产品实践背景的 2027 届硕士生。',
    '曾在腾讯、蚂蚁集团及金融机构参与 AI 产品、资产配置、金融数据评测和风险管理项目。',
    '目前专注互联网 AI 产品方向，很开心认识您。',
  ],
  education: [
    { school: '香港理工大学', program: '量化金融与金融科技硕士', period: '2025.09 – 2027.03' },
    { school: '西南财经大学', program: '经济统计学（金融统计与风险管理）', period: '2020.09 – 2024.06' },
  ],
  experiences: [
    { organization: '腾讯', focus: 'AI 金融产品实习 · 知识库、数据评测与用户反馈产品化' },
    { organization: '蚂蚁集团', focus: '金融分析与资产配置实践' },
    { organization: '金融机构', focus: '资产管理、投融资流程与量化分析' },
  ],
};

export const projects: ProjectCase[] = [
  {
    id: 'wiki',
    route: '/wiki',
    navLabel: 'LLM Wiki',
    eyebrow: '01 / STOCK ANALYSIS / KNOWLEDGE ENGINE',
    title: 'Stock Analysis｜LLM Wiki（投研知识库）',
    summary: '将分散投研材料编译为可追溯、可关联、可审核的知识资产。',
    problem: '传统知识库通常按公司、文档或单点页面沉淀信息，跨主题研究需要反复检索；当新材料与既有结论不一致时，也缺少可追溯的审核机制。LLM Wiki 通过原材料解析、主题化聚合、实体关系图谱与待确认变更，把分散观点转化为可关联、可审核、可持续迭代的投研知识资产。',
    workflow: ['素材摄入与去重', 'LLM 解析实体与关系', '主题图谱更新', 'Pending Change 审批融合'],
    outcomes: [
      '沉淀 200+ 投研实体，覆盖公司、行业、指标与事件等核心认知对象',
      '构建 100+ 知识图谱，关联跨主题实体、关系与证据链',
      '生成 100+ 主题 Wiki 页面，支持冲突检测与人工确认闭环',
    ],
    metrics: [
      { value: '3', label: '层知识架构' },
      { value: '200+', label: '投研实体' },
      { value: '100+', label: '知识图谱' },
      { value: '100+', label: '主题页面' },
    ],
    tags: ['原始材料', '主题 Wiki', '待确认变更', '知识图谱'],
    scenario: {
      title: '材料入库与变更审批',
      description: '选择一份脱敏材料，观察知识如何被解析、关联并进入待确认变更池。',
      steps: [
        { title: '读取材料', detail: '识别来源、摘要与重复内容' },
        { title: '抽取知识', detail: '生成主题、实体和证据关系' },
        { title: '检查冲突', detail: '标记可能覆盖既有判断的陈述' },
        { title: '人工确认', detail: '将批准变更合并回主题 Wiki' },
      ],
    },
  },
  {
    id: 'skill-eval',
    route: '/skill-eval',
    navLabel: 'Skill 评测',
    eyebrow: '02 / EVALUATION WORKBENCH',
    title: '金融数据 Skill 评测 Agent',
    summary: '把“哪个数据源更好”的主观比较，转化为可复现、有证据的评测工作台。',
    problem: '金融数据源的覆盖范围、授权条件和输出结构不同，人工提问难以分辨能力缺失、权限阻断与执行失败。',
    workflow: ['选择 Skill 与 Query', 'Runner 记录原始输出', 'Judge 按验收规则评分', '覆盖缺口进入优化清单'],
    outcomes: ['构建 963 个数据格、101 类资产映射', '沉淀 1,926 条广度 Query 与 2,667 条深度 Query', '覆盖 NeoData、iFinD、富途、通达信等多源评测'],
    metrics: [
      { value: '963', label: '数据能力格' },
      { value: '101', label: '资产映射' },
      { value: '5', label: '评测数据源' },
      { value: '6', label: '工作台环节' },
    ],
    tags: ['Query Runner', 'Judge', 'Coverage Matrix', 'Evidence'],
    scenario: {
      title: '一次可复现的能力评测',
      description: '以 A 股历史股东数据为例，展示 Query、原始证据与判定结果如何被保存。',
      steps: [
        { title: '选择样本', detail: '按资产、数据块与时间维度定位 Query' },
        { title: '运行 Skill', detail: '保留原始输出与执行状态' },
        { title: '验收判定', detail: '区分支持、部分支持、权限阻断与不支持' },
        { title: '沉淀缺口', detail: '写入可追踪的产品优化事项' },
      ],
    },
    evidence: {
      src: '/evidence/financial-eval-workbench.png',
      alt: '金融数据竞品评测工作台的执行评测界面',
      caption: '真实工作台截图，已作为公开版成果证据使用。',
    },
  },
  {
    id: 'feedback-agent',
    route: '/feedback-agent',
    navLabel: '反馈归因',
    eyebrow: '03 / FEEDBACK AGENT',
    title: '多模态用户反馈归因 Agent',
    summary: '把分散的文字与截图反馈转化为可分诊、可统计、可追溯的问题池。',
    problem: '投研产品反馈散落在聊天与人工转发记录中，问题热度无法汇总，人工归类成本高。',
    workflow: ['接收文字或截图', '消息切片与解析', 'LLM 五类归因', '结构化入库与人工分诊'],
    outcomes: ['跑通文本与截图的解析、分类、入库与 Dashboard 展示', '完成公众号、企微机器人、自建应用等 5 类渠道能力验证', '明确合并转发受平台隐私限制，收敛到文本粘贴与截图解析方案'],
    metrics: [
      { value: '5', label: '反馈标签' },
      { value: '3', label: '消息切片路径' },
      { value: '5', label: '渠道验证' },
      { value: '1', label: '可复用反馈闭环' },
    ],
    tags: ['Multimodal', 'FastAPI', 'LLM Classifier', 'Dashboard'],
    scenario: {
      title: '从聊天记录到分诊看板',
      description: '粘贴一段脱敏聊天内容，体验切片、标签归因和人工处理状态更新。',
      steps: [
        { title: '识别消息', detail: '解析发言人、时间与多条反馈' },
        { title: '逐条归因', detail: '映射到可用性、效果、性能、体验或认可' },
        { title: '统计热度', detail: '聚合高频问题并生成处理队列' },
        { title: '人工分诊', detail: '确认优先级与跟进状态' },
      ],
    },
  },
  {
    id: 'web-forge',
    route: '/web-forge',
    navLabel: '复刻 Skill',
    eyebrow: '04 / DELIVERY SKILL',
    title: 'FinClaw 前端复刻 Skill',
    summary: '将桌面端网页化从一次性工作沉淀为首次建设与增量跟版两套复用流程。',
    problem: '桌面端产品需要快速演示与跨端交付，手工重复复刻页面会放大版本同步和构建兼容成本。',
    workflow: ['扫描桌面端结构', '隔离平台依赖', '生成网页预览', '构建后修复与验收'],
    outcomes: ['沉淀首次复刻与增量跟版两套 Skill', '覆盖 9 个预览页面与 7 类兼容问题', '支持离线单文件演示与后续版本同步'],
    metrics: [
      { value: '2', label: '复刻 Skill' },
      { value: '9', label: '预览页面' },
      { value: '7', label: '兼容问题沉淀' },
      { value: '1', label: '离线交付产物' },
    ],
    tags: ['React', 'TypeScript', 'Vite', 'Single-file Build'],
    scenario: {
      title: '一次增量跟版任务',
      description: '选择更新范围，查看结构扫描、平台桥接、构建修复和验收结果。',
      steps: [
        { title: '检测差异', detail: '识别新增页面与受保护的本地改动' },
        { title: '同步组件', detail: '复用桌面端界面并隔离 Electron 依赖' },
        { title: '修复构建', detail: '处理单文件脚本顺序与 file:// 兼容性' },
        { title: '完成验收', detail: '校验预览路由、模拟桥接与静默通知' },
      ],
    },
  },
];

export const projectById = (id: ProjectId) => projects.find((item) => item.id === id);
export const projectByRoute = (route: string) => projects.find((item) => item.route === route);

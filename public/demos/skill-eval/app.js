const stages = [
  {
    title: "竞品发现",
    short: "规则、候选池与准入",
    description: "从本机、市场、官网、仓库或人工线索建立可追溯候选档案，并判断是否值得接入。",
    output: "产物：竞品候选池",
  },
  {
    title: "Skill 管理",
    short: "Skill、授权与历史产物",
    description: "统一查看已接入 Skill、授权状态和各环节历史评测产物；Query 分别在广度、深度评测页维护。",
    output: "产物：评测对象、授权与历史档案",
  },
  {
    title: "广度评测",
    short: "数据域是否覆盖",
    description: "按数据格执行代表性 Query，只回答是否能够取得该数据域，不用声明代替实测。",
    output: "产物：广度覆盖矩阵",
  },
  {
    title: "深度评测",
    short: "字段、时间、市场、结构",
    description: "对重点数据格继续测试字段完整度、历史深度、市场适用性和结构化程度。",
    output: "产物：深度覆盖矩阵",
  },
  {
    title: "数据看板",
    short: "覆盖率、维度与对比",
    description: "按 Skill 汇总最近一次逻辑批次的广度与深度结果，直观看覆盖、进度、耗时和待补能力。",
    output: "产物：Skill 覆盖数据面板",
  },
  {
    title: "数据框架",
    short: "新数据块与新字段",
    description: "把竞品新增能力分为新数据块和新字段，经人工审核后再进入正式数据框架。",
    output: "产物：框架候选与审核记录",
  },
  {
    title: "报告与优化事项",
    short: "结论、根因与优先级",
    description: "合并广度与深度证据，区分数据缺失、路由、解析、权限和验收问题。",
    output: "产物：竞品结论与优化输入",
  },
];

const state = {
  stage: 0,
  health: null,
  judgeProvider: null,
  skills: [],
  authBySkill: new Map(),
  candidates: [],
  discoveryAvailable: false,
  discoverySources: [],
  discoveryJobs: [],
  discoveryItems: [],
  selectedCandidateId: "",
  selectedSkillId: "",
  selectedEvaluationSkillIds: new Set(),
  managerTab: "artifacts",
  queryViews: {
    breadth: { queries: [], total: 0, search: "" },
    depth: { queries: [], total: 0, search: "" },
  },
  queryFacets: { breadth: {}, depth: {} },
  queryBulk: {
    breadth: { field: "asset_category", value: "" },
    depth: { field: "asset_category", value: "" },
  },
  queryCache: new Map(),
  querySelections: {
    breadth: new Set(),
    depth: new Set(),
  },
  queryContextType: "breadth",
  evaluationRules: { breadth: "", depth: "" },
  dashboard: null,
  dashboardSkillId: "",
  dashboardType: "breadth",
  runs: [],
  batches: [],
  selectedBatchId: "",
  selectedBatch: null,
  batchSearch: "",
  batchType: "breadth",
  batchSkillId: "",
  batchResultFilter: "all",
  frameworkCandidates: [],
  pollingTimers: {},
};

const dimensionNames = {
  entity: "实体",
  product_type: "产品",
  market: "市场",
  semantic: "语义",
  time: "时间",
  event: "事件",
  fields: "字段",
};

const categoryNames = {
  routing: "接口路由",
  judgment: "验收判定",
  parser: "字段解析",
  query: "Query设计",
  judge_guard: "硬门禁修正",
  query_mapping: "Query映射",
  judge_runtime: "语义复核环境",
};

const candidateStatusNames = {
  new: "新发现",
  screening: "接入审核",
  ready: "待评测",
  evaluating: "评测中",
  completed: "已评测",
  watchlist: "观察",
  blocked_auth: "授权阻断",
  blocked_service: "服务阻断",
  blocked_quota: "额度阻断",
  rejected: "已排除",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  window.setTimeout(() => node.classList.remove("show"), 1800);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`);
  return payload;
}

function selectedSkill() {
  return state.skills.find((item) => item.id === state.selectedSkillId);
}

function selectedAuth() {
  return state.authBySkill.get(state.selectedSkillId);
}

function selectedCandidate() {
  return state.candidates.find((item) => item.candidate_id === state.selectedCandidateId);
}

function candidateForSkill(skillId) {
  return state.candidates.find((item) => item.skill_id === skillId);
}

function querySelection(type) {
  return state.querySelections[type] || state.querySelections.breadth;
}

function selectedQueries(type = state.queryContextType) {
  return [...querySelection(type)]
    .map((id) => state.queryCache.get(id))
    .filter(Boolean);
}

function latestRun(evaluationType = null, skillId = state.selectedSkillId) {
  const candidates = state.runs.filter((run) =>
    (!evaluationType || run.evaluation_type === evaluationType)
    && (!skillId || run.skill_id === skillId));
  // An interrupted/cancelled rejudge has no new retrieval evidence and must
  // never hide the latest usable full/rejudge result. Active runs still take
  // precedence so their live progress remains visible.
  return candidates.find((run) => ["queued", "running"].includes(run.status))
    || candidates.find((run) => run.status === "completed" && run.result?.results?.length)
    || candidates.find((run) => run.result?.results?.length)
    || candidates[0];
}

function latestRunsForEvaluation(type) {
  return [...state.selectedEvaluationSkillIds]
    .map((skillId) => latestRun(type, skillId))
    .filter(Boolean);
}

function formatPercent(value) {
  return `${((Number(value) || 0) * 100).toFixed(1)}%`;
}

function formatElapsed(milliseconds) {
  const value = Number(milliseconds) || 0;
  if (value < 1000) return `${value} ms`;
  if (value < 60000) return `${(value / 1000).toFixed(1)} s`;
  return `${(value / 60000).toFixed(1)} min`;
}

function verdictClass(verdict) {
  return verdict === "✓" ? "full" : verdict === "▲" ? "partial" : verdict === "✗" ? "fail" : "pending";
}

function verdictLabel(verdict) {
  return verdict === "✓" ? "完全支持" : verdict === "▲" ? "部分支持" : verdict === "✗" ? "不支持" : "待测";
}

function render() {
  renderStepper();
  renderPanelHeader();
  [renderDiscovery, renderSkillManagement, renderBreadth, renderDepth, renderDashboard, renderFramework, renderReport][state.stage]();
  renderFooter();
}

function renderStepper() {
  $("#stepper").innerHTML = stages.map((stage, index) => `
    <button class="step ${state.stage === index ? "active" : ""}" data-stage="${index}" type="button">
      <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
      <strong>${stage.title}</strong>
      <small>${stage.short}</small>
    </button>`).join("");
  $$("[data-stage]").forEach((button) => {
    button.onclick = () => {
      state.stage = Number(button.dataset.stage);
      render();
    };
  });
}

function renderPanelHeader() {
  const stage = stages[state.stage];
  $("#stageEyebrow").textContent = `STEP ${String(state.stage + 1).padStart(2, "0")} / ${String(stages.length).padStart(2, "0")}`;
  $("#stageTitle").textContent = stage.title;
  $("#stageDescription").textContent = stage.description;
  $("#stageOutput").textContent = stage.output;
}

function renderFooter() {
  const skill = selectedSkill();
  const type = state.stage === 3 ? "depth" : "breadth";
  const queryCount = querySelection(type).size;
  const evaluationSkillCount = state.selectedEvaluationSkillIds.size;
  $("#handoff").innerHTML = `<b>当前上下文：</b>${
    state.stage === 2 || state.stage === 3
      ? `${evaluationSkillCount} 个目标 Skill · ${queryCount} 条${type === "breadth" ? "广度" : "深度"} Query`
      : `${skill ? escapeHtml(skill.name) : "尚未选择Skill"}`
  }`;
  $("#previousButton").disabled = state.stage === 0;
  $("#nextButton").disabled = state.stage === stages.length - 1;
}

async function loadHealth() {
  try {
    state.health = await api("/api/health");
    const runnerReady = Boolean(state.health.evaluator_available);
    state.judgeProvider = state.health.judge_provider || state.judgeProvider;
    const activeJudge = state.judgeProvider?.active_health || {};
    const judgeReady = Boolean(activeJudge.available && (activeJudge.logged_in || state.judgeProvider?.active_provider === "workbuddy"));
    $("#codexStatus").className = `connection ${runnerReady ? "ready" : "error"}`;
    $("#codexStatus").innerHTML = `<i></i>${runnerReady ? "Runner 已连接" : "Runner 未就绪"}`;
    $("#codexStatus").title = judgeReady
      ? `固定Runner可取数；${state.judgeProvider?.active_label || "语义模型"}只读复核可用`
      : `固定Runner可取数；语义复核暂不可用：${activeJudge.message || "未连接"}`;
  } catch {
    $("#codexStatus").className = "connection error";
    $("#codexStatus").innerHTML = "<i></i>本地服务未连接";
  }
}

async function loadSkills() {
  state.skills = await api("/api/skills");
  if (!state.selectedSkillId && state.skills.length) {
    state.selectedSkillId = state.skills[0].id;
    state.selectedEvaluationSkillIds.add(state.skills[0].id);
  }
}

async function loadAuthStatuses() {
  const items = await api("/api/auth");
  state.authBySkill = new Map(items.map((item) => [item.skill_id, item]));
}

async function loadCandidates() {
  state.candidates = await api("/api/candidates");
  if (!state.selectedCandidateId && state.candidates.length) {
    state.selectedCandidateId = state.candidates[0].candidate_id;
  }
}

async function loadDiscoveryState() {
  try {
    const [sources, jobs, items] = await Promise.all([
      api("/api/discovery/sources"),
      api("/api/discovery/jobs?limit=10"),
      api("/api/discovery/items?status=new&limit=200"),
    ]);
    state.discoverySources = sources;
    state.discoveryJobs = jobs;
    state.discoveryItems = items;
    state.discoveryAvailable = true;
  } catch (_error) {
    state.discoverySources = [];
    state.discoveryJobs = [];
    state.discoveryItems = [];
    state.discoveryAvailable = false;
  }
}

async function loadQueries(search = "", type = "breadth") {
  state.queryViews[type].search = search;
  const params = new URLSearchParams({
    search,
    limit: "120",
    evaluation_type: type,
  });
  const payload = await api(`/api/queries?${params}`);
  state.queryViews[type].queries = payload.queries;
  state.queryViews[type].total = payload.total;
  payload.queries.forEach((query) => state.queryCache.set(query.query_id, query));
}

async function loadQueryFacets(type) {
  state.queryFacets[type] = await api(`/api/query-facets?evaluation_type=${encodeURIComponent(type)}`);
}

async function loadDashboard() {
  state.dashboard = await api("/api/dashboard");
  if (
    !state.dashboardSkillId
    || !state.dashboard.skills?.some((item) => item.skill_id === state.dashboardSkillId)
  ) {
    state.dashboardSkillId = state.dashboard.skills?.[0]?.skill_id || "";
  }
}

async function loadEvaluationRules() {
  state.evaluationRules = await api("/api/evaluation-rules");
}

async function loadJudgeProvider() {
  state.judgeProvider = await api("/api/judge-provider");
}

async function loadRuns() {
  state.runs = await api("/api/runs");
}

async function loadBatches() {
  const params = new URLSearchParams({ limit: "1000", _: String(Date.now()) });
  state.batches = await api(`/api/batches?${params}`);
  if (state.selectedBatchId && !state.batches.some((item) =>
    item.batch_id === state.selectedBatchId
    && item.evaluation_type === state.batchType
    && (!state.batchSkillId || item.skill_ids?.includes(state.batchSkillId))
  )) {
    state.selectedBatchId = "";
    state.selectedBatch = null;
  }
}

async function loadFrameworkCandidates() {
  state.frameworkCandidates = await api("/api/framework-candidates");
}

function renderDiscovery() {
  const candidate = selectedCandidate();
  const readyCount = state.candidates.filter((item) => item.status === "ready").length;
  const watchCount = state.candidates.filter((item) => item.status === "watchlist").length;
  const blockedCount = state.candidates.filter((item) => item.status.startsWith("blocked")).length;
  const latestJob = state.discoveryJobs[0];
  const jobRunning = ["queued", "running"].includes(latestJob?.status);
  const jobStatusNames = {
    queued: "排队中",
    running: "采集中",
    completed: "已完成",
    completed_with_errors: "部分来源异常",
    interrupted: "已中断",
    failed: "失败",
  };
  $("#stageBody").innerHTML = `
    <div class="section-line">
      <div><h3>1. 定义规则并形成候选池</h3><p>硬门槛用于排除无关对象；市场、热度、关键词和平台背书共同决定调研优先级。</p></div>
      <div class="actions">
        <button class="button secondary" id="scanInstalledButton" type="button">扫描本机金融 Skill</button>
        <button class="button primary" id="scanExternalButton" type="button" ${state.discoveryAvailable && !jobRunning ? "" : "disabled"}>${jobRunning ? "正在发现…" : "发现外部竞品"}</button>
        <button class="button primary" id="addCandidateButton" type="button">人工补录候选</button>
      </div>
    </div>
    <div class="metric-grid" style="margin-bottom:12px">
      <div class="metric"><b>${state.candidates.length}</b><span>候选记录</span></div>
      <div class="metric green"><b>${readyCount}</b><span>可进入待评测</span></div>
      <div class="metric amber"><b>${watchCount}</b><span>观察池</span></div>
      <div class="metric red"><b>${blockedCount}</b><span>授权 / 服务阻断</span></div>
    </div>
    <div class="rule-grid" style="margin-bottom:12px">
      <div class="rule-card"><b>市场相关性</b><span>目标资产与市场命中</span><em>30%</em></div>
      <div class="rule-card"><b>热度</b><span>安装、引用、更新与讨论</span><em>25%</em></div>
      <div class="rule-card"><b>关键词</b><span>行情、财务、宏观、ESG等</span><em>20%</em></div>
      <div class="rule-card"><b>平台背书</b><span>官方市场、大厂、券商、数据商</span><em>25%</em></div>
    </div>
    <div class="card discovery-source-card">
      <div class="card-head">高质量发现源 · 独立 Worker，不安装或执行外部 Skill</div>
      <div class="card-body">
        ${state.discoveryAvailable ? `
          <div class="source-grid">${state.discoverySources.map((source) => `
            <button class="source-chip ${source.enabled ? "enabled" : "disabled"}" data-discovery-source="${escapeHtml(source.source_id)}" data-enabled="${source.enabled ? "1" : "0"}" type="button">
              <span><b>${escapeHtml(source.name)}</b><small>${escapeHtml(source.description)}</small></span>
              <em>${source.enabled ? "已启用" : source.auth_mode === "api_key" && !source.auth_configured ? "待配置 Key" : "未启用"}</em>
            </button>`).join("")}</div>
          ${latestJob ? `<div class="discovery-job ${jobRunning ? "running" : ""}">
            <span><b>${escapeHtml(jobStatusNames[latestJob.status] || latestJob.status)}</b> · 来源 ${latestJob.sources_completed}/${latestJob.sources_total} · 发现 ${latestJob.found_count} · 新增 ${latestJob.new_count} · 更新 ${latestJob.updated_count}</span>
            <small>${escapeHtml(latestJob.current_source || latestJob.finished_at || latestJob.created_at || "")}</small>
          </div>` : '<div class="hint-box">尚未执行外部发现。建议先启用官方 Registry、Glama、GitHub 和 awesome-mcp-servers。</div>'}
        ` : '<div class="hint-box">外部发现模块已写入项目，将在当前 NeoData 批次结束、服务安全重启后激活；现有评测不受影响。</div>'}
      </div>
    </div>
    ${state.discoveryItems.length ? `
      <div class="card discovery-inbox">
        <div class="card-head">自动发现待复核 · ${state.discoveryItems.length} 条</div>
        <div class="table-shell scroll">
          <table>
            <thead><tr><th>候选 / 提供方</th><th>发现源</th><th>命中依据</th><th>评分</th><th>操作</th></tr></thead>
            <tbody>${state.discoveryItems.map((item) => `
              <tr>
                <td><span class="name">${escapeHtml(item.name)}</span><span class="query-sub">${escapeHtml(item.provider)}${item.repo_url ? ` · <a href="${escapeHtml(item.repo_url)}" target="_blank">仓库</a>` : ""}</span></td>
                <td>${escapeHtml(item.source_ids.join("、"))}</td>
                <td>${escapeHtml(item.keyword_hits.join("、"))}</td>
                <td class="score">${Number(item.total_score).toFixed(1)}</td>
                <td><div class="actions compact"><button class="button success small" data-discovery-admit="${escapeHtml(item.fingerprint)}" type="button">纳入候选池</button><button class="button ghost small" data-discovery-dismiss="${escapeHtml(item.fingerprint)}" type="button">排除</button></div></td>
              </tr>`).join("")}</tbody>
          </table>
        </div>
      </div>` : ""}
    <div class="layout">
      <div>
        <div class="card">
          <div class="card-head">竞品候选池 · 保存原始来源、工程文件、规则证据和准入状态</div>
          <div class="table-shell scroll">
            <table>
              <thead><tr><th style="width:190px">Skill / 提供方</th><th style="width:105px">发现渠道</th><th style="width:70px">入选分</th><th style="width:85px">状态</th><th>入选证据</th></tr></thead>
              <tbody>${state.candidates.length ? state.candidates.map((item) => `
                <tr class="clickable ${item.candidate_id === state.selectedCandidateId ? "selected" : ""}" data-candidate-id="${escapeHtml(item.candidate_id)}">
                  <td><span class="name">${escapeHtml(item.skill_name)}</span><span class="query-sub">${escapeHtml(item.provider)} · v${escapeHtml(item.version)}</span></td>
                  <td>${escapeHtml(item.discovery_channel)}</td>
                  <td class="score">${Number(item.total_score).toFixed(1)}</td>
                  <td><span class="status ${escapeHtml(item.status)}">${escapeHtml(candidateStatusNames[item.status] || item.status)}</span></td>
                  <td>${escapeHtml(item.inclusion_reason)}</td>
                </tr>`).join("") : '<tr><td colspan="5" class="empty">还没有候选，先扫描本机或人工补录。</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      </div>
      <aside>${candidate ? renderCandidateDetail(candidate) : '<div class="card"><div class="empty">选择一条候选查看详情。</div></div>'}</aside>
    </div>`;
  $$("[data-candidate-id]").forEach((row) => {
    row.onclick = () => {
      state.selectedCandidateId = row.dataset.candidateId;
      renderDiscovery();
    };
  });
  $("#scanInstalledButton").onclick = scanInstalledSkills;
  $("#scanExternalButton").onclick = startExternalDiscovery;
  $("#addCandidateButton").onclick = () => $("#candidateDialog").showModal();
  $$('[data-discovery-source]').forEach((button) => {
    button.onclick = () => toggleDiscoverySource(button.dataset.discoverySource, button.dataset.enabled !== "1");
  });
  $$('[data-discovery-admit]').forEach((button) => {
    button.onclick = () => admitDiscoveryItem(button.dataset.discoveryAdmit);
  });
  $$('[data-discovery-dismiss]').forEach((button) => {
    button.onclick = () => updateDiscoveryItemStatus(button.dataset.discoveryDismiss, "dismissed");
  });
  $$("[data-candidate-action]").forEach((button) => {
    button.onclick = () => updateCandidateStatus(candidate.candidate_id, button.dataset.candidateAction);
  });
}

function renderCandidateDetail(candidate) {
  const canEvaluate = Boolean(candidate.skill_id && state.skills.some((skill) => skill.id === candidate.skill_id));
  return `
    <div class="card detail-panel">
      <div class="card-head">候选准入详情</div>
      <div class="card-body">
        <h3>${escapeHtml(candidate.skill_name)}</h3>
        <p>${escapeHtml(candidate.candidate_id)}</p>
        <div class="detail-list">
          <div class="detail-row"><b>原始 URL</b><span>${candidate.source_url ? `<a href="${escapeHtml(candidate.source_url)}" target="_blank">打开来源</a>` : "本机发现"}</span></div>
          <div class="detail-row"><b>工程文件</b><span>${escapeHtml(candidate.artifact_uri || "待补充")}</span></div>
          <div class="detail-row"><b>认证方式</b><span>${escapeHtml(candidate.auth_mode || "待核实")}</span></div>
          <div class="detail-row"><b>额度</b><span>${escapeHtml(candidate.quota || "待核实")}</span></div>
          <div class="detail-row"><b>限频</b><span>${escapeHtml(candidate.rate_limit || "待核实")}</span></div>
          <div class="detail-row"><b>评分构成</b><span>市场${candidate.market_score} / 热度${candidate.popularity_score} / 关键词${candidate.keyword_score} / 背书${candidate.platform_score}</span></div>
        </div>
        <div class="reason"><b>为什么入选：</b><br>${escapeHtml(candidate.inclusion_reason)}</div>
        <div class="actions" style="margin-top:11px">
          <button class="button success small" data-candidate-action="ready" type="button" ${canEvaluate ? "" : "disabled"}>纳入待评测</button>
          <button class="button secondary small" data-candidate-action="watchlist" type="button">进入观察</button>
          <button class="button danger small" data-candidate-action="rejected" type="button">排除</button>
        </div>
        ${canEvaluate ? "" : '<div class="warning-box" style="margin-top:10px">该候选尚未绑定本机 Adapter；可保留档案，但不能直接进入实测。</div>'}
      </div>
    </div>`;
}

async function scanInstalledSkills() {
  try {
    const result = await api("/api/discovery/scan-installed", { method: "POST", body: "{}" });
    await loadCandidates();
    renderDiscovery();
    toast(result.inserted ? `发现 ${result.inserted} 个新 Skill` : "本机候选已是最新");
  } catch (error) {
    toast(error.message);
  }
}

async function startExternalDiscovery() {
  if (!state.discoveryAvailable) {
    toast("外部发现服务尚未激活");
    return;
  }
  try {
    const sourceIds = state.discoverySources.filter((item) => item.enabled).map((item) => item.source_id);
    const job = await api("/api/discovery/jobs", {
      method: "POST",
      body: JSON.stringify({ source_ids: sourceIds }),
    });
    await loadDiscoveryState();
    renderDiscovery();
    pollDiscoveryJob(job.job_id);
    toast(`发现任务已启动：${sourceIds.length} 个来源`);
  } catch (error) {
    toast(error.message);
  }
}

function pollDiscoveryJob(jobId) {
  if (state.pollingTimers.discovery) window.clearTimeout(state.pollingTimers.discovery);
  const tick = async () => {
    try {
      const job = await api(`/api/discovery/jobs/${encodeURIComponent(jobId)}`);
      await loadDiscoveryState();
      if (state.stage === 0) renderDiscovery();
      if (["queued", "running"].includes(job.status)) {
        state.pollingTimers.discovery = window.setTimeout(tick, 1500);
      } else {
        toast(job.status === "completed" ? `发现完成：新增 ${job.new_count} 条` : "发现完成，部分来源需要检查");
      }
    } catch (error) {
      toast(error.message);
    }
  };
  state.pollingTimers.discovery = window.setTimeout(tick, 800);
}

async function toggleDiscoverySource(sourceId, enabled) {
  try {
    const source = state.discoverySources.find((item) => item.source_id === sourceId);
    if (enabled && source?.auth_mode === "api_key" && !source.auth_configured) {
      toast("Smithery 需要先在启动环境配置 SMITHERY_API_KEY");
      return;
    }
    await api(`/api/discovery/sources/${encodeURIComponent(sourceId)}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
    await loadDiscoveryState();
    renderDiscovery();
  } catch (error) {
    toast(error.message);
  }
}

async function admitDiscoveryItem(fingerprint) {
  try {
    const candidate = await api(`/api/discovery/items/${encodeURIComponent(fingerprint)}/admit`, {
      method: "POST",
      body: "{}",
    });
    await Promise.all([loadDiscoveryState(), loadCandidates()]);
    state.selectedCandidateId = candidate.candidate_id;
    renderDiscovery();
    toast("已纳入候选池，下一步核实授权和可评测性");
  } catch (error) {
    toast(error.message);
  }
}

async function updateDiscoveryItemStatus(fingerprint, status) {
  try {
    await api(`/api/discovery/items/${encodeURIComponent(fingerprint)}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    await loadDiscoveryState();
    renderDiscovery();
    toast("发现线索状态已更新");
  } catch (error) {
    toast(error.message);
  }
}

async function updateCandidateStatus(candidateId, status) {
  try {
    const candidate = await api(`/api/candidates/${encodeURIComponent(candidateId)}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (status === "ready" && candidate.skill_id) {
      state.selectedSkillId = candidate.skill_id;
      state.stage = 1;
    }
    await loadCandidates();
    render();
    toast(status === "ready" ? "已进入待评测 Skill" : "候选状态已更新");
  } catch (error) {
    toast(error.message);
  }
}

async function submitCandidate(event) {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  for (const field of ["market_score", "popularity_score", "keyword_score", "platform_score"]) {
    payload[field] = Number(payload[field]);
  }
  try {
    const candidate = await api("/api/candidates", { method: "POST", body: JSON.stringify(payload) });
    event.currentTarget.reset();
    $("#candidateDialog").close();
    await loadCandidates();
    state.selectedCandidateId = candidate.candidate_id;
    renderDiscovery();
    toast("候选已加入");
  } catch (error) {
    toast(error.message);
  }
}

function renderSkillManagement() {
  const skill = selectedSkill();
  $("#stageBody").innerHTML = `
    <div class="manager-layout">
      <div>
        <div class="section-line"><div><h3>全部 Skill</h3><p>${state.skills.length} 个已接入评测环境</p></div></div>
        <div class="card"><div class="card-body"><div class="skill-list">${state.skills.map((item) => {
          const candidate = candidateForSkill(item.id);
          const auth = state.authBySkill.get(item.id);
          return `<button class="skill-item ${item.id === state.selectedSkillId ? "selected" : ""}" data-skill-id="${escapeHtml(item.id)}" type="button">
            <b>${escapeHtml(item.name)}</b>
            <span>${escapeHtml(item.evaluation_mode)} · ${escapeHtml(candidateStatusNames[candidate?.status] || candidate?.status || "未入池")}</span>
            <em class="auth-mini ${authStatusClass(auth?.status)}">${escapeHtml(auth?.status_label || "授权待检查")}</em>
          </button>`;
        }).join("")}</div></div></div>
      </div>
      <div class="card">
        <div class="card-head">${escapeHtml(skill?.name || "未选择Skill")} · ${escapeHtml(skill?.description || "")}</div>
        <div class="tabs">
          <button class="tab ${state.managerTab === "artifacts" ? "active" : ""}" data-manager-tab="artifacts" type="button">环节产物</button>
          <button class="tab ${state.managerTab === "auth" ? "active" : ""}" data-manager-tab="auth" type="button">授权信息</button>
        </div>
        <div class="card-body" id="managerContent">${
          state.managerTab === "artifacts"
            ? renderArtifactContent(skill)
            : renderAuthContent(skill)
        }</div>
      </div>
    </div>`;
  $$("[data-skill-id]").forEach((button) => {
    button.onclick = () => {
      state.selectedSkillId = button.dataset.skillId;
      renderSkillManagement();
      renderFooter();
    };
  });
  $$("[data-manager-tab]").forEach((button) => {
    button.onclick = () => {
      state.managerTab = button.dataset.managerTab;
      renderSkillManagement();
    };
  });
  bindAuthManagerEvents();
}

function renderArtifactContent(skill) {
  const candidate = candidateForSkill(skill?.id);
  const runs = state.runs.filter((run) => run.skill_id === skill?.id);
  const breadth = runs.find((run) => run.evaluation_type === "breadth");
  const depth = runs.find((run) => run.evaluation_type === "depth");
  return `
    <div class="artifact-list">
      <div class="artifact-row"><b>候选与准入档案</b><span>${candidate ? `${candidate.discovery_channel} · ${candidate.auth_mode} · ${candidate.inclusion_reason}` : "尚未建立候选档案"}</span><span class="status ${candidate ? "full" : "pending"}">${candidate ? "已生成" : "暂无"}</span></div>
      <div class="artifact-row"><b>Query 集</b><span>广度模板 ${state.health?.catalog_counts?.breadth || 0} 条；深度模板 ${state.health?.catalog_counts?.depth || 0} 条；自定义 ${state.health?.custom_query_count || 0} 条；广度已选 ${querySelection("breadth").size} 条，深度已选 ${querySelection("depth").size} 条</span><span class="status full">分环节管理</span></div>
      <div class="artifact-row"><b>广度覆盖矩阵</b><span>${breadth ? `${breadth.status} · ${breadth.query_count} 条` : "尚未执行"}</span><span class="status ${breadth?.status === "completed" ? "full" : "pending"}">${breadth?.status === "completed" ? "已生成" : "暂无"}</span></div>
      <div class="artifact-row"><b>深度覆盖矩阵</b><span>${depth ? `${depth.status} · ${depth.query_count} 条` : "尚未执行"}</span><span class="status ${depth?.status === "completed" ? "full" : "pending"}">${depth?.status === "completed" ? "已生成" : "暂无"}</span></div>
      <div class="artifact-row"><b>评测历史</b><span>${runs.length} 个批次；原始结果均保存在本机 runs 目录</span><span class="status ${runs.length ? "full" : "pending"}">${runs.length ? "可追溯" : "暂无"}</span></div>
    </div>
    <div class="hint" style="margin-top:11px">广度与深度使用不同 Query 集。请分别进入“广度评测”和“深度评测”管理、导入与选择本环节 Query。</div>`;
}

function authStatusClass(status) {
  if (["valid", "service_online", "not_required", "optional_configured"].includes(status)) return "auth-ok";
  if (["pending", "expiring", "configured_unverified", "mcp_configured", "optional_missing"].includes(status)) return "auth-warn";
  if (["expired", "missing", "service_offline", "mcp_missing", "credential_error"].includes(status)) return "auth-bad";
  return "auth-neutral";
}

function authTypeExplanation(type) {
  return {
    temporary_token: "临时凭证：根据本地缓存时间计算有效期，可直接替换 Token。",
    api_key: "固定 Key：本地只显示掩码；没有 exp 时必须通过真实调用确认有效性。",
    local_login: "交互式登录：不存 Key，由本地客户端保持登录态，可检查服务端口。",
    mcp_oauth: "MCP OAuth：由工作台打开官方授权页，自动保存和刷新加密凭证。",
    mcp_auth: "MCP 授权：由 Codex 的 MCP 配置管理，不能把“已配置”直接当作“已可调用”。",
    none: "无需授权：核心能力没有独立 Key 或扫码步骤。",
    optional_api_key: "部分免授权：核心能力可用，只有可选能力需要额外 Key。",
  }[type] || "尚未归类，需要人工确认 Skill 的鉴权说明。";
}

function renderAuthContent(skill) {
  const auth = selectedAuth();
  if (!skill || !auth) {
    return '<div class="empty"><b>授权信息加载中</b>请刷新后重试。</div>';
  }
  const credential = auth.credential_configured
    ? auth.credential_masked
    : auth.auth_type === "none" || auth.auth_type === "local_login" || auth.auth_type === "mcp_auth"
      ? "不适用"
      : "未配置";
  let management = "";
  if (auth.can_update) {
    management = `
      <form class="credential-form" id="credentialForm">
        <div>
          <b>${auth.auth_type === "temporary_token" ? "替换临时 Token" : "更新 API Key"}</b>
          <p>输入内容只发送给本机 127.0.0.1 服务并写入该 Skill 的注册凭证文件；页面不会回显明文。</p>
        </div>
        <input name="secret" type="password" autocomplete="new-password" required placeholder="粘贴新的凭证">
        <button class="button primary small" type="submit">安全更新</button>
      </form>`;
  } else if (auth.can_launch) {
    management = `
      <div class="auth-action-row">
        <div><b>本地登录管理</b><p>打开 OpenD 后在客户端完成登录或扫码；本页只检查 127.0.0.1:11111 是否可连接。</p></div>
        <button class="button primary small" id="launchAuthManager" type="button">打开 OpenD</button>
      </div>`;
  } else if (auth.management === "oauth_browser") {
    management = `
      <div class="auth-action-row">
        <div><b>官方 OAuth 登录</b><p>可以独立登录，也可以同步本机 WorkBuddy 已完成的通达信授权；两种方式都会由工作台使用 DPAPI 加密保存，前端不接触 Token 明文。</p></div>
        <div class="actions">
          <button class="button primary small" id="startOAuthButton" type="button">${auth.credential_configured ? "重新授权" : "登录通达信"}</button>
          ${auth.can_sync_workbuddy ? '<button class="button secondary small" id="syncWorkBuddyOAuthButton" type="button">同步 WorkBuddy 授权</button>' : ""}
          ${auth.can_disconnect ? '<button class="button danger small" id="disconnectOAuthButton" type="button">退出授权</button>' : ""}
        </div>
      </div>`;
  } else if (auth.management === "external_config") {
    management = `
      <div class="auth-action-row">
        <div><b>由 Codex MCP 配置管理</b><p>请在 Codex 的 MCP Server 配置中维护连接或认证信息；本页不复制保存第二份 Key。</p></div>
        <span class="status pending">外部配置</span>
      </div>`;
  } else if (auth.management === "environment_variable") {
    management = `
      <div class="auth-action-row">
        <div><b>可选环境变量</b><p>核心能力无需授权；仅需要 iWenCai 语义搜索时配置 IWENCAI_API_KEY。</p></div>
        <span class="status pending">可选</span>
      </div>`;
  } else {
    management = `
      <div class="auth-action-row">
        <div><b>无需凭证管理</b><p>该 Skill 的核心调用不依赖 Key、Token 或扫码登录。</p></div>
        <span class="status full">免授权</span>
      </div>`;
  }

  return `
    <div class="auth-overview">
      <div class="auth-title">
        <div>
          <span class="eyebrow">AUTHORIZATION</span>
          <h3>${escapeHtml(auth.auth_label)}</h3>
          <p>${escapeHtml(authTypeExplanation(auth.auth_type))}</p>
        </div>
        <span class="auth-state ${authStatusClass(auth.status)}"><i></i>${escapeHtml(auth.status_label)}</span>
      </div>
      <div class="auth-facts">
        <div><span>当前凭证</span><b>${escapeHtml(credential)}</b></div>
        <div><span>有效期 / 过期时间</span><b>${escapeHtml(auth.expires_at || (auth.status === "configured_unverified" ? "服务端决定，需在线验证" : "不适用"))}</b></div>
        <div><span>配置位置</span><b>${escapeHtml(auth.location || "无需本地配置")}</b></div>
        <div><span>最近检查</span><b>${escapeHtml(auth.last_checked_at)}</b></div>
      </div>
      <div class="auth-note">${escapeHtml(auth.detail)}${auth.credential_source === "workbuddy" ? " 当前凭证来源：WorkBuddy 本机授权，已同步至评测 Agent。" : ""}</div>
      <div class="auth-toolbar">
        <button class="button secondary small" id="checkAuthButton" type="button">重新检查状态</button>
        <span>状态检查不会展示或记录 Key 明文；“已配置”不等于“在线调用成功”。</span>
      </div>
    </div>
    <div class="auth-management">
      <h3>授权管理</h3>
      ${management}
    </div>
    <div class="auth-methods">
      <h3>授权方式如何区分</h3>
      <div class="auth-method-grid">
        <div><b>Key / Token</b><span>出现 config、auth_token、API_KEY 或凭证文件时，使用密钥管理。</span></div>
        <div><b>扫码 / 登录</b><span>需要打开客户端、授权链接或 authChecker 时，归为交互式登录。</span></div>
        <div><b>本地服务 / MCP</b><span>先检查端口或 MCP 配置，再用真实 Query 确认权限，不能只看进程存在。</span></div>
        <div><b>免授权 / 可选授权</b><span>核心免费接口与可选增值能力分开标注，避免把局部缺 Key 当作整个 Skill 失效。</span></div>
      </div>
    </div>`;
}

function bindAuthManagerEvents() {
  const checkButton = $("#checkAuthButton");
  if (checkButton) {
    checkButton.onclick = async () => {
      try {
        const auth = await api(`/api/auth/${encodeURIComponent(state.selectedSkillId)}`);
        state.authBySkill.set(auth.skill_id, auth);
        renderSkillManagement();
        toast("授权状态已重新检查");
      } catch (error) {
        toast(error.message);
      }
    };
  }
  const credentialForm = $("#credentialForm");
  if (credentialForm) {
    credentialForm.onsubmit = async (event) => {
      event.preventDefault();
      const secret = new FormData(credentialForm).get("secret");
      try {
        const auth = await api(`/api/auth/${encodeURIComponent(state.selectedSkillId)}/credential`, {
          method: "POST",
          body: JSON.stringify({ secret }),
        });
        state.authBySkill.set(auth.skill_id, auth);
        credentialForm.reset();
        renderSkillManagement();
        toast("凭证已更新；建议立即用真实 Query 验证");
      } catch (error) {
        toast(error.message);
      }
    };
  }
  const launchButton = $("#launchAuthManager");
  if (launchButton) {
    launchButton.onclick = async () => {
      try {
        await api(`/api/auth/${encodeURIComponent(state.selectedSkillId)}/launch`, {
          method: "POST",
          body: "{}",
        });
        toast("已启动本地授权程序");
      } catch (error) {
        toast(error.message);
      }
    };
  }
  const startOAuthButton = $("#startOAuthButton");
  if (startOAuthButton) {
    startOAuthButton.onclick = async () => {
      try {
        const started = await api("/api/auth/tdx-connector/oauth/start-system", {
          method: "POST",
          body: "{}",
        });
        if (!started.opened_in_system_browser) {
          window.open(started.authorization_url, "_blank");
        }
        toast(started.brand_notice || "请在通达信页面完成授权");
        for (let attempt = 0; attempt < 120; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const auth = await api("/api/auth/tdx-connector");
          state.authBySkill.set(auth.skill_id, auth);
          if (["valid", "expiring"].includes(auth.status)) {
            renderSkillManagement();
            toast("通达信授权成功");
            return;
          }
        }
        renderSkillManagement();
      } catch (error) {
        toast(error.message);
      }
    };
  }
  const disconnectOAuthButton = $("#disconnectOAuthButton");
  if (disconnectOAuthButton) {
    disconnectOAuthButton.onclick = async () => {
      if (!window.confirm("确定删除本机的通达信 OAuth 凭证吗？")) return;
      try {
        const auth = await api("/api/auth/tdx-connector/oauth/disconnect", {
          method: "POST",
          body: "{}",
        });
        state.authBySkill.set(auth.skill_id, auth);
        renderSkillManagement();
        toast("已退出通达信授权");
      } catch (error) {
        toast(error.message);
      }
    };
  }
  const syncWorkBuddyOAuthButton = $("#syncWorkBuddyOAuthButton");
  if (syncWorkBuddyOAuthButton) {
    syncWorkBuddyOAuthButton.onclick = async () => {
      if (!window.confirm("将读取本机 WorkBuddy 的通达信授权，并加密同步到评测 Agent。是否继续？")) return;
      try {
        const auth = await api("/api/auth/tdx-connector/oauth/sync-workbuddy", {
          method: "POST",
          body: "{}",
        });
        state.authBySkill.set(auth.skill_id, auth);
        renderSkillManagement();
        toast("WorkBuddy 通达信授权已同步");
      } catch (error) {
        toast(error.message);
      }
    };
  }
}

const queryFacetNames = {
  asset_category: "资产类别",
  block_l1: "一级类目",
  block_l2: "二级类目",
  time_depth: "时间层级",
};

function renderBulkQuerySelector(type) {
  const bulk = state.queryBulk[type];
  const facets = state.queryFacets[type] || {};
  const options = facets[bulk.field] || [];
  if (!options.some((item) => item.value === bulk.value)) {
    bulk.value = options[0]?.value || "";
  }
  return `
    <div class="query-bulk-picker">
      <div>
        <b>批量下拉选择</b>
        <span>选择一个分组，一次加入或移出该组全部 Query；之后仍可逐条微调。</span>
      </div>
      <select id="queryBulkField">
        ${Object.entries(queryFacetNames).map(([key, label]) => `<option value="${key}" ${bulk.field === key ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      <select id="queryBulkValue">
        ${options.map((item) => `<option value="${escapeHtml(item.value)}" ${bulk.value === item.value ? "selected" : ""}>${escapeHtml(item.value)}（${item.count}条）</option>`).join("")}
      </select>
      <button class="button primary small" id="bulkAddQueriesButton" type="button">整组选中</button>
      <button class="button ghost small" id="bulkRemoveQueriesButton" type="button">整组取消</button>
    </div>`;
}

function renderQueryManagerContent(type) {
  const view = state.queryViews[type];
  const selection = querySelection(type);
  return `
    <div class="section-line">
      <div><h3>${type === "breadth" ? "广度" : "深度"} Query 集</h3><p>本页选择只作用于${type === "breadth" ? "广度" : "深度"}评测；模板只读，导入和手工新增的 Query 可编辑、删除。</p></div>
      <div class="actions">
        <input class="search-box" id="querySearch" value="${escapeHtml(view.search)}" placeholder="搜索 ID、市场、数据格或 Query">
        <button class="button ghost small" id="selectAllQueriesButton" type="button">全选当前 Query 集（${view.total}）</button>
        <button class="button ghost small" id="clearQuerySelectionButton" type="button">清空选择</button>
        <button class="button secondary small" id="importQueryButton" type="button">导入表格 / JSON</button>
        <button class="button primary small" id="addQueryButton" type="button">新增 Query</button>
        <button class="button danger small" id="deleteQueryButton" type="button">删除选中自定义</button>
      </div>
    </div>
    ${renderBulkQuerySelector(type)}
    <div class="hint" style="margin-bottom:9px">当前检索 ${view.total} 条，本环节已选择 <b id="querySelectionCount">${selection.size}</b> 条。导入字段支持 query_id、数据格时间ID、资产类别、一级标题、二级标题、时间和原子Query。</div>
    <div class="table-shell scroll">
      <table>
        <thead><tr><th class="checkbox-cell"></th><th style="width:90px">Query ID</th><th style="width:180px">数据格</th><th style="width:75px">时间</th><th>原子 Query</th><th style="width:150px">运行映射</th><th style="width:70px">来源</th><th style="width:68px">操作</th></tr></thead>
        <tbody>${view.queries.length ? view.queries.map((query) => `
          <tr>
            <td class="checkbox-cell"><input type="checkbox" data-query-select="${escapeHtml(query.query_id)}" ${selection.has(query.query_id) ? "checked" : ""}></td>
            <td><span class="name">${escapeHtml(query.query_id)}</span><span class="query-sub">${escapeHtml(query.data_grid_time_id)}</span></td>
            <td>${escapeHtml(query.asset_category)}<span class="query-sub">${escapeHtml(query.block_l1)} / ${escapeHtml(query.block_l2)}</span></td>
            <td>${escapeHtml(query.time_depth)}</td>
            <td class="query-text">${escapeHtml(query.query)}</td>
            <td><span class="status ${query.query_spec?.mapping_confidence === "high" ? "full" : "partial"}">${query.query_spec?.query_type === "selector" ? "选标型" : query.query_spec?.query_type === "comparison" ? "对比型" : "原子型"}</span><span class="query-sub">${escapeHtml(query.query_spec?.product_type || "unknown")} · ${escapeHtml(query.query_spec?.market || "unknown")}</span>${query.query_spec?.mapping_issues?.length ? `<span class="query-sub warning-text">${escapeHtml(query.query_spec.mapping_issues.join("；"))}</span>` : ""}</td>
            <td><span class="source-pill ${query.source === "custom" ? "custom" : ""}">${query.source === "custom" ? "自定义" : "正式模板"}</span></td>
            <td>${query.source === "custom" ? `<button class="link-button" data-edit-query="${escapeHtml(query.query_id)}" type="button">编辑</button>` : "只读"}</td>
          </tr>`).join("") : '<tr><td colspan="8" class="empty">没有匹配的 Query。</td></tr>'}</tbody>
      </table>
    </div>`;
}

let querySearchTimer = null;
async function applyBulkQuerySelection(type, mode) {
  const bulk = state.queryBulk[type];
  if (!bulk.value) {
    toast("当前分组没有可选 Query");
    return;
  }
  try {
    const params = new URLSearchParams({ evaluation_type: type });
    params.set(bulk.field, bulk.value);
    const payload = await api(`/api/query-ids?${params}`);
    const selection = querySelection(type);
    payload.query_ids.forEach((queryId) => {
      if (mode === "add") selection.add(queryId);
      else selection.delete(queryId);
    });
    render();
    toast(`${mode === "add" ? "已选中" : "已取消"} ${bulk.value}：${payload.total} 条 Query`);
  } catch (error) {
    toast(error.message);
  }
}

function bindQueryManagerEvents(type) {
  const selection = querySelection(type);
  const search = $("#querySearch");
  if (search) {
    search.oninput = () => {
      window.clearTimeout(querySearchTimer);
      querySearchTimer = window.setTimeout(async () => {
        await loadQueries(search.value.trim(), type);
        if (state.stage === (type === "breadth" ? 2 : 3)) render();
      }, 260);
    };
  }
  $$("[data-query-select]").forEach((checkbox) => {
    checkbox.onchange = () => {
      if (checkbox.checked) {
        selection.add(checkbox.dataset.querySelect);
      } else {
        selection.delete(checkbox.dataset.querySelect);
      }
      const countNode = $("#querySelectionCount");
      const summaryNode = $("#evaluationQueryCount");
      if (countNode) countNode.textContent = String(selection.size);
      if (summaryNode) summaryNode.textContent = `${selection.size} 条 / Skill`;
      renderFooter();
    };
  });
  if ($("#selectAllQueriesButton")) {
    $("#selectAllQueriesButton").onclick = async () => {
      try {
        const params = new URLSearchParams({
          search: state.queryViews[type].search || "",
          evaluation_type: type,
        });
        const payload = await api(`/api/query-ids?${params}`);
        state.querySelections[type] = new Set(payload.query_ids);
        render();
        toast(`已选择完整 Query 集：${payload.total} 条；执行时作为一个完整批次保存`);
      } catch (error) {
        toast(error.message);
      }
    };
  }
  if ($("#clearQuerySelectionButton")) {
    $("#clearQuerySelectionButton").onclick = () => {
      state.querySelections[type] = new Set();
      render();
    };
  }
  if ($("#queryBulkField")) {
    $("#queryBulkField").onchange = (event) => {
      state.queryBulk[type].field = event.target.value;
      state.queryBulk[type].value = state.queryFacets[type]?.[event.target.value]?.[0]?.value || "";
      render();
    };
  }
  if ($("#queryBulkValue")) {
    $("#queryBulkValue").onchange = (event) => {
      state.queryBulk[type].value = event.target.value;
    };
  }
  if ($("#bulkAddQueriesButton")) {
    $("#bulkAddQueriesButton").onclick = () => applyBulkQuerySelection(type, "add");
  }
  if ($("#bulkRemoveQueriesButton")) {
    $("#bulkRemoveQueriesButton").onclick = () => applyBulkQuerySelection(type, "remove");
  }
  $$("[data-edit-query]").forEach((button) => {
    button.onclick = () => openQueryDialog(state.queryCache.get(button.dataset.editQuery));
  });
  if ($("#importQueryButton")) $("#importQueryButton").onclick = () => {
    state.queryContextType = type;
    $("#queryFileInput").click();
  };
  if ($("#addQueryButton")) $("#addQueryButton").onclick = () => {
    state.queryContextType = type;
    openQueryDialog();
  };
  if ($("#deleteQueryButton")) $("#deleteQueryButton").onclick = () => deleteSelectedQueries(type);
}

function openQueryDialog(query = null) {
  const form = $("#queryForm");
  form.reset();
  form.elements.editing_query_id.value = query?.query_id || "";
  form.elements.query_id.value = query?.query_id || "";
  form.elements.query_id.disabled = Boolean(query);
  form.elements.data_grid_time_id.value = query?.data_grid_time_id || "";
  form.elements.asset_category.value = query?.asset_category || "";
  form.elements.block_l1.value = query?.block_l1 || "";
  form.elements.block_l2.value = query?.block_l2 || "";
  form.elements.time_depth.value = query?.time_depth || "最新/实时";
  form.elements.query.value = query?.query || "";
  $("#queryDialogTitle").textContent = query ? `编辑 ${query.query_id}` : "新增 Query";
  $("#queryDialog").showModal();
}

async function submitQuery(event) {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  payload.evaluation_type = state.queryContextType;
  const editingId = payload.editing_query_id;
  delete payload.editing_query_id;
  if (editingId) delete payload.query_id;
  try {
    const saved = await api(editingId ? `/api/queries/${encodeURIComponent(editingId)}` : "/api/queries", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    state.queryCache.set(saved.query_id, saved);
    $("#queryDialog").close();
    await Promise.all([
      loadQueries(state.queryViews.breadth.search, "breadth"),
      loadQueries(state.queryViews.depth.search, "depth"),
      loadQueryFacets("breadth"),
      loadQueryFacets("depth"),
      loadHealth(),
    ]);
    render();
    toast(editingId ? "Query 已更新" : "Query 已新增");
  } catch (error) {
    toast(error.message);
  }
}

async function importQueryFile(file) {
  if (!file) return;
  try {
    const response = await fetch("/api/queries/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": encodeURIComponent(file.name),
        "X-Evaluation-Type": state.queryContextType,
      },
      body: file,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "导入失败");
    const type = state.queryContextType;
    payload.query_ids.forEach((id) => querySelection(type).add(id));
    state.queryViews[type].search = "";
    await Promise.all([
      loadQueries("", type),
      loadQueries(state.queryViews[type === "breadth" ? "depth" : "breadth"].search, type === "breadth" ? "depth" : "breadth"),
      loadQueryFacets(type),
      loadHealth(),
    ]);
    render();
    toast(`导入 ${payload.inserted} 条，更新 ${payload.updated} 条，失败 ${payload.failed} 条`);
  } catch (error) {
    toast(error.message);
  } finally {
    $("#queryFileInput").value = "";
  }
}

async function deleteSelectedQueries(type) {
  const selection = querySelection(type);
  const customIds = [...selection].filter((id) => state.queryCache.get(id)?.source === "custom");
  if (!customIds.length) {
    toast("没有选中的自定义 Query；正式模板不可删除");
    return;
  }
  try {
    await Promise.all(customIds.map((id) => api(`/api/queries/${encodeURIComponent(id)}`, { method: "DELETE" })));
    customIds.forEach((id) => {
      state.querySelections.breadth.delete(id);
      state.querySelections.depth.delete(id);
      state.queryCache.delete(id);
    });
    await Promise.all([
      loadQueries(state.queryViews.breadth.search, "breadth"),
      loadQueries(state.queryViews.depth.search, "depth"),
      loadQueryFacets("breadth"),
      loadQueryFacets("depth"),
      loadHealth(),
    ]);
    render();
    toast(`已删除 ${customIds.length} 条自定义 Query`);
  } catch (error) {
    toast(error.message);
  }
}

function renderBreadth() {
  renderEvaluationStage("breadth", {
    title: "运行广度实测",
    intro: "以当前选中的数据格 Query 为完整分母。声明只用于路由和差异解释，不能直接判定覆盖。",
    button: "一键运行广度评测",
    guide: [
      ["对象与数据格", "返回必须匹配请求实体、市场和二级数据块。"],
      ["必要证据", "至少返回核心字段与最新有效时间，不接受公司概况或关键词相关内容替代。"],
      ["覆盖口径", "完全支持计1，部分支持计0.5；待测单列，不偷算为不支持。"],
    ],
  });
}

function renderDepth() {
  const timeStats = selectedQueries("depth").reduce((acc, item) => {
    acc[item.time_depth] = (acc[item.time_depth] || 0) + 1;
    return acc;
  }, {});
  renderEvaluationStage("depth", {
    title: "运行深度实测",
    intro: `当前样本时间构成：${Object.entries(timeStats).map(([key, value]) => `${key} ${value}条`).join("、") || "尚未选择Query"}。建议从广度有结果和战略重点数据格中选择。`,
    button: "一键运行深度评测",
    guide: [
      ["字段能力", "核心字段逐项验收，扩展字段计算覆盖率，单位/币种/口径单独保留。"],
      ["时间能力", "动态常规数据测最新、1年内、5年前；周期数据测1年内、5年前；Tick测实时和1周内。"],
      ["市场与结构", "同模板替换代表市场实体；结构化程度按S0—S3单独评价。"],
    ],
  });
}

function renderEvaluationStage(type, copy) {
  state.queryContextType = type;
  const selection = querySelection(type);
  const runs = latestRunsForEvaluation(type);
  const runningRuns = runs.filter((run) => ["queued", "running"].includes(run.status));
  const maxConcurrency = state.health?.evaluation_runtime?.max_concurrency || 2;
  const activeJudge = state.judgeProvider?.active_provider || "codex";
  const judgeLabel = activeJudge === "workbuddy" ? "WorkBuddy" : "Codex";
  const judgeHealth = state.judgeProvider?.health?.[activeJudge] || {};
  $("#stageBody").innerHTML = `
    <div class="evaluation-config">
      <div class="card">
        <div class="card-head">目标 Skill（可多选）</div>
        <div class="card-body">
          <div class="evaluation-skill-grid">${state.skills.map((skill) => {
            const auth = state.authBySkill.get(skill.id);
            return `<label class="evaluation-skill ${state.selectedEvaluationSkillIds.has(skill.id) ? "selected" : ""}">
              <input type="checkbox" data-evaluation-skill="${escapeHtml(skill.id)}" ${state.selectedEvaluationSkillIds.has(skill.id) ? "checked" : ""}>
              <span><b>${escapeHtml(skill.name)}</b><small>${escapeHtml(auth?.status_label || "授权待检查")}</small></span>
            </label>`;
          }).join("")}</div>
          <div class="hint" style="margin-top:9px">可以一次提交多个 Skill；本机最多并行 ${maxConcurrency} 个固定 Runner。${judgeLabel} 只复核本地规则无法确定的语义，不再负责取数。</div>
        </div>
      </div>
      <div class="launch-card">
        <span class="eyebrow">${type === "breadth" ? "BREADTH" : "DEPTH"} EVALUATION</span>
        <h3>${copy.title}</h3>
        <p>${copy.intro}</p>
        <div class="launch-summary">
          <div><span>目标 Skill</span><b>${state.selectedEvaluationSkillIds.size} 个</b></div>
          <div><span>Query 数量</span><b id="evaluationQueryCount">${selection.size} 条 / Skill</b></div>
          <div><span>数据来源</span><b>仅目标 Skill 的真实 raw_output</b></div>
        </div>
        <div class="success-box">执行链路：QuerySpec映射 → 固定Runner真实取数 → 本地硬门禁 → 仅不确定项由${judgeLabel}只读复核。原始返回和全部尝试始终保留。</div>
        <div class="judge-provider-switch">
          <div>
            <span>语义复核环境</span>
            <small>${escapeHtml(judgeHealth.message || "请选择复核环境")}</small>
          </div>
          <div class="judge-provider-options">
            <label class="${activeJudge === "codex" ? "selected" : ""}">
              <input type="radio" name="judgeProvider" value="codex" ${activeJudge === "codex" ? "checked" : ""}>Codex
            </label>
            <label class="${activeJudge === "workbuddy" ? "selected" : ""}">
              <input type="radio" name="judgeProvider" value="workbuddy" ${activeJudge === "workbuddy" ? "checked" : ""}>WorkBuddy
            </label>
            <button class="button secondary small" id="testJudgeProviderButton" type="button">测试连接</button>
          </div>
        </div>
        <button class="button primary launch-button" id="runEvaluationButton" type="button" ${!state.selectedEvaluationSkillIds.size || !selection.size || runningRuns.length ? "disabled" : ""}>${runningRuns.length ? `${runningRuns.length} 个批次执行中…` : copy.button}</button>
        <p class="run-message">${!selection.size ? `请在下方选择${type === "breadth" ? "广度" : "深度"} Query。` : ""}</p>
      </div>
    </div>
    <div class="card evaluation-section">
      <div class="card-body">${renderQueryManagerContent(type)}</div>
    </div>
    <div class="rules-layout">
      <div class="card">
        <div class="card-head">本环节验收规则 · 可编辑</div>
        <div class="card-body">
          <textarea class="rules-editor" id="acceptanceRulesEditor">${escapeHtml(state.evaluationRules[type] || "")}</textarea>
          <div class="rules-actions">
            <span>点击执行时会把当前文本写入本批 acceptance_rules.md，旧批次规则不会被后续修改覆盖。</span>
            <button class="button secondary small" id="saveRulesButton" type="button">保存为默认规则</button>
          </div>
        </div>
      </div>
      <aside class="card">
        <div class="card-head">${type === "breadth" ? "广度验收边界" : "深度四维拆解"}</div>
        <div class="card-body"><div class="dimension-guide">${copy.guide.map(([title, text]) => `<div><b>${title}</b><span>${text}</span></div>`).join("")}</div></div>
      </aside>
    </div>
    <div class="results-wrap">
      <div class="results-head"><div><h3>测评进度与结果</h3><p>取数进度来自Runner证据库；结果同时展示覆盖结论、真实尝试、成功调用、耗时与可反馈的路由/验收问题。</p></div></div>
      ${renderRunComparison(runs)}
      ${runs.length ? runs.map((run) => renderRunResult(run)).join("") : '<div class="empty"><b>尚未产生本环节结果</b>选择 Skill、Query 并确认验收规则后即可执行。</div>'}
    </div>`;
  $$("[data-evaluation-skill]").forEach((checkbox) => {
    checkbox.onchange = () => {
      if (checkbox.checked) state.selectedEvaluationSkillIds.add(checkbox.dataset.evaluationSkill);
      else state.selectedEvaluationSkillIds.delete(checkbox.dataset.evaluationSkill);
      render();
    };
  });
  bindQueryManagerEvents(type);
  $("#acceptanceRulesEditor").oninput = (event) => {
    state.evaluationRules[type] = event.target.value;
  };
  $("#saveRulesButton").onclick = () => saveEvaluationRules(type);
  $$('input[name="judgeProvider"]').forEach((input) => {
    input.onchange = () => setJudgeProvider(input.value, type);
  });
  $("#testJudgeProviderButton").onclick = () => testJudgeProvider(type);
  if ($("#runEvaluationButton")) $("#runEvaluationButton").onclick = () => startEvaluation(type);
  runs.forEach((run) => bindRunResultEvents(run));
}

async function setJudgeProvider(provider, type) {
  const editor = $("#acceptanceRulesEditor");
  if (editor) state.evaluationRules[type] = editor.value;
  try {
    await api("/api/judge-provider", {
      method: "PUT",
      body: JSON.stringify({ active_provider: provider }),
    });
    await Promise.all([loadJudgeProvider(), loadHealth()]);
    render();
    toast(`语义复核已切换为 ${provider === "workbuddy" ? "WorkBuddy" : "Codex"}；只影响新建批次`);
  } catch (error) {
    toast(error.message);
    render();
  }
}

async function testJudgeProvider(type) {
  const editor = $("#acceptanceRulesEditor");
  if (editor) state.evaluationRules[type] = editor.value;
  const provider = state.judgeProvider?.active_provider || "codex";
  const button = $("#testJudgeProviderButton");
  if (button) {
    button.disabled = true;
    button.textContent = "测试中…";
  }
  try {
    const result = await api("/api/judge-provider/test", {
      method: "POST",
      body: JSON.stringify({ provider }),
    });
    await Promise.all([loadJudgeProvider(), loadHealth()]);
    render();
    toast(result.message || (result.ok ? "连接测试成功" : "连接测试失败"));
  } catch (error) {
    toast(error.message);
    render();
  }
}

async function saveEvaluationRules(type) {
  const editor = $("#acceptanceRulesEditor");
  if (editor) state.evaluationRules[type] = editor.value;
  try {
    const saved = await api(`/api/evaluation-rules/${type}`, {
      method: "PUT",
      body: JSON.stringify({ content: state.evaluationRules[type] }),
    });
    state.evaluationRules[type] = saved.content;
    toast(`${type === "breadth" ? "广度" : "深度"}验收规则已保存`);
  } catch (error) {
    toast(error.message);
  }
}

async function startEvaluation(type) {
  const selection = querySelection(type);
  if (!state.selectedEvaluationSkillIds.size || !selection.size) return;
  const editor = $("#acceptanceRulesEditor");
  if (editor) state.evaluationRules[type] = editor.value;
  try {
    const group = await api("/api/run-groups", {
      method: "POST",
      body: JSON.stringify({
        skill_ids: [...state.selectedEvaluationSkillIds],
        query_ids: [...selection],
        evaluation_type: type,
        acceptance_rules: state.evaluationRules[type],
      }),
    });
    await Promise.all([loadRuns(), loadBatches()]);
    render();
    group.runs.forEach((response) => pollRun(response.run_id, type));
    toast(`已创建完整测评批次 ${group.batch_id}；${group.skill_count} 个 Skill 的结果分别保存`);
  } catch (error) {
    toast(error.message);
  }
}

function pollRun(runId, type) {
  window.clearTimeout(state.pollingTimers[runId]);
  const poll = async () => {
    try {
      const run = await api(`/api/runs/${encodeURIComponent(runId)}`);
      const index = state.runs.findIndex((item) => item.run_id === run.run_id);
      if (index >= 0) state.runs[index] = run;
      else state.runs.unshift(run);
      if (state.stage === 6 && state.selectedBatchId) {
        state.selectedBatch = await api(
          `/api/batches/${encodeURIComponent(state.selectedBatchId)}`,
        ).catch(() => state.selectedBatch);
      }
      if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
        await Promise.all([loadRuns(), loadBatches(), loadDashboard()]);
        render();
        toast(run.status === "completed" ? "评测完成" : run.status === "cancelled" ? "评测已暂停" : "评测失败");
        return;
      }
      if (state.stage === (type === "breadth" ? 2 : 3) || state.stage === 6) render();
      state.pollingTimers[runId] = window.setTimeout(poll, 2200);
    } catch {
      state.pollingTimers[runId] = window.setTimeout(poll, 4000);
    }
  };
  poll();
}

function renderRunComparison(runs) {
  const completed = runs.filter((run) => run.status === "completed" && run.result);
  if (completed.length < 2) return "";
  const sameGroup = completed.every((run) => run.group_id && run.group_id === completed[0].group_id);
  if (!sameGroup) return "";
  return `<div class="card" style="margin-bottom:12px">
    <div class="card-head">同批多 Skill 横向对比</div>
    <div class="card-body">
      <div class="table-shell">
        <table>
          <thead><tr><th>Skill</th><th>加权覆盖率</th><th>完全</th><th>部分</th><th>不支持</th><th>待测</th><th>取数成功</th><th>成功/尝试</th><th>总耗时</th></tr></thead>
          <tbody>${completed.map((run) => {
            const summary = run.result.summary || {};
            const counts = summary.verdict_counts || {};
            const skillName = state.skills.find((item) => item.id === run.skill_id)?.name || run.skill_id;
            return `<tr>
              <td><span class="name">${escapeHtml(skillName)}</span></td>
              <td><b>${formatPercent(summary.weighted_coverage)}</b></td>
              <td>${counts["✓"] || 0}</td>
              <td>${counts["▲"] || 0}</td>
              <td>${counts["✗"] || 0}</td>
              <td>${counts["待测"] || 0}</td>
              <td>${summary.retrieval_success_count || 0}/${summary.query_count || 0}</td>
              <td>${summary.valid_attempt_count || 0}/${summary.attempt_count || 0}</td>
              <td>${formatElapsed(summary.total_elapsed_ms)}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function resultMatchesFilter(result, filter) {
  if (filter === "runtime_success") return result.status === "success";
  if (filter === "runtime_failed") return result.status !== "success";
  if (filter === "verdict_full") return result.judge_verdict === "✓";
  if (filter === "verdict_partial") return result.judge_verdict === "▲";
  if (filter === "verdict_fail") return result.judge_verdict === "✗";
  if (filter === "verdict_waiting") return result.judge_verdict === "待测";
  return true;
}

function runtimeStatusLabel(status) {
  return status === "success" ? "已完成取数" : status || "状态未知";
}

function progressPhaseLabel(phase) {
  const labels = {
    queued: "等待开始",
    loading_evidence: "载入既有证据",
    retrieving: "目标 Skill 取数",
    judging: "本地规则验收",
    local_judging: "本地规则重判",
    semantic_review: "语义复核",
    completed: "已完成",
    failed: "执行失败",
    cancelled: "已停止",
  };
  return labels[phase] || phase || "处理中";
}

function renderRunResult(run, resultFilter = "all") {
  const skillName = state.skills.find((item) => item.id === run.skill_id)?.name || run.skill_id;
  const progress = run.progress || { completed: 0, total: run.query_count, phase: run.status };
  const total = Number(progress.total || run.query_count || 0);
  const completed = Number(progress.completed || 0);
  const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  if (["queued", "running"].includes(run.status)) {
    const isRejudge = run.execution_engine === "rejudge_existing_evidence";
    return `<div class="run-progress-card">
      <div class="run-progress-head">
        <div><b>${escapeHtml(skillName)} · ${isRejudge ? "再次验收" : "取数与验收"}</b><span>${escapeHtml(run.run_id)}</span></div>
        <span class="status ${run.status === "running" ? "running" : "pending"}">${run.status === "running" ? progressPhaseLabel(progress.phase) : "排队中"}</span>
      </div>
      <div class="progress-track"><i style="width:${percent}%"></i></div>
      <div class="progress-meta">
        <span>${completed} / ${total} 条 · ${percent}%</span>
        <span>${escapeHtml(progress.current_query_id || progressPhaseLabel(progress.phase))}</span>
        <span>${escapeHtml(progress.message || (isRejudge ? "只读取已有raw_output，不会调用目标Skill" : "等待固定Runner返回进度"))}</span>
      </div>
    </div>`;
  }
  if (run.status === "failed") {
    return `<div class="run-progress-card failed"><div class="warning-box"><b>${escapeHtml(skillName)} 本批未完成：</b>${escapeHtml(run.error_message || "未知执行错误")}；已处理 ${completed}/${total} 条。</div></div>`;
  }
  if (!run.result) return "";
  const summary = run.result.summary;
  const counts = summary.verdict_counts;
  const allResults = run.result.results || [];
  const visibleResults = allResults.filter((result) => resultMatchesFilter(result, resultFilter));
  const retryableCount = Number(summary.retryable_count || run.retryable_count || 0);
  return `
    <div class="results-wrap">
      <div class="results-head">
        <div><h3>${escapeHtml(skillName)} · ${summary.grid_count || summary.query_count} 个数据格</h3><p>${escapeHtml(run.run_id)} · ${escapeHtml(run.finished_at || "")}</p></div>
        <div class="actions">
          ${retryableCount ? `<button class="button secondary small" data-retry-run="${escapeHtml(run.run_id)}" type="button">仅重跑失败/未执行（${retryableCount}）</button>` : ""}
          <button class="button secondary small" data-rejudge-run="${escapeHtml(run.run_id)}" data-rejudge-type="${escapeHtml(run.evaluation_type || "breadth")}" type="button">再次验收（不取数）</button>
          <span class="status ${retryableCount ? "partial" : "full"}">${retryableCount ? "暂定覆盖矩阵" : "完整覆盖矩阵"} · 规则已冻结</span>
        </div>
      </div>
      <div class="metric-grid six" style="margin-bottom:9px">
        <div class="metric"><b>${formatPercent(summary.weighted_coverage)}</b><span>加权覆盖率</span></div>
        <div class="metric green"><b>${counts["✓"] || 0}</b><span>完全支持</span></div>
        <div class="metric amber"><b>${counts["▲"] || 0}</b><span>部分支持</span></div>
        <div class="metric red"><b>${counts["✗"] || 0}</b><span>不支持</span></div>
        <div class="metric"><b>${counts["待测"] || 0}</b><span>待测</span></div>
        <div class="metric"><b>${formatElapsed(summary.total_elapsed_ms)}</b><span>总耗时</span></div>
      </div>
      <div class="hint" style="margin-bottom:9px">执行引擎：${escapeHtml(summary.execution_engine || run.execution_engine || "fixed_runner")} · 逻辑批次共 ${summary.execution_count || run.execution_count || 1} 次执行 / 重跑 ${summary.retry_count || run.retry_count || 0} 次 · 取数成功 ${summary.retrieval_success_count || 0}/${summary.query_count || 0} 条 · 本地确定 ${Object.entries(summary.judge_source_counts || {}).filter(([key]) => key.startsWith("local_")).reduce((sum, [, value]) => sum + Number(value || 0), 0)} 条 · 语义缓存 ${summary.semantic_cache_hit_count || 0} 条 · 本次新增语义复核 ${summary.semantic_new_review_count || 0} 条 · 实际累计耗时 ${formatElapsed(summary.total_actual_elapsed_ms ?? summary.total_elapsed_ms)} · 当前筛选展示 ${visibleResults.length}/${allResults.length} 条 · 验收来源：${escapeHtml(Object.entries(summary.judge_source_counts || {}).map(([key, value]) => `${key} ${value}`).join("、") || "本地硬门禁")}</div>
      <div class="table-shell scroll">
        <table>
          <thead><tr><th style="width:90px">Query</th><th style="width:190px">数据格 / 时间</th><th style="width:92px">取数状态</th><th style="width:82px">验收判定</th><th style="width:280px">维度门禁</th><th>原因 / 证据</th><th style="width:75px">操作</th></tr></thead>
          <tbody>${visibleResults.length ? visibleResults.map((result) => `
            <tr>
              <td><span class="name">${escapeHtml(result.query_id)}</span><span class="query-sub">${escapeHtml(result.data_grid_time_id)}</span></td>
              <td>${escapeHtml(result.asset_category)} / ${escapeHtml(result.block_l2)}<span class="query-sub">${escapeHtml(result.time_depth)}</span></td>
              <td><span class="status ${result.status === "success" ? "completed" : "failed"}">${escapeHtml(runtimeStatusLabel(result.status))}</span></td>
              <td><span class="verdict ${verdictClass(result.judge_verdict)}">${escapeHtml(result.judge_verdict)} ${verdictLabel(result.judge_verdict)}</span></td>
              <td><div class="dimension-list">${Object.entries(dimensionNames).map(([key, label]) => `<span class="dimension ${escapeHtml(result.dimensions?.[key] || "unknown")}">${label}</span>`).join("")}</div></td>
              <td>${escapeHtml(result.judge_reason)}</td>
              <td><button class="link-button" data-result-query="${escapeHtml(result.query_id)}" data-result-run="${escapeHtml(run.run_id)}" type="button">查看证据</button><br><button class="link-button" data-feedback-query="${escapeHtml(result.query_id)}" data-feedback-run="${escapeHtml(run.run_id)}" type="button">人工复核</button></td>
            </tr>`).join("") : '<tr><td colspan="7" class="empty">当前筛选条件下没有 Query。</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

function bindRunResultEvents(run) {
  if (!run?.result) return;
  $$("[data-result-query]").forEach((button) => {
    button.onclick = () => openResultEvidence(button.dataset.resultRun, button.dataset.resultQuery);
  });
  $$("[data-feedback-query]").forEach((button) => {
    button.onclick = () => openFeedback(button.dataset.feedbackRun, button.dataset.feedbackQuery);
  });
  $$("[data-retry-run]").forEach((button) => {
    button.onclick = () => retryFailedQueries(button.dataset.retryRun);
  });
  $$("[data-rejudge-run]").forEach((button) => {
    button.onclick = () => rejudgeExistingEvidence(
      button.dataset.rejudgeRun,
      button.dataset.rejudgeType || "breadth",
    );
  });
}

async function rejudgeExistingEvidence(runId, evaluationType) {
  const rules = state.evaluationRules[evaluationType] || "";
  if (!window.confirm("将按前端当前验收规则重新判定本批已有 raw_output；不会重新调用目标 Skill，也不会覆盖旧批次。继续吗？")) return;
  try {
    const response = await api(`/api/runs/${encodeURIComponent(runId)}/rejudge`, {
      method: "POST",
      body: JSON.stringify({ acceptance_rules: rules }),
    });
    await Promise.all([loadRuns(), loadBatches(), loadDashboard()]);
    if (state.stage === 6 && response.batch_id) {
      state.batchType = evaluationType;
      state.selectedBatchId = response.batch_id;
      state.selectedBatch = await api(`/api/batches/${encodeURIComponent(response.batch_id)}`).catch(() => null);
    }
    render();
    pollRun(response.run_id, evaluationType);
    toast("再次验收已开始：复用已有取数，只执行本地规则、精确缓存和必要的语义复核");
  } catch (error) {
    toast(error.message);
  }
}

async function retryFailedQueries(runId) {
  if (!window.confirm("只重跑取数失败、超时、待授权或尚未执行的 Query；原有成功结果会保留并合并。继续吗？")) return;
  try {
    const response = await api(`/api/runs/${encodeURIComponent(runId)}/retry-failures`, {
      method: "POST",
      body: "{}",
    });
    await Promise.all([loadRuns(), loadBatches(), loadDashboard()]);
    render();
    pollRun(response.run_id, state.runs.find((item) => item.run_id === response.root_run_id)?.evaluation_type || "breadth");
    toast(`已提交 ${response.query_count} 条失败/未执行 Query；结果将合并回原批次`);
  } catch (error) {
    toast(error.message);
  }
}

async function cancelEvaluationBatch(batchId) {
  if (!window.confirm("停止运行只会暂停本批次继续取数，已产生的结果和证据会保留。继续吗？")) return;
  try {
    await api(`/api/batches/${encodeURIComponent(batchId)}/cancel`, {
      method: "POST",
      body: "{}",
    });
    await Promise.all([loadRuns(), loadBatches(), loadDashboard()]);
    if (state.selectedBatchId === batchId) {
      state.selectedBatch = await api(`/api/batches/${encodeURIComponent(batchId)}`).catch(() => null);
    }
    render();
    toast("批次已暂停取数");
  } catch (error) {
    toast(error.message);
  }
}

async function deleteEvaluationBatch(batchId) {
  if (!window.confirm(`清空后将删除本批次的结果目录、数据库记录和后端运行记录：\n${batchId}\n\n确认清空吗？`)) return;
  try {
    await api(`/api/batches/${encodeURIComponent(batchId)}`, {
      method: "DELETE",
    });
    state.batches = state.batches.filter((item) => item.batch_id !== batchId);
    state.runs = state.runs.filter((item) => item.group_id !== batchId && item.run_id !== batchId);
    if (state.selectedBatchId === batchId) {
      state.selectedBatchId = "";
      state.selectedBatch = null;
    }
    render();
    await Promise.all([loadRuns(), loadBatches(), loadDashboard()]);
    render();
    toast("批次已清空");
  } catch (error) {
    toast(error.message);
  }
}

async function openResultEvidence(runId, queryId) {
  $("#resultDialogTitle").textContent = `${queryId} · 正在加载完整证据`;
  $("#resultDialogBody").innerHTML = '<div class="empty"><b>正在读取本地完整 raw_output…</b></div>';
  $("#resultDialog").showModal();
  try {
    const run = await api(`/api/runs/${encodeURIComponent(runId)}?evidence=1`);
    const result = run?.result?.results.find((item) => item.query_id === queryId);
    if (!result) throw new Error("没有找到该Query的完整证据");
    $("#resultDialogTitle").textContent = `${queryId} · ${verdictLabel(result.judge_verdict)}`;
    $("#resultDialogBody").innerHTML = `
    <div class="evidence-grid">
      <div class="evidence-block wide"><h4>原始 Query</h4><p>${escapeHtml(result.query)}</p></div>
      <div class="evidence-block"><h4>最终判定</h4><p>${escapeHtml(result.judge_verdict)} · ${escapeHtml(result.judge_reason)}</p></div>
      <div class="evidence-block"><h4>路由摘要</h4><p>${escapeHtml(result.route_summary || "未提供")}</p></div>
      <div class="evidence-block"><h4>验收来源</h4><p>${escapeHtml(result.judge_source || "local_hard_gate")}</p></div>
      <div class="evidence-block wide"><h4>QuerySpec运行映射</h4><pre class="raw-output">${escapeHtml(JSON.stringify(result.query_spec || {}, null, 2))}</pre></div>
      <div class="evidence-block wide"><h4>判定证据</h4><p>${escapeHtml(result.evidence || "未提供")}</p></div>
      <div class="evidence-block wide"><h4>格式化展示</h4><p>${escapeHtml(result.normalized_output || "未生成")}</p></div>
      <div class="evidence-block wide"><h4>目标 Skill 完整 raw_output</h4><pre class="raw-output">${escapeHtml(result.raw_output || "")}</pre></div>
      <div class="evidence-block wide"><h4>全部尝试</h4>${(result.attempts || []).map((attempt) => `<p><b>尝试${attempt.attempt}</b> · ${escapeHtml(attempt.status)} · ${formatElapsed(attempt.elapsed_ms)} · ${escapeHtml(attempt.route)}</p><pre class="raw-output">${escapeHtml(attempt.raw_output)}</pre>`).join("") || "<p>没有尝试记录。</p>"}</div>
    </div>`;
  } catch (error) {
    $("#resultDialogBody").innerHTML = `<div class="warning-box">${escapeHtml(error.message)}</div>`;
  }
}

function openFeedback(runId, queryId) {
  const form = $("#feedbackForm");
  form.reset();
  form.dataset.runId = runId;
  form.elements.query_id.value = queryId;
  $("#feedbackDialog").showModal();
}

async function submitFeedback(event) {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  try {
    await api(`/api/runs/${encodeURIComponent(event.currentTarget.dataset.runId)}/feedback`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    $("#feedbackDialog").close();
    await loadRuns();
    render();
    toast("人工复核意见已保存");
  } catch (error) {
    toast(error.message);
  }
}

function dashboardCoverageCard(label, metrics) {
  if (!metrics) {
    return `<div class="dashboard-kpi empty-kpi"><span>${label}</span><b>尚未测评</b><small>完成一次${label}评测后自动进入看板</small></div>`;
  }
  const summary = metrics.summary || {};
  const counts = summary.verdict_counts || {};
  const provisional = !summary.effective_complete;
  return `
    <div class="dashboard-kpi">
      <div class="dashboard-kpi-title"><span>${label}</span><em class="status ${provisional ? "partial" : "full"}">${provisional ? "暂定" : "完整"}</em></div>
      <b>${formatPercent(summary.weighted_coverage)}</b>
      <small>✓ ${counts["✓"] || 0} · ▲ ${counts["▲"] || 0} · ✗ ${counts["✗"] || 0} · 待测 ${counts["待测"] || 0}</small>
      <small>取数 ${summary.retrieval_success_count || 0}/${summary.query_count || 0} · 累计 ${formatElapsed(summary.total_actual_elapsed_ms ?? summary.total_elapsed_ms)}</small>
    </div>`;
}

function renderDashboardDimension(label, metric) {
  if (!metric || metric.score === null || metric.score === undefined) {
    return `<div class="dimension-score unresolved"><span>${label}</span><b>待测</b><small>当前结果未形成可比较证据</small></div>`;
  }
  return `<div class="dimension-score"><span>${label}</span><b>${formatPercent(metric.score)}</b><small>已验收 ${metric.tested || 0} · 未决 ${metric.unresolved || 0}</small></div>`;
}

function renderCoverageBars(rows) {
  if (!rows?.length) return '<div class="empty"><b>暂无分项数据</b></div>';
  return `<div class="coverage-bars">${rows.map((item) => {
    const width = Math.max(1, Math.round((Number(item.weighted_coverage) || 0) * 100));
    return `<div class="coverage-bar-row">
      <div><b>${escapeHtml(item.name)}</b><span>${item.runtime_success_count}/${item.query_count} 条取数成功${item.unresolved_count ? ` · ${item.unresolved_count} 条未决` : ""}</span></div>
      <div class="coverage-bar-track"><i style="width:${width}%"></i></div>
      <strong>${formatPercent(item.weighted_coverage)}</strong>
    </div>`;
  }).join("")}</div>`;
}

function renderDashboard() {
  const skills = state.dashboard?.skills || [];
  const selected = skills.find((item) => item.skill_id === state.dashboardSkillId);
  const detail = selected?.[state.dashboardType];
  $("#stageBody").innerHTML = `
    <div class="dashboard-layout">
      <aside class="card dashboard-skill-list">
        <div class="card-head">选择 Skill</div>
        <div class="card-body">
          ${skills.length ? skills.map((item) => `
            <button class="dashboard-skill ${item.skill_id === state.dashboardSkillId ? "active" : ""}" data-dashboard-skill="${escapeHtml(item.skill_id)}" type="button">
              <b>${escapeHtml(item.skill_name)}</b>
              <span>广度 ${item.breadth ? formatPercent(item.breadth.summary?.weighted_coverage) : "未测"} · 深度 ${item.depth ? formatPercent(item.depth.summary?.weighted_coverage) : "未测"}</span>
            </button>`).join("") : '<div class="empty"><b>暂无测评数据</b>完成广度或深度评测后自动出现。</div>'}
        </div>
      </aside>
      <section class="dashboard-main">
        <div class="section-line">
          <div><h3>${escapeHtml(selected?.skill_name || "Skill 覆盖数据面板")}</h3><p>默认展示每个 Skill 最近一次独立时间点的逻辑批次；失败重跑只补齐该批次，不会混入其他日期。</p></div>
          <button class="button secondary small" id="dashboardRefreshButton" type="button">刷新数据</button>
        </div>
        <div class="dashboard-kpi-grid">
          ${dashboardCoverageCard("广度覆盖", selected?.breadth)}
          ${dashboardCoverageCard("深度覆盖", selected?.depth)}
        </div>
        <div class="batch-tabs compact-tabs">
          <button class="${state.dashboardType === "breadth" ? "active" : ""}" data-dashboard-type="breadth" type="button"><b>广度分项</b><span>按资产类别看覆盖</span></button>
          <button class="${state.dashboardType === "depth" ? "active" : ""}" data-dashboard-type="depth" type="button"><b>深度分项</b><span>时间、字段、市场与结构</span></button>
        </div>
        ${detail ? `
          <div class="card dashboard-detail">
            <div class="card-head">${state.dashboardType === "breadth" ? "资产类别覆盖" : "深度维度与资产类别覆盖"} <span>批次 ${escapeHtml(detail.batch_id || "")}</span></div>
            <div class="card-body">
              ${state.dashboardType === "depth" ? `<div class="dimension-score-grid">
                ${renderDashboardDimension("时间", detail.dimensions?.time)}
                ${renderDashboardDimension("字段", detail.dimensions?.fields)}
                ${renderDashboardDimension("市场", detail.dimensions?.market)}
                ${renderDashboardDimension("结构化", detail.dimensions?.structure)}
              </div>` : ""}
              ${renderCoverageBars(detail.by_asset_category)}
            </div>
          </div>` : '<div class="empty"><b>该 Skill 尚无本类结果</b>请先执行对应评测。</div>'}
      </section>
    </div>
    <div class="card dashboard-comparison">
      <div class="card-head">各 Skill 最近结果横向对比</div>
      <div class="card-body"><div class="table-shell"><table>
        <thead><tr><th>Skill</th><th>广度覆盖</th><th>广度取数</th><th>深度覆盖</th><th>深度取数</th><th>未决 Query</th></tr></thead>
        <tbody>${skills.length ? skills.map((item) => `<tr>
          <td><b>${escapeHtml(item.skill_name)}</b></td>
          <td>${item.breadth ? formatPercent(item.breadth.summary?.weighted_coverage) : "—"}</td>
          <td>${item.breadth ? `${item.breadth.summary?.retrieval_success_count || 0}/${item.breadth.summary?.query_count || 0}` : "—"}</td>
          <td>${item.depth ? formatPercent(item.depth.summary?.weighted_coverage) : "—"}</td>
          <td>${item.depth ? `${item.depth.summary?.retrieval_success_count || 0}/${item.depth.summary?.query_count || 0}` : "—"}</td>
          <td>${Number(item.breadth?.retryable_count || 0) + Number(item.depth?.retryable_count || 0)}</td>
        </tr>`).join("") : '<tr><td colspan="6" class="empty">暂无可比较结果。</td></tr>'}</tbody>
      </table></div></div>
    </div>`;
  $$("[data-dashboard-skill]").forEach((button) => {
    button.onclick = () => {
      state.dashboardSkillId = button.dataset.dashboardSkill;
      renderDashboard();
    };
  });
  $$("[data-dashboard-type]").forEach((button) => {
    button.onclick = () => {
      state.dashboardType = button.dataset.dashboardType;
      renderDashboard();
    };
  });
  $("#dashboardRefreshButton").onclick = async () => {
    await loadDashboard();
    renderDashboard();
    toast("数据看板已刷新");
  };
}

function renderFramework() {
  const pending = state.frameworkCandidates.filter((item) => item.decision === "pending").length;
  const accepted = state.frameworkCandidates.filter((item) => item.decision === "accept").length;
  $("#stageBody").innerHTML = `
    <div class="section-line">
      <div><h3>新增候选池</h3><p>同一个入口内分为“一级/二级数据块”和“绑定现有数据格的新字段”两个层级。</p></div>
      <div class="actions"><button class="button primary" id="addFrameworkButton" type="button">新增候选</button></div>
    </div>
    <div class="metric-grid" style="margin-bottom:12px">
      <div class="metric"><b>${state.frameworkCandidates.length}</b><span>候选总数</span></div>
      <div class="metric amber"><b>${pending}</b><span>待人工审核</span></div>
      <div class="metric green"><b>${accepted}</b><span>已采纳</span></div>
      <div class="metric"><b>${state.frameworkCandidates.filter((item) => item.item_type === "新字段").length}</b><span>字段级候选</span></div>
    </div>
    <div class="hint" style="margin-bottom:10px">模型只能提出建议，不能自动修改正式框架。每个决定都保留证据、审核人和更新时间；框架变化后应生成增量Query并优先使用既有raw_output复判。</div>
    <div class="table-shell">
      <table class="framework-table">
        <thead><tr><th style="width:95px">层级</th><th style="width:170px">候选</th><th>证据</th><th style="width:120px">来源</th><th style="width:125px">审核决定</th></tr></thead>
        <tbody>${state.frameworkCandidates.length ? state.frameworkCandidates.map((item) => `
          <tr>
            <td><span class="status ${item.item_type === "新字段" ? "running" : "partial"}">${escapeHtml(item.item_type)}</span></td>
            <td><span class="name">${escapeHtml(item.name)}</span><span class="query-sub">${escapeHtml(item.reviewer || "待审核")}</span></td>
            <td>${escapeHtml(item.evidence)}</td>
            <td>${escapeHtml(item.source_query_id || item.source_run_id || "人工补录")}</td>
            <td><select data-framework-decision="${escapeHtml(item.item_id)}"><option value="pending">待审核</option><option value="accept">采纳</option><option value="merge">合并</option><option value="observe">观察</option><option value="exclude">排除</option></select></td>
          </tr>`).join("") : '<tr><td colspan="5" class="empty"><b>还没有框架候选</b>可从竞品能力映射、深度返回或人工研究中补录。</td></tr>'}</tbody>
      </table>
    </div>`;
  $("#addFrameworkButton").onclick = () => $("#frameworkDialog").showModal();
  $$("[data-framework-decision]").forEach((select) => {
    const item = state.frameworkCandidates.find((row) => row.item_id === select.dataset.frameworkDecision);
    select.value = item.decision;
    select.onchange = () => updateFrameworkDecision(item.item_id, select.value);
  });
}

async function submitFrameworkCandidate(event) {
  event.preventDefault();
  try {
    await api("/api/framework-candidates", {
      method: "POST",
      body: JSON.stringify(formObject(event.currentTarget)),
    });
    event.currentTarget.reset();
    $("#frameworkDialog").close();
    await loadFrameworkCandidates();
    renderFramework();
    toast("框架候选已保存");
  } catch (error) {
    toast(error.message);
  }
}

async function updateFrameworkDecision(itemId, decision) {
  try {
    await api(`/api/framework-candidates/${encodeURIComponent(itemId)}`, {
      method: "PUT",
      body: JSON.stringify({ decision, reviewer: "业务 / 专家复核" }),
    });
    await loadFrameworkCandidates();
    renderFramework();
    toast("审核决定已保存");
  } catch (error) {
    toast(error.message);
  }
}

function batchStatusLabel(status) {
  return status === "completed"
    ? "已完成"
    : status === "running"
      ? "执行中"
      : status === "queued"
        ? "排队中"
        : status === "partial"
          ? "部分完成"
          : status === "cancelled"
            ? "已暂停"
            : "失败";
}

function evaluationTypeLabel(type) {
  return type === "breadth" ? "广度" : type === "depth" ? "深度" : type || "历史类型";
}

function batchSkillNames(batch) {
  return (batch.skill_ids || []).map((skillId) =>
    state.skills.find((item) => item.id === skillId)?.name || skillId
  ).join("、");
}

function reportBatches(type = state.batchType) {
  const search = state.batchSearch.trim().toLowerCase();
  return state.batches.filter((batch) =>
    batch.evaluation_type === type
    && (!state.batchSkillId || batch.skill_ids?.includes(state.batchSkillId))
    && (!search || [
      batch.batch_id,
      batch.created_at,
      batchSkillNames(batch),
      ...(batch.skill_ids || []),
    ].join(" ").toLowerCase().includes(search))
  );
}

function batchRunsForCurrentSkill(batch) {
  const runs = batch?.runs || [];
  return state.batchSkillId
    ? runs.filter((run) => run.skill_id === state.batchSkillId)
    : runs;
}

function runEffectHtml(batch) {
  const runs = state.batchSkillId
    ? (batch.runs || []).filter((run) => run.skill_id === state.batchSkillId)
    : batch.runs || [];
  if (runs.length !== 1) {
    return `<span class="query-sub">${runs.length} 个 Skill；选择 Skill 后查看单项效果</span>`;
  }
  const run = runs[0];
  const summary = run.summary || {};
  const counts = summary.verdict_counts || {};
  if (run.status !== "completed") {
    return `<span class="status ${escapeHtml(run.status)}">${batchStatusLabel(run.status)}</span>`;
  }
  return `<b>${formatPercent(summary.weighted_coverage)}</b><span class="query-sub">✓ ${counts["✓"] || 0} · ▲ ${counts["▲"] || 0} · ✗ ${counts["✗"] || 0} · 待测 ${counts["待测"] || 0}</span>`;
}

function batchIsActive(batch) {
  const status = displayedBatchStatus(batch);
  return status === "queued" || status === "running";
}

function displayedBatchStatus(batch) {
  if (!state.batchSkillId) return batch.status;
  return (batch.runs || []).find(
    (run) => run.skill_id === state.batchSkillId
  )?.status || batch.status;
}

function selectedSkillHistoryStats(batches) {
  const runs = batches
    .flatMap((batch) => (batch.runs || []).map((run) => ({ batch, run })))
    .filter(({ run }) => !state.batchSkillId || run.skill_id === state.batchSkillId);
  const completed = runs.filter(({ run }) => run.status === "completed");
  const latest = completed[0]?.run;
  const summary = latest?.summary || {};
  return {
    runCount: runs.length,
    completedCount: completed.length,
    latestCoverage: latest ? formatPercent(summary.weighted_coverage) : "—",
    retrieval: latest
      ? `${summary.retrieval_success_count || 0}/${summary.query_count || latest.query_count || 0}`
      : "—",
  };
}

async function openEvaluationBatch(batchId) {
  try {
    state.selectedBatchId = batchId;
    state.selectedBatch = await api(`/api/batches/${encodeURIComponent(batchId)}`);
    renderReport();
    document.querySelector(".batch-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    toast(error.message);
  }
}

function renderReport() {
  const visibleBatches = reportBatches();
  const batch = visibleBatches.some(
    (item) => item.batch_id === state.selectedBatchId
  ) ? state.selectedBatch : null;
  const breadthCount = reportBatches("breadth").length;
  const depthCount = reportBatches("depth").length;
  const historyStats = selectedSkillHistoryStats(visibleBatches);
  const batchRuns = batchRunsForCurrentSkill(batch);
  const completedRuns = batchRuns.filter((run) => run.status === "completed" && run.result);
  const allFeedback = completedRuns.flatMap((run) => run.result?.feedback || []);
  const manualFeedback = batchRuns.flatMap((run) => run.manual_feedback || []);
  const rootCounts = [...allFeedback, ...manualFeedback].reduce((acc, item) => {
    const key = item.category || "judgment";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  $("#stageBody").innerHTML = `
    <div class="section-line">
      <div>
        <h3>测评批次中心</h3>
        <p>一行代表一次完整执行。相同 Query 集在不同时间重跑会形成新的批次；技术分片和单条重试不作为批次展示。</p>
      </div>
      <div class="actions">
        <input class="search-box" id="batchSearch" value="${escapeHtml(state.batchSearch)}" placeholder="搜索批次、时间或 Skill">
        <select class="batch-filter skill-filter" id="batchSkillFilter">
          <option value="">全部 Skill</option>
          ${state.skills.map((skill) => `<option value="${escapeHtml(skill.id)}" ${state.batchSkillId === skill.id ? "selected" : ""}>${escapeHtml(skill.name)}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="batch-tabs" role="tablist" aria-label="广度与深度测评结果">
      <button class="${state.batchType === "breadth" ? "active" : ""}" data-batch-type="breadth" type="button"><b>广度测评结果</b><span>${breadthCount} 个完整批次</span></button>
      <button class="${state.batchType === "depth" ? "active" : ""}" data-batch-type="depth" type="button"><b>深度测评结果</b><span>${depthCount} 个完整批次</span></button>
    </div>
    <div class="hint batch-principle">
      <b>结果隔离规则：</b>每个批次冻结 Query 清单、验收规则、每个 Skill 的完整结果及 raw_output。再次执行只新增批次，绝不改写、拼接或用新结果覆盖旧批次。
    </div>
    ${state.batchSkillId ? `
      <div class="skill-history-strip">
        <div><span>当前 Skill</span><b>${escapeHtml(state.skills.find((item) => item.id === state.batchSkillId)?.name || state.batchSkillId)}</b></div>
        <div><span>${evaluationTypeLabel(state.batchType)}执行次数</span><b>${historyStats.runCount}</b></div>
        <div><span>完整批次</span><b>${historyStats.completedCount}</b></div>
        <div><span>最近加权覆盖</span><b>${historyStats.latestCoverage}</b></div>
        <div><span>最近取数成功</span><b>${historyStats.retrieval}</b></div>
      </div>` : ""}
    <div class="table-shell batch-table-shell">
      <table>
        <thead><tr><th>执行时间 / 批次</th><th>同一 Query 集第几次</th><th>完整 Query 集</th><th>目标 Skill</th><th>完成效果</th><th>状态</th><th>完成时间</th><th>操作</th></tr></thead>
        <tbody>${visibleBatches.length ? visibleBatches.map((item) => `
          <tr class="${item.batch_id === state.selectedBatchId ? "selected" : ""}">
            <td><span class="name">${escapeHtml(item.created_at)}</span><span class="query-sub">${escapeHtml(item.batch_id)}</span></td>
            <td><span class="repeat-badge">第 ${item.repeat_index} 次</span><span class="query-sub">Query指纹 ${escapeHtml((item.query_set_hash || "").slice(0, 10))}</span></td>
            <td><b>${item.query_count}</b> 条 / Skill<span class="query-sub">${item.skill_count > 1 ? `共 ${item.result_row_count} 条 Skill-Query 结果` : "一份完整结果"}</span></td>
            <td>${escapeHtml(batchSkillNames(item))}<span class="query-sub">${item.skill_count} 个 Skill，结果彼此隔离</span></td>
            <td>${runEffectHtml(item)}</td>
            <td><span class="status ${escapeHtml(displayedBatchStatus(item))}">${batchStatusLabel(displayedBatchStatus(item))}</span></td>
            <td>${escapeHtml(item.finished_at || "—")}</td>
            <td>
              <div class="row-actions">
                <button class="button secondary small" data-open-batch="${escapeHtml(item.batch_id)}" type="button">查看</button>
                <button class="button secondary small" data-cancel-batch="${escapeHtml(item.batch_id)}" type="button" ${batchIsActive(item) ? "" : "disabled"}>停止运行</button>
                <button class="button danger small" data-delete-batch="${escapeHtml(item.batch_id)}" type="button">清空</button>
              </div>
            </td>
          </tr>`).join("") : '<tr><td colspan="8" class="empty">没有匹配的完整测评批次。</td></tr>'}</tbody>
      </table>
    </div>
    ${batch ? `
      <div class="batch-detail">
        <div class="results-head">
          <div>
            <h3>${escapeHtml(batch.batch_id)} · 第 ${batch.repeat_index} 次完整执行${state.batchSkillId ? ` · ${escapeHtml(state.skills.find((item) => item.id === state.batchSkillId)?.name || state.batchSkillId)}` : ""}</h3>
            <p>${escapeHtml(batch.created_at)} · ${batch.query_count} 条 Query / Skill · 当前展示 ${batchRuns.length}/${batch.skill_count} 个 Skill · Query指纹 ${escapeHtml((batch.query_set_hash || "").slice(0, 16))} · 规则指纹 ${escapeHtml((batch.rules_hash || "").slice(0, 12))}</p>
          </div>
          <span class="status ${escapeHtml(batch.status)}">${batchStatusLabel(batch.status)} · 快照已隔离</span>
        </div>
        <div class="metric-grid" style="margin-bottom:12px">
          <div class="metric"><b>${batch.query_count}</b><span>本次完整 Query 数 / Skill</span></div>
          <div class="metric green"><b>${batchRuns.length}</b><span>当前展示 Skill 结果</span></div>
          <div class="metric amber"><b>${batchRuns.reduce((sum, run) => sum + Number(run.query_count || 0), 0)}</b><span>当前 Skill-Query 结果数</span></div>
          <div class="metric"><b>${completedRuns.length}</b><span>已完成 Skill</span></div>
        </div>
        <div class="result-filter-bar">
          <div><b>Query 结果筛选</b><span>运行状态与覆盖判定分开筛选，避免把接口失败误当成数据不支持。</span></div>
          <select class="batch-filter" id="batchResultFilter">
            <option value="all" ${state.batchResultFilter === "all" ? "selected" : ""}>全部 Query</option>
            <option value="runtime_success" ${state.batchResultFilter === "runtime_success" ? "selected" : ""}>已完成取数（status=success）</option>
            <option value="runtime_failed" ${state.batchResultFilter === "runtime_failed" ? "selected" : ""}>取数失败 / 未完成</option>
            <option value="verdict_full" ${state.batchResultFilter === "verdict_full" ? "selected" : ""}>验收：完全支持 ✓</option>
            <option value="verdict_partial" ${state.batchResultFilter === "verdict_partial" ? "selected" : ""}>验收：部分支持 ▲</option>
            <option value="verdict_fail" ${state.batchResultFilter === "verdict_fail" ? "selected" : ""}>验收：不支持 ✗</option>
            <option value="verdict_waiting" ${state.batchResultFilter === "verdict_waiting" ? "selected" : ""}>验收：待测</option>
          </select>
        </div>
        ${renderRunComparison(batchRuns)}
        ${batchRuns.map((run) => renderRunResult(run, state.batchResultFilter)).join("")}
      </div>
      <div class="report-summary" style="margin-top:16px">
        <div>
          <div class="conclusion">
            <h3>本批精度反馈</h3>
            <p>反馈只对应 ${escapeHtml(batch.batch_id)}，不会与其他时间点的执行结果混合。需要对比变化时，可按 Query 指纹选择不同“第 N 次”批次逐次查看。</p>
          </div>
          <div style="margin-top:12px">${renderFeedbackList(allFeedback, manualFeedback)}</div>
        </div>
        <aside class="card">
          <div class="card-head">本批问题归因</div>
          <div class="card-body">
            <div class="detail-list">
              <div class="detail-row"><b>Skill 路由</b><span>${rootCounts.routing || 0}</span></div>
              <div class="detail-row"><b>解析 / 结构化</b><span>${rootCounts.parser || 0}</span></div>
              <div class="detail-row"><b>框架 / 验收</b><span>${(rootCounts.judgment || 0) + (rootCounts.judge_guard || 0)}</span></div>
              <div class="detail-row"><b>Query 设计 / 映射</b><span>${(rootCounts.query || 0) + (rootCounts.query_mapping || 0)}</span></div>
              <div class="detail-row"><b>运行 / 复核环境</b><span>${rootCounts.judge_runtime || 0}</span></div>
            </div>
          </div>
        </aside>
      </div>` : `
      <div class="empty batch-empty">
        <b>请选择一个测评批次</b>
        点击“查看本次全部结果”，即可看到该时间点每个 Skill 的完整 2667 条（或当次实际数量）结果。
      </div>`}`;
  $$("[data-open-batch]").forEach((button) => {
    button.onclick = () => openEvaluationBatch(button.dataset.openBatch);
  });
  $$("[data-cancel-batch]").forEach((button) => {
    button.onclick = () => cancelEvaluationBatch(button.dataset.cancelBatch);
  });
  $$("[data-delete-batch]").forEach((button) => {
    button.onclick = () => deleteEvaluationBatch(button.dataset.deleteBatch);
  });
  let batchSearchTimer = null;
  $("#batchSearch").oninput = (event) => {
    window.clearTimeout(batchSearchTimer);
    batchSearchTimer = window.setTimeout(() => {
      state.batchSearch = event.target.value.trim();
      renderReport();
    }, 250);
  };
  $$("[data-batch-type]").forEach((button) => {
    button.onclick = () => {
      state.batchType = button.dataset.batchType;
      state.batchResultFilter = "all";
      if (state.selectedBatch?.evaluation_type !== state.batchType) {
        state.selectedBatchId = "";
        state.selectedBatch = null;
      }
      renderReport();
    };
  });
  $("#batchSkillFilter").onchange = (event) => {
    state.batchSkillId = event.target.value;
    state.batchResultFilter = "all";
    if (
      state.selectedBatch
      && state.batchSkillId
      && !state.selectedBatch.skill_ids?.includes(state.batchSkillId)
    ) {
      state.selectedBatchId = "";
      state.selectedBatch = null;
    }
    renderReport();
  };
  if ($("#batchResultFilter")) {
    $("#batchResultFilter").onchange = (event) => {
      state.batchResultFilter = event.target.value;
      renderReport();
    };
  }
  batchRuns.forEach((run) => bindRunResultEvents(run));
}

function renderFeedbackList(systemFeedback, manualFeedback) {
  const rows = [
    ...systemFeedback,
    ...manualFeedback.map((item) => ({
      ...item,
      title: "人工复核意见",
      expected: item.corrected_verdict ? `修正为 ${item.corrected_verdict}` : "保留原判定",
      actual: item.note,
      suggested_action: item.suggested_action || "待补充",
      target_component: "manual_review",
    })),
  ];
  if (!rows.length) return '<div class="empty"><b>暂无反馈</b>完成真实评测后，误路由、误验收、漏解析和Query歧义会在此汇总。</div>';
  return `<div class="feedback-list">${rows.map((item) => `
    <article class="feedback-card">
      <div><span class="status running">${escapeHtml(categoryNames[item.category] || "人工反馈")}</span><span class="query-sub">${escapeHtml(item.query_id)}</span></div>
      <div><h4>${escapeHtml(item.title || "优化事项")}</h4><p><b>期望：</b>${escapeHtml(item.expected || "")}</p><p><b>实际：</b>${escapeHtml(item.actual || item.note || "")}</p></div>
      <div class="suggestion"><b>进入 ${escapeHtml(item.target_component || "评测系统")}</b><br>${escapeHtml(item.suggested_action || "待补充")}</div>
    </article>`).join("")}</div>`;
}

async function exportLatestResult() {
  const runs = state.stage === 2
    ? latestRunsForEvaluation("breadth")
    : state.stage === 3
      ? latestRunsForEvaluation("depth")
      : state.selectedBatch?.runs || [latestRun()].filter(Boolean);
  const completedRuns = runs.filter((run) => run?.result);
  if (!completedRuns.length) {
    toast("当前没有可导出的结果");
    return;
  }
  const fullRuns = await Promise.all(
    completedRuns.map((run) => api(`/api/runs/${encodeURIComponent(run.run_id)}?evidence=1`))
  );
  const payload = { runs: fullRuns, framework_candidates: state.frameworkCandidates };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fullRuns.length === 1 ? `${fullRuns[0].run_id}.json` : `evaluation-group-${Date.now()}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 500);
  toast("结果已导出");
}

function bindEvents() {
  $("#previousButton").onclick = () => {
    if (state.stage > 0) {
      state.stage -= 1;
      render();
    }
  };
  $("#nextButton").onclick = () => {
    if (state.stage < stages.length - 1) {
      state.stage += 1;
      render();
    }
  };
  $("#refreshButton").onclick = async () => {
    await Promise.all([
      loadHealth(),
      loadAuthStatuses(),
      loadCandidates(),
      loadDiscoveryState(),
      loadQueries(state.queryViews.breadth.search, "breadth"),
      loadQueries(state.queryViews.depth.search, "depth"),
      loadQueryFacets("breadth"),
      loadQueryFacets("depth"),
      loadEvaluationRules(),
      loadJudgeProvider(),
      loadRuns(),
      loadBatches(),
      loadDashboard(),
      loadFrameworkCandidates(),
    ]);
    render();
    toast("已刷新");
  };
  $("#openLatestButton").onclick = () => {
    state.stage = 6;
    render();
  };
  $("#exportButton").onclick = exportLatestResult;
  $("#candidateForm").onsubmit = submitCandidate;
  $("#queryForm").onsubmit = submitQuery;
  $("#frameworkForm").onsubmit = submitFrameworkCandidate;
  $("#feedbackForm").onsubmit = submitFeedback;
  $("#queryFileInput").onchange = (event) => importQueryFile(event.target.files?.[0]);
  $$("[data-close-dialog]").forEach((button) => {
    button.onclick = () => $(`#${button.dataset.closeDialog}`).close();
  });
}

async function initialize() {
  bindEvents();
  await loadHealth();
  await Promise.all([
    loadSkills(),
    loadAuthStatuses(),
    loadCandidates(),
    loadDiscoveryState(),
    loadQueries("", "breadth"),
    loadQueries("", "depth"),
    loadQueryFacets("breadth"),
    loadQueryFacets("depth"),
    loadEvaluationRules(),
    loadJudgeProvider(),
    loadRuns(),
    loadBatches(),
    loadDashboard(),
    loadFrameworkCandidates(),
  ]);
  ["BQ000001-A", "BQ000001-B", "BQ000002-A", "BQ000002-B"].forEach((id) => {
    if (state.queryCache.has(id)) state.querySelections.breadth.add(id);
  });
  ["Q000001", "Q000008", "Q000039", "Q000041"].forEach((id) => {
    if (state.queryCache.has(id)) state.querySelections.depth.add(id);
  });
  for (const run of state.runs.filter((item) => ["queued", "running"].includes(item.status))) {
    pollRun(run.run_id, run.evaluation_type);
  }
  render();
}

initialize().catch((error) => toast(error.message));

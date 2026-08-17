/* Public portfolio fixture adapter. The original workbench UI and app.js remain unchanged. */
(() => {
  const originalFetch = window.fetch.bind(window)
  const queries = [
    { query_id: 'BQ000001-A', data_grid_time_id: 'STK-QUOTE-LATEST', asset_category: '股票', block_l1: '市场行情', block_l2: '实时行情', time_depth: '最新/实时', query: '查询贵州茅台最新收盘价、涨跌幅和成交额', source: 'template', query_spec: { mapping_confidence: 'high', query_type: 'atomic', product_type: 'stock', market: 'A股', mapping_issues: [] } },
    { query_id: 'BQ000001-B', data_grid_time_id: 'STK-FIN-CAP', asset_category: '股票', block_l1: '资金面', block_l2: '股东与股本', time_depth: '1年内', query: '查询宁德时代最近一期前十大股东及持股变化', source: 'template', query_spec: { mapping_confidence: 'high', query_type: 'atomic', product_type: 'stock', market: 'A股', mapping_issues: [] } },
    { query_id: 'BQ000002-A', data_grid_time_id: 'FUND-NAV', asset_category: '基金', block_l1: '基金数据', block_l2: '净值与持仓', time_depth: '5年前', query: '查询指定公募基金历史单位净值和累计净值', source: 'template', query_spec: { mapping_confidence: 'medium', query_type: 'atomic', product_type: 'fund', market: '中国', mapping_issues: ['历史口径需复核'] } },
    { query_id: 'BQ000002-B', data_grid_time_id: 'MACRO-CPI', asset_category: '宏观', block_l1: '宏观经济', block_l2: '价格指数', time_depth: '5年前', query: '查询中国 CPI 同比与环比历史序列', source: 'template', query_spec: { mapping_confidence: 'high', query_type: 'atomic', product_type: 'macro', market: '中国', mapping_issues: [] } },
    { query_id: 'Q000001', data_grid_time_id: 'STK-FIN-CAP', asset_category: '股票', block_l1: '资金面', block_l2: '股东与股本', time_depth: '1年内', query: '返回贵州茅台截至最新报告期的前十大股东名称、持股数和变动方向', source: 'template', query_spec: { mapping_confidence: 'high', query_type: 'atomic', product_type: 'stock', market: 'A股', mapping_issues: [] }, evaluation_type: 'depth' },
    { query_id: 'Q000008', data_grid_time_id: 'STK-QUOTE-LATEST', asset_category: '股票', block_l1: '市场行情', block_l2: '实时行情', time_depth: '最新/实时', query: '返回平安银行最新价、涨跌幅、成交额和时间戳', source: 'template', query_spec: { mapping_confidence: 'high', query_type: 'atomic', product_type: 'stock', market: 'A股', mapping_issues: [] }, evaluation_type: 'depth' },
    { query_id: 'Q000039', data_grid_time_id: 'FUND-NAV', asset_category: '基金', block_l1: '基金数据', block_l2: '净值与持仓', time_depth: '5年前', query: '返回基金净值序列及复权口径说明', source: 'template', query_spec: { mapping_confidence: 'medium', query_type: 'atomic', product_type: 'fund', market: '中国', mapping_issues: ['复权口径需说明'] }, evaluation_type: 'depth' },
    { query_id: 'Q000041', data_grid_time_id: 'MACRO-CPI', asset_category: '宏观', block_l1: '宏观经济', block_l2: '价格指数', time_depth: '5年前', query: '返回中国 CPI 同比、环比和发布日期', source: 'template', query_spec: { mapping_confidence: 'high', query_type: 'atomic', product_type: 'macro', market: '中国', mapping_issues: [] }, evaluation_type: 'depth' },
  ]

  const summary = {
    weighted_coverage: 0.625,
    verdict_counts: { '✓': 2, '▲': 1, '✗': 1, '待测': 0 },
    retrieval_success_count: 4,
    query_count: 4,
    valid_attempt_count: 4,
    attempt_count: 5,
    total_elapsed_ms: 8400,
    total_actual_elapsed_ms: 8400,
    execution_engine: 'fixed_runner',
    execution_count: 1,
    retry_count: 1,
    grid_count: 4,
    judge_source_counts: { local_rule: 3, semantic_review: 1 },
    semantic_cache_hit_count: 0,
    semantic_new_review_count: 1,
  }

  const resultRows = [
    { query_id: 'BQ000001-A', status: 'success', judge_verdict: '✓', verdict_reason: '返回字段与时点满足验收规则。', elapsed_ms: 1540, raw_output: 'price: 1,492.00; pct_chg: 0.83%; amount: 4.2e8', evidence: { attempts: [{ status: 'success', source: 'local fixture' }] } },
    { query_id: 'BQ000001-B', status: 'success', judge_verdict: '▲', verdict_reason: '返回股东名单和持股数，缺少完整变动方向。', elapsed_ms: 2260, raw_output: 'top_holders: [...]; reporting_period: 2026Q1', evidence: { attempts: [{ status: 'success', source: 'local fixture' }] } },
    { query_id: 'BQ000002-A', status: 'success', judge_verdict: '✓', verdict_reason: '净值历史序列与复权口径可用。', elapsed_ms: 1980, raw_output: 'nav_history: [...]; adjusted: true', evidence: { attempts: [{ status: 'success', source: 'local fixture' }] } },
    { query_id: 'BQ000002-B', status: 'success', judge_verdict: '✗', verdict_reason: '返回宏观概览，未满足历史序列验收。', elapsed_ms: 2620, raw_output: 'CPI latest: 0.7%', evidence: { attempts: [{ status: 'success', source: 'local fixture' }] } },
  ]

  const skills = [
    { id: 'neodata', name: 'NeoData', description: '金融数据查询 Skill', evaluation_mode: '本地静态 Adapter', version: 'public-fixture', installed_at: '2026-05-20' },
    { id: 'ifind', name: 'iFinD', description: '金融终端数据 Skill', evaluation_mode: '本地静态 Adapter', version: 'public-fixture', installed_at: '2026-05-20' },
    { id: 'futu', name: '富途', description: '行情与交易数据 Skill', evaluation_mode: '权限受限样例', version: 'public-fixture', installed_at: '2026-05-20' },
  ]
  const auth = [
    { skill_id: 'neodata', status: 'ready', status_label: '已授权', last_checked_at: '2026-05-20 10:15' },
    { skill_id: 'ifind', status: 'ready', status_label: '已授权', last_checked_at: '2026-05-20 10:15' },
    { skill_id: 'futu', status: 'blocked_auth', status_label: '受区域权限限制', last_checked_at: '2026-05-20 10:15', detail: '公开版保留原评测对权限阻断的判定口径。' },
  ]
  let candidates = [
    {
      candidate_id: 'candidate-neodata', skill_id: 'neodata', skill_name: 'NeoData', provider: 'NeoData', version: 'public-fixture',
      discovery_channel: '本地 Skill 目录', total_score: 86, status: 'ready', source_url: 'https://example.com/neodata-public-fixture',
      artifact_uri: 'public fixture / NeoData adapter', auth_mode: '本地授权', quota: '公开版固定样例', rate_limit: '本地模拟',
      market_score: 92, popularity_score: 78, keyword_score: 88, platform_score: 84,
      inclusion_reason: '覆盖股票、基金与宏观基础数据域，可作为广度评测的基线样例。', updated_at: '2026-05-20 10:15',
    },
    {
      candidate_id: 'candidate-ifind', skill_id: 'ifind', skill_name: 'iFinD', provider: '同花顺', version: 'public-fixture',
      discovery_channel: '人工补录', total_score: 83, status: 'ready', source_url: 'https://example.com/ifind-public-fixture',
      artifact_uri: 'public fixture / iFinD adapter', auth_mode: '本地授权', quota: '公开版固定样例', rate_limit: '本地模拟',
      market_score: 90, popularity_score: 80, keyword_score: 82, platform_score: 80,
      inclusion_reason: '具有金融终端式数据查询能力，适合与基线 Skill 对比字段和时间覆盖。', updated_at: '2026-05-20 10:15',
    },
    {
      candidate_id: 'candidate-futu', skill_id: 'futu', skill_name: '富途', provider: '富途', version: 'public-fixture',
      discovery_channel: '官方资料', total_score: 76, status: 'blocked_auth', source_url: 'https://example.com/futu-public-fixture',
      artifact_uri: 'public fixture / Futu adapter', auth_mode: '区域权限', quota: '权限受限', rate_limit: '不适用',
      market_score: 82, popularity_score: 86, keyword_score: 72, platform_score: 66,
      inclusion_reason: '市场覆盖具备研究价值，但公开演示明确保留区域权限阻断结论。', updated_at: '2026-05-20 10:15',
    },
  ]
  const runs = [
    { run_id: 'RUN-20260520-001', batch_id: 'BATCH-20260520-001', group_id: 'GROUP-20260520-001', skill_id: 'neodata', evaluation_type: 'breadth', status: 'completed', query_count: 4, finished_at: '2026-05-20 10:16:32', execution_engine: 'fixed_runner', result: { summary, results: resultRows, feedback: [{ category: 'routing', query_id: 'BQ000002-B', title: '宏观历史序列缺口', expected: '返回完整时间序列', actual: '仅返回最新值', suggested_action: '补充历史序列路由', target_component: 'connector' }] } },
  ]
  const batches = [{ batch_id: 'BATCH-20260520-001', evaluation_type: 'breadth', status: 'completed', created_at: '2026-05-20 10:15:02', finished_at: '2026-05-20 10:16:32', repeat_index: 1, query_set_hash: 'c562f0a45f1a', rules_hash: 'b6c1ca1232aa', query_count: 4, skill_count: 1, result_row_count: 4, skill_ids: ['neodata'], runs: runs.map((run) => ({ ...run, summary, manual_feedback: [] })) }]

  const dashboard = {
    skills: skills.map((skill, index) => ({
      skill_id: skill.id,
      skill_name: skill.name,
      breadth: {
        batch_id: 'BATCH-20260520-001',
        retryable_count: index === 2 ? 2 : 0,
        summary: { ...summary, weighted_coverage: index === 0 ? 0.625 : index === 1 ? 0.5 : 0.25 },
        by_asset_category: [
          { name: '股票', weighted_coverage: index === 2 ? 0.25 : 0.75, runtime_success_count: 2, query_count: 2, unresolved_count: 0 },
          { name: '基金', weighted_coverage: index === 0 ? 1 : 0.5, runtime_success_count: 1, query_count: 1, unresolved_count: 0 },
          { name: '宏观', weighted_coverage: index === 0 ? 0 : 0.25, runtime_success_count: 1, query_count: 1, unresolved_count: index === 2 ? 1 : 0 },
        ],
      },
      depth: {
        batch_id: 'BATCH-20260520-002',
        retryable_count: 0,
        summary: { ...summary, weighted_coverage: index === 0 ? 0.58 : index === 1 ? 0.46 : 0.2 },
        dimensions: { time: { score: 0.75, tested: 4, unresolved: 0 }, fields: { score: 0.5, tested: 4, unresolved: 1 }, market: { score: 1, tested: 4, unresolved: 0 }, structure: { score: 0.5, tested: 4, unresolved: 1 } },
        by_asset_category: [{ name: '股票', weighted_coverage: 0.5, runtime_success_count: 2, query_count: 2, unresolved_count: 0 }, { name: '基金', weighted_coverage: 0.65, runtime_success_count: 1, query_count: 1, unresolved_count: 0 }, { name: '宏观', weighted_coverage: 0.4, runtime_success_count: 1, query_count: 1, unresolved_count: 1 }],
      },
    })),
  }

  const facets = (type) => ({
    asset_category: [...new Set(queries.filter((item) => (type === 'depth') === (item.evaluation_type === 'depth')).map((item) => item.asset_category))].map((value) => ({ value, count: 1 })),
    block_l1: [{ value: '市场行情', count: 1 }, { value: '资金面', count: 1 }, { value: '基金数据', count: 1 }, { value: '宏观经济', count: 1 }],
    block_l2: [{ value: '实时行情', count: 1 }, { value: '股东与股本', count: 1 }, { value: '净值与持仓', count: 1 }, { value: '价格指数', count: 1 }],
    time_depth: [{ value: '最新/实时', count: 1 }, { value: '1年内', count: 1 }, { value: '5年前', count: 2 }],
  })

  const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }))
  const selectedQueries = (type) => queries.filter((item) => type === 'depth' ? item.evaluation_type === 'depth' : item.evaluation_type !== 'depth')

  window.fetch = (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin)
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init)
    const path = url.pathname
    const type = url.searchParams.get('evaluation_type') || 'breadth'
    if (path === '/api/health') return json({ evaluator_available: true, judge_provider: { active_provider: 'codex', active_label: 'Codex', active_health: { available: true, logged_in: true, message: '公开版静态样例可用' } }, evaluation_runtime: { max_concurrency: 2 } })
    if (path === '/api/skills') return json(skills)
    if (path === '/api/auth') return json(auth)
    if (path.startsWith('/api/auth/')) return json(auth.find((item) => path.includes(item.skill_id)) || auth[0])
    if (path === '/api/candidates' && (!init.method || init.method === 'GET')) return json(candidates)
    if (path === '/api/candidates' && init.method === 'POST') {
      const payload = JSON.parse(init.body || '{}')
      const candidate = { candidate_id: `candidate-manual-${Date.now()}`, skill_id: '', skill_name: payload.skill_name || '未命名候选', provider: payload.provider || '待补充', version: payload.version || 'unknown', discovery_channel: payload.discovery_channel || '人工补录', total_score: Number(payload.market_score || 0) * .3 + Number(payload.popularity_score || 0) * .25 + Number(payload.keyword_score || 0) * .2 + Number(payload.platform_score || 0) * .25, status: 'watchlist', source_url: payload.source_url || '', artifact_uri: payload.artifact_uri || '', auth_mode: payload.auth_mode || '待核实', quota: payload.quota || '待核实', rate_limit: '待核实', market_score: Number(payload.market_score || 0), popularity_score: Number(payload.popularity_score || 0), keyword_score: Number(payload.keyword_score || 0), platform_score: Number(payload.platform_score || 0), inclusion_reason: payload.inclusion_reason || '人工补录样例', updated_at: '2026-05-20 10:15' }
      candidates = [candidate, ...candidates]
      return json(candidate)
    }
    if (path.startsWith('/api/candidates/') && init.method === 'PUT') {
      const payload = JSON.parse(init.body || '{}')
      const candidate = candidates.find((item) => path.endsWith(item.candidate_id))
      if (candidate && payload.status) candidate.status = payload.status
      return json(candidate || { success: true })
    }
    if (path === '/api/discovery/sources') return json([{ source_id: 'installed', name: '本地 Skill 目录', description: '读取当前公开展示环境已接入的金融数据 Skill。', enabled: true, auth_mode: 'none', auth_configured: true, status: 'completed', kind: 'local' }])
    if (path === '/api/discovery/jobs') return json([{ job_id: 'discover-001', status: 'completed', created_at: '2026-05-20 09:50', finished_at: '2026-05-20 09:51', current_source: '本地公开样例', sources_completed: 1, sources_total: 1, found_count: 3, new_count: 3, updated_count: 0, summary: '离线样例：发现 3 个候选 Skill' }])
    if (path === '/api/discovery/items') return json([])
    if (path === '/api/queries') { const list = selectedQueries(type); const q = (url.searchParams.get('search') || '').toLowerCase(); const filtered = q ? list.filter((item) => JSON.stringify(item).toLowerCase().includes(q)) : list; return json({ queries: filtered, total: filtered.length }) }
    if (path === '/api/query-facets') return json(facets(type))
    if (path === '/api/query-ids') { const list = selectedQueries(type); return json({ query_ids: list.map((item) => item.query_id), total: list.length }) }
    if (path === '/api/evaluation-rules') return json({ breadth: '验收以实体、市场、时间与关键字段为硬门槛；权限受限单列，不计为不支持。', depth: '对字段、时间、市场与结构化程度分别验收，保留原始返回作为证据。' })
    if (path === '/api/judge-provider') return json({ active_provider: 'codex', active_label: 'Codex', active_health: { available: true, logged_in: true, message: '公开版：本地固定证据样例' }, health: { codex: { available: true, message: '本地样例可用' }, workbuddy: { available: false, message: '公开版未接入' } } })
    if (path === '/api/runs') return json(runs)
    if (path.startsWith('/api/runs/')) { const run = runs.find((item) => path.includes(item.run_id)) || runs[0]; return json(run) }
    if (path === '/api/batches') return json(batches)
    if (path.startsWith('/api/batches/')) return json(batches.find((item) => path.includes(item.batch_id)) || batches[0])
    if (path === '/api/dashboard') return json(dashboard)
    if (path === '/api/framework-candidates') return json([{ item_id: 'framework-001', item_type: '新字段', name: '公告披露时间', evidence: '多个 Skill 返回了公告正文但未提供披露时间字段。', source_query_id: 'BQ000001-B', decision: 'pending', reviewer: '待业务复核' }, { item_id: 'framework-002', item_type: '新数据块', name: '权限状态', evidence: '受区域或账户权限影响的返回需要单独归因。', source_run_id: 'RUN-20260520-001', decision: 'accept', reviewer: '业务复核' }])
    if (path === '/api/run-groups') return json({ batch_id: 'BATCH-20260520-001', skill_count: 1, runs })
    if (path === '/api/judge-provider/test') return json({ ok: true, message: '公开版静态证据检查完成' })
    return json({ success: true, message: '公开版静态样例：操作已在当前会话模拟完成。' })
  }
})()

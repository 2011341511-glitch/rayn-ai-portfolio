export interface WikiSection { title: string; content: string }
export interface WikiLinkChip { label: string; target: string }
export interface WikiContent { title: string; lede: string; sections: WikiSection[]; linkchips: WikiLinkChip[] }
export interface WikiPage { topic: string; title: string; lede: string; content: WikiContent; updated_at: string; source_ids?: number[] }
export interface WikiPageSummary { topic: string; title: string; lede: string; updated_at: string }
export interface RawMaterial { id: number; type: 'pdf' | 'link' | 'text'; source_url?: string; raw_text?: string; created_at: string; entities?: string[] }
export interface IngestMaterialRequest { type: 'pdf' | 'link' | 'text'; content: string; source_url?: string; topic?: string }
export interface WikiPageResult { topic: string; is_new: boolean; pending_change_ids: number[]; pending_change_count: number; wiki_page?: WikiPage }
export interface IngestMaterialResponse { success: boolean; material_id: number; wiki_page?: WikiPage; wiki_pages?: WikiPageResult[]; pending_change_ids?: number[]; total_pending_count?: number; message?: string }
export interface WikiTopicItem { id: number; name: string; entity_type: string; current_judgment?: string; judgment_summary?: string; material_count: number; pending_change_count: number; related_entity_names: string[]; updated_at?: string; created_at?: string }
export interface PendingChangeItem { id: number; change_type: 'contradiction' | 'new_link' | 'supplement' | 'merge'; status: 'pending' | 'accepted' | 'rejected' | 'expired'; topic_id?: number; topic_name?: string; wiki_topic?: string; source_material_id?: number; title?: string; old_knowledge?: Record<string, unknown>; new_knowledge?: Record<string, unknown>; ai_reasoning?: string; source_type?: string; source_title?: string; source_entry?: 'main_page' | 'wiki_detail'; created_at?: string; updated_at?: string }
export interface MaterialsListItem { id: number; type: string; filename?: string; file_size?: number; source_url?: string; extraction_status: string; summary?: string; affected_topic_ids?: number[]; created_at: string }
export interface TopicsListResponse { items: WikiTopicItem[]; total: number; pending_total: number }
export interface PendingListResponse { items: PendingChangeItem[]; total: number }
export interface ExtractionResponse { success: boolean; task_id: string; status: string }
export interface ExtractionStatusResponse { task_id: string; status: string; error?: string; affected_topics?: number[] }
export interface MaterialsListResponse { items: MaterialsListItem[]; total: number }
export interface MaterialContentResponse { id: number; type: string; filename?: string; source_url?: string; raw_text: string; mime_type?: string; file_path?: string }
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; page_size: number; pages: number }
export interface BatchUploadResult { success: boolean; total: number; success_count: number; failed_count: number; results: Array<{ filename: string; success: boolean; material_id?: number; wiki_page?: WikiPage; error?: string }> }
export interface EntityInfo { id: number; name: string; entity_type: string; topic?: string; description?: string; source_ids?: number[]; weight: number; created_at?: string; updated_at?: string }
export interface EntityRelation { source: string; target: string; type: string; strength: number }
export interface EntityGraphResponse { entity: EntityInfo; relations: EntityRelation[] }

const now = '2026-05-20 10:16:00'
const pages: WikiPage[] = [
  {
    topic: '新能源车产业链',
    title: '新能源车产业链：供给、需求与关键变量',
    lede: '公开脱敏样例，展示主题 Wiki 如何汇聚材料、实体关系与待确认变更。',
    updated_at: now,
    source_ids: [101, 102, 103],
    content: {
      title: '新能源车产业链',
      lede: '以主题为中心组织上游材料、关键实体与判断变化。',
      sections: [
        { title: '核心判断', content: '需求侧由车型供给和价格带扩展共同驱动；材料价格变化会通过库存与产品结构影响盈利弹性。' },
        { title: '关注变量', content: '观察电池材料价格、交付节奏、渠道库存与政策预期等变量。' },
        { title: '证据来源', content: '全部内容来自公开脱敏材料样例，原始材料可在左侧原材料视图查看。' },
      ],
      linkchips: [{ label: '动力电池', target: '动力电池' }, { label: '锂价', target: '锂价' }, { label: '车型供给', target: '车型供给' }],
    },
  },
  {
    topic: '半导体设备',
    title: '半导体设备：国产替代与验证周期',
    lede: '围绕设备验证、产能建设与下游资本开支的结构化知识样例。',
    updated_at: '2026-05-18 14:30:00',
    source_ids: [104, 105, 106],
    content: {
      title: '半导体设备',
      lede: '围绕设备验证、产能建设与下游资本开支的结构化知识样例。',
      sections: [
        { title: '核心判断', content: '验证节奏与客户导入仍是设备兑现的前置条件，产能扩张需要与下游资本开支共同观察。' },
        { title: '关注变量', content: '工艺节点、验证轮次、订单交付与晶圆厂投资计划是主要跟踪维度。' },
        { title: '证据来源', content: '本页由设备访谈纪要、公开产业链接和供给观察材料归纳生成。' },
      ],
      linkchips: [{ label: '晶圆厂', target: '晶圆厂' }, { label: '设备验证', target: '设备验证' }, { label: '资本开支', target: '资本开支' }],
    },
  },
  {
    topic: '算力基础设施',
    title: '算力基础设施：需求节奏与供给协同',
    lede: '从服务器需求、网络互联和供电约束观察算力基础设施的阶段性变量。',
    updated_at: '2026-05-20 09:50:00',
    source_ids: [107, 108, 109],
    content: {
      title: '算力基础设施',
      lede: '以需求兑现、供给协同与交付节奏组织跨环节材料。',
      sections: [
        { title: '核心判断', content: '需求向基础设施各环节传导时存在节奏差，服务器、网络和供电能力需要协同跟踪。' },
        { title: '关注变量', content: '观察项目落地、交付周期、互联带宽与机房供电资源的匹配程度。' },
        { title: '证据来源', content: '本页仅使用公开脱敏 mock 材料，不包含真实项目、客户或采购信息。' },
      ],
      linkchips: [{ label: '服务器', target: '服务器' }, { label: '网络互联', target: '网络互联' }, { label: '供电资源', target: '供电资源' }],
    },
  },
  {
    topic: '可选消费',
    title: '可选消费：需求修复与渠道效率',
    lede: '围绕需求、渠道库存与新品节奏整理可选消费的跟踪线索。',
    updated_at: '2026-05-19 17:20:00',
    source_ids: [110, 111, 112],
    content: {
      title: '可选消费',
      lede: '以消费场景、渠道效率和产品更新作为主题知识入口。',
      sections: [
        { title: '核心判断', content: '需求修复并非线性过程，渠道库存与新品节奏会影响不同品类的表现差异。' },
        { title: '关注变量', content: '跟踪客流、转化率、折扣力度、库存周转和新品反馈等可验证信号。' },
        { title: '证据来源', content: '材料为作品集内置的匿名样例，用于演示主题化归纳和观点更新流程。' },
      ],
      linkchips: [{ label: '消费场景', target: '消费场景' }, { label: '渠道库存', target: '渠道库存' }, { label: '新品节奏', target: '新品节奏' }],
    },
  },
]

type MaterialFixture = MaterialsListItem & { raw_text: string; entities: string[]; topic: string }

const materials: MaterialFixture[] = [
  { id: 112, type: 'pdf', filename: '消费新品反馈摘要（脱敏）.pdf', file_size: 218400, extraction_status: 'completed', summary: '归纳新品反馈、转化率与渠道库存的联动关系。', affected_topic_ids: [4], created_at: '2026-05-20 09:18:00', topic: '可选消费', entities: ['新品节奏', '渠道库存', '消费场景'], raw_text: '【公开脱敏 mock 材料】\n本期新品反馈呈现分化：高频消费场景的转化保持稳定，而低频品类仍受渠道库存影响。建议将库存周转与新品首周转化率作为共同跟踪指标。' },
  { id: 111, type: 'link', filename: '渠道效率公开观察（脱敏链接）', source_url: 'https://example.com/public-fixture/consumer-channel', extraction_status: 'completed', summary: '提取客流、折扣力度与库存周转的主题线索。', affected_topic_ids: [4], created_at: '2026-05-20 08:45:00', topic: '可选消费', entities: ['消费场景', '渠道库存'], raw_text: '【公开脱敏 mock 材料】\n链接摘要：渠道效率需要同时观察客流、转化率和折扣。单独以销售额判断需求修复容易忽略库存清理对短期数据的影响。' },
  { id: 110, type: 'text', filename: '可选消费周度纪要（脱敏）.txt', extraction_status: 'completed', summary: '梳理需求修复、渠道库存和新品节奏三个关键变量。', affected_topic_ids: [4], created_at: '2026-05-19 17:20:00', topic: '可选消费', entities: ['消费场景', '渠道库存', '新品节奏'], raw_text: '【公开脱敏 mock 材料】\n部分可选消费品类出现需求回暖，但不同渠道的库存水平差异明显。新品节奏改善有助于提升转化，仍需与折扣力度结合判断。' },
  { id: 109, type: 'pdf', filename: '机房资源供给观察（脱敏）.pdf', file_size: 412000, extraction_status: 'completed', summary: '记录供电资源、上架周期和基础设施交付约束。', affected_topic_ids: [3], created_at: '2026-05-20 09:50:00', topic: '算力基础设施', entities: ['供电资源', '服务器', '网络互联'], raw_text: '【公开脱敏 mock 材料】\n基础设施交付受机房供电、网络互联和上架节奏共同约束。需求增长并不直接等同于当期收入确认，需要匹配可用资源和交付窗口。' },
  { id: 108, type: 'text', filename: '算力需求拆解笔记（脱敏）.txt', extraction_status: 'completed', summary: '拆解服务器、网络互联与供电资源之间的需求传导。', affected_topic_ids: [3], created_at: '2026-05-20 09:05:00', topic: '算力基础设施', entities: ['服务器', '网络互联', '供电资源'], raw_text: '【公开脱敏 mock 材料】\n算力项目启动后，服务器、网络与供电并非同步确认。应以项目落地、交付周期和基础设施配套三类证据共同判断需求兑现。' },
  { id: 107, type: 'link', filename: '基础设施交付节奏（脱敏链接）', source_url: 'https://example.com/public-fixture/compute-delivery', extraction_status: 'completed', summary: '公开材料摘要，关注项目落地与跨环节交付节奏。', affected_topic_ids: [3], created_at: '2026-05-19 18:30:00', topic: '算力基础设施', entities: ['服务器', '网络互联'], raw_text: '【公开脱敏 mock 材料】\n链接摘要：基础设施需求的传导存在阶段差，设备供给、网络互联和上架能力决定了项目从规划到可用容量的实际节奏。' },
  { id: 106, type: 'link', filename: '设备验证路径观察（脱敏链接）', source_url: 'https://example.com/public-fixture/semiconductor-validation', extraction_status: 'completed', summary: '提取验证轮次、客户导入与订单交付的关系。', affected_topic_ids: [2], created_at: '2026-05-19 14:30:00', topic: '半导体设备', entities: ['设备验证', '晶圆厂', '资本开支'], raw_text: '【公开脱敏 mock 材料】\n链接摘要：验证节奏受工艺节点和客户产线节拍影响。产品通过验证后仍需观察订单释放与交付周期，不能仅以单次导入判断兑现速度。' },
  { id: 105, type: 'text', filename: '设备供给周报（脱敏）.txt', extraction_status: 'completed', summary: '梳理设备验证、产能建设和下游资本开支的跟踪项。', affected_topic_ids: [2], created_at: '2026-05-19 11:20:00', topic: '半导体设备', entities: ['设备验证', '资本开支', '晶圆厂'], raw_text: '【公开脱敏 mock 材料】\n客户导入节奏和设备验证轮次仍是关键。下游资本开支若出现调整，将通过订单节奏与产能利用率影响设备交付预期。' },
  { id: 104, type: 'pdf', filename: '设备验证访谈（脱敏）.pdf', file_size: 348120, extraction_status: 'completed', summary: '提取设备验证周期、客户导入和工艺节点信息。', affected_topic_ids: [2], created_at: '2026-05-18 14:10:00', topic: '半导体设备', entities: ['晶圆厂', '设备验证', '资本开支'], raw_text: '【公开脱敏 mock 材料】\n访谈摘要：验证周期由工艺节点、客户产线节拍和设备稳定性共同决定。对于新增设备，建议区分样机验证、重复采购与批量交付三个阶段。' },
  { id: 103, type: 'pdf', filename: '海外交付节奏观察（脱敏）.pdf', file_size: 286400, extraction_status: 'completed', summary: '记录车型供给、交付节奏与渠道库存的关联。', affected_topic_ids: [1], created_at: '2026-05-19 15:40:00', topic: '新能源车产业链', entities: ['车型供给', '动力电池', '渠道库存'], raw_text: '【公开脱敏 mock 材料】\n车型供给增加会带动需求端关注度，但不同区域的交付节奏和渠道库存需要单独拆分。材料价格变化对盈利的影响还取决于库存周期。' },
  { id: 102, type: 'link', filename: '产业链公开研究摘要（脱敏链接）', source_url: 'https://example.com/public-fixture/ev-supply', extraction_status: 'completed', summary: '公开材料摘要，涉及材料价格、车型供给与需求弹性。', affected_topic_ids: [1], created_at: '2026-05-19 16:20:00', topic: '新能源车产业链', entities: ['动力电池', '锂价', '车型供给'], raw_text: '【公开脱敏 mock 材料】\n链接摘要：材料价格下行并不必然直接改善盈利，仍需考虑库存周转和车型结构。车型供给扩展对需求弹性的影响更适合以主题关系沉淀。' },
  { id: 101, type: 'text', filename: '行业跟踪纪要（脱敏）.txt', extraction_status: 'completed', summary: '提取需求、材料价格与车型供给三个主题线索。', affected_topic_ids: [1], created_at: '2026-05-20 09:30:00', topic: '新能源车产业链', entities: ['动力电池', '锂价', '车型供给'], raw_text: '【公开脱敏 mock 材料】\n需求端仍由车型供给和价格带扩展驱动。材料价格波动会影响盈利弹性，但需要结合库存周期、采购节奏和产品结构共同判断。' },
]

let pendingChanges: PendingChangeItem[] = [
  { id: 201, change_type: 'contradiction', status: 'pending', topic_id: 1, topic_name: '新能源车产业链', wiki_topic: '新能源车产业链', source_material_id: 101, title: '材料价格影响程度存在差异', old_knowledge: { claim: '材料价格下行将直接改善行业盈利。' }, new_knowledge: { claim: '材料价格影响受库存周期与车型结构共同约束。' }, ai_reasoning: '两条判断关注同一因果关系，但适用条件不同，建议人工确认后合并。', source_type: 'text', source_title: '行业跟踪纪要（脱敏）', source_entry: 'wiki_detail', created_at: '2026-05-20 10:02:00' },
  { id: 202, change_type: 'new_link', status: 'pending', topic_id: 1, topic_name: '新能源车产业链', wiki_topic: '新能源车产业链', source_material_id: 102, title: '新增“车型供给”关联', old_knowledge: { entities: ['动力电池', '锂价'] }, new_knowledge: { entities: ['动力电池', '锂价', '车型供给'] }, ai_reasoning: '材料提及车型供给与需求弹性具有稳定关联。', source_type: 'link', source_title: '公开研究材料', source_entry: 'main_page', created_at: '2026-05-19 16:31:00' },
  { id: 203, change_type: 'supplement', status: 'accepted', topic_id: 2, topic_name: '半导体设备', wiki_topic: '半导体设备', title: '补充设备验证周期描述', old_knowledge: { claim: '验证周期较长。' }, new_knowledge: { claim: '验证节奏由工艺节点和客户产线节拍共同决定。' }, ai_reasoning: '补充了判断适用条件。', created_at: '2026-05-18 15:00:00' },
  { id: 204, change_type: 'supplement', status: 'pending', topic_id: 3, topic_name: '算力基础设施', wiki_topic: '算力基础设施', source_material_id: 109, title: '补充供电资源约束', old_knowledge: { claim: '服务器交付决定项目进度。' }, new_knowledge: { claim: '服务器、网络互联与供电资源共同决定可用容量的交付节奏。' }, ai_reasoning: '新材料补充了影响交付的基础设施约束，建议在主题页中保留。', source_type: 'pdf', source_title: '机房资源供给观察（脱敏）', source_entry: 'wiki_detail', created_at: '2026-05-20 10:05:00' },
  { id: 205, change_type: 'new_link', status: 'pending', topic_id: 4, topic_name: '可选消费', wiki_topic: '可选消费', source_material_id: 110, title: '新增“新品节奏”关联', old_knowledge: { entities: ['消费场景', '渠道库存'] }, new_knowledge: { entities: ['消费场景', '渠道库存', '新品节奏'] }, ai_reasoning: '材料表明新品节奏会改变转化与库存去化的关系。', source_type: 'text', source_title: '可选消费周度纪要（脱敏）', source_entry: 'main_page', created_at: '2026-05-19 17:30:00' },
]

const entityData: EntityInfo[] = [
  { id: 1, name: '新能源车产业链', entity_type: 'topic', topic: '新能源车产业链', description: '主题知识节点', weight: 10 },
  { id: 2, name: '动力电池', entity_type: 'industry', topic: '新能源车产业链', description: '产业链核心环节', weight: 8 },
  { id: 3, name: '锂价', entity_type: 'macro', topic: '新能源车产业链', description: '关键成本变量', weight: 7 },
  { id: 4, name: '车型供给', entity_type: 'concept', topic: '新能源车产业链', description: '需求侧变量', weight: 7 },
  { id: 5, name: '半导体设备', entity_type: 'topic', topic: '半导体设备', description: '主题知识节点', weight: 9 },
  { id: 6, name: '晶圆厂', entity_type: 'company', topic: '半导体设备', description: '下游客户', weight: 6 },
  { id: 7, name: '设备验证', entity_type: 'concept', topic: '半导体设备', description: '设备导入关键阶段', weight: 7 },
  { id: 8, name: '资本开支', entity_type: 'macro', topic: '半导体设备', description: '下游投资变量', weight: 6 },
  { id: 9, name: '算力基础设施', entity_type: 'topic', topic: '算力基础设施', description: '主题知识节点', weight: 9 },
  { id: 10, name: '服务器', entity_type: 'industry', topic: '算力基础设施', description: '基础设施供给环节', weight: 7 },
  { id: 11, name: '网络互联', entity_type: 'industry', topic: '算力基础设施', description: '基础设施协同环节', weight: 7 },
  { id: 12, name: '供电资源', entity_type: 'concept', topic: '算力基础设施', description: '机房资源约束', weight: 6 },
  { id: 13, name: '可选消费', entity_type: 'topic', topic: '可选消费', description: '主题知识节点', weight: 8 },
  { id: 14, name: '消费场景', entity_type: 'concept', topic: '可选消费', description: '需求侧观察变量', weight: 6 },
  { id: 15, name: '渠道库存', entity_type: 'concept', topic: '可选消费', description: '渠道效率变量', weight: 6 },
  { id: 16, name: '新品节奏', entity_type: 'concept', topic: '可选消费', description: '产品更新变量', weight: 6 },
]

const wait = () => new Promise<void>((resolve) => window.setTimeout(resolve, 180))
const pageSummary = (page: WikiPage): WikiPageSummary => ({ topic: page.topic, title: page.title, lede: page.lede, updated_at: page.updated_at })
const paginate = <T,>(items: T[], page: number, pageSize: number): PaginatedResponse<T> => ({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, page_size: pageSize, pages: Math.max(1, Math.ceil(items.length / pageSize)) })

export async function listTopics(page = 1, size = 20): Promise<TopicsListResponse> { await wait(); return { items: pages.slice((page - 1) * size, page * size).map((item, index) => ({ id: index + 1, name: item.topic, entity_type: 'topic', current_judgment: item.lede, judgment_summary: item.lede, material_count: item.source_ids?.length || 0, pending_change_count: pendingChanges.filter((change) => change.wiki_topic === item.topic && change.status === 'pending').length, related_entity_names: item.content.linkchips.map((chip) => chip.label), updated_at: item.updated_at })), total: pages.length, pending_total: pendingChanges.filter((item) => item.status === 'pending').length } }
export async function getPendingCount(wikiTopic?: string) { await wait(); return { count: pendingChanges.filter((item) => item.status === 'pending' && (!wikiTopic || item.wiki_topic === wikiTopic)).length } }
export async function batchResolvePending(params: { change_ids?: number[]; topic?: string; action: 'accept' | 'reject'; resolution_note?: string }) { await wait(); let count = 0; pendingChanges = pendingChanges.map((item) => { if (item.status !== 'pending' || (params.change_ids && !params.change_ids.includes(item.id)) || (params.topic && item.wiki_topic !== params.topic)) return item; count += 1; return { ...item, status: params.action === 'accept' ? 'accepted' : 'rejected', updated_at: now } }); return { success: true, count } }
export async function listPendingChanges(page = 1, size = 20, status?: string, changeType?: string): Promise<PendingListResponse> { await wait(); const items = pendingChanges.filter((item) => (!status || item.status === status) && (!changeType || item.change_type === changeType)); return { items: items.slice((page - 1) * size, page * size), total: items.length } }
export async function acceptPendingChange(changeId: number, note?: string) { return batchResolvePending({ change_ids: [changeId], action: 'accept', resolution_note: note }) }
export async function rejectPendingChange(changeId: number, note?: string) { return batchResolvePending({ change_ids: [changeId], action: 'reject', resolution_note: note }) }
export async function getPendingChange(changeId: number) { await wait(); return pendingChanges.find((item) => item.id === changeId) || pendingChanges[0] }
export async function listMaterials(page = 1, size = 20): Promise<MaterialsListResponse> { await wait(); return { items: materials.slice((page - 1) * size, page * size), total: materials.length } }
export async function triggerExtraction(materialId: number): Promise<ExtractionResponse> { await wait(); return { success: true, task_id: `fixture-${materialId}`, status: 'completed' } }
export async function deleteMaterial(_materialId: number) { await wait(); return { success: true } }
export async function restoreMaterial(_materialId: number) { await wait(); return { success: true } }
export async function listTrashMaterials(_page = 1, _size = 20): Promise<MaterialsListResponse> { await wait(); return { items: [], total: 0 } }
export async function getMaterialContent(materialId: number): Promise<MaterialContentResponse> {
  await wait();
  const material = materials.find((item) => item.id === materialId);
  return {
    id: materialId,
    type: material?.type || 'text',
    filename: material?.filename,
    source_url: material?.source_url,
    raw_text: material?.raw_text || '【公开脱敏 mock 材料】\n该材料仅用于作品集展示，不包含内部研究内容、真实客户数据或未公开结论。',
    mime_type: 'text/plain',
  };
}
export async function downloadMaterial(_materialId: number, filename = '公开脱敏材料.txt') { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['公开脱敏材料，仅供作品集演示。'], { type: 'text/plain' })); link.download = filename; link.click(); URL.revokeObjectURL(link.href) }
export async function getWikiPage(topic: string) { await wait(); return pages.find((item) => item.topic === topic) || pages[0] }
export async function reformatWikiPage(topic: string) { await wait(); return getWikiPage(topic) }
export async function saveWikiPage(topic: string, data: { title: string; lede: string; content_json: string; source_ids?: number[] }) { await wait(); const parsed = JSON.parse(data.content_json) as WikiContent; const page: WikiPage = { topic, title: data.title, lede: data.lede, content: parsed, source_ids: data.source_ids, updated_at: now }; const index = pages.findIndex((item) => item.topic === topic); if (index >= 0) pages[index] = page; else pages.push(page); return page }
export async function deleteWikiPage(_topic: string) { await wait() }
export async function searchWikiPages(query: string, page = 1, pageSize = 20) { await wait(); const value = query.toLowerCase(); return paginate(pages.filter((item) => `${item.topic} ${item.title} ${item.lede}`.toLowerCase().includes(value)).map(pageSummary), page, pageSize) }
export async function listWikiPages(page = 1, pageSize = 20) { await wait(); return paginate(pages.map(pageSummary), page, pageSize) }
export async function ingestMaterial(request: IngestMaterialRequest): Promise<IngestMaterialResponse> { await wait(); const id = 113 + materials.length; const topic = request.topic || pages[0].topic; materials.unshift({ id, type: request.type, filename: request.type === 'text' ? '即时文本（公开版）.txt' : undefined, source_url: request.source_url, extraction_status: 'completed', summary: '公开版本地样例：已完成结构化抽取。', created_at: now, topic, entities: [], raw_text: `【公开脱敏 mock 材料】\n${request.content || '即时摄入的本地样例材料。'}` }); return { success: true, material_id: id, wiki_page: pages[0], wiki_pages: [{ topic: pages[0].topic, is_new: false, pending_change_ids: [], pending_change_count: 0, wiki_page: pages[0] }], pending_change_ids: [], total_pending_count: pendingChanges.filter((item) => item.status === 'pending').length, message: '公开版本地样例已处理完成' } }
export async function listRawMaterials(page = 1, pageSize = 20) {
  await wait();
  return paginate(materials.map((item) => ({
    id: item.id,
    type: item.type as 'pdf' | 'link' | 'text',
    source_url: item.source_url,
    raw_text: item.raw_text,
    entities: item.entities,
    created_at: item.created_at,
  })), page, pageSize);
}
export async function ingestPdfFile(file: File, topic?: string) { return ingestMaterial({ type: 'pdf', content: file.name, topic }) }
export async function ingestBatchPdfFiles(files: File[], topic?: string): Promise<BatchUploadResult> { const results = await Promise.all(files.map(async (file) => ({ filename: file.name, success: true, material_id: (await ingestPdfFile(file, topic)).material_id }))); return { success: true, total: files.length, success_count: files.length, failed_count: 0, results } }
export async function getEntityGraph(entityName: string): Promise<EntityGraphResponse> {
  await wait();
  const entity = entityData.find((item) => item.name === entityName) || entityData[0];
  const relationsByTopic: Record<string, EntityRelation[]> = {
    '半导体设备': [
      { source: '半导体设备', target: '晶圆厂', type: '服务于', strength: 0.9 },
      { source: '半导体设备', target: '设备验证', type: '依赖', strength: 0.86 },
      { source: '晶圆厂', target: '资本开支', type: '受影响于', strength: 0.72 },
    ],
    '算力基础设施': [
      { source: '算力基础设施', target: '服务器', type: '包含', strength: 0.94 },
      { source: '算力基础设施', target: '网络互联', type: '协同', strength: 0.86 },
      { source: '算力基础设施', target: '供电资源', type: '受约束于', strength: 0.78 },
    ],
    '可选消费': [
      { source: '可选消费', target: '消费场景', type: '观察', strength: 0.88 },
      { source: '可选消费', target: '渠道库存', type: '受影响于', strength: 0.8 },
      { source: '消费场景', target: '新品节奏', type: '关联', strength: 0.76 },
    ],
  };
  const relations = relationsByTopic[entity.topic || entity.name] || [
    { source: '新能源车产业链', target: '动力电池', type: '包含', strength: 0.95 },
    { source: '动力电池', target: '锂价', type: '受影响于', strength: 0.82 },
    { source: '新能源车产业链', target: '车型供给', type: '关联', strength: 0.74 },
  ];
  return { entity, relations };
}
export async function searchEntities(query: string, limit = 20) { await wait(); const value = query.toLowerCase(); const items = entityData.filter((item) => item.name.toLowerCase().includes(value)).slice(0, limit); return { items, total: items.length } }
export async function backfillEntityGraph() { await wait(); return { success: true, count: entityData.length, message: '公开版静态样例已就绪' } }

export const wikiApi = { getPage: getWikiPage, savePage: saveWikiPage, deletePage: deleteWikiPage, search: searchWikiPages, list: listWikiPages, reformatPage: reformatWikiPage, ingestMaterial, listMaterials, uploadPdf: ingestPdfFile, batchUploadPdf: ingestBatchPdfFiles, listTopics, listPendingChanges, acceptPendingChange, rejectPendingChange, getPendingChange, batchResolvePending, getPendingCount, triggerExtraction, deleteMaterial, restoreMaterial, listTrashMaterials, getMaterialContent, downloadMaterial, getEntityGraph, searchEntities, backfillEntityGraph }
export default wikiApi

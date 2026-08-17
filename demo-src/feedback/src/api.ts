export interface TopicStat {
  name: string
  count: number
  total_count: number
  summary: string
}

export interface FeedbackItem {
  id: number
  primary_topic: string | null
  secondary_topic: string | null
  speaker: string | null
  spoken_at: string | null
  text: string | null
  sentiment: string | null
  severity: number | null
  split_path: string
  created_at: string
}

export interface StatsResponse {
  topics: TopicStat[]
  days: number | null
}

export interface ItemsResponse {
  total: number
  items: FeedbackItem[]
}

const feedbackItems: FeedbackItem[] = [
  { id: 1, primary_topic: '可用性Bug', secondary_topic: '导出', speaker: '用户 A', spoken_at: '周二 10:21', text: '导出研报后表格列宽没有保持，阅读时需要反复调整。', sentiment: 'negative', severity: 4, split_path: '文本切片 / 1', created_at: '2026-05-12 10:22:08' },
  { id: 2, primary_topic: '效果类', secondary_topic: '检索召回', speaker: '用户 B', spoken_at: '周二 11:08', text: '同一问题连续追问时，第二轮没有引用到上一轮已经确认的公司口径。', sentiment: 'urgent', severity: 5, split_path: '文本切片 / 2', created_at: '2026-05-12 11:09:41' },
  { id: 3, primary_topic: '性能类', secondary_topic: '页面响应', speaker: '用户 C', spoken_at: '周三 09:34', text: '长周期行情筛选在高峰时段打开较慢，建议给出明确的加载进度。', sentiment: 'negative', severity: 3, split_path: '截图 OCR / 1', created_at: '2026-05-13 09:36:10' },
  { id: 4, primary_topic: '产品体验&新功能建议', secondary_topic: '工作流', speaker: '用户 D', spoken_at: '周三 14:16', text: '希望把常用的投研问题保存为模板，下次可以直接复用筛选条件。', sentiment: 'neutral', severity: 2, split_path: '文本切片 / 1', created_at: '2026-05-13 14:18:32' },
  { id: 5, primary_topic: '产品认可', secondary_topic: '总结', speaker: '用户 E', spoken_at: '周四 16:05', text: '行业横向比较的结构很清楚，减少了整理初稿的时间。', sentiment: 'positive', severity: 1, split_path: '文本切片 / 1', created_at: '2026-05-14 16:06:12' },
  { id: 6, primary_topic: '可用性Bug', secondary_topic: '权限', speaker: '用户 F', spoken_at: '周五 10:44', text: '切换权限后页面提示已成功，但刷新后仍然没有对应的菜单入口。', sentiment: 'negative', severity: 4, split_path: '截图 OCR / 2', created_at: '2026-05-15 10:45:53' },
  { id: 7, primary_topic: '可用性Bug', secondary_topic: '筛选', speaker: '用户 G', spoken_at: '周五 11:20', text: '切换行业筛选后，已选择的时间范围被重置，连续比较时需要重新设置。', sentiment: 'negative', severity: 3, split_path: '文本切片 / 3', created_at: '2026-05-15 11:21:20' },
  { id: 8, primary_topic: '可用性Bug', secondary_topic: '收藏', speaker: '用户 H', spoken_at: '周五 15:10', text: '收藏的问题在列表中没有按最近使用排序，常用入口不容易找到。', sentiment: 'negative', severity: 2, split_path: '转发清洗 / 1', created_at: '2026-05-15 15:12:06' },
  { id: 9, primary_topic: '可用性Bug', secondary_topic: '引用跳转', speaker: '用户 I', spoken_at: '周一 09:18', text: '回答里的引用编号可以看到，但点击后没有定位到对应原文段落。', sentiment: 'urgent', severity: 5, split_path: '截图 OCR / 3', created_at: '2026-05-18 09:19:44' },
  { id: 10, primary_topic: '可用性Bug', secondary_topic: '移动端', speaker: '用户 J', spoken_at: '周一 16:42', text: '在窄屏下日期选择器遮住了确认按钮，无法完成筛选。', sentiment: 'negative', severity: 4, split_path: '截图 OCR / 4', created_at: '2026-05-18 16:43:31' },
  { id: 11, primary_topic: '效果类', secondary_topic: '引用准确性', speaker: '用户 K', spoken_at: '周二 10:02', text: '答案方向是对的，但引用材料只覆盖结论，没有解释推导过程。', sentiment: 'negative', severity: 4, split_path: '文本切片 / 4', created_at: '2026-05-19 10:03:15' },
  { id: 12, primary_topic: '效果类', secondary_topic: '表格抽取', speaker: '用户 L', spoken_at: '周二 11:35', text: '研报里的同比和环比字段被混在一起，建议保留原始表头和单位。', sentiment: 'urgent', severity: 5, split_path: '截图 OCR / 5', created_at: '2026-05-19 11:36:48' },
  { id: 13, primary_topic: '效果类', secondary_topic: '多轮上下文', speaker: '用户 M', spoken_at: '周二 14:08', text: '先确认行业范围后再问个股，回答偶尔又回到了全市场口径。', sentiment: 'negative', severity: 4, split_path: '转发清洗 / 2', created_at: '2026-05-19 14:09:29' },
  { id: 14, primary_topic: '效果类', secondary_topic: '结果结构', speaker: '用户 N', spoken_at: '周二 17:26', text: '比较多个标的时，希望每个结论都明确对应数据时间点，便于复核。', sentiment: 'neutral', severity: 3, split_path: '文本切片 / 5', created_at: '2026-05-19 17:27:04' },
  { id: 15, primary_topic: '性能类', secondary_topic: 'OCR 解析', speaker: '用户 O', spoken_at: '周三 09:12', text: '上传多张截图后等待时间较长，建议显示当前正在解析第几张。', sentiment: 'negative', severity: 3, split_path: '截图 OCR / 6', created_at: '2026-05-20 09:13:38' },
  { id: 16, primary_topic: '性能类', secondary_topic: '答案生成', speaker: '用户 P', spoken_at: '周三 10:54', text: '需要多个指标的查询明显变慢，加载过程中没有可预期的进度提示。', sentiment: 'negative', severity: 3, split_path: '文本切片 / 6', created_at: '2026-05-20 10:55:42' },
  { id: 17, primary_topic: '性能类', secondary_topic: '页面切换', speaker: '用户 Q', spoken_at: '周三 15:18', text: '从历史记录返回结果页时图表会重新加载，影响连续查看。', sentiment: 'neutral', severity: 2, split_path: '转发清洗 / 3', created_at: '2026-05-20 15:19:10' },
  { id: 18, primary_topic: '产品体验&新功能建议', secondary_topic: '模板', speaker: '用户 R', spoken_at: '周四 09:25', text: '希望团队可以共享常用问题模板，并给模板加上适用场景说明。', sentiment: 'neutral', severity: 2, split_path: '文本切片 / 7', created_at: '2026-05-21 09:26:36' },
  { id: 19, primary_topic: '产品体验&新功能建议', secondary_topic: '对比视图', speaker: '用户 S', spoken_at: '周四 11:40', text: '横向比较时可以固定一个基准标的，查看其他标的相对变化会更方便。', sentiment: 'positive', severity: 2, split_path: '文本切片 / 8', created_at: '2026-05-21 11:42:18' },
  { id: 20, primary_topic: '产品体验&新功能建议', secondary_topic: '协作', speaker: '用户 T', spoken_at: '周四 14:52', text: '希望能在结论旁标注“待复核”并指派给同事，避免聊天里重复确认。', sentiment: 'neutral', severity: 3, split_path: '转发清洗 / 4', created_at: '2026-05-21 14:53:51' },
  { id: 21, primary_topic: '产品体验&新功能建议', secondary_topic: '提醒', speaker: '用户 U', spoken_at: '周四 16:30', text: '对已关注公司的关键指标变化可以给出简短提醒，减少重复检索。', sentiment: 'positive', severity: 2, split_path: '文本切片 / 9', created_at: '2026-05-21 16:31:45' },
  { id: 22, primary_topic: '产品认可', secondary_topic: '检索效率', speaker: '用户 V', spoken_at: '周五 09:10', text: '把公告、研报和历史问答放在同一个结果里后，查找资料的时间明显减少。', sentiment: 'positive', severity: 1, split_path: '文本切片 / 10', created_at: '2026-05-22 09:11:27' },
  { id: 23, primary_topic: '产品认可', secondary_topic: '引用展示', speaker: '用户 W', spoken_at: '周五 11:26', text: '结果里保留来源和时间点，对复盘讨论很有帮助。', sentiment: 'positive', severity: 1, split_path: '转发清洗 / 5', created_at: '2026-05-22 11:27:50' },
  { id: 24, primary_topic: '产品认可', secondary_topic: '信息整合', speaker: '用户 X', spoken_at: '周五 14:05', text: '把多份材料归纳成待确认要点后，和研究同事沟通更聚焦。', sentiment: 'positive', severity: 1, split_path: '文本切片 / 11', created_at: '2026-05-22 14:06:12' },
  { id: 25, primary_topic: '产品认可', secondary_topic: '工作流', speaker: '用户 Y', spoken_at: '周五 16:44', text: '从提问到保存结论的路径比较顺畅，适合作为日常研究的起点。', sentiment: 'positive', severity: 1, split_path: '截图 OCR / 7', created_at: '2026-05-22 16:45:39' },
]

const topicOrder = ['可用性Bug', '效果类', '性能类', '产品体验&新功能建议', '产品认可']
const summaries: Record<string, string> = {
  '可用性Bug': '优先关注导出、权限与操作阻断问题',
  '效果类': '聚焦检索、引用与回答一致性',
  '性能类': '关注高峰时段的加载与响应',
  '产品体验&新功能建议': '沉淀可进入产品规划的建议',
  '产品认可': '保留可复用的正向体验证据',
}

const delay = () => new Promise<void>((resolve) => window.setTimeout(resolve, 180))

export const api = {
  async stats(days?: number): Promise<StatsResponse> {
    await delay()
    const divisor = days === 7 ? 2 : days === 30 ? 1.25 : 1
    const topics = topicOrder.map((name) => {
      const total = feedbackItems.filter((item) => item.primary_topic === name).length
      return {
        name,
        count: Math.max(1, Math.round(total / divisor)),
        total_count: total,
        summary: summaries[name],
      }
    })
    return { topics, days: days ?? null }
  },

  async items(topic?: string, limit = 50, offset = 0): Promise<ItemsResponse> {
    await delay()
    const filtered = topic ? feedbackItems.filter((item) => item.primary_topic === topic) : feedbackItems
    return { total: filtered.length, items: filtered.slice(offset, offset + limit) }
  },

  async triage(_id: number, _status: string, _note?: string): Promise<{ success: boolean }> {
    await delay()
    return { success: true }
  },
}

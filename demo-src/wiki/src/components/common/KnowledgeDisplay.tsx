import React from 'react';

interface KnowledgeField {
  label: string;
  value: string | number | boolean | null | undefined;
  type?: 'text' | 'number' | 'percent' | 'badge' | 'boolean';
}

/** 解析知识对象为可展示字段 */
function parseKnowledge(obj: Record<string, unknown>): KnowledgeField[] {
  if (!obj || typeof obj !== 'object') return [];

  const fields: KnowledgeField[] = [];

  // 常用字段映射
  const fieldMap: Record<string, string> = {
    judgment: '判断',
    judgment_reason: '判断理由',
    confidence: '置信度',
    sentiment: '情绪倾向',
    tags: '标签',
    category: '分类',
    summary: '摘要',
    description: '描述',
    analysis: '分析',
    viewpoint: '观点',
    conclusion: '结论',
    evidence: '证据',
    source: '来源',
    entity: '实体',
    relation: '关系',
    impact: '影响',
    risk: '风险等级',
    recommendation: '建议',
  };

  for (const [key, value] of Object.entries(obj)) {
    // 跳过系统字段
    if (key.startsWith('_') || key === 'id' || key === 'created_at' || key === 'updated_at') {
      continue;
    }

    const label = fieldMap[key] || key;
    fields.push({
      label,
      value,
      type: inferType(key, value),
    });
  }

  return fields;
}

function inferType(key: string, value: unknown): KnowledgeField['type'] {
  if (typeof value === 'number') {
    if (key.includes('confidence') || key.includes('rate') || key.includes('percent')) {
      return 'percent';
    }
    return 'number';
  }
  if (typeof value === 'boolean') return 'boolean';
  if (key === 'tags' || key === 'categories' || key === 'labels') return 'badge';
  return 'text';
}

function formatValue(field: KnowledgeField): React.ReactNode {
  const { value } = field;
  return renderValue(value);
}

/** 检测并解析 Markdown 表格 */
function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  // 找表格分隔行（全是 | 和 - 以及空格）
  const separatorIdx = lines.findIndex(line =>
    /^\s*\|?[\s\-|:-]+\|?\s*$/.test(line)
  );
  if (separatorIdx === -1 || separatorIdx === 0) return null;

  // 解析表头
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0);
  if (headers.length === 0) return null;

  // 解析数据行
  const rows: string[][] = [];
  for (let i = separatorIdx + 1; i < lines.length; i++) {
    const cols = lines[i]
      .split('|')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    if (cols.length > 0) rows.push(cols);
  }

  return { headers, rows };
}

/** 渲染 Markdown 表格 */
function renderMarkdownTable(table: { headers: string[]; rows: string[][] }, isDark: boolean): React.ReactNode {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${isDark ? 'border-red-500/20 bg-red-500/10' : 'border-cyan/20 bg-cyan/10'}`}>
            {table.headers.map((h, i) => (
              <th key={i} className={`px-3 py-2 text-left text-xs font-medium ${isDark ? 'text-red-300' : 'text-cyan'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className={`border-b border-border/10 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/5'}`}>
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2 ${isDark ? 'text-red-200' : 'text-muted'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 递归渲染任意类型的值 */
function renderValue(value: unknown, depth = 0, isDark = false): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted/50 italic">无</span>;
  }

  // 对象类型
  if (typeof value === 'object' && !Array.isArray(value)) {
    const fields = parseKnowledge(value as Record<string, unknown>);
    if (fields.length === 0) return <span className="text-muted/50 italic">空</span>;

    return (
      <div className={`space-y-2 ${depth > 0 ? 'rounded-lg border border-border/30 bg-surface-elevated/50 p-3' : ''}`}>
        {fields.map((f, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] gap-2">
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="text-sm">{renderValue(f.value, depth + 1, isDark)}</dd>
          </div>
        ))}
      </div>
    );
  }

  // 数组类型
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted/50 italic">无</span>;

    // 如果元素是字符串/数字，用标签展示
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span key={i} className="rounded-full bg-cyan/10 px-2 py-0.5 text-xs text-cyan">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    // 对象数组，每项一行
    return (
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="relative rounded-lg border border-border/30 bg-surface-elevated/30 p-3">
            <span className="absolute -top-2 left-3 bg-surface-elevated px-1 text-[10px] text-muted">
              #{i + 1}
            </span>
            {renderValue(item, depth + 1, isDark)}
          </div>
        ))}
      </div>
    );
  }

  // 简单类型
  if (typeof value === 'boolean') {
    return (
      <span className={value ? 'text-green-400' : 'text-muted'}>
        {value ? '✓ 是' : '✗ 否'}
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="font-mono">{String(value)}</span>;
  }

  // 字符串类型 - 检测 Markdown 表格
  const str = String(value);
  const table = parseMarkdownTable(str);
  if (table && table.rows.length > 0) {
    return renderMarkdownTable(table, isDark);
  }

  return <span className="whitespace-pre-wrap">{str}</span>;
}

interface KnowledgeDisplayProps {
  knowledge: Record<string, unknown>;
  title?: string;
  variant?: 'light' | 'dark';
}

/** 知识内容展示组件 - 美化格式 */
export const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({
  knowledge,
  title,
  variant = 'light',
}) => {
  const fields = parseKnowledge(knowledge);

  if (fields.length === 0) {
    return (
      <div className="text-sm text-muted/50 italic">
        暂无内容
      </div>
    );
  }

  const isDark = variant === 'dark';
  const containerClass = isDark
    ? 'rounded-xl border border-red-500/20 bg-red-500/5'
    : 'rounded-xl border border-cyan/20 bg-cyan/5';

  return (
    <div className={containerClass}>
      {title && (
        <div className={`border-b border-border/30 px-4 py-2 ${isDark ? 'border-red-500/20' : 'border-cyan/20'}`}>
          <h4 className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-cyan'}`}>
            {title}
          </h4>
        </div>
      )}
      <div className="p-4">
        <dl className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="grid grid-cols-[100px_1fr] gap-2">
              <dt className="text-sm text-muted">{field.label}</dt>
              <dd className={`text-sm ${isDark ? 'text-red-300' : 'text-text'}`}>
                {renderValue(field.value, 0, isDark)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

interface KnowledgeComparisonProps {
  oldKnowledge?: Record<string, unknown> | null;
  newKnowledge?: Record<string, unknown> | null;
}

/** 知识对比组件 - 左右对比展示 */
export const KnowledgeComparison: React.FC<KnowledgeComparisonProps> = ({
  oldKnowledge,
  newKnowledge,
}) => {
  const hasOld = oldKnowledge && Object.keys(oldKnowledge).length > 0;
  const hasNew = newKnowledge && Object.keys(newKnowledge).length > 0;

  if (!hasOld && !hasNew) {
    return <div className="text-sm text-muted/50 italic">暂无内容</div>;
  }

  return (
    <div className="space-y-5">
      {/* 新认知在前 */}
      {hasNew && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-green-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            新认知
          </h4>
          <KnowledgeDisplay knowledge={newKnowledge!} variant="light" />
        </div>
      )}

      {/* 原判断在后 */}
      {hasOld && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-red-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
            原判断
          </h4>
          <KnowledgeDisplay knowledge={oldKnowledge!} variant="dark" />
        </div>
      )}
    </div>
  );
};

export default KnowledgeDisplay;

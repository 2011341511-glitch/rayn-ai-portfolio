import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ApiErrorAlert,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  InlineAlert,
  KnowledgeComparison,
  Loading,
} from '../components/common';
import { wikiApi, type WikiPage, type WikiPageSummary, type IngestMaterialResponse, type PendingChangeItem, type MaterialsListItem, type MaterialContentResponse } from '../api/wiki';
import { getParsedApiError, createParsedApiError } from '../api/error';
import { formatDateTime } from '../utils/format';
import EntityGraph from './WikiEntityGraph';

type ViewMode = 'list' | 'detail' | 'upload';

const WIKI_INPUT_CLASS =
  'input-surface input-focus-glow w-full rounded-xl border bg-transparent px-4 py-3 text-sm transition-all focus:outline-none';
const WIKI_TEXTAREA_CLASS = `${WIKI_INPUT_CLASS} min-h-[120px] resize-y`;
const WIKI_FILE_PICKER_CLASS =
  'input-surface input-focus-glow flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed bg-transparent px-4 py-8 text-sm transition-all focus-within:border-solid';

// ==================== 图谱探索器组件 ====================

interface GraphExplorerProps {
  onNavigate?: (topic: string) => void;
}

const GraphExplorer: React.FC<GraphExplorerProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [entityName, setEntityName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; entity_type: string }>>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const result = await wikiApi.searchEntities(query, 6);
      setSearchResults(result.items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenGraph = (name: string) => {
    setEntityName(name);
    setIsOpen(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEntityName('');
  };

  const handleNodeClick = (name: string) => {
    if (onNavigate) {
      onNavigate(name);
      handleClose();
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2 rounded-xl border border-border/50 bg-surface-elevated p-3">
        <div className="flex items-center gap-2 flex-1">
          <svg className="h-4 w-4 flex-shrink-0 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="输入实体名称，查看关联图谱..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          {searching && (
            <svg className="h-4 w-4 animate-spin text-muted" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-1 z-20 w-72 rounded-xl border border-border/50 bg-surface-elevated shadow-xl">
            {searchResults.map(entity => (
              <button
                key={entity.name}
                onClick={() => handleOpenGraph(entity.name)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-hover"
              >
                <span className="h-2 w-2 rounded-full bg-cyan" />
                <span className="flex-1 truncate font-medium">{entity.name}</span>
                <span className="text-xs text-muted">{entity.entity_type}</span>
              </button>
            ))}
          </div>
        )}
        {searchQuery && !searching && searchResults.length === 0 && (
          <span className="text-xs text-muted pr-2">无匹配实体</span>
        )}
      </div>

      {/* 图谱模态框 */}
      {isOpen && entityName && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleClose}
        >
          <div
            className="h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border/50 bg-surface-elevated shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <h3 className="text-lg font-semibold">知识图谱探索</h3>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(85vh-60px)] p-4">
              <EntityGraph
                entityName={entityName}
                onClose={handleClose}
                fullscreen
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==================== 子组件 ====================

interface WikiCardProps {
  page: WikiPageSummary;
  onClick: () => void;
}

function WikiCard({ page, onClick }: WikiCardProps) {
  return (
    <div onClick={onClick}>
      <Card
        hoverable
        className="p-5 transition-all hover:border-cyan hover:shadow-lg hover:shadow-cyan/10"
      >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold text-cyan">{page.topic}</h3>
        <span className="text-xs text-muted">
          {formatDateTime(page.updated_at)}
        </span>
      </div>
      <h4 className="mb-2 text-base font-medium">{page.title}</h4>
      <p className="line-clamp-2 text-sm text-muted">{page.lede}</p>
      </Card>
    </div>
  );
}

interface WikiDetailViewProps {
  page: WikiPage;
  onBack: () => void;
  onDelete: () => void;
  onAddMaterial: () => void;
  onReformat: () => void;
  isReformatting: boolean;
  onNavigate?: (topic: string) => void;
}

function WikiDetailView({ page, onBack, onDelete, onAddMaterial, onReformat, isReformatting, onNavigate }: WikiDetailViewProps) {
  // 生成目录导航
  const tocItems = page.content.sections?.map((s, i) => ({
    id: `section-${i}`,
    title: s.title,
  })) || [];
  const [showGraph, setShowGraph] = useState(false);

  return (
    <div className="flex gap-8">
      {/* 侧边目录导航 - 桌面端 */}
      {tocItems.length > 0 && (
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="sticky top-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              内容导航
            </h3>
            <nav className="space-y-1">
              {tocItems.map((item, i) => (
                <a
                  key={i}
                  href={`#${item.id}`}
                  className="block rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-cyan"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* 主内容区 */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="btn-ghost group flex items-center gap-1">
            <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
            返回列表
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onReformat}
              disabled={isReformatting}
              className="btn-outline text-sm flex items-center gap-1.5"
            >
              <svg className={`h-4 w-4 ${isReformatting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isReformatting ? 'AI排版中...' : '重新排版'}</span>
            </button>
            <button onClick={onAddMaterial} className="btn-outline text-sm">
              + 追加材料
            </button>
            <button onClick={onDelete} className="btn-danger text-sm">
              删除页面
            </button>
          </div>
        </div>

        {/* Title Block */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-elevated via-surface-elevated to-cyan/5 p-6 pt-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan via-cyan/50 to-transparent" />
          <div className="mb-2 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-cyan/10 px-3 py-1 text-sm font-medium text-cyan">
              {page.topic}
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">{page.title}</h1>
          <div className="flex items-start gap-3 rounded-xl border-l-4 border-cyan/30 bg-base-100/50 p-4">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base leading-relaxed text-muted">{page.lede}</p>
          </div>
        </div>

        {/* Link Chips */}
        {page.content.linkchips && page.content.linkchips.length > 0 && (
          <div className="rounded-xl bg-surface-elevated p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              关联主题
            </h3>
            <div className="flex flex-wrap gap-2">
              {page.content.linkchips.map((chip, i) => (
                <a
                  key={i}
                  href={`#${chip.target}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 px-3 py-1.5 text-sm text-cyan transition-colors hover:bg-cyan/20"
                >
                  <span>{chip.label}</span>
                  <span className="text-xs text-cyan/60">({chip.target})</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {page.content.sections?.map((section, i) => (
            <section
              key={i}
              id={`section-${i}`}
              className="scroll-mt-6 rounded-2xl border border-border/50 bg-surface-elevated p-6 transition-all hover:border-border"
            >
              {/* Section Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                  <span className="text-sm font-bold">{i + 1}</span>
                </div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              {/* Section Content */}
              <div className="max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-lg border border-border/50">
                        <table className="min-w-full divide-y divide-border/50 text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-surface-hover">{children}</thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-border/30">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="transition-colors hover:bg-surface-hover/50">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{children}</td>
                    ),
                    h1: ({ children }) => (
                      <h1 className="mb-3 mt-6 text-2xl font-bold">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-2 mt-5 text-xl font-semibold">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-lg font-medium text-foreground">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-muted last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 list-disc space-y-1 pl-5 text-muted last:mb-0">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal space-y-1 pl-5 text-muted last:mb-0">{children}</ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="rounded-md bg-cyan/10 px-1.5 py-0.5 text-sm font-mono text-cyan">
                          {children}
                        </code>
                      ) : (
                        <code className="block rounded-lg bg-base-100 p-4 text-sm font-mono leading-relaxed text-muted">
                          {children}
                        </code>
                      );
                    },
                    hr: () => <hr className="my-6 border-border/50" />,
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-cyan/30 bg-base-100/50 py-3 pl-4 italic text-muted">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 pt-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>最后更新: {new Date(page.updated_at).toLocaleString('zh-CN')}</span>
            {page.source_ids && page.source_ids.length > 0 && (
              <span>来源材料 ID: {page.source_ids.join(', ')}</span>
            )}
          </div>
        </div>

        {/* 知识图谱按钮 */}
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-surface-elevated p-3 text-sm text-cyan transition-all hover:border-cyan/30 hover:bg-cyan/5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {showGraph ? '收起知识图谱' : '查看知识图谱'}
        </button>

        {/* 图谱内容 */}
        {showGraph && (
          <EntityGraph
            entityName={page.topic}
            onClose={() => setShowGraph(false)}
            onNodeClick={(entityName) => {
              // 点击节点时跳转到该实体的 Wiki 页面
              setShowGraph(false);
              if (onNavigate) {
                onNavigate(entityName);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

interface UploadFormProps {
  onSubmit: (type: 'text' | 'link' | 'document', content: string, topic: string) => Promise<void>;
  onFileUpload: (files: File[], topic: string) => Promise<void>;
  onCancel: () => void;
  onDismissError?: () => void;
  isLoading: boolean;
  errorMsg?: string | null;
}

function UploadForm({ onSubmit, onFileUpload, onCancel, onDismissError, isLoading, errorMsg }: UploadFormProps) {
  const [type, setType] = useState<'text' | 'link' | 'document'>('text');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'document' && files.length > 0) {
      // 批量上传文件
      await onFileUpload(files, topic);
    } else {
      const textContent = type === 'link' ? link : content;
      await onSubmit(type, textContent, topic);
    }
  };

  const handleTypeChange = (newType: 'text' | 'link' | 'document') => {
    setType(newType);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      // 最多支持 6 个文件
      const newFiles = selectedFiles.slice(0, 6);
      setFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const uniqueNew = newFiles.filter(f => !existingNames.has(f.name));
        return [...prev, ...uniqueNew].slice(0, 6);
      });
    }
    // 清空 input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">原材料类型</label>
        <div className="flex gap-2">
          {(['text', 'link', 'document'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`rounded-lg px-4 py-2 text-sm transition-all ${
                type === t
                  ? 'bg-cyan text-base-100'
                  : 'bg-surface-elevated hover:bg-surface-hover'
              }`}
            >
              {t === 'text' ? '文本' : t === 'link' ? '链接' : '文档'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          关联主题/关键词（可选）
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="如: 白酒行业, 贵州茅台"
          className={WIKI_INPUT_CLASS}
        />
      </div>

      {type === 'text' && (
        <div>
          <label className="mb-2 block text-sm font-medium">文本内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="粘贴研究报告、公告、新闻等文本内容..."
            className={WIKI_TEXTAREA_CLASS}
            rows={8}
          />
        </div>
      )}

      {type === 'link' && (
        <div>
          <label className="mb-2 block text-sm font-medium">链接地址</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className={WIKI_INPUT_CLASS}
          />
          <p className="mt-2 text-xs text-muted">
            <span className="text-amber-400">提示：</span>
            雪球网、东方财富、知乎等网站正文由 JS 动态加载，建议直接
            <span
              className="cursor-pointer text-cyan underline"
              onClick={() => handleTypeChange('text')}
            >切换到"文本"模式
            </span>
            粘贴文章内容，成功率更高。
          </p>
        </div>
      )}

      {type === 'document' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">
              文档文件（最多 6 个）
            </label>
            <span className="text-xs text-muted">{files.length}/6</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= 6}
            className={`${WIKI_FILE_PICKER_CLASS} ${files.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">📄</span>
              <span className="text-muted text-sm">
                点击添加文件（支持 PDF、Word）
              </span>
            </div>
          </button>
          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-surface-elevated px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-cyan">📄</span>
                    <span className="truncate text-foreground" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-muted">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 shrink-0 rounded p-1 text-muted hover:bg-surface-hover hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 错误信息（显示在弹窗内，可关闭） */}
      {errorMsg && (
        <div className="group relative rounded-lg border border-red-500/30 bg-red-500/10 p-3 pr-8 text-sm text-red-400">
          {errorMsg}
          <button
            onClick={onDismissError}
            className="absolute right-2 top-2 rounded p-0.5 text-red-400 hover:bg-red-500/20"
            title="关闭"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 上传中进度提示 */}
      {isLoading && (
        <div className="space-y-2 rounded-lg bg-cyan/5 p-3 text-sm">
          <div className="flex items-center gap-2 text-cyan">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-medium">正在处理...</span>
          </div>
          <p className="text-xs text-muted">
            PDF 正在经过 OCR 文字识别 + LLM 结构化解析，预计 2~5 分钟，请耐心等待
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost" disabled={isLoading}>
          取消
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || (type === 'text' && !content) || (type === 'link' && !link) || (type === 'document' && files.length === 0)}
        >
          {isLoading ? `处理中 (${files.length > 1 ? `${files.length} 个文件` : ''})...` : files.length > 1 ? `批量上传 ${files.length} 个文件` : '摄入并生成 Wiki'}
        </button>
      </div>
    </form>
  );
}

// ==================== Layer 1 Tab: 原始资料列表 ====================

// ==================== 原始资料列表（独立子组件）====================
const NormalMaterialList: React.FC<{
  onDelete: (id: number) => Promise<void>;
  actionLoading: Record<number, boolean>;
}> = ({ onDelete, actionLoading }) => {
  const [items, setItems] = useState<MaterialsListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 20;
  const [viewModal, setViewModal] = useState<{ open: boolean; content: MaterialContentResponse | null; loading: boolean }>({ open: false, content: null, loading: false });

  useEffect(() => {
    setLoading(true);
    wikiApi.listMaterials(pageNum, pageSize)
      .then(res => { setItems(res.items as MaterialsListItem[]); setTotal(res.total); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [pageNum]);

  // 查看文本内容
  const handleView = async (id: number) => {
    setViewModal({ open: true, content: null, loading: true });
    try {
      const content = await wikiApi.getMaterialContent(id);
      setViewModal({ open: true, content, loading: false });
    } catch {
      setViewModal({ open: true, content: null, loading: false });
    }
  };

  // 下载文件
  const handleDownload = async (id: number, filename?: string) => {
    try {
      await wikiApi.downloadMaterial(id, filename);
    } catch (e) {
      console.error('下载失败:', e);
    }
  };

  if (loading) return <Loading label="加载原始资料..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted">共 {total} 份原始资料</p>
        <select className="input-surface rounded-lg px-3 py-1.5 text-sm"
          value={pageNum}
          onChange={e => setPageNum(Number(e.target.value))}
        >
          {Array.from({ length: Math.max(1, Math.ceil(total / pageSize)) }, (_, i) => (
            <option key={i} value={i + 1}>第 {i + 1} 页</option>
          ))}
        </select>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="📄" title="暂无原始资料" description="点击右上角「摄入原材料」添加" />
      ) : (
        <div className="grid gap-3">
          {items.map(m => (
            <div key={m.id} className="rounded-xl border border-border/50 bg-surface-elevated p-4 hover:border-cyan/20 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      m.type === 'pdf' ? 'bg-red-500/10 text-red-400' :
                      m.type === 'word' ? 'bg-blue-500/10 text-blue-400' :
                      m.type === 'link' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>{m.type === 'word' ? 'WORD' : m.type.toUpperCase()}</span>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                      m.extraction_status === 'done' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>{m.extraction_status === 'done' ? '已提取' : '待处理'}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{m.filename || m.source_url || `材料 #${m.id}`}</p>
                  {m.summary && <p className="mt-1 text-xs text-muted line-clamp-2">{m.summary}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.file_size && <span className="text-xs text-muted">{(m.file_size / 1024 / 1024).toFixed(1)} MB</span>}
                  {/* 操作按钮 */}
                  {m.type === 'text' && (
                    <button onClick={() => handleView(m.id)}
                      className="rounded-lg bg-cyan/10 px-2.5 py-1.5 text-xs text-cyan hover:bg-cyan/20"
                    >📖 查看</button>
                  )}
                  {m.type === 'link' && m.source_url && (
                    <a href={m.source_url} target="_blank" rel="noreferrer"
                      className="rounded-lg bg-cyan/10 px-2.5 py-1.5 text-xs text-cyan hover:bg-cyan/20 inline-block"
                    >🔗 打开</a>
                  )}
                  {(m.type === 'pdf' || m.type === 'word') && (
                    <>
                      <button onClick={() => handleView(m.id)}
                        className="rounded-lg bg-cyan/10 px-2.5 py-1.5 text-xs text-cyan hover:bg-cyan/20"
                      >📖 查看</button>
                      <button onClick={() => handleDownload(m.id, m.filename)}
                        className="rounded-lg bg-cyan/10 px-2.5 py-1.5 text-xs text-cyan hover:bg-cyan/20"
                      >📥 下载</button>
                    </>
                  )}
                  <button onClick={() => onDelete(m.id)} disabled={actionLoading[m.id]}
                    className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  >{actionLoading[m.id] ? '...' : '🗑️ 删除'}</button>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted">{m.created_at && formatDateTime(m.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* 文本查看模态框 - 独立组件 */}
      {viewModal.open && (
        <MaterialViewModal
          content={viewModal.content}
          loading={viewModal.loading}
          onClose={() => setViewModal({ open: false, content: null, loading: false })}
        />
      )}
    </div>
  );
};

// ==================== 原材料查看模态框（独立组件）====================
const MaterialViewModal: React.FC<{
  content: MaterialContentResponse | null;
  loading: boolean;
  onClose: () => void;
}> = ({ content, loading, onClose }) => {
  const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed');
  
  const isPdf = content?.type === 'pdf';
  const hasFilePath = !!content?.file_path;
  const rawUrl = content?.file_path
    ? `/api/v1/wiki/materials/${content.id}/download`
    : null;

  // 内容类型：text=纯文本, link=链接, pdf/doc=文档
  const isTextContent = content?.type === 'text' || content?.type === 'link';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
         onClick={onClose}>
      <div className="h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border/50 bg-surface-elevated shadow-xl flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-lg">📄</span>
            <div>
              <h3 className="text-lg font-semibold">
                {isPdf ? (viewMode === 'raw' ? '原始文件预览' : '解析内容')
                  : isTextContent ? '文本内容'
                  : '文档内容'}
              </h3>
              {content?.filename && (
                <p className="text-sm text-muted">{content.filename}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* PDF 文件：显示解析/原文件切换按钮 */}
            {hasFilePath && isPdf && (
              <div className="flex rounded-lg bg-surface p-1">
                <button
                  onClick={() => setViewMode('parsed')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'parsed' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  解析结果
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'raw' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  原始文件
                </button>
              </div>
            )}
            <button onClick={onClose}
                    className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loading label="加载内容..." />
            </div>
          ) : isPdf && viewMode === 'raw' && rawUrl ? (
            /* PDF 原始文件预览 */
            <iframe
              src={rawUrl}
              className="h-full w-full border-0"
              title="原始文件预览"
            />
          ) : content?.raw_text ? (
            /* 文本/解析内容 */
            <div className="h-full overflow-y-auto p-4">
              <div className="prose prose-sm prose-invert max-w-none
                prose-headings:text-foreground prose-p:text-muted/90
                prose-li:text-muted/90 prose-code:text-cyan prose-code:bg-cyan/10 prose-code:px-1 prose-code:rounded
                prose-pre:bg-surface prose-pre:border prose-pre:border-border/50">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.raw_text}
                </ReactMarkdown>
              </div>
            </div>
          ) : hasFilePath && !isPdf ? (
            /* 非 PDF 文件，仅支持下载 */
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-6xl">📎</div>
              <p className="text-muted">该文件类型不支持在线预览</p>
              <a
                href={rawUrl || '#'}
                download={content?.filename}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                ⬇️ 下载文件
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted">暂无内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 回收站列表（独立子组件）====================
const TrashMaterialList: React.FC<{
  onRestore: (id: number) => Promise<void>;
  actionLoading: Record<number, boolean>;
}> = ({ onRestore, actionLoading }) => {
  const [items, setItems] = useState<MaterialsListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wikiApi.listTrashMaterials(1, 100)
      .then(res => { setItems(res.items as MaterialsListItem[]); setTotal(res.total); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="加载回收站..." />;

  return (
    <div>
      <p className="text-sm text-muted mb-3">回收站共 {total} 项</p>
      {items.length === 0 ? (
        <EmptyState icon="🗑️" title="回收站为空" description="已删除的资料会在这里显示" />
      ) : (
        <div className="grid gap-3">
          {items.map(m => (
            <div key={m.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400">{m.type.toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{m.filename || m.source_url || `材料 #${m.id}`}</p>
                  {m.summary && <p className="mt-1 text-xs text-muted line-clamp-2">{m.summary}</p>}
                </div>
                <button onClick={() => onRestore(m.id)} disabled={actionLoading[m.id]}
                  className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20 disabled:opacity-50 flex-shrink-0"
                >{actionLoading[m.id] ? '...' : '恢复'}</button>
              </div>
              <div className="mt-2 text-xs text-muted">{m.created_at && formatDateTime(m.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 原始资料 Tab（容器组件，只管理切换）====================
const MaterialsTab: React.FC = () => {
  const [showTrash, setShowTrash] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定移入回收站？')) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await wikiApi.deleteMaterial(id);
      setRefreshCounter(c => c + 1);
    } catch { /* ignore */ } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRestore = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await wikiApi.restoreMaterial(id);
      setRefreshCounter(c => c + 1);
    } catch { /* ignore */ } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{showTrash ? '回收站' : '原始资料'}</p>
        <button
          onClick={() => setShowTrash(!showTrash)}
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            showTrash ? 'bg-cyan/10 text-cyan' : 'bg-surface-hover text-muted hover:text-foreground'
          }`}
        >
          🗑️ {showTrash ? '返回资料列表' : '回收站'}
        </button>
      </div>

      {/* 用 key 强制 React 销毁重建组件，杜绝数据串混 */}
      {showTrash ? (
        <TrashMaterialList key={`trash-${refreshCounter}`} onRestore={handleRestore} actionLoading={actionLoading} />
      ) : (
        <NormalMaterialList key={`normal-${refreshCounter}`} onDelete={handleDelete} actionLoading={actionLoading} />
      )}
    </div>
  );
};

// ==================== Layer 3 Tab: 待确认变更 ====================

const PendingTab: React.FC = () => {
  const [items, setItems] = useState<PendingChangeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [actionError, setActionError] = useState<Record<number, string>>({});
  const [selectedItem, setSelectedItem] = useState<PendingChangeItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    wikiApi.listPendingChanges(pageNum, pageSize)
      .then(res => { setItems(res.items); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageNum]);

  useEffect(() => { load(); }, [load]);

  const handleViewDetail = async (item: PendingChangeItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleAccept = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setActionError(prev => ({ ...prev, [id]: '' }));
    try {
      await wikiApi.acceptPendingChange(id);
      await load();
      if (selectedItem?.id === id) setShowDetailModal(false);
    } catch (err: any) {
      setActionError(prev => ({ ...prev, [id]: err?.message || '操作失败' }));
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setActionError(prev => ({ ...prev, [id]: '' }));
    try {
      await wikiApi.rejectPendingChange(id);
      await load();
      if (selectedItem?.id === id) setShowDetailModal(false);
    } catch (err: any) {
      setActionError(prev => ({ ...prev, [id]: err?.message || '操作失败' }));
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <Loading label="加载待确认变更..." />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">共 {total} 条待确认</p>

      {items.length === 0 ? (
        <EmptyState icon="✅" title="无待处理事项" description="所有认知判断已确认" />
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-border/50 bg-surface-elevated p-5 transition-all hover:border-cyan/20">
              {/* 头部 */}
              <div className="mb-3 flex items-start gap-3">
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-lg ${
                  item.change_type === 'contradiction' ? 'bg-orange-500/10 text-orange-400' :
                  item.change_type === 'new_link' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {item.change_type === 'contradiction' ? '⚡' :
                   item.change_type === 'new_link' ? '🔗' : '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  {item.topic_name && (
                    <p className="text-xs text-muted mt-0.5">关联主题: {item.topic_name}</p>
                  )}
                  {item.source_type && item.source_title && (
                    <p className="text-xs text-muted">来源: {item.source_type} · {item.source_title}</p>
                  )}
                </div>
                <span className="text-xs text-muted flex-shrink-0">
                  {item.created_at && formatDateTime(item.created_at)}
                </span>
              </div>

              {/* AI 推理 */}
              {item.ai_reasoning && (
                <div className="mb-3 rounded-lg bg-cyan/5 p-3 text-sm text-muted">
                  <span className="text-xs font-medium text-cyan">AI 分析：</span>
                  {item.ai_reasoning}
                </div>
              )}

              {/* 错误提示 */}
              {actionError[item.id] && (
                <div className="mb-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {actionError[item.id]}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleViewDetail(item)}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-cyan/30 hover:text-cyan"
                >
                  查看详情
                </button>
                <button
                  onClick={() => handleAccept(item.id)}
                  disabled={actionLoading[item.id]}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan/10 px-4 py-2 text-sm text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
                >
                  {actionLoading[item.id] ? '处理中...' : '✓ 接受修正'}
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  disabled={actionLoading[item.id]}
                  className="flex items-center gap-1.5 rounded-lg bg-surface-hover px-4 py-2 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  ✗ 保留旧判断
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情模态框 */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
             onClick={() => setShowDetailModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/50 bg-surface-elevated p-6 shadow-xl"
               onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                  selectedItem.change_type === 'contradiction' ? 'bg-orange-500/10 text-orange-400' :
                  selectedItem.change_type === 'new_link' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {selectedItem.change_type === 'contradiction' ? '⚡' :
                   selectedItem.change_type === 'new_link' ? '🔗' : '📝'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{selectedItem.title || '待确认变更'}</h3>
                  {selectedItem.topic_name && (
                    <p className="text-sm text-muted">关联主题: {selectedItem.topic_name}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)}
                      className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground">
                ✕
              </button>
            </div>

            {/* AI 推理 */}
            {selectedItem.ai_reasoning && (
              <div className="mb-4 rounded-xl bg-cyan/5 p-4">
                <h4 className="mb-2 text-sm font-medium text-cyan">AI 分析</h4>
                <p className="text-sm text-muted">{selectedItem.ai_reasoning}</p>
              </div>
            )}

            {/* 旧知识 vs 新知识对比 */}
            <div className="mb-4">
              <KnowledgeComparison
                oldKnowledge={selectedItem.old_knowledge}
                newKnowledge={selectedItem.new_knowledge}
              />
            </div>

            {/* 来源信息 */}
            {selectedItem.source_type && selectedItem.source_title && (
              <div className="mb-4 text-sm text-muted">
                <span className="font-medium">来源：</span>{selectedItem.source_type} · {selectedItem.source_title}
              </div>
            )}

            {/* 详情操作按钮 */}
            <div className="flex gap-2 border-t border-border/50 pt-4">
              <button
                onClick={() => handleAccept(selectedItem.id)}
                disabled={actionLoading[selectedItem.id]}
                className="flex-1 rounded-xl bg-cyan/10 py-3 text-sm font-medium text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
              >
                {actionLoading[selectedItem.id] ? '处理中...' : '✓ 接受修正'}
              </button>
              <button
                onClick={() => handleReject(selectedItem.id)}
                disabled={actionLoading[selectedItem.id]}
                className="flex-1 rounded-xl bg-surface-hover py-3 text-sm font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
              >
                ✗ 保留旧判断
              </button>
            </div>

            {/* 详情页错误提示 */}
            {actionError[selectedItem.id] && (
              <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {actionError[selectedItem.id]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 主组件（三层 Tab） ====================

const WikiPageComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wiki' | 'materials' | 'pending'>('wiki');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [currentPage, setCurrentPage] = useState<WikiPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ReturnType<typeof getParsedApiError> | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [isReformatting, setIsReformatting] = useState(false);

  // 错误/成功提示 15 秒后自动消失
  useEffect(() => {
    if (!error && !successMsg) return;
    const timer = setTimeout(() => {
      setError(null);
      setSuccessMsg(null);
    }, 15000);
    return () => clearTimeout(timer);
  }, [error, successMsg]);

  // 加载页面列表
  const loadPages = useCallback(async (pageNum: number = 1, query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (query) {
        response = await wikiApi.search(query, pageNum);
      } else {
        response = await wikiApi.list(pageNum);
      }
      setPages(response.items);
      setPage(response.page);
      setTotalPages(response.pages);
    } catch (err) {
      setError(getParsedApiError(err as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载待确认总数
  useEffect(() => {
    wikiApi.listPendingChanges(1, 1)
      .then(res => setPendingTotal(res.total))
      .catch(() => {});
  }, [successMsg]);

  // 初始加载 & 翻页（即时触发）
  useEffect(() => {
    if (activeTab === 'wiki' && viewMode === 'list') {
      loadPages(page, searchQuery || undefined);
    }
  }, [activeTab, viewMode, page]);

  // 搜索关键词变化防抖（300ms 后触发，并重置到第 1 页）
  useEffect(() => {
    if (activeTab !== 'wiki' || viewMode !== 'list') return;
    const timer = setTimeout(() => {
      setPage(1);
      loadPages(1, searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 打开详情
  const handleOpenPage = async (topic: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const wikiPage = await wikiApi.getPage(topic);
      setCurrentPage(wikiPage);
      setViewMode('detail');
    } catch (err) {
      setError(getParsedApiError(err as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setIsLoading(false);
    }
  };

  // LLM 智能重新排版
  const handleReformat = async () => {
    if (!currentPage || isReformatting) return;
    setIsReformatting(true);
    setError(null);
    try {
      const reformatted = await wikiApi.reformatPage(currentPage.topic);
      setCurrentPage(reformatted);
      setSuccessMsg('AI 已智能重新排版，页面结构已优化');
    } catch (err) {
      setError(getParsedApiError(err as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setIsReformatting(false);
    }
  };

  // 删除页面
  const handleDeletePage = async (topic: string) => {
    setIsLoading(true);
    setError(null);
    setDeleteConfirm(null);
    try {
      await wikiApi.deletePage(topic);
      setSuccessMsg(`已删除 ${topic} 的 Wiki 页面`);
      setViewMode('list');
      setCurrentPage(null);
    } catch (err) {
      setError(getParsedApiError(err as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setIsLoading(false);
    }
  };

  // 摄入原材料
  const handleIngestMaterial = async (type: 'text' | 'link' | 'document', content: string, topic: string) => {
    // 'document' type goes to handleFileUpload, not here
    // This function only handles 'text' and 'link'
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Only 'text' and 'link' types reach here (document goes to handleFileUpload)
      const materialType = type === 'document' ? 'text' : type;
      const response = await wikiApi.ingestMaterial({ type: materialType, content, topic: topic || undefined });
      handleIngestSuccess(response);
    } catch (err) {
      setError(getParsedApiError(err as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setIsUploading(false);
    }
  };

  // 上传 PDF（支持多文件批量上传）
  const handleFileUpload = async (files: File[], topic: string) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);
    
    if (files.length === 1) {
      // 单文件：保持原有逻辑
      try {
        const response = await wikiApi.uploadPdf(files[0], topic || undefined);
        handleIngestSuccess(response);
      } catch (err) {
        setError(getParsedApiError(err as Parameters<typeof getParsedApiError>[0]));
      } finally {
        setIsUploading(false);
      }
    } else {
      // 多文件：批量上传
      const results: { success: IngestMaterialResponse[]; failed: string[] } = { success: [], failed: [] };
      
      // 并行上传所有文件
      const uploadPromises = files.map(async (file) => {
        try {
          const response = await wikiApi.uploadPdf(file, topic || undefined);
          return { success: true, response, filename: file.name };
        } catch (err) {
          return { 
            success: false, 
            filename: file.name, 
            error: getParsedApiError(err as Parameters<typeof getParsedApiError>[0]) 
          };
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      // 统计结果
      uploadResults.forEach(result => {
        if (result.success && result.response) {
          results.success.push(result.response);
        } else if (!result.success) {
          results.failed.push(`${result.filename}: ${result.error}`);
        }
      });
      
      // 显示结果
      if (results.success.length > 0) {
        const topics = results.success
          .filter(r => r.wiki_page?.topic)
          .map(r => r.wiki_page!.topic);
        if (topics.length > 0) {
          setSuccessMsg(`成功上传 ${results.success.length} 个文件，已为 ${topics.slice(0, 3).join(', ')}${topics.length > 3 ? ` 等 ${topics.length} 个` : ''} 生成 Wiki 页面`);
        } else {
          setSuccessMsg(`成功上传 ${results.success.length} 个文件，正在后台处理...`);
        }
        // 打开第一个成功的 Wiki 页面
        if (results.success[0].wiki_page) {
          setCurrentPage(results.success[0].wiki_page);
          setViewMode('detail');
        }
      }
      
      if (results.failed.length > 0) {
        setError(createParsedApiError({
          title: '部分文件上传失败',
          message: `${results.failed.slice(0, 3).join('\n')}${results.failed.length > 3 ? `\n...共 ${results.failed.length} 个失败` : ''}`,
          category: 'http_error'
        }));
      }
      
      setShowUploadModal(false);
      setIsUploading(false);
    }
  };

  const handleIngestSuccess = (response: IngestMaterialResponse) => {
    setShowUploadModal(false);
    if (response.wiki_page) {
      setSuccessMsg(`已为 ${response.wiki_page.topic} 生成 Wiki 页面`);
      setCurrentPage(response.wiki_page);
      setViewMode('detail');
    } else {
      setSuccessMsg(`原材料已保存 (ID: ${response.material_id})，正在后台处理...`);
    }
  };

  // 搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPages(1, searchQuery || undefined);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">投研知识库</h1>
          <p className="text-sm text-muted">管理你的研究资料、主题认知与待确认项</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary">
          + 摄入原材料
        </button>
      </div>

      {/* 待确认提示横幅 */}
      {pendingTotal > 0 && activeTab !== 'pending' && (
        <div className="mb-4 cursor-pointer rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 transition-colors hover:bg-orange-500/10"
             onClick={() => { setActiveTab('pending'); setViewMode('list'); }}>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-lg">⚡</span>
            <div>
              <p className="text-sm font-medium text-orange-400">
                AI 发现 {pendingTotal} 处新旧认知矛盾，等你确认
              </p>
              <p className="text-xs text-muted">点击查看详情</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="group relative mb-4">
          <button onClick={() => setError(null)}
            className="absolute right-2 top-2 z-10 rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground group-hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <ApiErrorAlert error={error} />
        </div>
      )}
      {successMsg && (
        <div className="group relative mb-4">
          <button onClick={() => setSuccessMsg(null)}
            className="absolute right-2 top-2 z-10 rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground group-hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <InlineAlert variant="success" message={successMsg} />
        </div>
      )}

      {/* Tab 导航 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-elevated p-1">
        <button
          onClick={() => { setActiveTab('wiki'); setViewMode('list'); }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'wiki' ? 'bg-cyan/10 text-cyan shadow-sm' : 'text-muted hover:text-foreground'
          }`}
        >
          📚 Wiki 页面
        </button>
        <button
          onClick={() => { setActiveTab('materials'); }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'materials' ? 'bg-cyan/10 text-cyan shadow-sm' : 'text-muted hover:text-foreground'
          }`}
        >
          📄 原始资料
        </button>
        <Link
          to="/wiki/pending"
          className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'pending' ? 'bg-cyan/10 text-cyan shadow-sm' : 'text-muted hover:text-foreground'
          }`}
        >
          ⚡ 待确认
          {pendingTotal > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
              {pendingTotal}
            </span>
          )}
        </Link>
      </div>

      {/* Main Content */}
      {activeTab === 'wiki' && viewMode === 'list' && (
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 Wiki 页面..."
              className={`${WIKI_INPUT_CLASS} flex-1`}
            />
            <button type="submit" className="btn-primary">搜索</button>
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setPage(1); }} className="btn-ghost">
                清除
              </button>
            )}
          </form>

          {/* 图谱入口 */}
          <GraphExplorer onNavigate={handleOpenPage} />

          {/* Loading / Page List */}
          {isLoading ? (
            <Loading label="加载中..." />
          ) : pages.length === 0 ? (
            <EmptyState icon="📚" title="暂无 Wiki 页面" description="点击右上角「摄入原材料」添加你的第一份研究资料" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pages.map((p) => (
                <WikiCard key={p.topic} page={p} onClick={() => handleOpenPage(p.topic)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1} className="btn-ghost">上一页</button>
              <span className="flex items-center px-4 text-sm text-muted">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages} className="btn-ghost">下一页</button>
            </div>
          )}
        </div>
      )}

      {!isLoading && activeTab === 'wiki' && viewMode === 'detail' && currentPage && (
        <WikiDetailView
          page={currentPage}
          onBack={() => { setViewMode('list'); setCurrentPage(null); }}
          onDelete={() => setDeleteConfirm(currentPage.topic)}
          onAddMaterial={() => setShowUploadModal(true)}
          onReformat={handleReformat}
          isReformatting={isReformatting}
          onNavigate={handleOpenPage}
        />
      )}

      {!isLoading && activeTab === 'materials' && <MaterialsTab />}
      {!isLoading && activeTab === 'pending' && <PendingTab />}

      {/* Upload Drawer */}
      <Drawer
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="摄入原材料"
        side="right"
        width="max-w-lg"
      >
        <UploadForm
          onSubmit={handleIngestMaterial}
          onFileUpload={handleFileUpload}
          onCancel={() => setShowUploadModal(false)}
          onDismissError={() => setError(null)}
          isLoading={isUploading}
          errorMsg={error ? (typeof error === 'string' ? error : error.message) : null}
        />
      </Drawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="确认删除"
        message={`确定要删除 ${deleteConfirm} 的 Wiki 页面吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        isDanger
        onConfirm={() => {
          if (deleteConfirm) handleDeletePage(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default WikiPageComponent;

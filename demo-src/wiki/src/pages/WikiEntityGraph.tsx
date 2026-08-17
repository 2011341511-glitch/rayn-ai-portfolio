import React, { useEffect, useRef, useState, useCallback } from 'react';
import { wikiApi, type EntityInfo, type EntityRelation, type EntityGraphResponse } from '../api/wiki';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  weight?: number;
  description?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

interface EntityGraphProps {
  /** 初始实体名称 */
  entityName: string;
  /** 关闭回调 */
  onClose?: () => void;
  /** 节点点击回调（用于导航到其他 Wiki 页面） */
  onNodeClick?: (entityName: string, entityInfo?: EntityInfo) => void;
  /** 是否全屏模式 */
  fullscreen?: boolean;
}

/** 颜色映射 */
const COLOR_MAP: Record<string, string> = {
  stock: '#38bdf8',
  company: '#38bdf8',
  concept: '#a78bfa',
  industry: '#f59e0b',
  person: '#34d399',
  location: '#f472b6',
  technology: '#60a5fa',
  policy: '#ef4444',
  macro: '#84cc16',
  product: '#c084fc',
  brand: '#fb923c',
  topic: '#22d3ee',
  event: '#fbbf24',
  related: '#64748b',
};

/** 实体类型中文名 */
const TYPE_LABELS: Record<string, string> = {
  stock: '股票',
  company: '公司',
  concept: '概念',
  industry: '行业',
  person: '人物',
  location: '地区',
  technology: '技术',
  policy: '政策',
  macro: '宏观',
  product: '产品',
  brand: '品牌',
  topic: '主题',
  event: '事件',
  related: '关联',
};

/** 力导向图组件 — SVG + React hooks */
const EntityGraph: React.FC<EntityGraphProps> = ({
  entityName,
  onClose,
  onNodeClick,
  fullscreen = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [entityInfo, setEntityInfo] = useState<EntityInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EntityInfo[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // 视图状态
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 600, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // 画布尺寸
  const canvasWidth = fullscreen ? 800 : 600;
  const canvasHeight = fullscreen ? 600 : 500;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // 加载图谱数据
  const loadGraph = useCallback(async (name: string) => {
    setLoading(true);
    setError('');
    try {
      const data: EntityGraphResponse = await wikiApi.getEntityGraph(name);
      if (!data.entity) {
        setError(`未找到实体: ${name}`);
        setLoading(false);
        return;
      }
      setEntityInfo(data.entity);

      // 构建节点
      const nodeMap = new Map<string, GraphNode>();
      nodeMap.set(data.entity.name, {
        id: data.entity.name,
        label: data.entity.name,
        type: data.entity.entity_type,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        weight: data.entity.weight,
        description: data.entity.description,
      });

      // 关联节点
      const relations = data.relations || [];
      const angleStep = (2 * Math.PI) / Math.max(relations.length, 1);
      relations.forEach((rel, i) => {
        const otherName = rel.source === data.entity.name ? rel.target : rel.source;
        if (!nodeMap.has(otherName)) {
          const angle = i * angleStep - Math.PI / 2;
          const radius = 160 + Math.random() * 40;
          nodeMap.set(otherName, {
            id: otherName,
            label: otherName,
            type: 'related',
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            weight: rel.strength,
          });
        }
      });

      setNodes(Array.from(nodeMap.values()));
      setEdges(relations);
      setLoading(false);
    } catch (err: any) {
      setError(`加载失败: ${err.message || '网络错误'}`);
      setLoading(false);
    }
  }, [centerX, centerY]);

  // 初始化
  useEffect(() => {
    if (entityName) {
      loadGraph(entityName);
    }
  }, [entityName, loadGraph]);

  // 力导向模拟
  useEffect(() => {
    if (nodes.length < 2) return;

    let frameId: number;
    let iter = 0;
    const maxIter = 120;
    const centerNode = nodes[0];

    const simulate = () => {
      iter++;
      const updated = nodes.map(n => ({ ...n }));

      // 节点间排斥力
      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const dx = updated[j].x - updated[i].x;
          const dy = updated[j].y - updated[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 20);
          const force = 600 / (dist * dist);
          const fx = dx / dist * force;
          const fy = dy / dist * force;
          updated[i].vx -= fx;
          updated[i].vy -= fy;
          updated[j].vx += fx;
          updated[j].vy += fy;
        }
      }

      // 中心节点固定
      updated[0].vx = 0;
      updated[0].vy = 0;
      updated[0].x = centerX;
      updated[0].y = centerY;

      // 边连接节点的吸引力
      for (const edge of edges) {
        const sourceIdx = updated.findIndex(n => n.id === edge.source);
        const targetIdx = updated.findIndex(n => n.id === edge.target);
        if (sourceIdx === -1 || targetIdx === -1) continue;

        const source = updated[sourceIdx];
        const target = updated[targetIdx];
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idealDist = 120;
        const force = (dist - idealDist) * 0.02 * edge.strength;
        const fx = dx / dist * force;
        const fy = dy / dist * force;

        if (sourceIdx !== 0) {
          source.vx += fx;
          source.vy += fy;
        }
        if (targetIdx !== 0) {
          target.vx -= fx;
          target.vy -= fy;
        }
      }

      // 更新其他节点
      for (let i = 1; i < updated.length; i++) {
        const n = updated[i];
        // 指向中心
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
        n.vx += dx / dist * 0.015;
        n.vy += dy / dist * 0.015;

        // 边界弹性
        const margin = 60;
        if (n.x < margin) n.vx += 0.5;
        if (n.x > canvasWidth - margin) n.vx -= 0.5;
        if (n.y < margin) n.vy += 0.5;
        if (n.y > canvasHeight - margin) n.vy -= 0.5;

        // 应用速度
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.88;
        n.vy *= 0.88;

        // 边界限制
        n.x = Math.max(40, Math.min(canvasWidth - 40, n.x));
        n.y = Math.max(40, Math.min(canvasHeight - 40, n.y));
      }

      setNodes(updated);

      if (iter < maxIter) {
        frameId = requestAnimationFrame(simulate);
      }
    };

    frameId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(frameId);
  }, [nodes.length > 0 ? JSON.stringify(nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))) : null, edges.length, centerX, centerY, canvasWidth, canvasHeight]);

  // 鼠标拖拽平移
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) * scale;
    const dy = (e.clientY - dragStart.y) * scale;
    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));
    setScale(newScale);
  };

  // 节点点击
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node.id);
    if (onNodeClick) {
      const relatedEdge = edges.find(
        e => e.source === entityInfo?.name || e.target === entityInfo?.name
      );
      onNodeClick(node.id);
    }
  };

  // 双击节点加载子图谱
  const handleNodeDoubleClick = (node: GraphNode) => {
    if (node.id !== entityName) {
      loadGraph(node.id);
      setSelectedNode(null);
    }
  };

  // 搜索实体
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const result = await wikiApi.searchEntities(query, 8);
      setSearchResults(result.items.filter(item => item.name !== entityName));
    } catch {
      setSearchResults([]);
    }
  };

  // 选择搜索结果
  const handleSelectSearchResult = (entity: EntityInfo) => {
    loadGraph(entity.name);
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults([]);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${fullscreen ? 'h-full' : 'h-64'}`}>
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-cyan" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted">正在构建知识图谱...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-red-500/20 bg-red-500/5 p-4 ${fullscreen ? 'h-full' : ''}`}>
        <div className="flex items-center gap-2 text-red-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={() => loadGraph(entityName)}
          className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`wiki-graph-shell relative ${fullscreen ? 'h-full min-h-[500px]' : ''}`}
    >
      {/* 头部工具栏 */}
      <div className="wiki-graph-toolbar mb-3 flex items-center justify-between gap-2">
        <div className="wiki-graph-summary flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-sm font-medium">实体图谱</span>
          {entityInfo && (
            <span className="inline-flex items-center rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
              {entityInfo.name}
            </span>
          )}
          <span className="text-xs text-muted">
            {nodes.length} 节点 / {edges.length} 关系
          </span>
        </div>

        <div className="wiki-graph-controls flex items-center gap-2">
          {/* 搜索框 */}
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
              title="搜索实体"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {showSearch && (
              <div className="absolute right-0 top-full mt-1 z-10 w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="搜索实体..."
                  className="input-surface w-full rounded-lg border bg-surface-elevated px-3 py-2 text-sm"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/50 bg-surface-elevated shadow-lg">
                    {searchResults.map(entity => (
                      <button
                        key={entity.id}
                        onClick={() => handleSelectSearchResult(entity)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLOR_MAP[entity.entity_type] || COLOR_MAP.related }}
                        />
                        <span className="flex-1 truncate">{entity.name}</span>
                        <span className="text-xs text-muted">{TYPE_LABELS[entity.entity_type] || entity.entity_type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 缩放控制 */}
          <div className="flex items-center gap-1 rounded-lg bg-surface-elevated px-1.5 py-1">
            <button
              onClick={() => setScale(s => Math.min(3, s * 1.2))}
              className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
              title="放大"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="min-w-[3rem] text-center text-xs text-muted">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.max(0.5, s * 0.8))}
              className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
              title="缩小"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={() => { setScale(1); setViewBox({ x: 0, y: 0, width: canvasWidth, height: canvasHeight }); }}
              className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
              title="重置视图"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
              title="关闭"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / scale} ${viewBox.height / scale}`}
        className={`wiki-graph-canvas w-full rounded-xl border border-border/50 ${fullscreen ? 'h-full' : 'h-[500px]'}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="graphGrid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.12" />
            <circle cx="18" cy="18" r="0.75" fill="currentColor" opacity="0.22" />
          </pattern>
          {/* 发光滤镜 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 渐变 */}
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor={COLOR_MAP[entityInfo?.entity_type || 'concept'] || COLOR_MAP.concept} stopOpacity="1" />
            <stop offset="100%" stopColor={COLOR_MAP[entityInfo?.entity_type || 'concept'] || COLOR_MAP.concept} stopOpacity="0.6" />
          </radialGradient>
        </defs>

        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width / scale}
          height={viewBox.height / scale}
          fill="url(#graphGrid)"
          className="text-cyan"
          pointerEvents="none"
        />

        {/* 连线 */}
        {edges.map((edge, i) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;
          const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target || selectedNode === edge.source || selectedNode === edge.target;
          return (
            <g key={`edge-${i}`}>
              {/* 透明点击区域 */}
              <line
                x1={source.x} y1={source.y}
                x2={target.x} y2={target.y}
                stroke="transparent"
                strokeWidth={12}
              />
              {/* 连线 */}
              <line
                x1={source.x} y1={source.y}
                x2={target.x} y2={target.y}
                stroke={isHighlighted ? '#38bdf8' : 'rgba(148,163,184,0.4)'}
                strokeWidth={isHighlighted ? 2.25 : 1}
                strokeDasharray={isHighlighted ? 'none' : '6,3'}
                opacity={isHighlighted ? 1 : 0.6}
                strokeLinecap="round"
              />
              {/* 关系标签 */}
              {edge.type !== 'relates_to' && (
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 6}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize="9"
                  opacity={isHighlighted ? 1 : 0.5}
                >
                  {TYPE_LABELS[edge.type] || edge.type}
                </text>
              )}
            </g>
          );
        })}

        {/* 节点 */}
        {nodes.map((node) => {
          const isCenter = node.id === entityName;
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;
          const color = COLOR_MAP[node.type] || COLOR_MAP.related;
          const baseRadius = isCenter ? 26 : 18;
          const radius = isHovered || isSelected ? baseRadius + 4 : baseRadius;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
              style={{ cursor: 'pointer' }}
            >
              {/* 外发光 */}
              {(isHovered || isSelected) && (
                <circle
                  cx={node.x} cy={node.y}
                  r={radius + 10}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  opacity={0.3}
                  filter="url(#glow)"
                />
              )}

              {/* 节点圆 */}
              <circle
                cx={node.x} cy={node.y}
                r={radius}
                fill={isCenter ? 'url(#centerGradient)' : color}
                fillOpacity={isHovered ? 0.95 : isCenter ? 0.85 : 0.75}
                stroke={color}
                strokeWidth={isCenter ? 3 : isSelected ? 2.5 : 2}
                filter={isHovered || isSelected ? 'url(#glow)' : undefined}
              />

              {/* 节点图标（中心节点） */}
              {isCenter && (
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {entityInfo?.name?.slice(0, 2) || '主'}
                </text>
              )}

              {/* 节点标签 */}
              <text
                x={node.x}
                y={node.y + radius + 16}
                textAnchor="middle"
                className={isHovered || isCenter ? 'fill-foreground' : 'fill-muted'}
                fontSize={isCenter ? '11' : isHovered ? '10.5' : '10'}
                fontWeight={isCenter ? 'bold' : 'normal'}
              >
                {node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 节点详情悬浮卡片 */}
      {hoveredNode && nodes.length > 0 && (
        <div className="wiki-graph-tooltip pointer-events-none absolute z-10 mt-1 w-48 rounded-lg border border-border/50 bg-surface-elevated p-3 shadow-lg">
          {(() => {
            const node = nodes.find(n => n.id === hoveredNode);
            if (!node) return null;
            return (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLOR_MAP[node.type] || COLOR_MAP.related }}
                  />
                  <span className="font-medium">{node.label}</span>
                </div>
                <p className="text-xs text-muted">
                  {TYPE_LABELS[node.type] || node.type}
                  {node.description && ` · ${node.description.slice(0, 30)}…`}
                </p>
                {node.id !== entityName && (
                  <p className="mt-1.5 text-xs text-cyan">双击展开关联图谱</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* 图例 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
        {Object.entries(TYPE_LABELS)
          .filter(([key]) => key !== 'related')
          .slice(0, 7)
          .map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLOR_MAP[key] || COLOR_MAP.related }}
              />
              {label}
            </span>
          ))}
        <span className="ml-auto text-xs text-muted/60">
          拖拽平移 · 滚轮缩放 · 双击节点展开
        </span>
      </div>
    </div>
  );
};

export default EntityGraph;

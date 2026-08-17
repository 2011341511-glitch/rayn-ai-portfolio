import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ApiErrorAlert,
  Card,
  ConfirmDialog,
  Drawer,
  InlineAlert,
  KnowledgeComparison,
  Loading,
} from '../components/common';
import {
  batchResolvePending,
  getPendingChange,
  listPendingChanges,
  type PendingChangeItem,
} from '../api/wiki';
import { getParsedApiError } from '../api/error';
import { formatDateTime } from '../utils/format';

type ChangeTypeFilter = 'all' | 'supplement' | 'contradiction' | 'new_link';
type StatusFilter = 'pending' | 'accepted' | 'rejected';

const CHANGE_TYPE_LABELS: Record<string, string> = {
  supplement: '补充',
  contradiction: '冲突',
  new_link: '新关联',
  merge: '合并',
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  supplement: 'text-cyan bg-cyan/10 border-cyan/30',
  contradiction: 'text-red-400 bg-red-400/10 border-red-400/30',
  new_link: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  merge: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

export default function WikiPendingPage() {
  const [changes, setChanges] = useState<PendingChangeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [changeTypeFilter, setChangeTypeFilter] = useState<ChangeTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedChange, setSelectedChange] = useState<PendingChangeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [batchConfirm, setBatchConfirm] = useState<{ action: 'accept' | 'reject'; count: number } | null>(null);

  const PAGE_SIZE = 20;

  const fetchChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPendingChanges(
        page,
        PAGE_SIZE,
        statusFilter !== 'pending' ? statusFilter : undefined,
        changeTypeFilter !== 'all' ? changeTypeFilter : undefined,
      );
      setChanges(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(getParsedApiError(e as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setLoading(false);
    }
  }, [page, changeTypeFilter, statusFilter]);

  useEffect(() => {
    void fetchChanges();
  }, [fetchChanges]);

  const handleView = async (changeId: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getPendingChange(changeId);
      setSelectedChange(detail);
    } catch (e) {
      setDetailError(getParsedApiError(e as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolve = async (changeId: number, action: 'accept' | 'reject') => {
    setActionLoading(changeId);
    try {
      await batchResolvePending({ change_ids: [changeId], action });
      await void fetchChanges();
    } catch (e) {
      setError(getParsedApiError(e as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatch = async (action: 'accept' | 'reject') => {
    if (!batchConfirm) return;
    setActionLoading(-1);
    try {
      await batchResolvePending({ action, topic: undefined });
      setBatchConfirm(null);
      await void fetchChanges();
    } catch (e) {
      setError(getParsedApiError(e as Parameters<typeof getParsedApiError>[0]));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptAll = () => {
    setBatchConfirm({ action: 'accept', count: total });
  };

  const handleRejectAll = () => {
    setBatchConfirm({ action: 'reject', count: total });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">待确认变更</h1>
          <p className="mt-1 text-sm text-muted">
            共 {total} 项待确认变更
            {statusFilter !== 'pending' && `（筛选：${statusFilter}）`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline text-sm"
            onClick={handleAcceptAll}
            disabled={total === 0 || actionLoading !== null}
          >
            一键接受全部
          </button>
          <button
            type="button"
            className="btn-outline text-sm text-red-400 border-red-400/30 hover:bg-red-400/10"
            onClick={handleRejectAll}
            disabled={total === 0 || actionLoading !== null}
          >
            一键拒绝全部
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {(['pending', 'accepted', 'rejected'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-cyan/20 text-cyan'
                  : 'text-muted hover:text-text'
              }`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s === 'pending' ? '待确认' : s === 'accepted' ? '已接受' : '已拒绝'}
            </button>
          ))}
        </div>
        {statusFilter === 'pending' && (
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {(['all', 'supplement', 'contradiction', 'new_link'] as ChangeTypeFilter[]).map((ct) => (
              <button
                key={ct}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  changeTypeFilter === ct
                    ? 'bg-cyan/20 text-cyan'
                    : 'text-muted hover:text-text'
                }`}
                onClick={() => { setChangeTypeFilter(ct); setPage(1); }}
              >
                {ct === 'all' ? '全部' : CHANGE_TYPE_LABELS[ct]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4">
          <ApiErrorAlert error={error} />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : changes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 py-16 text-center">
          <p className="text-muted">暂无待确认变更</p>
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((change) => (
            <ChangeCard
              key={change.id}
              change={change}
              onView={() => void handleView(change.id)}
              onAccept={() => void handleResolve(change.id, 'accept')}
              onReject={() => void handleResolve(change.id, 'reject')}
              loading={actionLoading === change.id}
              showActions={statusFilter === 'pending'}
            />
          ))}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                type="button"
                className="btn-outline text-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </button>
              <span className="flex items-center text-sm text-muted">
                {page} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                type="button"
                className="btn-outline text-sm"
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* Change Detail Drawer */}
      <Drawer
        isOpen={!!selectedChange || detailLoading}
        onClose={() => { setSelectedChange(null); setDetailError(null); }}
        title={`变更详情：${selectedChange?.title || '加载中...'}`}
      >
        {detailLoading && (
          <div className="flex justify-center py-12">
            <Loading label="加载详情..." />
          </div>
        )}

        {detailError && (
          <div className="mb-4">
            <InlineAlert type="error">{detailError}</InlineAlert>
          </div>
        )}

        {selectedChange && !detailLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`rounded border px-2 py-0.5 text-xs font-medium ${
                CHANGE_TYPE_COLORS[selectedChange.change_type] || ''
              }`}>
                {CHANGE_TYPE_LABELS[selectedChange.change_type] || selectedChange.change_type}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs ${
                selectedChange.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                selectedChange.status === 'accepted' ? 'bg-green-400/10 text-green-400' :
                'bg-red-400/10 text-red-400'
              }`}>
                {selectedChange.status === 'pending' ? '待确认' :
                 selectedChange.status === 'accepted' ? '已接受' : '已拒绝'}
              </span>
            </div>

            {selectedChange.wiki_topic && (
              <div>
                <p className="text-xs font-medium text-muted">主题</p>
                <p className="mt-0.5 text-sm text-text">{selectedChange.wiki_topic}</p>
              </div>
            )}

            {selectedChange.ai_reasoning && (
              <div>
                <p className="text-xs font-medium text-muted">AI 推理说明</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{selectedChange.ai_reasoning}</p>
              </div>
            )}

            {(selectedChange.new_knowledge || selectedChange.old_knowledge) && (
              <KnowledgeComparison
                oldKnowledge={selectedChange.old_knowledge}
                newKnowledge={selectedChange.new_knowledge}
              />
            )}

            {selectedChange.source_title && (
              <div>
                <p className="text-xs font-medium text-muted">来源</p>
                <p className="mt-0.5 text-sm text-muted">
                  [{selectedChange.source_type}] {selectedChange.source_title}
                </p>
              </div>
            )}

            <div className="text-xs text-muted">
              创建于 {formatDateTime(selectedChange.created_at)}
              {selectedChange.updated_at && selectedChange.updated_at !== selectedChange.created_at && (
                <> · 更新于 {formatDateTime(selectedChange.updated_at)}</>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Batch Confirm Dialog */}
      <ConfirmDialog
        open={!!batchConfirm}
        title={batchConfirm?.action === 'accept' ? '确认接受全部变更' : '确认拒绝全部变更'}
        message={
          batchConfirm
            ? `确定要${batchConfirm.action === 'accept' ? '接受' : '拒绝'}这 ${batchConfirm.count} 项变更吗？此操作不可撤销。`
            : ''
        }
        confirmLabel={batchConfirm?.action === 'accept' ? '确认接受' : '确认拒绝'}
        cancelLabel="取消"
        onConfirm={() => void handleBatch(batchConfirm!.action)}
        onCancel={() => setBatchConfirm(null)}
        loading={actionLoading === -1}
        destructive={batchConfirm?.action === 'reject'}
      />
    </div>
  );
}

// ==================== ChangeCard ====================

interface ChangeCardProps {
  change: PendingChangeItem;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
  showActions: boolean;
}

function ChangeCard({ change, onView, onAccept, onReject, loading, showActions }: ChangeCardProps) {
  const isContradiction = change.change_type === 'contradiction';

  return (
    <Card className={`p-4 ${isContradiction ? 'border-red-400/30' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${
              CHANGE_TYPE_COLORS[change.change_type] || ''
            }`}>
              {isContradiction ? '⚠️ 冲突' : CHANGE_TYPE_LABELS[change.change_type] || change.change_type}
            </span>
            {change.wiki_topic && (
              <span className="text-xs text-cyan">{change.wiki_topic}</span>
            )}
          </div>
          <h3 className="mb-1 truncate font-medium text-text">
            {change.title || '无标题'}
          </h3>
          {change.source_title && (
            <p className="mb-1.5 text-xs text-muted">
              来源：{change.source_title}
            </p>
          )}
          {change.ai_reasoning && (
            <p className="line-clamp-2 text-xs text-muted">{change.ai_reasoning}</p>
          )}
          <p className="mt-1.5 text-xs text-muted">
            {formatDateTime(change.created_at)}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className="btn-outline text-xs"
            onClick={onView}
          >
            查看
          </button>
          {showActions && (
            <>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={onAccept}
                disabled={loading}
              >
                {loading ? '处理中...' : '接受'}
              </button>
              {!isContradiction ? (
                <button
                  type="button"
                  className="btn-outline text-xs text-red-400"
                  onClick={onReject}
                  disabled={loading}
                >
                  拒绝
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-outline text-xs text-muted"
                  onClick={onReject}
                  disabled={loading}
                >
                  保留旧观点
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

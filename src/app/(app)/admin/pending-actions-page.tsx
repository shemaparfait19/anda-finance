'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge }  from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast }  from '@/hooks/use-toast';
import { ACTION_LABELS } from '@/lib/permissions';
import { processApproval } from './user-actions';
import type { PendingAction } from '@/lib/types';

function statusBadge(status: string) {
  if (status === 'approved') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Approved</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
}

function ActionCard({
  action,
  canApprove,
}: {
  action: PendingAction;
  canApprove: boolean;
}) {
  const { toast }    = useToast();
  const [expanded,   setExpanded]   = useState(false);
  const [comment,    setComment]    = useState('');
  const [processing, setProcessing] = useState<'approved' | 'rejected' | null>(null);

  const handle = async (decision: 'approved' | 'rejected') => {
    setProcessing(decision);
    const result = await processApproval(action.id, decision, comment || undefined);
    toast({
      title:       result.success ? (decision === 'approved' ? 'Approved' : 'Rejected') : 'Error',
      description: result.message,
      variant:     result.success ? 'default' : 'destructive',
    });
    setProcessing(null);
  };

  const approvalCount = action.approvals.filter((a) => a.decision === 'approved').length;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {ACTION_LABELS[action.actionType] ?? action.actionType}
            </span>
            {statusBadge(action.status)}
          </div>
          <p className="text-xs text-muted-foreground">
            Initiated by <span className="font-medium text-foreground">{action.initiatedByName}</span>
            {' · '}
            {new Date(action.initiatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground p-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3">
          {/* Action data */}
          <div className="rounded-md bg-muted/60 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Action Details</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {Object.entries(action.actionData).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="font-medium truncate">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Approvals so far */}
          {action.approvals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Approvals ({approvalCount} / {action.requiredApprovals})
              </p>
              {action.approvals.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs py-1">
                  {a.decision === 'approved'
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                  <span className="font-medium">{a.approverName}</span>
                  <span className="text-muted-foreground">— {new Date(a.decidedAt).toLocaleString()}</span>
                  {a.comment && <span className="text-muted-foreground italic">"{a.comment}"</span>}
                </div>
              ))}
            </div>
          )}

          {/* Approve / Reject controls */}
          {action.status === 'pending' && canApprove && (
            <div className="space-y-2 pt-1">
              <Textarea
                placeholder="Optional comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-sm resize-none h-16"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!!processing}
                  onClick={() => handle('approved')}
                >
                  {processing === 'approved'
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  disabled={!!processing}
                  onClick={() => handle('rejected')}
                >
                  {processing === 'rejected'
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <XCircle className="h-3.5 w-3.5" />}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface PendingActionsPageProps {
  actions: PendingAction[];
  canApprove: boolean;
}

export default function PendingActionsPage({ actions, canApprove }: PendingActionsPageProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const filtered = filter === 'all' ? actions : actions.filter((a) => a.status === filter);
  const pendingCount = actions.filter((a) => a.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              Pending Approvals
              {pendingCount > 0 && (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                  {pendingCount} waiting
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve or reject actions submitted by Makers.
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                className="h-7 text-xs capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">
            No {filter === 'all' ? '' : filter} actions.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <ActionCard key={a.id} action={a} canApprove={canApprove} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

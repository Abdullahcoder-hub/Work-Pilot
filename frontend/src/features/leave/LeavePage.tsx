import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, CalendarClock, Check, X, Ban } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useLeaveBalance, useLeaveRequests, useReviewLeaveRequest, useCancelLeaveRequest } from './useLeave';
import { LeaveRequestModal } from './LeaveRequestModal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { LeaveRequest } from '../../types';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const TYPE_LABEL: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  unpaid: 'Unpaid',
  other: 'Other',
};

function nameOf(entity: LeaveRequest['userId']): string {
  return typeof entity === 'object' ? entity.name : 'Unknown';
}

export function LeavePage() {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('company_admin', 'team_lead');
  const [tab, setTab] = useState<'mine' | 'approvals'>('mine');
  const [requestOpen, setRequestOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: balance } = useLeaveBalance();
  const { data: list, isLoading } = useLeaveRequests(tab === 'approvals' ? { status: 'pending' } : { userId: user?._id });

  const review = useReviewLeaveRequest();
  const cancel = useCancelLeaveRequest();

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    try {
      await review.mutateAsync({ id, status, reviewNote: reviewNote || undefined });
      toast.success(status === 'approved' ? 'Request approved' : 'Request rejected');
      setReviewingId(null);
      setReviewNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function handleCancel(request: LeaveRequest) {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await cancel.mutateAsync(request._id);
      toast.success('Request cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Leave</h1>
          <p className="mt-0.5 text-sm text-slate-500">Request time off and track your balance.</p>
        </div>
        <button className="btn-primary" onClick={() => setRequestOpen(true)}>
          <Plus size={16} /> Request leave
        </button>
      </div>

      {balance && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {balance.map((b) => (
            <div key={b.leaveType} className="card p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{TYPE_LABEL[b.leaveType]}</div>
              {b.allocated === null ? (
                <div className="mt-1 text-sm text-slate-500">No limit</div>
              ) : (
                <>
                  <div className="mt-1 text-xl font-semibold text-slate-800">
                    {b.remaining}
                    <span className="text-sm font-normal text-slate-400"> / {b.allocated}</span>
                  </div>
                  <div className="text-xs text-slate-400">days remaining</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isManager && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab('mine')}
            className={clsx('btn-secondary !py-1.5 text-xs', tab === 'mine' && '!border-brand-400 !bg-brand-50 !text-brand-700')}
          >
            My requests
          </button>
          <button
            onClick={() => setTab('approvals')}
            className={clsx('btn-secondary !py-1.5 text-xs', tab === 'approvals' && '!border-brand-400 !bg-brand-50 !text-brand-700')}
          >
            Pending approvals
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !list || list.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={tab === 'approvals' ? 'Nothing pending' : 'No leave requests yet'}
          description={tab === 'approvals' ? 'You are all caught up.' : 'Request time off whenever you need it.'}
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((request) => {
            const isOwner = (typeof request.userId === 'object' ? request.userId._id : request.userId) === user?._id;
            const canCancel = isOwner && (request.status === 'pending' || (request.status === 'approved' && request.startDate >= new Date().toISOString().slice(0, 10)));

            return (
              <div key={request._id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={clsx('badge', STATUS_BADGE[request.status])}>{request.status}</span>
                      <span className="text-sm font-semibold text-slate-800">{TYPE_LABEL[request.leaveType]} leave</span>
                      {tab === 'approvals' && <span className="text-sm text-slate-500">· {nameOf(request.userId)}</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.startDate} – {request.endDate}
                    </p>
                    {request.reason && <p className="mt-1 text-sm text-slate-600">"{request.reason}"</p>}
                    {request.status !== 'pending' && request.reviewNote && (
                      <p className="mt-1 text-xs text-slate-400">Note: {request.reviewNote}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    {tab === 'approvals' && request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => (reviewingId === request._id ? handleReview(request._id, 'approved') : setReviewingId(request._id))}
                          className="btn-secondary !px-2.5 !py-1.5 text-xs hover:!bg-emerald-50 hover:!text-emerald-700"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReview(request._id, 'rejected')}
                          className="btn-secondary !px-2.5 !py-1.5 text-xs hover:!bg-rose-50 hover:!text-rose-700"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    {canCancel && (
                      <button onClick={() => handleCancel(request)} className="btn-ghost !px-2.5 !py-1.5 text-xs">
                        <Ban size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {reviewingId === request._id && (
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <input
                      className="input flex-1 !py-1.5 text-sm"
                      placeholder="Optional note for the approval..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                    <button onClick={() => handleReview(request._id, 'approved')} className="btn-primary !py-1.5 text-xs">
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <LeaveRequestModal isOpen={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}

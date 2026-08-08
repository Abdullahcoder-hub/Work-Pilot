import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';
import { api } from '../../lib/api';
import { ApiResponse, Company, Pagination } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

async function fetchCompanies() {
  const { data } = await api.get<ApiResponse<Company[]> & { pagination: Pagination }>('/platform/companies');
  return data.data;
}

async function setStatus(companyId: string, status: 'active' | 'suspended') {
  const { data } = await api.patch<ApiResponse<Company>>(`/platform/companies/${companyId}/status`, { status });
  return data.data;
}

async function setPlan(companyId: string, plan: Company['plan']) {
  const { data } = await api.patch<ApiResponse<Company>>(`/platform/companies/${companyId}/plan`, { plan });
  return data.data;
}

export function PlatformPage() {
  const queryClient = useQueryClient();
  const { data: companies, isLoading } = useQuery({ queryKey: ['platform', 'companies'], queryFn: fetchCompanies });
  const [busyId, setBusyId] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) => setStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform', 'companies'] }),
  });
  const planMutation = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: Company['plan'] }) => setPlan(id, plan),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform', 'companies'] }),
  });

  async function handleStatusToggle(company: Company) {
    setBusyId(company._id);
    try {
      await statusMutation.mutateAsync({ id: company._id, status: company.status === 'active' ? 'suspended' : 'active' });
      toast.success(company.status === 'active' ? 'Company suspended' : 'Company reactivated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePlanChange(company: Company, plan: Company['plan']) {
    setBusyId(company._id);
    try {
      await planMutation.mutateAsync({ id: company._id, plan });
      toast.success(`Plan updated to ${plan}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Platform admin</h1>
        <p className="mt-0.5 text-sm text-slate-500">Every tenant workspace on WorkPilot — visible only to super admins.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !companies || companies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies yet" description="Workspaces will appear here as teams sign up." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((company) => (
                <tr key={company._id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{company.name}</div>
                    <div className="text-xs text-slate-500">/{company.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {company.userCount ?? 0} / {company.seatLimit}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="input w-auto !py-1 text-xs"
                      value={company.plan}
                      disabled={busyId === company._id}
                      onChange={(e) => handlePlanChange(company, e.target.value as Company['plan'])}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${company.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="btn-ghost !px-2 !py-1 text-xs"
                      disabled={busyId === company._id}
                      onClick={() => handleStatusToggle(company)}
                    >
                      {company.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

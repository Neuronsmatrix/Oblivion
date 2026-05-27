import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, casesApi, labsApi } from '../../lib/api/endpoints';
import { isInFlight } from '../../lib/queryClient';
import type { BatchItem, CaseWithDiagnoses } from '../../lib/api/types';

// The API has no "list batches" endpoint, so we remember the ids this client
// has created. Keyed per lab user so switching accounts stays clean.
const KEY = (labId: string) => `pg_batches_${labId}`;

export interface StoredBatch { id: string; total: number; created_at: string }

export const batchStore = {
  list(labId: string): StoredBatch[] {
    try { return JSON.parse(localStorage.getItem(KEY(labId)) ?? '[]'); } catch { return []; }
  },
  add(labId: string, batch: StoredBatch) {
    const next = [batch, ...this.list(labId).filter((b) => b.id !== batch.id)];
    localStorage.setItem(KEY(labId), JSON.stringify(next));
  },
};

export function useSubmitBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageKeys: string[]) => labsApi.submitBatch(imageKeys),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage'] }),
  });
}

export function useBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['batch', id],
    queryFn: () => labsApi.results(id!),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data && isInFlight(q.state.data.batch.status) ? 2000 : false),
  });
}

/**
 * Per-item results: each completed BatchItem links to a case whose diagnoses
 * are the analysis result. Fetch them keyed by case_id.
 */
export function useBatchItemResults(items: BatchItem[]) {
  const ids = items.filter((it) => it.status === 'completed' && it.case_id).map((it) => it.case_id!);
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['case', id],
      queryFn: () => casesApi.get(id),
      staleTime: 60_000,
    })),
  });
  const byCaseId: Record<string, CaseWithDiagnoses> = {};
  queries.forEach((q, i) => {
    if (q.data) byCaseId[ids[i]] = q.data;
  });
  return byCaseId;
}

export function useUsage() {
  return useQuery({ queryKey: ['usage'], queryFn: () => labsApi.usage() });
}

export function useTiers() {
  return useQuery({ queryKey: ['tiers'], queryFn: () => labsApi.tiers() });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labId, planId }: { labId: string; planId: string }) => billingApi.subscribe(labId, planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage'] }),
  });
}

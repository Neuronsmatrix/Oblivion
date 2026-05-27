import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '../../lib/api/endpoints';
import { isInFlight } from '../../lib/queryClient';
import type { CreateCaseRequest } from '../../lib/api/types';

export function useCases(offset: number, limit = 20) {
  return useQuery({
    queryKey: ['cases', { offset, limit }],
    queryFn: () => casesApi.list({ offset, limit }),
  });
}

export function useCase(id: string | undefined) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: () => casesApi.get(id!),
    enabled: !!id,
    // Poll while the analysis is still running.
    refetchInterval: (q) => (q.state.data && isInFlight(q.state.data.status) ? 2000 : false),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCaseRequest) => casesApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

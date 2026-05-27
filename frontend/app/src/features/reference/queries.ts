import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '../../lib/api/endpoints';

export function useSyndromes(search: string) {
  return useQuery({
    queryKey: ['syndromes', search],
    queryFn: () => referenceApi.syndromes({ search: search || undefined, limit: 50 }),
  });
}

export function useSyndrome(id: string | undefined) {
  return useQuery({
    queryKey: ['syndrome', id],
    queryFn: () => referenceApi.syndrome(id!),
    enabled: !!id,
  });
}

export function useHpoSearch(q: string) {
  return useQuery({
    queryKey: ['hpo', q],
    queryFn: () => referenceApi.hpoSearch(q),
    enabled: q.trim().length >= 2,
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api/endpoints';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 50 }),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

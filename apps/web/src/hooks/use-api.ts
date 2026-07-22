'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse, PaginatedResponse } from '@/lib/api';

interface UseApiOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: UseApiOptions,
) {
  return useQuery({
    queryKey: key,
    queryFn: () => api.get<ApiResponse<T>>(endpoint),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 30_000,
  });
}

export function useApiPaginatedQuery<T>(
  key: string[],
  endpoint: string,
  params?: Record<string, string | number>,
  options?: UseApiOptions,
) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      searchParams.set(k, String(v));
    });
  }
  const query = searchParams.toString();
  const url = query ? `${endpoint}?${query}` : endpoint;

  return useQuery({
    queryKey: [...key, params],
    queryFn: () => api.get<ApiResponse<PaginatedResponse<T>>>(url),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 30_000,
  });
}

export function useApiMutation<TData, TVariables>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  invalidateKeys?: string[][],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      switch (method) {
        case 'POST':
          return api.post<TData>(endpoint, variables);
        case 'PUT':
          return api.put<TData>(endpoint, variables);
        case 'PATCH':
          return api.patch<TData>(endpoint, variables);
        case 'DELETE':
          return api.delete<TData>(endpoint);
      }
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
  });
}

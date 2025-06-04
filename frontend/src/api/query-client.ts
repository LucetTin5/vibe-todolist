import { QueryClient } from "@tanstack/react-query";
import type { GetTodosParams } from "./model";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

export const QUERY_KEYS = {
  todos: {
    all: ["todos"] as const,
    lists: () => [...QUERY_KEYS.todos.all, "list"] as const,
    list: (filters?: GetTodosParams) =>
      [...QUERY_KEYS.todos.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.todos.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.todos.details(), id] as const,
    stats: () => [...QUERY_KEYS.todos.all, "stats"] as const,
  },
} as const;

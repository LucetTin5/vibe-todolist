// Re-export generated API hooks for convenience
export {
  useGetTodos as useTodos,
  useGetTodosId as useTodo,
  useGetTodosStats as useTodoStats,
  usePostTodos as useCreateTodo,
  usePutTodosId as useUpdateTodo,
  usePatchTodosIdToggle as useToggleTodo,
  useDeleteTodosId as useDeleteTodo,
} from "../api/generated";

// Export query keys from the generated API
export { getGetTodosQueryKey as getTodosQueryKey } from "../api/generated";

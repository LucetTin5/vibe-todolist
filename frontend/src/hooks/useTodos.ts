// Re-export generated API hooks for convenience
export {
  useGetApiTodos as useTodos,
  useGetApiTodosId as useTodo,
  useGetApiTodosStats as useTodoStats,
  useGetApiTodosTags as useTodoTags,
  usePostApiTodos as useCreateTodo,
  usePutApiTodosId as useUpdateTodo,
  usePatchApiTodosIdToggle as useToggleTodo,
  useDeleteApiTodosId as useDeleteTodo,
  useDeleteApiTodos as useDeleteAllTodos,
  usePatchApiTodosBulk as useBulkUpdateTodos,
} from '../api/generated'

// Export query keys from the generated API
export { 
  getGetApiTodosQueryKey as getTodosQueryKey,
  getGetApiTodosIdQueryKey as getTodoQueryKey,
  getGetApiTodosStatsQueryKey as getTodoStatsQueryKey,
  getGetApiTodosTagsQueryKey as getTodoTagsQueryKey,
} from '../api/generated'

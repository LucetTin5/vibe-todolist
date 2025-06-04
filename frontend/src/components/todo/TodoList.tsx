import { useState } from "react";
import { Button } from "../ui";
import { TodoItem } from "./TodoItem";
import { TodoForm } from "./TodoForm";
import type {
  GetTodos200TodosItem,
  PostTodosBody,
  GetTodosParams,
} from "../../api/model";

export interface TodoListProps {
  todos: GetTodos200TodosItem[];
  filters: GetTodosParams;
  onFiltersChange: (filters: GetTodosParams) => void;
  onToggleTodo: (id: string) => void;
  onCreateTodo: (todo: PostTodosBody) => void;
  onUpdateTodo: (todo: { id: string } & PostTodosBody) => void;
  onDeleteTodo: (id: string) => void;
  isLoading?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  togglingIds?: string[];
  deletingIds?: string[];
}

export function TodoList({
  todos,
  filters,
  onFiltersChange,
  onToggleTodo,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  isLoading = false,
  isCreating = false,
  isUpdating = false,
  togglingIds = [],
  deletingIds = [],
}: TodoListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<GetTodos200TodosItem | null>(
    null
  );

  const handleCreateTodo = (todoData: PostTodosBody) => {
    onCreateTodo(todoData);
    setIsFormOpen(false);
  };

  const handleUpdateTodo = (todoData: PostTodosBody) => {
    if (editingTodo) {
      onUpdateTodo({ id: editingTodo.id, ...todoData });
      setEditingTodo(null);
    }
  };

  const handleEditTodo = (todo: GetTodos200TodosItem) => {
    setEditingTodo(todo);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTodo(null);
  };

  const filteredTodos = todos.filter((todo) => {
    if (
      filters.search &&
      !todo.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !todo.description?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  const completedTodos = filteredTodos.filter((todo) => todo.completed);
  const pendingTodos = filteredTodos.filter((todo) => !todo.completed);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={`skeleton-loading-${Date.now()}-${i}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Todos ({filteredTodos.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pendingTodos.length} pending, {completedTodos.length} completed
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add Todo</Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search todos..."
              value={filters.search || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({})}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No todos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {todos.length === 0
              ? "Get started by creating your first todo."
              : "No todos match your current filters."}
          </p>
          {todos.length === 0 && (
            <div className="mt-6">
              <Button onClick={() => setIsFormOpen(true)}>Create Todo</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending Todos */}
          {pendingTodos.length > 0 && (
            <div className="space-y-3">
              {pendingTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggleTodo}
                  onEdit={handleEditTodo}
                  onDelete={onDeleteTodo}
                  isToggling={togglingIds.includes(todo.id)}
                  isDeleting={deletingIds.includes(todo.id)}
                />
              ))}
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div className="space-y-3">
              {pendingTodos.length > 0 && (
                <div className="flex items-center gap-2 pt-6">
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
                    Completed ({completedTodos.length})
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                </div>
              )}
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggleTodo}
                  onEdit={handleEditTodo}
                  onDelete={onDeleteTodo}
                  isToggling={togglingIds.includes(todo.id)}
                  isDeleting={deletingIds.includes(todo.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Todo Form Modal */}
      <TodoForm
        isOpen={isFormOpen || !!editingTodo}
        onClose={handleCloseForm}
        onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
        initialData={editingTodo || undefined}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}

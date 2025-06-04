import { useState } from "react";
import { TodoList } from "./components/todo";
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodo,
  useDeleteTodo,
} from "./hooks/useTodos";
import type { GetTodosParams, PostTodosBody } from "./api/model";

function App() {
  const [filters, setFilters] = useState<GetTodosParams>({});

  // Queries and Mutations
  const { data: todosResponse, isLoading } = useTodos(filters);
  const todos = todosResponse?.data?.todos || [];
  const createTodoMutation = useCreateTodo();
  const updateTodoMutation = useUpdateTodo();
  const toggleTodoMutation = useToggleTodo();
  const deleteTodoMutation = useDeleteTodo();

  // Event Handlers
  const handleCreateTodo = (todoData: PostTodosBody) => {
    createTodoMutation.mutate({ data: todoData });
  };

  const handleUpdateTodo = (todoData: { id: string } & PostTodosBody) => {
    const { id, ...data } = todoData;
    updateTodoMutation.mutate({ id, data });
  };

  const handleToggleTodo = (id: string) => {
    toggleTodoMutation.mutate({ id });
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodoMutation.mutate({ id });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            TodoList
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Modern Todo Management Application
          </p>
        </header>

        <main>
          <TodoList
            todos={todos}
            filters={filters}
            onFiltersChange={setFilters}
            onToggleTodo={handleToggleTodo}
            onCreateTodo={handleCreateTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
            isLoading={isLoading}
            isCreating={createTodoMutation.isPending}
            isUpdating={updateTodoMutation.isPending}
            togglingIds={
              toggleTodoMutation.isPending && toggleTodoMutation.variables
                ? [toggleTodoMutation.variables.id]
                : []
            }
            deletingIds={
              deleteTodoMutation.isPending && deleteTodoMutation.variables
                ? [deleteTodoMutation.variables.id]
                : []
            }
          />
        </main>
      </div>
    </div>
  );
}

export default App;

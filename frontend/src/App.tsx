import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-responsive py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            TodoList
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Modern Todo Management Application
          </p>
        </header>

        <main className="max-w-md mx-auto">
          <div className="card-base p-6 text-center">
            <button
              type="button"
              onClick={() => setCount((count) => count + 1)}
              className="btn-base bg-blue-600 hover:bg-blue-700 text-white mb-4"
            >
              count is {count}
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              TailwindCSS v4 is working! Edit{" "}
              <code className="text-blue-600 dark:text-blue-400">
                src/App.tsx
              </code>{" "}
              to start building.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

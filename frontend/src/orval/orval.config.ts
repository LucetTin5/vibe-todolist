import { defineConfig } from 'orval'

export default defineConfig({
  todoApi: {
    input: {
      target: 'http://localhost:3300/openapi.json',
    },
    output: {
      workspace: '../api',
      target: './generated.ts',
      schemas: './model',
      client: 'react-query',
      mode: 'split',
      clean: true,
      override: {
        mutator: {
          path: '../orval/mutator.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'bun run format',
    },
  },
})

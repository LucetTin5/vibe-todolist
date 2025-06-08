import { defineConfig } from 'orval'

export default defineConfig({
  'todolist-api': {
    input: {
      target: 'http://localhost:3300/openapi.json',
    },
    output: {
      target: 'src/api/generated.ts',
      mode: 'split',
      client: 'react-query',
      httpClient: 'axios',
      mock: false,
      override: {
        mutator: {
          path: 'src/orval/mutator.ts',
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
      afterAllFilesWrite: 'bun run type-check',
    },
  },
})

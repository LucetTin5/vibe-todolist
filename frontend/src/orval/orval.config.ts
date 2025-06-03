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
    },
    hooks: {
      afterAllFilesWrite: 'bun run format',
    },
  },
})

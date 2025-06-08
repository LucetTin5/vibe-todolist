import { describe, test, expect, beforeEach } from 'bun:test'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { todoRoutes } from '../routes/todos'
import { InMemoryStorage } from '../utils/in-memory-storage'
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../schemas/todo.schemas'

describe('Todo API Routes', () => {
  let app: OpenAPIHono
  let storage: InMemoryStorage

  beforeEach(() => {
    // 테스트용 앱 설정
    app = new OpenAPIHono()
    app.use('*', cors())
    app.route('/', todoRoutes)

    // 스토리지 초기화
    storage = InMemoryStorage.getInstance()
    storage.clear()
  })

  describe('POST /api/todos', () => {
    test('Enhanced 필드와 함께 Todo를 생성할 수 있다', async () => {
      const requestBody: CreateTodoRequest = {
        title: '새로운 할일',
        description: '할일 설명',
        priority: 'high',
        category: 'work',
        dueDate: '2025-06-10T09:00:00.000Z',
        tags: ['프로젝트', '중요'],
        estimatedMinutes: 120,
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(201)

      const todo = await response.json()
      expect(todo.title).toBe(requestBody.title)
      expect(todo.description).toBe(requestBody.description)
      expect(todo.priority).toBe(requestBody.priority)
      expect(todo.category).toBe(requestBody.category)
      expect(todo.dueDate).toBe(requestBody.dueDate)
      expect(todo.tags).toEqual(requestBody.tags)
      expect(todo.estimatedMinutes).toBe(requestBody.estimatedMinutes)
      expect(todo.completed).toBe(false)
      expect(todo.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(new Date(todo.createdAt)).toBeInstanceOf(Date)
      expect(new Date(todo.updatedAt)).toBeInstanceOf(Date)
    })

    test('기본값으로 Todo를 생성할 수 있다', async () => {
      const requestBody: CreateTodoRequest = {
        title: '간단한 할일',
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(201)

      const todo = await response.json()
      expect(todo.title).toBe(requestBody.title)
      expect(todo.priority).toBe('medium') // 기본값
      expect(todo.category).toBe('other') // 기본값
      expect(todo.tags).toEqual([]) // 기본값
      expect(todo.description).toBeUndefined()
      expect(todo.dueDate).toBeUndefined()
    })

    test('잘못된 우선순위로 생성하면 400 에러가 발생한다', async () => {
      const requestBody = {
        title: '할일',
        priority: 'invalid_priority',
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
    })

    test('잘못된 카테고리로 생성하면 400 에러가 발생한다', async () => {
      const requestBody = {
        title: '할일',
        category: 'invalid_category',
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
    })

    test('잘못된 날짜 형식으로 생성하면 400 에러가 발생한다', async () => {
      const requestBody = {
        title: '할일',
        dueDate: '2025-06-10', // ISO 형식이 아님
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/todos - Enhanced 필터링', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      const testTodos: CreateTodoRequest[] = [
        {
          title: 'Work Task 1',
          description: 'Important project task',
          priority: 'high',
          category: 'work',
          tags: ['project', 'important'],
          dueDate: '2025-06-15T09:00:00.000Z',
        },
        {
          title: 'Personal Task 1',
          description: 'Personal development',
          priority: 'medium',
          category: 'personal',
          tags: ['learning'],
          dueDate: '2025-06-20T10:00:00.000Z',
        },
        {
          title: 'Shopping Task',
          description: 'Buy groceries',
          priority: 'low',
          category: 'shopping',
          tags: ['shopping'],
          dueDate: '2025-06-10T08:00:00.000Z',
        },
        {
          title: 'Urgent Health Task',
          description: 'Doctor appointment',
          priority: 'urgent',
          category: 'health',
          tags: ['health', 'urgent'],
          dueDate: '2025-06-08T14:00:00.000Z',
        },
        {
          title: 'Other Task',
          description: 'Miscellaneous task',
          priority: 'medium',
          category: 'other',
          tags: [],
        },
      ]

      for (const todoData of testTodos) {
        await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todoData),
        })
      }
    })

    test('우선순위로 필터링할 수 있다', async () => {
      const response = await app.request('/api/todos?priority=high')

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos).toHaveLength(1)
      expect(result.todos[0].priority).toBe('high')
    })

    test('카테고리로 필터링할 수 있다', async () => {
      const response = await app.request('/api/todos?category=work')

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos).toHaveLength(1)
      expect(result.todos[0].category).toBe('work')
    })

    test('태그로 검색할 수 있다', async () => {
      const response = await app.request('/api/todos?search=project')

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos).toHaveLength(1)
      expect(result.todos[0].tags).toContain('project')
    })

    test('정렬 기능이 동작한다', async () => {
      const titleAscResponse = await app.request('/api/todos?sortBy=title&sortOrder=asc')
      expect(titleAscResponse.status).toBe(200)

      const titleAscResult = await titleAscResponse.json()
      const titles = titleAscResult.todos.map((todo: Todo) => todo.title)
      const sortedTitles = [...titles].sort()
      expect(titles).toEqual(sortedTitles)

      const priorityDescResponse = await app.request('/api/todos?sortBy=priority&sortOrder=desc')
      expect(priorityDescResponse.status).toBe(200)

      const priorityResult = await priorityDescResponse.json()
      const priorities = priorityResult.todos.map((todo: Todo) => todo.priority)
      // urgent(4) > high(3) > medium(2) > low(1) 순서
      expect(priorities[0]).toBe('urgent')
    })

    test('마감일 범위로 필터링할 수 있다', async () => {
      const response = await app.request(
        '/api/todos?dueDateFrom=2025-06-01T00:00:00.000Z&dueDateTo=2025-06-15T23:59:59.999Z'
      )

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos.length).toBeGreaterThan(0)

      for (const todo of result.todos) {
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate)
          expect(dueDate >= new Date('2025-06-01T00:00:00.000Z')).toBe(true)
          expect(dueDate <= new Date('2025-06-15T23:59:59.999Z')).toBe(true)
        }
      }
    })

    test('여러 필터를 조합할 수 있다', async () => {
      const response = await app.request(
        '/api/todos?filter=active&priority=high&category=work&search=project'
      )

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos).toHaveLength(1)
      const todo = result.todos[0]
      expect(todo.completed).toBe(false)
      expect(todo.priority).toBe('high')
      expect(todo.category).toBe('work')
      expect(todo.description).toContain('project')
    })

    test('잘못된 필터 값은 400 에러가 발생한다', async () => {
      const invalidQueries = [
        '?priority=invalid',
        '?category=invalid',
        '?filter=invalid',
        '?sortBy=invalid',
        '?sortOrder=invalid',
        '?page=0',
        '?limit=101',
      ]

      for (const query of invalidQueries) {
        const response = await app.request(`/api/todos${query}`)
        expect(response.status).toBe(400)
      }
    })
  })

  describe('PUT /api/todos/:id - Enhanced 업데이트', () => {
    test('Enhanced 필드들을 업데이트할 수 있다', async () => {
      // Todo 생성
      const createResponse = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '원본 제목',
          priority: 'low',
          category: 'other',
        }),
      })
      const created = await createResponse.json()

      const updateData: UpdateTodoRequest = {
        title: '수정된 제목',
        priority: 'urgent',
        category: 'work',
        dueDate: '2025-06-10T09:00:00.000Z',
        tags: ['new', 'updated'],
        estimatedMinutes: 90,
        completed: true,
      }

      const response = await app.request(`/api/todos/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)

      const updated = await response.json()
      expect(updated.title).toBe(updateData.title)
      expect(updated.priority).toBe(updateData.priority)
      expect(updated.category).toBe(updateData.category)
      expect(updated.dueDate).toBe(updateData.dueDate)
      expect(updated.tags).toEqual(updateData.tags)
      expect(updated.estimatedMinutes).toBe(updateData.estimatedMinutes)
      expect(updated.completed).toBe(updateData.completed)
    })

    test('부분 업데이트가 가능하다', async () => {
      // Todo 생성
      const createResponse = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '원본 제목',
          description: '원본 설명',
          priority: 'low',
          category: 'personal',
        }),
      })
      const created = await createResponse.json()

      const partialUpdate = { completed: true, priority: 'high' }

      const response = await app.request(`/api/todos/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate),
      })

      expect(response.status).toBe(200)

      const updated = await response.json()
      expect(updated.title).toBe('원본 제목') // 변경되지 않음
      expect(updated.description).toBe('원본 설명') // 변경되지 않음
      expect(updated.category).toBe('personal') // 변경되지 않음
      expect(updated.completed).toBe(true) // 변경됨
      expect(updated.priority).toBe('high') // 변경됨
    })
  })

  describe('GET /api/todos/stats - Enhanced 통계', () => {
    beforeEach(async () => {
      // 통계 테스트용 데이터 생성
      const testData = [
        { title: 'Work 1', priority: 'high', category: 'work' },
        { title: 'Work 2', priority: 'medium', category: 'work' },
        { title: 'Personal 1', priority: 'low', category: 'personal' },
        {
          title: 'Shopping 1',
          priority: 'urgent',
          category: 'shopping',
          dueDate: '2025-06-05T00:00:00.000Z',
        },
        {
          title: 'Health 1',
          priority: 'medium',
          category: 'health',
          dueDate: new Date().toISOString(),
        },
      ]

      const createdTodos = []
      for (const data of testData) {
        const response = await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const todo = await response.json()
        createdTodos.push(todo)
      }

      // 첫 번째와 세 번째 Todo 완료 처리
      const updateData: UpdateTodoRequest = { completed: true }

      await app.request(`/api/todos/${createdTodos[0].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      await app.request(`/api/todos/${createdTodos[2].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    })

    test('확장된 통계를 조회할 수 있다', async () => {
      const response = await app.request('/api/todos/stats')

      expect(response.status).toBe(200)

      const stats = await response.json()
      expect(stats.total).toBe(5)
      expect(stats.completed).toBe(2)
      expect(stats.active).toBe(3)
      expect(stats.completionRate).toBeCloseTo(40.0)

      // 우선순위별 통계
      expect(stats.byPriority).toBeDefined()
      expect(stats.byPriority.low).toBe(1)
      expect(stats.byPriority.medium).toBe(2)
      expect(stats.byPriority.high).toBe(1)
      expect(stats.byPriority.urgent).toBe(1)

      // 카테고리별 통계
      expect(stats.byCategory).toBeDefined()
      expect(stats.byCategory.work).toBe(2)
      expect(stats.byCategory.personal).toBe(1)
      expect(stats.byCategory.shopping).toBe(1)
      expect(stats.byCategory.health).toBe(1)
      expect(stats.byCategory.other).toBe(0)

      // 마감일 관련 통계
      expect(stats.overdue).toBeDefined()
      expect(stats.dueToday).toBeDefined()
      expect(stats.dueThisWeek).toBeDefined()
    })
  })

  describe('PATCH /api/todos/bulk - 대량 업데이트', () => {
    test('여러 Todo를 한 번에 업데이트할 수 있다', async () => {
      // 3개의 Todo 생성
      const todo1Response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 1' }),
      })
      const todo1 = await todo1Response.json()

      const todo2Response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 2' }),
      })
      const todo2 = await todo2Response.json()

      const todo3Response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 3' }),
      })
      const todo3 = await todo3Response.json()

      const bulkUpdateData = {
        ids: [todo1.id, todo2.id, todo3.id],
        data: { completed: true, priority: 'high' },
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.updatedTodos).toHaveLength(3)

      for (const todo of result.updatedTodos) {
        expect(todo.completed).toBe(true)
        expect(todo.priority).toBe('high')
      }
    })

    test('빈 ID 배열로 요청하면 빈 결과를 반환한다', async () => {
      const bulkUpdateData = {
        ids: [],
        data: { completed: true },
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.updatedTodos).toHaveLength(0)
    })
  })

  describe('GET /api/todos/tags - 태그 관리', () => {
    test('사용된 태그 목록을 조회할 수 있다', async () => {
      // 태그가 있는 Todo들 생성
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 1', tags: ['work', 'important'] }),
      })

      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Todo 2',
          tags: ['personal', 'learning'],
        }),
      })

      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 3', tags: ['work', 'project'] }),
      })

      const response = await app.request('/api/todos/tags')

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.tags).toHaveLength(5)
      expect(result.tags).toContain('work')
      expect(result.tags).toContain('important')
      expect(result.tags).toContain('personal')
      expect(result.tags).toContain('learning')
      expect(result.tags).toContain('project')

      // 정렬되어 있는지 확인
      const sortedTags = [...result.tags].sort()
      expect(result.tags).toEqual(sortedTags)
    })

    test('태그가 없으면 빈 배열을 반환한다', async () => {
      const response = await app.request('/api/todos/tags')

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.tags).toEqual([])
    })
  })

  describe('PATCH /api/todos/:id/toggle - 상태 토글', () => {
    test('Todo의 완료 상태를 토글할 수 있다', async () => {
      // Todo 생성 (기본적으로 완료되지 않음)
      const createResponse = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '토글할 할일' }),
      })
      const created = await createResponse.json()

      expect(created.completed).toBe(false)

      // 토글
      const toggleResponse = await app.request(`/api/todos/${created.id}/toggle`, {
        method: 'PATCH',
      })

      expect(toggleResponse.status).toBe(200)

      const toggled = await toggleResponse.json()
      expect(toggled.completed).toBe(true)

      // 다시 토글
      const toggleAgainResponse = await app.request(`/api/todos/${created.id}/toggle`, {
        method: 'PATCH',
      })

      expect(toggleAgainResponse.status).toBe(200)

      const toggledAgain = await toggleAgainResponse.json()
      expect(toggledAgain.completed).toBe(false)
    })

    test('존재하지 않는 Todo를 토글하면 404 에러가 발생한다', async () => {
      const response = await app.request('/api/todos/nonexistent/toggle', {
        method: 'PATCH',
      })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/todos/:id', () => {
    test('Todo를 삭제할 수 있다', async () => {
      // Todo 생성
      const createResponse = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '삭제할 할일' }),
      })
      const created = await createResponse.json()

      // 삭제
      const deleteResponse = await app.request(`/api/todos/${created.id}`, {
        method: 'DELETE',
      })

      expect(deleteResponse.status).toBe(200)

      const result = await deleteResponse.json()
      expect(result.success).toBe(true)

      // 삭제 확인
      const getResponse = await app.request(`/api/todos/${created.id}`)
      expect(getResponse.status).toBe(404)
    })
  })

  describe('DELETE /api/todos - 전체 삭제', () => {
    test('모든 Todo를 삭제할 수 있다', async () => {
      // 몇 개의 Todo 생성
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 1' }),
      })

      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Todo 2' }),
      })

      // 전체 삭제
      const deleteResponse = await app.request('/api/todos', {
        method: 'DELETE',
      })

      expect(deleteResponse.status).toBe(200)

      const result = await deleteResponse.json()
      expect(result.success).toBe(true)

      // 삭제 확인
      const listResponse = await app.request('/api/todos')
      const listResult = await listResponse.json()
      expect(listResult.total).toBe(0)
    })
  })

  describe('에러 처리', () => {
    test('잘못된 JSON 형식이면 400 에러가 발생한다', async () => {
      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      expect(response.status).toBe(400)
    })

    test('지원하지 않는 HTTP 메서드는 404 에러가 발생한다', async () => {
      const response = await app.request('/api/todos', {
        method: 'PATCH',
      })

      expect(response.status).toBe(404)
    })

    test('존재하지 않는 엔드포인트는 404 에러가 발생한다', async () => {
      const response = await app.request('/api/todos/nonexistent/invalid')

      expect(response.status).toBe(404)
    })
  })

  describe('CORS 설정', () => {
    test('CORS 헤더가 포함되어 있다', async () => {
      const response = await app.request('/api/todos', {
        method: 'OPTIONS',
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
    })
  })
})

/**
 * Kanban API 테스트
 * Phase 2 Kanban 기능을 위한 API 엔드포인트 테스트
 */
import { describe, test, expect, beforeEach } from 'bun:test'
import app from '../routes/todos'

describe('Kanban API Tests', () => {
  // 각 테스트 전에 데이터 초기화
  beforeEach(async () => {
    await app.request('/api/todos', {
      method: 'DELETE',
    })
  })

  describe('Todo 생성 시 Kanban 필드 지원', () => {
    test('status와 order 필드를 포함한 Todo를 생성할 수 있다', async () => {
      const todoData = {
        title: 'Kanban Todo',
        description: 'Kanban 테스트용 Todo',
        status: 'in-progress',
        order: 5,
        priority: 'high',
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      })

      expect(response.status).toBe(201)

      const result = await response.json()
      expect(result.title).toBe(todoData.title)
      expect(result.status).toBe('in-progress')
      expect(result.order).toBe(5)
      expect(result.priority).toBe('high')
    })

    test('status와 order 필드 없이 생성하면 기본값이 적용된다', async () => {
      const todoData = {
        title: 'Default Kanban Todo',
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      })

      expect(response.status).toBe(201)

      const result = await response.json()
      expect(result.status).toBe('todo') // 기본값
      expect(result.order).toBe(0) // 기본값
    })

    test('잘못된 status 값으로 생성하면 400 에러가 발생한다', async () => {
      const todoData = {
        title: 'Invalid Status Todo',
        status: 'invalid-status',
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Status 필터링 기능', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      const todos = [
        { title: 'Todo 1', status: 'todo', order: 1 },
        { title: 'Todo 2', status: 'todo', order: 2 },
        { title: 'Todo 3', status: 'in-progress', order: 3 },
        { title: 'Todo 4', status: 'in-progress', order: 4 },
        { title: 'Todo 5', status: 'done', order: 5 },
      ]

      for (const todo of todos) {
        await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        })
      }
    })

    test('todo 상태로 필터링할 수 있다', async () => {
      const response = await app.request('/api/todos?status=todo')
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.total).toBe(2)
      expect(result.todos).toHaveLength(2)
      
      for (const todo of result.todos) {
        expect(todo.status).toBe('todo')
      }
    })

    test('in-progress 상태로 필터링할 수 있다', async () => {
      const response = await app.request('/api/todos?status=in-progress')
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.total).toBe(2)
      expect(result.todos).toHaveLength(2)
      
      for (const todo of result.todos) {
        expect(todo.status).toBe('in-progress')
      }
    })

    test('done 상태로 필터링할 수 있다', async () => {
      const response = await app.request('/api/todos?status=done')
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.total).toBe(1)
      expect(result.todos).toHaveLength(1)
      expect(result.todos[0].status).toBe('done')
    })

    test('status와 다른 필터를 조합할 수 있다', async () => {
      const response = await app.request('/api/todos?status=todo&sortBy=order&sortOrder=asc')
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.total).toBe(2)
      
      // order 순으로 정렬되었는지 확인
      expect(result.todos[0].order).toBe(1)
      expect(result.todos[1].order).toBe(2)
    })
  })

  describe('Order 정렬 기능', () => {
    beforeEach(async () => {
      // 다양한 order 값을 가진 테스트 데이터 생성
      const todos = [
        { title: 'Todo C', order: 30 },
        { title: 'Todo A', order: 10 },
        { title: 'Todo B', order: 20 },
        { title: 'Todo D', order: 5 },
      ]

      for (const todo of todos) {
        await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        })
      }
    })

    test('order 기준으로 오름차순 정렬할 수 있다', async () => {
      const response = await app.request('/api/todos?sortBy=order&sortOrder=asc')
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos).toHaveLength(4)

      const orders = result.todos.map((todo: any) => todo.order)
      expect(orders).toEqual([5, 10, 20, 30])
    })

    test('order 기준으로 내림차순 정렬할 수 있다', async () => {
      const response = await app.request('/api/todos?sortBy=order&sortOrder=desc')
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.todos).toHaveLength(4)

      const orders = result.todos.map((todo: any) => todo.order)
      expect(orders).toEqual([30, 20, 10, 5])
    })
  })

  describe('Bulk Update API', () => {
    let todoIds: string[]

    beforeEach(async () => {
      // 테스트용 Todo들 생성
      const todos = [
        { title: 'Bulk Todo 1', status: 'todo', order: 1 },
        { title: 'Bulk Todo 2', status: 'todo', order: 2 },
        { title: 'Bulk Todo 3', status: 'in-progress', order: 3 },
      ]

      todoIds = []
      for (const todo of todos) {
        const response = await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        })
        const result = await response.json()
        todoIds.push(result.id)
      }
    })

    test('여러 Todo의 status를 일괄 변경할 수 있다', async () => {
      const bulkUpdateData = {
        data: [
          { id: todoIds[0], status: 'in-progress' },
          { id: todoIds[1], status: 'done' },
        ],
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2)
      expect(result.updatedTodos).toHaveLength(2)

      // 개별 Todo 확인
      const todo1Response = await app.request(`/api/todos/${todoIds[0]}`)
      const todo1 = await todo1Response.json()
      expect(todo1.status).toBe('in-progress')

      const todo2Response = await app.request(`/api/todos/${todoIds[1]}`)
      const todo2 = await todo2Response.json()
      expect(todo2.status).toBe('done')
    })

    test('여러 Todo의 order를 일괄 변경할 수 있다', async () => {
      const bulkUpdateData = {
        data: [
          { id: todoIds[0], order: 100 },
          { id: todoIds[1], order: 200 },
          { id: todoIds[2], order: 50 },
        ],
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(3)

      // order 순으로 정렬하여 확인
      const listResponse = await app.request('/api/todos?sortBy=order&sortOrder=asc')
      const listResult = await listResponse.json()
      const orders = listResult.todos.map((todo: any) => todo.order)
      expect(orders).toEqual([50, 100, 200])
    })

    test('status와 order를 동시에 변경할 수 있다', async () => {
      const bulkUpdateData = {
        data: [
          { id: todoIds[0], status: 'done', order: 999 },
          { id: todoIds[1], status: 'in-progress', order: 888 },
        ],
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2)

      // 변경사항 확인
      const todo1Response = await app.request(`/api/todos/${todoIds[0]}`)
      const todo1 = await todo1Response.json()
      expect(todo1.status).toBe('done')
      expect(todo1.order).toBe(999)

      const todo2Response = await app.request(`/api/todos/${todoIds[1]}`)
      const todo2 = await todo2Response.json()
      expect(todo2.status).toBe('in-progress')
      expect(todo2.order).toBe(888)
    })

    test('존재하지 않는 Todo ID가 포함되어도 나머지는 성공한다', async () => {
      const bulkUpdateData = {
        data: [
          { id: todoIds[0], status: 'done' },
          { id: 'non-existent-id', status: 'done' },
          { id: todoIds[1], status: 'done' },
        ],
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(false) // 일부 실패로 인해 false
      expect(result.updatedCount).toBe(2) // 2개는 성공
      expect(result.message).toContain('2개의 Todo가 업데이트')
      expect(result.message).toContain('1개 실패')
    })

    test('빈 배열로 요청하면 400 에러가 발생한다', async () => {
      const bulkUpdateData = {
        data: [],
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(400)
    })

    test('잘못된 status 값으로 bulk update하면 실패한다', async () => {
      const bulkUpdateData = {
        data: [
          { id: todoIds[0], status: 'invalid-status' },
        ],
      }

      const response = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateData),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Kanban 워크플로우 시나리오', () => {
    test('전체 Kanban 워크플로우가 정상 동작한다', async () => {
      // 1. 초기 Todo들 생성
      const initialTodos = [
        { title: 'Task 1', status: 'todo', order: 1 },
        { title: 'Task 2', status: 'todo', order: 2 },
        { title: 'Task 3', status: 'todo', order: 3 },
      ]

      const todoIds: string[] = []
      for (const todo of initialTodos) {
        const response = await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        })
        const result = await response.json()
        todoIds.push(result.id)
      }

      // 2. Todo 상태별 조회 확인
      const todoStatusResponse = await app.request('/api/todos?status=todo')
      const todoStatusResult = await todoStatusResponse.json()
      expect(todoStatusResult.total).toBe(3)

      // 3. 첫 번째 Task를 진행중으로 이동
      const moveToProgressData = {
        data: [{ id: todoIds[0], status: 'in-progress', order: 1 }],
      }

      const moveResponse = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveToProgressData),
      })

      expect(moveResponse.status).toBe(200)

      // 4. 상태별 개수 확인
      const progressResponse = await app.request('/api/todos?status=in-progress')
      const progressResult = await progressResponse.json()
      expect(progressResult.total).toBe(1)

      const todoResponse = await app.request('/api/todos?status=todo')
      const todoResult = await todoResponse.json()
      expect(todoResult.total).toBe(2)

      // 5. 진행중인 Task를 완료로 이동
      const moveToCompleteData = {
        data: [{ id: todoIds[0], status: 'done', order: 1 }],
      }

      const completeResponse = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveToCompleteData),
      })

      expect(completeResponse.status).toBe(200)

      // 6. 최종 상태 확인
      const doneResponse = await app.request('/api/todos?status=done')
      const doneResult = await doneResponse.json()
      expect(doneResult.total).toBe(1)

      const finalTodoResponse = await app.request('/api/todos?status=todo')
      const finalTodoResult = await finalTodoResponse.json()
      expect(finalTodoResult.total).toBe(2)

      // 7. 전체 통계 확인
      const statsResponse = await app.request('/api/todos/stats')
      const statsResult = await statsResponse.json()
      expect(statsResult.total).toBe(3)
      expect(statsResult.completed).toBe(0) // status가 done이어도 completed는 별개
      expect(statsResult.active).toBe(3)
    })

    test('드래그앤드롭 시뮬레이션 - 순서 변경', async () => {
      // 1. 같은 컬럼 내 Task들 생성
      const tasks = [
        { title: 'Task A', status: 'todo', order: 1 },
        { title: 'Task B', status: 'todo', order: 2 },
        { title: 'Task C', status: 'todo', order: 3 },
        { title: 'Task D', status: 'todo', order: 4 },
      ]

      const taskIds: string[] = []
      for (const task of tasks) {
        const response = await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
        const result = await response.json()
        taskIds.push(result.id)
      }

      // 2. 드래그앤드롭 시뮬레이션: Task C를 맨 위로 이동
      // 원래 순서: A(1), B(2), C(3), D(4)
      // 새 순서: C(1), A(2), B(3), D(4)
      const reorderData = {
        data: [
          { id: taskIds[2], order: 1 }, // Task C를 1번으로
          { id: taskIds[0], order: 2 }, // Task A를 2번으로
          { id: taskIds[1], order: 3 }, // Task B를 3번으로
          // Task D는 그대로 4번
        ],
      }

      const reorderResponse = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reorderData),
      })

      expect(reorderResponse.status).toBe(200)

      // 3. 순서 확인
      const orderedResponse = await app.request('/api/todos?status=todo&sortBy=order&sortOrder=asc')
      const orderedResult = await orderedResponse.json()
      
      const titles = orderedResult.todos.map((todo: any) => todo.title)
      expect(titles).toEqual(['Task C', 'Task A', 'Task B', 'Task D'])
    })

    test('컬럼 간 이동 시뮬레이션', async () => {
      // 1. 각 컬럼에 Task들 생성
      const tasks = [
        { title: 'Todo Task 1', status: 'todo', order: 1 },
        { title: 'Todo Task 2', status: 'todo', order: 2 },
        { title: 'Progress Task 1', status: 'in-progress', order: 1 },
        { title: 'Done Task 1', status: 'done', order: 1 },
      ]

      const taskIds: string[] = []
      for (const task of tasks) {
        const response = await app.request('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
        const result = await response.json()
        taskIds.push(result.id)
      }

      // 2. Todo에서 Progress로 이동 (Todo Task 1)
      const moveData = {
        data: [
          { id: taskIds[0], status: 'in-progress', order: 2 }, // Progress 컬럼의 두 번째로
        ],
      }

      const moveResponse = await app.request('/api/todos/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveData),
      })

      expect(moveResponse.status).toBe(200)

      // 3. 각 컬럼 상태 확인
      const todoResponse = await app.request('/api/todos?status=todo')
      const todoResult = await todoResponse.json()
      expect(todoResult.total).toBe(1) // Todo Task 2만 남음

      const progressResponse = await app.request('/api/todos?status=in-progress&sortBy=order&sortOrder=asc')
      const progressResult = await progressResponse.json()
      expect(progressResult.total).toBe(2) // Progress Task 1, Todo Task 1
      
      const progressTitles = progressResult.todos.map((todo: any) => todo.title)
      expect(progressTitles).toEqual(['Progress Task 1', 'Todo Task 1'])
    })
  })
})
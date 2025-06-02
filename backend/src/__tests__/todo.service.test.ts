import { describe, test, expect, beforeEach } from 'bun:test'
import { TodoService } from '../services/todo.service'
import { todoStorage } from '../utils/in-memory-storage'

describe('TodoService', () => {
  let service: TodoService

  beforeEach(() => {
    service = new TodoService()
    todoStorage.clear()
  })

  describe('Todo 생성', () => {
    test('유효한 데이터로 Todo를 생성할 수 있다', async () => {
      const createData = {
        title: '새로운 할일',
        description: '할일 설명',
      }

      const todo = await service.createTodo(createData)

      expect(todo).toBeDefined()
      expect(todo.title).toBe(createData.title)
      expect(todo.description).toBe(createData.description)
      expect(todo.completed).toBe(false)
      expect(todo.createdAt).toBeInstanceOf(Date)
      expect(todo.updatedAt).toBeInstanceOf(Date)
    })

    test('설명 없이도 Todo를 생성할 수 있다', async () => {
      const createData = {
        title: '간단한 할일',
      }

      const todo = await service.createTodo(createData)

      expect(todo.title).toBe(createData.title)
      expect(todo.description).toBeUndefined()
      expect(todo.completed).toBe(false)
    })

    test('빈 제목으로는 Todo를 생성할 수 없다', async () => {
      const createData = {
        title: '',
        description: '설명',
      }

      await expect(service.createTodo(createData)).rejects.toThrow('제목은 필수입니다')
    })

    test('공백만 있는 제목으로는 Todo를 생성할 수 없다', async () => {
      const createData = {
        title: '   ',
        description: '설명',
      }

      await expect(service.createTodo(createData)).rejects.toThrow('제목은 필수입니다')
    })
  })

  describe('Todo 조회', () => {
    test('ID로 Todo를 조회할 수 있다', async () => {
      const created = await service.createTodo({
        title: '조회할 할일',
        description: '설명',
      })

      const found = await service.getTodoById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.title).toBe(created.title)
    })

    test('존재하지 않는 ID로 조회하면 에러가 발생한다', async () => {
      await expect(service.getTodoById('nonexistent')).rejects.toThrow('Todo를 찾을 수 없습니다')
    })

    test('페이지네이션으로 Todo 목록을 조회할 수 있다', async () => {
      // 5개의 Todo 생성
      for (let i = 1; i <= 5; i++) {
        await service.createTodo({
          title: `Todo ${i}`,
          description: `설명 ${i}`,
        })
      }

      const result = await service.getTodos({ page: 1, limit: 3 }, 'all')

      expect(result.todos).toHaveLength(3)
      expect(result.total).toBe(5)
      expect(result.totalPages).toBe(2)
      expect(result.currentPage).toBe(1)
      expect(result.hasNext).toBe(true)
      expect(result.hasPrev).toBe(false)
    })

    test('페이지 번호가 0 이하면 에러가 발생한다', async () => {
      await expect(service.getTodos({ page: 0, limit: 10 }, 'all')).rejects.toThrow(
        '페이지 번호는 1 이상이어야 합니다'
      )
    })

    test('페이지 크기가 0 이하면 에러가 발생한다', async () => {
      await expect(service.getTodos({ page: 1, limit: 0 }, 'all')).rejects.toThrow(
        '페이지 크기는 1 이상이어야 합니다'
      )
    })

    test('페이지 크기가 100을 초과하면 에러가 발생한다', async () => {
      await expect(service.getTodos({ page: 1, limit: 101 }, 'all')).rejects.toThrow(
        '페이지 크기는 100 이하여야 합니다'
      )
    })
  })

  describe('Todo 필터링', () => {
    beforeEach(async () => {
      const todo1 = await service.createTodo({ title: 'Active 1' })
      const todo2 = await service.createTodo({ title: 'Active 2' })
      await service.createTodo({ title: 'Active 3' })

      // 일부를 완료 상태로 변경
      await service.updateTodo(todo1.id, { completed: true })
      await service.updateTodo(todo2.id, { completed: true })
    })

    test('활성 상태 Todo만 필터링할 수 있다', async () => {
      const result = await service.getTodos({ page: 1, limit: 10 }, 'active')

      expect(result.todos.every((todo) => !todo.completed)).toBe(true)
      expect(result.total).toBe(1)
    })

    test('완료된 Todo만 필터링할 수 있다', async () => {
      const result = await service.getTodos({ page: 1, limit: 10 }, 'completed')

      expect(result.todos.every((todo) => todo.completed)).toBe(true)
      expect(result.total).toBe(2)
    })

    test('모든 Todo를 조회할 수 있다', async () => {
      const result = await service.getTodos({ page: 1, limit: 10 }, 'all')

      expect(result.total).toBe(3)
    })
  })

  describe('Todo 검색', () => {
    beforeEach(async () => {
      await service.createTodo({
        title: 'JavaScript 학습',
        description: 'React 공부하기',
      })
      await service.createTodo({
        title: 'Python 개발',
        description: 'Django 프로젝트',
      })
      await service.createTodo({
        title: '운동하기',
        description: 'JavaScript 책 읽으면서 운동',
      })
    })

    test('검색어로 Todo를 필터링할 수 있다', async () => {
      const result = await service.getTodos({ page: 1, limit: 10 }, 'all', 'JavaScript')

      expect(result.todos).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    test('검색어와 상태 필터를 함께 사용할 수 있다', async () => {
      // 첫 번째 Todo를 완료 상태로 변경
      const todos = await service.getTodos({ page: 1, limit: 10 }, 'all')
      await service.updateTodo(todos.todos[0].id, { completed: true })

      const result = await service.getTodos({ page: 1, limit: 10 }, 'completed', 'JavaScript')

      expect(result.todos).toHaveLength(1)
    })

    test('빈 검색어는 무시된다', async () => {
      const resultWithEmpty = await service.getTodos({ page: 1, limit: 10 }, 'all', '')

      const resultWithoutSearch = await service.getTodos({ page: 1, limit: 10 }, 'all')

      expect(resultWithEmpty.total).toBe(resultWithoutSearch.total)
    })
  })

  describe('Todo 업데이트', () => {
    test('기존 Todo를 업데이트할 수 있다', async () => {
      const created = await service.createTodo({
        title: '원본 제목',
        description: '원본 설명',
      })

      const updated = await service.updateTodo(created.id, {
        title: '수정된 제목',
        completed: true,
      })

      expect(updated.title).toBe('수정된 제목')
      expect(updated.description).toBe('원본 설명')
      expect(updated.completed).toBe(true)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())
    })

    test('존재하지 않는 Todo를 업데이트하면 에러가 발생한다', async () => {
      await expect(
        service.updateTodo('nonexistent', {
          title: '새 제목',
        })
      ).rejects.toThrow('Todo를 찾을 수 없습니다')
    })

    test('빈 제목으로 업데이트할 수 없다', async () => {
      const created = await service.createTodo({
        title: '원본 제목',
      })

      await expect(
        service.updateTodo(created.id, {
          title: '',
        })
      ).rejects.toThrow('제목은 필수입니다')
    })

    test('부분 업데이트가 가능하다', async () => {
      const created = await service.createTodo({
        title: '원본 제목',
        description: '원본 설명',
      })

      const updated = await service.updateTodo(created.id, {
        completed: true,
      })

      expect(updated.title).toBe('원본 제목')
      expect(updated.description).toBe('원본 설명')
      expect(updated.completed).toBe(true)
    })
  })

  describe('Todo 삭제', () => {
    test('기존 Todo를 삭제할 수 있다', async () => {
      const created = await service.createTodo({
        title: '삭제할 할일',
      })

      await service.deleteTodo(created.id)

      await expect(service.getTodoById(created.id)).rejects.toThrow('Todo를 찾을 수 없습니다')
    })

    test('존재하지 않는 Todo를 삭제하면 에러가 발생한다', async () => {
      await expect(service.deleteTodo('nonexistent')).rejects.toThrow('Todo를 찾을 수 없습니다')
    })
  })

  describe('Todo 통계', () => {
    beforeEach(async () => {
      const todo1 = await service.createTodo({ title: 'Todo 1' })
      const todo2 = await service.createTodo({ title: 'Todo 2' })
      await service.createTodo({ title: 'Todo 3' })

      // 일부를 완료 상태로 변경
      await service.updateTodo(todo1.id, { completed: true })
      await service.updateTodo(todo2.id, { completed: true })
    })

    test('통계를 조회할 수 있다', async () => {
      const stats = await service.getStats()

      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(2)
      expect(stats.active).toBe(1)
    })
  })

  describe('Todo 전체 삭제', () => {
    test('모든 Todo를 삭제할 수 있다', async () => {
      await service.createTodo({ title: 'Todo 1' })
      await service.createTodo({ title: 'Todo 2' })

      await service.clearTodos()

      const stats = await service.getStats()
      expect(stats.total).toBe(0)
    })
  })

  describe('Todo 완료 상태 토글', () => {
    test('미완료 Todo를 완료 상태로 토글할 수 있다', async () => {
      const created = await service.createTodo({
        title: '토글할 할일',
      })

      expect(created.completed).toBe(false)

      const toggled = await service.toggleTodo(created.id)
      expect(toggled.completed).toBe(true)
    })

    test('완료된 Todo를 미완료 상태로 토글할 수 있다', async () => {
      const created = await service.createTodo({
        title: '토글할 할일',
      })

      // 먼저 완료 상태로 변경
      await service.updateTodo(created.id, { completed: true })

      const toggled = await service.toggleTodo(created.id)
      expect(toggled.completed).toBe(false)
    })

    test('존재하지 않는 Todo를 토글하면 에러가 발생한다', async () => {
      await expect(service.toggleTodo('nonexistent')).rejects.toThrow('Todo를 찾을 수 없습니다')
    })
  })
})

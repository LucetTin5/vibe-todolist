import { describe, test, expect, beforeEach } from 'bun:test'
import { TodoRepository } from '../repositories/todo.repository'
import { todoStorage } from '../utils/in-memory-storage'

describe('TodoRepository', () => {
  let repository: TodoRepository

  beforeEach(() => {
    repository = new TodoRepository()
    todoStorage.clear()
  })

  describe('Todo 생성', () => {
    test('새로운 Todo를 생성할 수 있다', async () => {
      const createData = {
        title: '새 할일',
        description: '할일 설명',
      }

      const todo = await repository.create(createData)

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

      const todo = await repository.create(createData)

      expect(todo.title).toBe(createData.title)
      expect(todo.description).toBeUndefined()
      expect(todo.completed).toBe(false)
    })
  })

  describe('Todo 조회', () => {
    test('ID로 Todo를 조회할 수 있다', async () => {
      const created = await repository.create({
        title: '조회할 할일',
        description: '설명',
      })

      const found = await repository.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.title).toBe(created.title)
    })

    test('존재하지 않는 ID로 조회하면 null을 반환한다', async () => {
      const found = await repository.findById('nonexistent')
      expect(found).toBeNull()
    })

    test('페이지네이션으로 Todo 목록을 조회할 수 있다', async () => {
      // 5개의 Todo 생성
      for (let i = 1; i <= 5; i++) {
        await repository.create({
          title: `Todo ${i}`,
          description: `설명 ${i}`,
        })
      }

      const result = await repository.findMany({ page: 1, limit: 3 }, 'all')

      expect(result.todos).toHaveLength(3)
      expect(result.total).toBe(5)
      // 최신 순으로 정렬되어야 함
      expect(result.todos[0].title).toBe('Todo 5')
      expect(result.todos[1].title).toBe('Todo 4')
      expect(result.todos[2].title).toBe('Todo 3')
    })

    test('두 번째 페이지를 조회할 수 있다', async () => {
      // 5개의 Todo 생성
      for (let i = 1; i <= 5; i++) {
        await repository.create({
          title: `Todo ${i}`,
        })
      }

      const result = await repository.findMany({ page: 2, limit: 3 }, 'all')

      expect(result.todos).toHaveLength(2)
      expect(result.total).toBe(5)
      expect(result.todos[0].title).toBe('Todo 2')
      expect(result.todos[1].title).toBe('Todo 1')
    })
  })

  describe('Todo 필터링', () => {
    beforeEach(async () => {
      await repository.create({ title: 'Active 1' })
      await repository.create({ title: 'Completed 1' })
      await repository.create({ title: 'Active 2' })
      await repository.create({ title: 'Completed 2' })

      // 마지막 두 개를 완료 상태로 변경
      const todos = todoStorage.findAll()
      todoStorage.update(todos[1].id, { completed: true })
      todoStorage.update(todos[3].id, { completed: true })
    })

    test('활성 상태 Todo만 필터링할 수 있다', async () => {
      const result = await repository.findMany({ page: 1, limit: 10 }, 'active')

      expect(result.todos.every((todo) => !todo.completed)).toBe(true)
      expect(result.total).toBe(2)
    })

    test('완료된 Todo만 필터링할 수 있다', async () => {
      const result = await repository.findMany({ page: 1, limit: 10 }, 'completed')

      expect(result.todos.every((todo) => todo.completed)).toBe(true)
      expect(result.total).toBe(2)
    })

    test('모든 Todo를 조회할 수 있다', async () => {
      const result = await repository.findMany({ page: 1, limit: 10 }, 'all')

      expect(result.total).toBe(4)
    })
  })

  describe('Todo 검색', () => {
    beforeEach(async () => {
      await repository.create({
        title: 'JavaScript 학습',
        description: 'React 공부하기',
      })
      await repository.create({
        title: 'Python 개발',
        description: 'Django 프로젝트',
      })
      await repository.create({
        title: '운동하기',
        description: 'JavaScript 책 읽으면서 운동',
      })
    })

    test('검색어로 Todo를 필터링할 수 있다', async () => {
      const result = await repository.findMany({ page: 1, limit: 10 }, 'all', 'JavaScript')

      expect(result.todos).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    test('검색어와 상태 필터를 함께 사용할 수 있다', async () => {
      // 첫 번째 Todo를 완료 상태로 변경
      const todos = todoStorage.findAll()
      todoStorage.update(todos[0].id, { completed: true })

      const result = await repository.findMany({ page: 1, limit: 10 }, 'completed', 'JavaScript')

      expect(result.todos).toHaveLength(1)
      expect(result.todos[0].title).toBe('운동하기')
    })
  })

  describe('Todo 업데이트', () => {
    test('기존 Todo를 업데이트할 수 있다', async () => {
      const created = await repository.create({
        title: '원본 제목',
        description: '원본 설명',
      })

      const updated = await repository.update(created.id, {
        title: '수정된 제목',
        completed: true,
      })

      expect(updated).toBeDefined()
      expect(updated?.title).toBe('수정된 제목')
      expect(updated?.description).toBe('원본 설명')
      expect(updated?.completed).toBe(true)
    })

    test('존재하지 않는 Todo를 업데이트하면 null을 반환한다', async () => {
      const result = await repository.update('nonexistent', {
        title: '새 제목',
      })

      expect(result).toBeNull()
    })
  })

  describe('Todo 삭제', () => {
    test('기존 Todo를 삭제할 수 있다', async () => {
      const created = await repository.create({
        title: '삭제할 할일',
      })

      const deleted = await repository.delete(created.id)
      expect(deleted).toBe(true)

      const found = await repository.findById(created.id)
      expect(found).toBeNull()
    })

    test('존재하지 않는 Todo를 삭제하면 false를 반환한다', async () => {
      const deleted = await repository.delete('nonexistent')
      expect(deleted).toBe(false)
    })
  })

  describe('Todo 존재 여부 확인', () => {
    test('존재하는 Todo의 경우 true를 반환한다', async () => {
      const created = await repository.create({
        title: '존재하는 할일',
      })

      const exists = await repository.exists(created.id)
      expect(exists).toBe(true)
    })

    test('존재하지 않는 Todo의 경우 false를 반환한다', async () => {
      const exists = await repository.exists('nonexistent')
      expect(exists).toBe(false)
    })
  })

  describe('Todo 통계', () => {
    beforeEach(async () => {
      await repository.create({ title: 'Todo 1' })
      await repository.create({ title: 'Todo 2' })
      await repository.create({ title: 'Todo 3' })

      // 일부를 완료 상태로 변경
      const todos = todoStorage.findAll()
      todoStorage.update(todos[0].id, { completed: true })
      todoStorage.update(todos[1].id, { completed: true })
    })

    test('통계를 조회할 수 있다', async () => {
      const stats = await repository.getStats()

      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(2)
      expect(stats.active).toBe(1)
    })
  })

  describe('Todo 전체 삭제', () => {
    test('모든 Todo를 삭제할 수 있다', async () => {
      await repository.create({ title: 'Todo 1' })
      await repository.create({ title: 'Todo 2' })

      await repository.clear()

      const stats = await repository.getStats()
      expect(stats.total).toBe(0)
    })
  })
})

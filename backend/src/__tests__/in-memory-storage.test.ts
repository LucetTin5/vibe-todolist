import { describe, test, expect, beforeEach } from 'bun:test'
import { todoStorage } from '../utils/in-memory-storage'

describe('InMemoryStorage', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토리지 초기화
    todoStorage.clear()
  })

  describe('Todo 생성', () => {
    test('새로운 Todo를 생성할 수 있다', () => {
      const todoData = {
        title: '테스트 Todo',
        description: '테스트 설명',
        completed: false,
      }

      const todo = todoStorage.create(todoData)

      expect(todo).toBeDefined()
      expect(todo.id).toMatch(/^todo_\d+$/)
      expect(todo.title).toBe(todoData.title)
      expect(todo.description).toBe(todoData.description)
      expect(todo.completed).toBe(false)
      expect(todo.createdAt).toBeInstanceOf(Date)
      expect(todo.updatedAt).toBeInstanceOf(Date)
    })

    test('연속으로 생성하면 다른 ID가 할당된다', () => {
      const todo1 = todoStorage.create({
        title: 'Todo 1',
        completed: false,
      })

      const todo2 = todoStorage.create({
        title: 'Todo 2',
        completed: false,
      })

      expect(todo1.id).not.toBe(todo2.id)
    })
  })

  describe('Todo 조회', () => {
    test('생성된 Todo를 ID로 찾을 수 있다', () => {
      const created = todoStorage.create({
        title: '찾을 Todo',
        completed: false,
      })

      const found = todoStorage.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.title).toBe(created.title)
    })

    test('존재하지 않는 ID로 찾으면 undefined를 반환한다', () => {
      const found = todoStorage.findById('nonexistent')
      expect(found).toBeUndefined()
    })

    test('모든 Todo를 조회할 수 있다', () => {
      todoStorage.create({ title: 'Todo 1', completed: false })
      todoStorage.create({ title: 'Todo 2', completed: true })
      todoStorage.create({ title: 'Todo 3', completed: false })

      const todos = todoStorage.findAll()

      expect(todos).toHaveLength(3)
      // 최신 생성 순으로 정렬되어야 함
      expect(todos[0].title).toBe('Todo 3')
      expect(todos[1].title).toBe('Todo 2')
      expect(todos[2].title).toBe('Todo 1')
    })
  })

  describe('Todo 업데이트', () => {
    test('기존 Todo를 업데이트할 수 있다', () => {
      const original = todoStorage.create({
        title: '원본 제목',
        description: '원본 설명',
        completed: false,
      })

      const updated = todoStorage.update(original.id, {
        title: '수정된 제목',
        completed: true,
      })

      expect(updated).toBeDefined()
      expect(updated?.title).toBe('수정된 제목')
      expect(updated?.description).toBe('원본 설명') // 변경되지 않음
      expect(updated?.completed).toBe(true)
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime())
    })

    test('존재하지 않는 Todo를 업데이트하면 undefined를 반환한다', () => {
      const result = todoStorage.update('nonexistent', { title: '새 제목' })
      expect(result).toBeUndefined()
    })
  })

  describe('Todo 삭제', () => {
    test('기존 Todo를 삭제할 수 있다', () => {
      const todo = todoStorage.create({
        title: '삭제할 Todo',
        completed: false,
      })

      const deleted = todoStorage.delete(todo.id)
      expect(deleted).toBe(true)

      const found = todoStorage.findById(todo.id)
      expect(found).toBeUndefined()
    })

    test('존재하지 않는 Todo를 삭제하면 false를 반환한다', () => {
      const deleted = todoStorage.delete('nonexistent')
      expect(deleted).toBe(false)
    })
  })

  describe('Todo 필터링', () => {
    beforeEach(() => {
      todoStorage.create({ title: 'Active Todo 1', completed: false })
      todoStorage.create({ title: 'Completed Todo 1', completed: true })
      todoStorage.create({ title: 'Active Todo 2', completed: false })
      todoStorage.create({ title: 'Completed Todo 2', completed: true })
    })

    test('완료된 Todo만 필터링할 수 있다', () => {
      const completed = todoStorage.findByCompleted(true)
      expect(completed).toHaveLength(2)
      expect(completed.every((todo) => todo.completed)).toBe(true)
    })

    test('미완료 Todo만 필터링할 수 있다', () => {
      const active = todoStorage.findByCompleted(false)
      expect(active).toHaveLength(2)
      expect(active.every((todo) => !todo.completed)).toBe(true)
    })
  })

  describe('Todo 검색', () => {
    beforeEach(() => {
      todoStorage.create({
        title: 'JavaScript 공부하기',
        description: 'React와 Node.js 학습',
        completed: false,
      })
      todoStorage.create({
        title: 'Python 프로젝트',
        description: 'Django 웹 개발',
        completed: true,
      })
      todoStorage.create({
        title: '운동하기',
        description: '헬스장 가서 JavaScript 책 읽기',
        completed: false,
      })
    })

    test('제목으로 검색할 수 있다', () => {
      const results = todoStorage.search('공부하기')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('JavaScript 공부하기')
    })

    test('설명으로 검색할 수 있다', () => {
      const results = todoStorage.search('Django')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Python 프로젝트')
    })

    test('제목과 설명 모두에서 검색할 수 있다', () => {
      const results = todoStorage.search('javascript') // 대소문자 무관
      expect(results).toHaveLength(2)
    })

    test('검색 결과가 없으면 빈 배열을 반환한다', () => {
      const results = todoStorage.search('존재하지않는검색어')
      expect(results).toHaveLength(0)
    })
  })

  describe('Todo 통계', () => {
    beforeEach(() => {
      todoStorage.create({ title: 'Todo 1', completed: false })
      todoStorage.create({ title: 'Todo 2', completed: true })
      todoStorage.create({ title: 'Todo 3', completed: false })
      todoStorage.create({ title: 'Todo 4', completed: true })
      todoStorage.create({ title: 'Todo 5', completed: true })
    })

    test('전체 Todo 개수를 조회할 수 있다', () => {
      expect(todoStorage.count()).toBe(5)
    })

    test('완료된 Todo 개수를 조회할 수 있다', () => {
      expect(todoStorage.countCompleted()).toBe(3)
    })

    test('미완료 Todo 개수를 조회할 수 있다', () => {
      expect(todoStorage.countActive()).toBe(2)
    })
  })

  describe('스토리지 초기화', () => {
    test('모든 데이터를 초기화할 수 있다', () => {
      todoStorage.create({ title: 'Todo 1', completed: false })
      todoStorage.create({ title: 'Todo 2', completed: true })

      expect(todoStorage.count()).toBe(2)

      todoStorage.clear()

      expect(todoStorage.count()).toBe(0)
      expect(todoStorage.findAll()).toHaveLength(0)
    })
  })
})

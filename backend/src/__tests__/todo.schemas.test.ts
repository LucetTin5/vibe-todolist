import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import {
  TodoSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
  PriorityEnum,
  CategoryEnum,
  StatusEnum,
  type Todo,
  type CreateTodoRequest,
  type UpdateTodoRequest,
  type TodoQuery,
  type Priority,
  type Category,
  type Status,
} from '../schemas/todo.schemas'

describe('Todo Schemas', () => {
  describe('PriorityEnum', () => {
    test('유효한 우선순위 값들을 허용한다', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent']

      for (const priority of validPriorities) {
        expect(() => PriorityEnum.parse(priority)).not.toThrow()
      }
    })

    test('잘못된 우선순위 값은 에러를 발생시킨다', () => {
      const invalidPriorities = ['critical', 'normal', '', null, undefined]

      for (const priority of invalidPriorities) {
        expect(() => PriorityEnum.parse(priority)).toThrow()
      }
    })
  })

  describe('CategoryEnum', () => {
    test('유효한 카테고리 값들을 허용한다', () => {
      const validCategories = ['work', 'personal', 'shopping', 'health', 'other']

      for (const category of validCategories) {
        expect(() => CategoryEnum.parse(category)).not.toThrow()
      }
    })

    test('잘못된 카테고리 값은 에러를 발생시킨다', () => {
      const invalidCategories = ['business', 'hobby', '', null, undefined]

      for (const category of invalidCategories) {
        expect(() => CategoryEnum.parse(category)).toThrow()
      }
    })
  })

  describe('TodoSchema', () => {
    test('유효한 Todo 객체를 파싱할 수 있다', () => {
      const validTodo = {
        id: 'todo_1737606271352',
        title: '프로젝트 완료하기',
        description: '마감일까지 모든 기능 구현 완료',
        completed: false,
        priority: 'high' as Priority,
        category: 'work' as Category,
        status: 'todo' as Status,
        order: 0,
        dueDate: '2025-06-10T09:00:00.000Z',
        tags: ['프로젝트', '중요'],
        estimatedMinutes: 120,
        createdAt: '2025-06-02T04:44:31.352Z',
        updatedAt: '2025-06-02T04:44:31.352Z',
      }

      expect(() => TodoSchema.parse(validTodo)).not.toThrow()

      const parsed = TodoSchema.parse(validTodo)
      expect(parsed).toEqual(validTodo)
    })

    test('필수 필드가 없으면 에러를 발생시킨다', () => {
      const invalidTodos = [
        // id 없음
        {
          title: '할일',
          completed: false,
          createdAt: '2025-06-02T04:44:31.352Z',
          updatedAt: '2025-06-02T04:44:31.352Z',
        },
        // title 없음
        {
          id: 'todo_1',
          completed: false,
          createdAt: '2025-06-02T04:44:31.352Z',
          updatedAt: '2025-06-02T04:44:31.352Z',
        },
        // completed 없음
        {
          id: 'todo_1',
          title: '할일',
          createdAt: '2025-06-02T04:44:31.352Z',
          updatedAt: '2025-06-02T04:44:31.352Z',
        },
      ]

      for (const todo of invalidTodos) {
        expect(() => TodoSchema.parse(todo)).toThrow()
      }
    })

    test('선택적 필드들이 없어도 파싱할 수 있다', () => {
      const minimalTodo = {
        id: 'todo_1',
        title: '간단한 할일',
        completed: false,
        priority: 'medium' as Priority,
        category: 'other' as Category,
        tags: [] as string[],
        createdAt: '2025-06-02T04:44:31.352Z',
        updatedAt: '2025-06-02T04:44:31.352Z',
      }

      expect(() => TodoSchema.parse(minimalTodo)).not.toThrow()

      const parsed = TodoSchema.parse(minimalTodo)
      expect(parsed.description).toBeUndefined()
      expect(parsed.dueDate).toBeUndefined()
      expect(parsed.estimatedMinutes).toBeUndefined()
    })

    test('잘못된 타입의 값들은 에러를 발생시킨다', () => {
      const baseValidTodo = {
        id: 'todo_1',
        title: '할일',
        completed: false,
        priority: 'medium' as Priority,
        category: 'other' as Category,
        tags: [] as string[],
        createdAt: '2025-06-02T04:44:31.352Z',
        updatedAt: '2025-06-02T04:44:31.352Z',
      }

      const invalidTodos = [
        { ...baseValidTodo, title: 123 }, // title이 숫자
        { ...baseValidTodo, completed: 'true' }, // completed가 문자열
        { ...baseValidTodo, priority: 'invalid' }, // 잘못된 priority
        { ...baseValidTodo, category: 'invalid' }, // 잘못된 category
        { ...baseValidTodo, tags: 'tag1,tag2' }, // tags가 문자열
        { ...baseValidTodo, estimatedMinutes: '120' }, // estimatedMinutes가 문자열
      ]

      for (const todo of invalidTodos) {
        expect(() => TodoSchema.parse(todo)).toThrow()
      }
    })

    test('빈 제목은 허용하지 않는다', () => {
      const todoWithEmptyTitle = {
        id: 'todo_1',
        title: '',
        completed: false,
        priority: 'medium' as Priority,
        category: 'other' as Category,
        tags: [] as string[],
        createdAt: '2025-06-02T04:44:31.352Z',
        updatedAt: '2025-06-02T04:44:31.352Z',
      }

      expect(() => TodoSchema.parse(todoWithEmptyTitle)).toThrow()
    })

    test('제목이 200자를 초과하면 에러를 발생시킨다', () => {
      const longTitle = 'a'.repeat(201)
      const todoWithLongTitle = {
        id: 'todo_1',
        title: longTitle,
        completed: false,
        priority: 'medium' as Priority,
        category: 'other' as Category,
        tags: [] as string[],
        createdAt: '2025-06-02T04:44:31.352Z',
        updatedAt: '2025-06-02T04:44:31.352Z',
      }

      expect(() => TodoSchema.parse(todoWithLongTitle)).toThrow()
    })
  })

  describe('CreateTodoSchema', () => {
    test('유효한 생성 요청을 파싱할 수 있다', () => {
      const createData = {
        title: '새로운 할일',
        description: '상세한 설명',
        priority: 'high' as Priority,
        category: 'work' as Category,
        dueDate: '2025-06-10T09:00:00.000Z',
        tags: ['프로젝트', '중요'],
        estimatedMinutes: 120,
      }

      expect(() => CreateTodoSchema.parse(createData)).not.toThrow()

      const parsed = CreateTodoSchema.parse(createData)
      expect(parsed).toEqual(createData)
    })

    test('제목만 있어도 생성 요청을 파싱할 수 있다', () => {
      const minimalData = {
        title: '간단한 할일',
      }

      expect(() => CreateTodoSchema.parse(minimalData)).not.toThrow()

      const parsed = CreateTodoSchema.parse(minimalData)
      expect(parsed.title).toBe('간단한 할일')
      // 스키마에서는 기본값이 설정되지 않음 (서비스 레이어에서 처리)
      expect(parsed.priority).toBeUndefined()
      expect(parsed.category).toBeUndefined()
      expect(parsed.tags).toBeUndefined()
    })

    test('빈 제목으로는 생성 요청을 할 수 없다', () => {
      const invalidData = {
        title: '',
        description: '설명',
      }

      expect(() => CreateTodoSchema.parse(invalidData)).toThrow()
    })
  })

  describe('UpdateTodoSchema', () => {
    test('유효한 업데이트 요청을 파싱할 수 있다', () => {
      const updateData = {
        title: '수정된 제목',
        description: '수정된 설명',
        completed: true,
        priority: 'urgent' as Priority,
        category: 'personal' as Category,
        dueDate: '2025-06-15T10:00:00.000Z',
        tags: ['수정됨'],
        estimatedMinutes: 90,
      }

      expect(() => UpdateTodoSchema.parse(updateData)).not.toThrow()

      const parsed = UpdateTodoSchema.parse(updateData)
      expect(parsed).toEqual(updateData)
    })

    test('부분 업데이트 요청을 파싱할 수 있다', () => {
      const partialData = {
        completed: true,
        priority: 'high' as Priority,
      }

      expect(() => UpdateTodoSchema.parse(partialData)).not.toThrow()

      const parsed = UpdateTodoSchema.parse(partialData)
      expect(parsed.completed).toBe(true)
      expect(parsed.priority).toBe('high')
      expect(parsed.title).toBeUndefined()
    })

    test('빈 객체도 유효한 업데이트 요청이다', () => {
      const emptyData = {}

      expect(() => UpdateTodoSchema.parse(emptyData)).not.toThrow()
    })

    test('빈 제목으로는 업데이트할 수 없다', () => {
      const invalidData = {
        title: '',
      }

      expect(() => UpdateTodoSchema.parse(invalidData)).toThrow()
    })
  })

  describe('TodoQuerySchema', () => {
    test('기본 쿼리 파라미터를 파싱할 수 있다', () => {
      const queryData = {
        page: '1',
        limit: '10',
        filter: 'all' as 'all' | 'active' | 'completed',
        sortBy: 'createdAt' as 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title',
        sortOrder: 'desc' as 'asc' | 'desc',
      }

      expect(() => TodoQuerySchema.parse(queryData)).not.toThrow()

      const parsed = TodoQuerySchema.parse(queryData)
      expect(parsed.page).toBe(1) // 문자열에서 숫자로 변환
      expect(parsed.limit).toBe(10)
      expect(parsed.filter).toBe('all')
      expect(parsed.sortBy).toBe('createdAt')
      expect(parsed.sortOrder).toBe('desc')
    })

    test('확장된 쿼리 파라미터를 파싱할 수 있다', () => {
      const queryData = {
        page: '2',
        limit: '20',
        filter: 'active' as 'all' | 'active' | 'completed',
        priority: 'high' as Priority,
        category: 'work' as Category,
        search: '검색어',
        sortBy: 'priority' as 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title',
        sortOrder: 'asc' as 'asc' | 'desc',
        dueDateFrom: '2025-06-01T00:00:00.000Z',
        dueDateTo: '2025-06-30T23:59:59.999Z',
      }

      expect(() => TodoQuerySchema.parse(queryData)).not.toThrow()

      const parsed = TodoQuerySchema.parse(queryData)
      expect(parsed.page).toBe(2)
      expect(parsed.limit).toBe(20)
      expect(parsed.priority).toBe('high')
      expect(parsed.category).toBe('work')
      expect(parsed.search).toBe('검색어')
      expect(parsed.dueDateFrom).toBe('2025-06-01T00:00:00.000Z')
      expect(parsed.dueDateTo).toBe('2025-06-30T23:59:59.999Z')
    })

    test('빈 객체는 기본값으로 파싱된다', () => {
      const emptyQuery = {}

      expect(() => TodoQuerySchema.parse(emptyQuery)).not.toThrow()

      const parsed = TodoQuerySchema.parse(emptyQuery)
      expect(parsed.page).toBe(1) // 기본값
      expect(parsed.limit).toBe(10) // 기본값
      expect(parsed.filter).toBe('all') // 기본값
      expect(parsed.sortBy).toBe('createdAt') // 기본값
      expect(parsed.sortOrder).toBe('desc') // 기본값
    })

    test('잘못된 숫자 형식은 에러를 발생시킨다', () => {
      const invalidQueries = [
        { page: 'abc' }, // 숫자가 아닌 page
        { limit: '10.5' }, // 소수점 있는 limit
        { page: '-1' }, // 음수 page (정규식 검사)
      ]

      for (const query of invalidQueries) {
        expect(() => TodoQuerySchema.parse(query)).toThrow()
      }
    })

    test('잘못된 enum 값은 에러를 발생시킨다', () => {
      const invalidQueries = [
        { filter: 'invalid' },
        { priority: 'invalid' },
        { category: 'invalid' },
        { sortBy: 'invalid' },
        { sortOrder: 'invalid' },
      ]

      for (const query of invalidQueries) {
        expect(() => TodoQuerySchema.parse(query)).toThrow()
      }
    })

    test('잘못된 날짜 형식은 에러를 발생시킨다', () => {
      const invalidQueries = [
        { dueDateFrom: '2025-06-01' }, // ISO 형식이 아님
        { dueDateTo: 'invalid-date' }, // 완전히 잘못된 형식
      ]

      for (const query of invalidQueries) {
        expect(() => TodoQuerySchema.parse(query)).toThrow()
      }
    })
  })

  describe('TypeScript 타입 추론', () => {
    test('타입이 올바르게 추론된다', () => {
      // 컴파일 타임 타입 체크를 위한 테스트
      const todo: Todo = {
        id: 'todo_1',
        title: '할일',
        completed: false,
        priority: 'medium',
        category: 'other',
        tags: [],
        createdAt: '2025-06-02T04:44:31.352Z',
        updatedAt: '2025-06-02T04:44:31.352Z',
      }

      const createRequest: CreateTodoRequest = {
        title: '새 할일',
      }

      const updateRequest: UpdateTodoRequest = {
        completed: true,
      }

      const query: TodoQuery = {
        page: 1,
        limit: 10,
        filter: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      // 이 테스트는 컴파일이 성공하면 통과
      expect(todo).toBeDefined()
      expect(createRequest).toBeDefined()
      expect(updateRequest).toBeDefined()
      expect(query).toBeDefined()
    })
  })
})

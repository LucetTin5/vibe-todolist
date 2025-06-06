import { describe, test, expect, beforeEach } from 'bun:test'
import { TodoService } from '../services/todo.service'
import { InMemoryStorage } from '../utils/in-memory-storage'
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  Priority,
  Category,
} from '../schemas/todo.schemas'

describe('Todo Enhanced Features Integration', () => {
  let service: TodoService
  let storage: InMemoryStorage

  beforeEach(() => {
    service = new TodoService()
    storage = InMemoryStorage.getInstance()
    storage.clear()
  })

  describe('실제 사용 시나리오 테스트', () => {
    test('프로젝트 관리 시나리오', async () => {
      // 1. 프로젝트 관련 Todo들 생성
      const projectTodos: CreateTodoRequest[] = [
        {
          title: '프로젝트 기획',
          description: '요구사항 분석 및 기획서 작성',
          priority: 'high',
          category: 'work',
          tags: ['프로젝트', '기획', '중요'],
          dueDate: '2025-06-01T09:00:00.000Z',
          estimatedMinutes: 480,
        },
        {
          title: 'UI/UX 디자인',
          description: '사용자 인터페이스 설계',
          priority: 'medium',
          category: 'work',
          tags: ['프로젝트', '디자인'],
          dueDate: '2025-06-05T17:00:00.000Z',
          estimatedMinutes: 360,
        },
        {
          title: '백엔드 개발',
          description: 'API 서버 개발',
          priority: 'high',
          category: 'work',
          tags: ['프로젝트', '개발', '백엔드'],
          dueDate: '2025-06-10T18:00:00.000Z',
          estimatedMinutes: 720,
        },
        {
          title: '프론트엔드 개발',
          description: '사용자 인터페이스 구현',
          priority: 'high',
          category: 'work',
          tags: ['프로젝트', '개발', '프론트엔드'],
          dueDate: '2025-06-12T18:00:00.000Z',
          estimatedMinutes: 600,
        },
        {
          title: '테스트 및 배포',
          description: '통합 테스트 및 서비스 배포',
          priority: 'urgent',
          category: 'work',
          tags: ['프로젝트', '테스트', '배포'],
          dueDate: '2025-06-15T12:00:00.000Z',
          estimatedMinutes: 240,
        },
      ]

      const createdTodos: Todo[] = []
      for (const todoData of projectTodos) {
        const todo = await service.createTodo(todoData)
        createdTodos.push(todo)
      }

      expect(createdTodos).toHaveLength(5)

      // 2. 프로젝트 태그로 모든 Todo 조회
      const projectTagTodos = await service.getTodosByTag('프로젝트')
      expect(projectTagTodos).toHaveLength(5)

      // 3. 업무 카테고리 + 높은 우선순위 필터링
      const highPriorityWork = await service.getTodos(
        { page: 1, limit: 10 },
        'all',
        undefined,
        'high',
        'work'
      )
      expect(highPriorityWork.todos).toHaveLength(3) // 기획, 백엔드, 프론트엔드

      // 4. 마감일 순으로 정렬
      const sortedByDueDate = await service.getTodos(
        { page: 1, limit: 10 },
        'all',
        '프로젝트',
        undefined,
        undefined,
        'dueDate',
        'asc'
      )

      const dueDates = sortedByDueDate.todos.map((todo) => todo.dueDate).filter(Boolean)
      expect(dueDates).toEqual([
        '2025-06-01T09:00:00.000Z',
        '2025-06-05T17:00:00.000Z',
        '2025-06-10T18:00:00.000Z',
        '2025-06-12T18:00:00.000Z',
        '2025-06-15T12:00:00.000Z',
      ])

      // 5. 첫 번째 작업 완료
      await service.updateTodo(createdTodos[0].id, { completed: true })

      // 6. 진행 상황 확인
      const activeProject = await service.getTodos({ page: 1, limit: 10 }, 'active', '프로젝트')
      expect(activeProject.total).toBe(4) // 1개 완료되어 4개 남음

      // 7. 통계로 프로젝트 진행 상황 확인
      const stats = await service.getStats()
      expect(stats.total).toBe(5)
      expect(stats.completed).toBe(1)
      expect(stats.completionRate).toBe(20.0)
      expect(stats.byCategory.work).toBe(5)
      expect(stats.byPriority.high).toBe(3)
      expect(stats.byPriority.urgent).toBe(1)
    })

    test('개인 일정 관리 시나리오', async () => {
      // 1. 다양한 개인 Todo들 생성
      const personalTodos: CreateTodoRequest[] = [
        {
          title: '운동하기',
          description: '헬스장에서 웨이트 트레이닝',
          priority: 'medium',
          category: 'health',
          tags: ['운동', '건강'],
          dueDate: new Date().toISOString(), // 오늘
          estimatedMinutes: 90,
        },
        {
          title: '책 읽기',
          description: 'JavaScript 디자인 패턴 책 읽기',
          priority: 'low',
          category: 'personal',
          tags: ['독서', '학습'],
          dueDate: '2025-06-07T20:00:00.000Z',
          estimatedMinutes: 120,
        },
        {
          title: '장보기',
          description: '주간 식료품 구매',
          priority: 'medium',
          category: 'shopping',
          tags: ['장보기', '생필품'],
          dueDate: '2025-06-08T15:00:00.000Z',
          estimatedMinutes: 60,
        },
        {
          title: '정기검진',
          description: '연간 건강검진 받기',
          priority: 'urgent',
          category: 'health',
          tags: ['건강', '병원'],
          dueDate: '2025-06-03T10:00:00.000Z', // 과거 날짜 (overdue)
          estimatedMinutes: 180,
        },
        {
          title: '친구 만나기',
          description: '대학 동기들과 모임',
          priority: 'low',
          category: 'personal',
          tags: ['친구', '모임'],
          dueDate: '2025-06-09T18:00:00.000Z',
          estimatedMinutes: 240,
        },
      ]

      for (const todoData of personalTodos) {
        await service.createTodo(todoData)
      }

      // 2. 건강 카테고리 우선순위 정렬
      const healthTodos = await service.getTodos(
        { page: 1, limit: 10 },
        'all',
        undefined,
        undefined,
        'health',
        'priority',
        'desc'
      )

      expect(healthTodos.todos).toHaveLength(2)
      expect(healthTodos.todos[0].priority).toBe('urgent') // 정기검진
      expect(healthTodos.todos[1].priority).toBe('medium') // 운동하기

      // 3. 오늘 해야 할 일들 확인
      const stats = await service.getStats()
      expect(stats.dueToday).toBe(1) // 운동하기
      expect(stats.overdue).toBe(1) // 정기검진

      // 4. 긴급한 일부터 처리 (정기검진 완료)
      const urgentTodos = await service.getTodos(
        { page: 1, limit: 10 },
        'active',
        undefined,
        'urgent'
      )
      expect(urgentTodos.todos).toHaveLength(1)

      await service.updateTodo(urgentTodos.todos[0].id, { completed: true })

      // 5. 태그별 할 일 확인
      const healthTagTodos = await service.getTodosByTag('건강')
      expect(healthTagTodos).toHaveLength(2)

      const learningTagTodos = await service.getTodosByTag('학습')
      expect(learningTagTodos).toHaveLength(1)

      // 6. 모든 태그 목록 확인
      const allTags = await service.getAllTags()
      expect(allTags).toContain('운동')
      expect(allTags).toContain('건강')
      expect(allTags).toContain('독서')
      expect(allTags).toContain('학습')
      expect(allTags).toContain('장보기')
      expect(allTags).toContain('생필품')
      expect(allTags).toContain('병원')
      expect(allTags).toContain('친구')
      expect(allTags).toContain('모임')
    })

    test('팀 작업 대량 관리 시나리오', async () => {
      // 1. 팀 프로젝트 Todo들 생성
      const teamTodos: CreateTodoRequest[] = []

      const members = ['김개발', '이디자인', '박기획']
      const tasks = ['요구사항 분석', 'UI 설계', 'API 개발', '테스트', '문서화']

      for (const member of members) {
        for (const task of tasks) {
          teamTodos.push({
            title: `${member} - ${task}`,
            description: `${member}이 담당하는 ${task} 작업`,
            priority: Math.random() > 0.5 ? 'high' : 'medium',
            category: 'work',
            tags: ['팀프로젝트', member, task],
            dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedMinutes: Math.floor(Math.random() * 300) + 60,
          })
        }
      }

      const createdTodos: Todo[] = []
      for (const todoData of teamTodos) {
        const todo = await service.createTodo(todoData)
        createdTodos.push(todo)
      }

      expect(createdTodos).toHaveLength(15) // 3명 * 5작업

      // 2. 각 멤버별 작업 조회
      for (const member of members) {
        const memberTodos = await service.getTodosByTag(member)
        expect(memberTodos).toHaveLength(5)
      }

      // 3. 높은 우선순위 작업들을 대량으로 긴급으로 변경
      const highPriorityTodos = await service.getTodos(
        { page: 1, limit: 20 },
        'all',
        undefined,
        'high'
      )

      const highPriorityIds = highPriorityTodos.todos.map((todo) => todo.id)
      const bulkUpdated = await service.bulkUpdate(highPriorityIds, {
        priority: 'urgent',
        tags: ['팀프로젝트', '긴급처리'],
      })

      expect(bulkUpdated.length).toBe(highPriorityIds.length)
      for (const todo of bulkUpdated) {
        expect(todo.priority).toBe('urgent')
        expect(todo.tags).toContain('긴급처리')
      }

      // 4. 특정 작업 유형 완료 처리
      const testTodos = await service.getTodosByTag('테스트')
      const testIds = testTodos.map((todo) => todo.id)

      await service.bulkUpdate(testIds, { completed: true })

      // 5. 프로젝트 진행 상황 통계 확인
      const finalStats = await service.getStats()
      expect(finalStats.total).toBe(15)
      expect(finalStats.completed).toBe(testTodos.length) // 실제 테스트 작업 개수
      expect(finalStats.byCategory.work).toBe(15)
      expect(finalStats.byPriority.urgent).toBeGreaterThan(0)

      // 6. 완료되지 않은 긴급 작업들 조회
      const remainingUrgent = await service.getTodos(
        { page: 1, limit: 20 },
        'active',
        undefined,
        'urgent'
      )

      expect(remainingUrgent.todos.every((todo) => !todo.completed)).toBe(true)
      expect(remainingUrgent.todos.every((todo) => todo.priority === 'urgent')).toBe(true)
    })
  })

  describe('복합 필터링 및 정렬 테스트', () => {
    beforeEach(async () => {
      // 복잡한 테스트 데이터 생성
      const complexTodos: CreateTodoRequest[] = [
        // 업무 관련
        {
          title: 'A급 업무',
          priority: 'urgent',
          category: 'work',
          tags: ['중요', '업무'],
          dueDate: '2025-06-01T09:00:00.000Z',
        },
        {
          title: 'B급 업무',
          priority: 'high',
          category: 'work',
          tags: ['업무'],
          dueDate: '2025-06-02T09:00:00.000Z',
        },
        {
          title: 'C급 업무',
          priority: 'medium',
          category: 'work',
          tags: ['업무'],
          dueDate: '2025-06-03T09:00:00.000Z',
        },

        // 개인 관련
        {
          title: 'A급 개인',
          priority: 'high',
          category: 'personal',
          tags: ['중요', '개인'],
          dueDate: '2025-06-01T15:00:00.000Z',
        },
        {
          title: 'B급 개인',
          priority: 'medium',
          category: 'personal',
          tags: ['개인'],
          dueDate: '2025-06-02T15:00:00.000Z',
        },
        {
          title: 'C급 개인',
          priority: 'low',
          category: 'personal',
          tags: ['개인'],
          dueDate: '2025-06-03T15:00:00.000Z',
        },

        // 건강 관련
        {
          title: 'A급 건강',
          priority: 'urgent',
          category: 'health',
          tags: ['중요', '건강'],
          dueDate: '2025-05-30T08:00:00.000Z',
        }, // 과거 (overdue)
        {
          title: 'B급 건강',
          priority: 'medium',
          category: 'health',
          tags: ['건강'],
          dueDate: '2025-06-04T08:00:00.000Z',
        },
      ]

      const createdTodos = []
      for (const todoData of complexTodos) {
        const todo = await service.createTodo(todoData)
        createdTodos.push(todo)
      }

      // 일부 Todo를 완료 상태로 업데이트
      await service.updateTodo(createdTodos[1].id, { completed: true }) // B급 업무
      await service.updateTodo(createdTodos[5].id, { completed: true }) // C급 개인
    })

    test('다중 필터 + 정렬 조합', async () => {
      // 1. 활성 상태 + 중요 태그 + 우선순위 정렬
      const importantActiveTodos = await service.getTodos(
        { page: 1, limit: 10 },
        'active',
        '중요',
        undefined,
        undefined,
        'priority',
        'desc'
      )

      expect(importantActiveTodos.todos).toHaveLength(3) // A급 업무, A급 개인, A급 건강
      expect(importantActiveTodos.todos[0].priority).toBe('urgent')
      expect(importantActiveTodos.todos.every((todo) => !todo.completed)).toBe(true)
      expect(importantActiveTodos.todos.every((todo) => todo.tags.includes('중요'))).toBe(true)

      // 2. 특정 날짜 범위 + 카테고리 + 제목 정렬
      const workInRange = await service.getTodos(
        { page: 1, limit: 10 },
        'all',
        undefined,
        undefined,
        'work',
        'title',
        'asc',
        '2025-06-01T00:00:00.000Z',
        '2025-06-03T23:59:59.999Z'
      )

      expect(workInRange.todos).toHaveLength(3) // A급, B급, C급 업무
      const titles = workInRange.todos.map((todo) => todo.title)
      expect(titles).toEqual(['A급 업무', 'B급 업무', 'C급 업무'])

      // 3. 마감일 정렬 + 상태 필터
      const activeSortedByDueDate = await service.getTodos(
        { page: 1, limit: 10 },
        'active',
        undefined,
        undefined,
        undefined,
        'dueDate',
        'asc'
      )

      // 과거 날짜부터 미래 날짜 순으로 정렬되어야 함
      const activeDueDates = activeSortedByDueDate.todos.map((todo) => todo.dueDate).filter(Boolean)
      expect(activeDueDates[0]).toBe('2025-05-30T08:00:00.000Z') // A급 건강 (과거)
      expect(activeDueDates[activeDueDates.length - 1]).toBe('2025-06-04T08:00:00.000Z') // B급 건강 (최신)
    })

    test('검색어 + 복합 필터링', async () => {
      // 1. "A급" 검색 + 활성 상태
      const aGradeActive = await service.getTodos({ page: 1, limit: 10 }, 'active', 'A급')

      expect(aGradeActive.todos).toHaveLength(3) // A급 업무, A급 개인, A급 건강
      expect(aGradeActive.todos.every((todo) => todo.title.includes('A급'))).toBe(true)
      expect(aGradeActive.todos.every((todo) => !todo.completed)).toBe(true)

      // 2. "업무" 검색 + 완료 상태
      const workCompleted = await service.getTodos({ page: 1, limit: 10 }, 'completed', '업무')

      expect(workCompleted.todos).toHaveLength(1) // B급 업무만
      expect(workCompleted.todos[0].title).toBe('B급 업무')
      expect(workCompleted.todos[0].completed).toBe(true)

      // 3. 태그와 카테고리 동시 필터링
      const personalImportant = await service.getTodos(
        { page: 1, limit: 10 },
        'all',
        '중요',
        undefined,
        'personal'
      )

      expect(personalImportant.todos).toHaveLength(1) // A급 개인만
      expect(personalImportant.todos[0].category).toBe('personal')
      expect(personalImportant.todos[0].tags).toContain('중요')
    })
  })

  describe('대량 데이터 처리 성능 테스트', () => {
    test('100개 Todo 생성 및 조회', async () => {
      const startTime = Date.now()

      // 100개 Todo 생성
      const todos: CreateTodoRequest[] = []
      for (let i = 1; i <= 100; i++) {
        todos.push({
          title: `Todo ${i}`,
          description: `Description for todo ${i}`,
          priority: (['low', 'medium', 'high', 'urgent'] as Priority[])[i % 4],
          category: (['work', 'personal', 'shopping', 'health', 'other'] as Category[])[i % 5],
          tags: [`tag${i % 10}`, `category${i % 5}`],
          dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
          estimatedMinutes: (i % 10) * 30 + 30,
        })
      }

      for (const todoData of todos) {
        await service.createTodo(todoData)
      }

      const creationTime = Date.now() - startTime
      console.log(`100개 Todo 생성 시간: ${creationTime}ms`)

      // 다양한 조회 성능 테스트
      const queryStartTime = Date.now()

      // 1. 전체 조회
      const allTodos = await service.getTodos({ page: 1, limit: 100 })
      expect(allTodos.total).toBe(100)

      // 2. 복합 필터링
      const filtered = await service.getTodos(
        { page: 1, limit: 50 },
        'active',
        'tag1',
        'high',
        'work',
        'priority',
        'desc'
      )

      // 3. 통계 조회
      const stats = await service.getStats()
      expect(stats.total).toBe(100)

      // 4. 태그 조회
      const allTags = await service.getAllTags()
      expect(allTags.length).toBeGreaterThan(0)

      const queryTime = Date.now() - queryStartTime
      console.log(`다양한 조회 작업 시간: ${queryTime}ms`)

      // 성능 기준 (개발 환경에서 합리적인 시간)
      expect(creationTime).toBeLessThan(5000) // 5초 이내
      expect(queryTime).toBeLessThan(1000) // 1초 이내
    })

    test('대량 업데이트 성능', async () => {
      // 50개 Todo 생성
      const todos: Todo[] = []
      for (let i = 1; i <= 50; i++) {
        const todo = await service.createTodo({
          title: `Bulk Test Todo ${i}`,
          priority: 'low',
          category: 'other',
        })
        todos.push(todo)
      }

      const startTime = Date.now()

      // 대량 업데이트
      const ids = todos.map((todo) => todo.id)
      const updated = await service.bulkUpdate(ids, {
        priority: 'high',
        completed: true,
        tags: ['bulk_updated'],
      })

      const updateTime = Date.now() - startTime
      console.log(`50개 Todo 대량 업데이트 시간: ${updateTime}ms`)

      expect(updated).toHaveLength(50)
      expect(updated.every((todo) => todo.priority === 'high')).toBe(true)
      expect(updated.every((todo) => todo.completed === true)).toBe(true)
      expect(updated.every((todo) => todo.tags.includes('bulk_updated'))).toBe(true)

      // 성능 기준
      expect(updateTime).toBeLessThan(2000) // 2초 이내
    })
  })

  describe('엣지 케이스 및 경계값 테스트', () => {
    test('빈 문자열 및 특수 문자 처리', async () => {
      // 특수 문자가 포함된 Todo
      const specialTodo = await service.createTodo({
        title: '특수문자 테스트 !@#$%^&*()',
        description: '줄바꿈\n테스트\t탭\r캐리지리턴',
        tags: ['한글태그', 'English Tag', '123숫자', '!@#특수문자'],
      })

      expect(specialTodo.title).toBe('특수문자 테스트 !@#$%^&*()')
      expect(specialTodo.description).toBe('줄바꿈\n테스트\t탭\r캐리지리턴')
      expect(specialTodo.tags).toHaveLength(4)

      // 검색에서도 정상 동작
      const searchResult = await service.getTodos({ page: 1, limit: 10 }, 'all', '특수문자')
      expect(searchResult.todos).toHaveLength(1)
    })

    test('극한 날짜 값 처리', async () => {
      // 과거와 미래의 극한 날짜
      const pastTodo = await service.createTodo({
        title: '과거 Todo',
        dueDate: '1900-01-01T00:00:00.000Z',
      })

      const futureTodo = await service.createTodo({
        title: '미래 Todo',
        dueDate: '2099-12-31T23:59:59.999Z',
      })

      expect(pastTodo.dueDate).toBe('1900-01-01T00:00:00.000Z')
      expect(futureTodo.dueDate).toBe('2099-12-31T23:59:59.999Z')

      // 날짜 범위 검색
      const veryOldRange = await service.getTodos(
        { page: 1, limit: 10 },
        'all',
        undefined,
        undefined,
        undefined,
        'dueDate',
        'asc',
        '1800-01-01T00:00:00.000Z',
        '1950-01-01T00:00:00.000Z'
      )
      expect(veryOldRange.todos).toHaveLength(1)
    })

    test('최대 길이 제한 테스트', async () => {
      // 200자 제목 (제한 내)
      const maxTitle = 'a'.repeat(200)
      const validTodo = await service.createTodo({
        title: maxTitle,
      })
      expect(validTodo.title).toBe(maxTitle)

      // 매우 긴 설명
      const longDescription = 'Lorem ipsum '.repeat(1000)
      const longDescTodo = await service.createTodo({
        title: '긴 설명 테스트',
        description: longDescription,
      })
      expect(longDescTodo.description).toBe(longDescription)

      // 많은 태그
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag${i}`)
      const manyTagsTodo = await service.createTodo({
        title: '많은 태그 테스트',
        tags: manyTags,
      })
      expect(manyTagsTodo.tags).toHaveLength(50)
    })

    test('동시성 시뮬레이션 (순차 실행)', async () => {
      // 동일한 시간에 여러 작업이 실행되는 상황 시뮬레이션
      const promises: Promise<Todo>[] = []

      // 동시에 여러 Todo 생성
      for (let i = 0; i < 10; i++) {
        promises.push(
          service.createTodo({
            title: `동시 생성 Todo ${i}`,
            priority: 'medium',
          })
        )
      }

      const todos = await Promise.all(promises)
      expect(todos).toHaveLength(10)

      // 모든 ID가 유일한지 확인
      const ids = todos.map((todo: Todo) => todo.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)

      // 동시에 대량 업데이트
      const updatePromises = todos.map((todo: Todo) =>
        service.updateTodo(todo.id, { completed: true })
      )

      const updatedTodos = await Promise.all(updatePromises)
      expect(updatedTodos.every((todo: Todo) => todo.completed)).toBe(true)
    })
  })
})

/**
 * 인메모리 Todo 데이터 스토리지 V2
 * 개발 단계에서 사용하는 임시 저장소 (Enhanced version)
 */
export class InMemoryStorage {
  private data: Map<string, unknown> = new Map();
  private static instance: InMemoryStorage;

  /**
   * 싱글톤 패턴으로 인스턴스 반환
   */
  static getInstance(): InMemoryStorage {
    if (!InMemoryStorage.instance) {
      InMemoryStorage.instance = new InMemoryStorage();
    }
    return InMemoryStorage.instance;
  }

  /**
   * 데이터 생성
   */
  async create<T>(id: string, data: T): Promise<T> {
    this.data.set(id, data);
    return data;
  }

  /**
   * ID로 데이터 조회
   */
  async findById<T>(id: string): Promise<T | undefined> {
    return this.data.get(id) as T | undefined;
  }

  /**
   * 모든 데이터 조회
   */
  async findAll<T>(): Promise<T[]> {
    return Array.from(this.data.values()) as T[];
  }

  /**
   * 데이터 업데이트
   */
  async update<T>(id: string, data: T): Promise<T> {
    this.data.set(id, data);
    return data;
  }

  /**
   * 데이터 삭제
   */
  async delete(id: string): Promise<void> {
    this.data.delete(id);
  }

  /**
   * 전체 개수 조회
   */
  count(): number {
    return this.data.size;
  }

  /**
   * 개발용: 모든 데이터 초기화
   */
  clear(): void {
    this.data.clear();
  }
}

// 싱글톤 인스턴스
export const todoStorage = new InMemoryStorage();

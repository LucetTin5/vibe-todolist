import type { Context } from 'hono'

interface SSEConnection {
  userId: string
  controller: ReadableStreamController<Uint8Array>
  lastActivity: Date
}

interface NotificationPayload {
  type: 'due_soon' | 'overdue' | 'reminder' | 'system'
  message: string
  todo_id?: string
  timestamp: string
  [key: string]: unknown
}

class SSEManager {
  private connections = new Map<string, SSEConnection>()
  private cleanupInterval: Timer | null = null
  private readonly CLEANUP_INTERVAL_MS = 30000 // 30초마다 정리
  private readonly CONNECTION_TIMEOUT_MS = 300000 // 5분 타임아웃

  initialize(): void {
    console.log('Initializing SSE Manager...')

    // 주기적으로 비활성 연결 정리
    this.startCleanupTimer()

    console.log('SSE Manager initialized')
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections()
    }, this.CLEANUP_INTERVAL_MS)
  }

  private cleanupInactiveConnections(): void {
    const now = new Date()
    const connectionsToRemove: string[] = []

    for (const [connectionId, connection] of this.connections) {
      const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime()

      if (timeSinceLastActivity > this.CONNECTION_TIMEOUT_MS) {
        connectionsToRemove.push(connectionId)
      }
    }

    for (const connectionId of connectionsToRemove) {
      console.log(`Removing inactive SSE connection: ${connectionId}`)
      this.removeConnection(connectionId)
    }

    if (connectionsToRemove.length > 0) {
      console.log(`Cleaned up ${connectionsToRemove.length} inactive connections`)
    }
  }

  async createConnection(c: Context, userId: string): Promise<Response> {
    const connectionId = `${userId}_${Date.now()}`

    console.log(`Creating SSE connection for user ${userId} (${connectionId})`)

    const stream = new ReadableStream({
      start: (controller) => {
        // 연결 저장
        this.connections.set(connectionId, {
          userId,
          controller,
          lastActivity: new Date(),
        })

        // 초기 연결 확인 메시지 전송
        this.sendToConnection(controller, {
          type: 'system',
          message: 'SSE connection established',
          timestamp: new Date().toISOString(),
        })

        console.log(`SSE connection established: ${connectionId}`)
      },
      cancel: () => {
        console.log(`SSE connection closed: ${connectionId}`)
        this.removeConnection(connectionId)
      },
    })

    // Keep-alive를 위한 주기적 ping
    const pingInterval = setInterval(() => {
      const connection = this.connections.get(connectionId)
      if (connection) {
        this.sendToConnection(connection.controller, {
          type: 'system',
          message: 'ping',
          timestamp: new Date().toISOString(),
        })
        connection.lastActivity = new Date()
      } else {
        clearInterval(pingInterval)
      }
    }, 30000) // 30초마다 ping

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  }

  private sendToConnection(
    controller: ReadableStreamController<Uint8Array>,
    data: NotificationPayload
  ): void {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(message))
    } catch (error) {
      console.error('Error sending SSE message:', error)
    }
  }

  async sendToUser(userId: string, notification: NotificationPayload): Promise<void> {
    const userConnections = Array.from(this.connections.entries()).filter(
      ([_, connection]) => connection.userId === userId
    )

    if (userConnections.length === 0) {
      console.log(`No active SSE connections for user ${userId}`)
      return
    }

    console.log(`Sending notification to user ${userId} via ${userConnections.length} connections`)

    for (const [connectionId, connection] of userConnections) {
      try {
        this.sendToConnection(connection.controller, notification)
        connection.lastActivity = new Date()
      } catch (error) {
        console.error(`Error sending notification to connection ${connectionId}:`, error)
        this.removeConnection(connectionId)
      }
    }
  }

  broadcast(notification: NotificationPayload): void {
    console.log(`Broadcasting notification to ${this.connections.size} connections`)

    for (const [connectionId, connection] of this.connections) {
      try {
        this.sendToConnection(connection.controller, notification)
        connection.lastActivity = new Date()
      } catch (error) {
        console.error(`Error broadcasting to connection ${connectionId}:`, error)
        this.removeConnection(connectionId)
      }
    }
  }

  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      try {
        connection.controller.close()
      } catch (error) {
        // 이미 닫힌 연결일 수 있음
        console.log(`Connection ${connectionId} was already closed`)
      }
      this.connections.delete(connectionId)
    }
  }

  getActiveConnectionCount(): number {
    return this.connections.size
  }

  getUserConnections(userId: string): number {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.userId === userId
    ).length
  }

  closeAllConnections(): void {
    console.log(`Closing all ${this.connections.size} SSE connections...`)

    for (const [connectionId] of this.connections) {
      this.removeConnection(connectionId)
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    console.log('All SSE connections closed')
  }

  // 디버깅용 연결 상태 조회
  getConnectionsStatus(): Array<{
    connectionId: string
    userId: string
    lastActivity: string
    activeTime: number
  }> {
    const now = new Date()
    return Array.from(this.connections.entries()).map(([connectionId, connection]) => ({
      connectionId,
      userId: connection.userId,
      lastActivity: connection.lastActivity.toISOString(),
      activeTime: now.getTime() - connection.lastActivity.getTime(),
    }))
  }
}

export const sseManager = new SSEManager()

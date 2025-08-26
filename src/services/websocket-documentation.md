# WebSocket Service Documentation

## Tổng quan

WebSocket Service (`src/services/websocket.service.ts`) là module centralized để quản lý kết nối Socket.io với namespace `/topics`. Module này cung cấp type-safe interface cho tất cả vote operations và topic management.

## Bảng mô tả Methods

### Connection Management

| Method | Mô tả | Parameters | Return Type | Throws |
|--------|-------|------------|-------------|--------|
| `connect(userId, username)` | Kết nối tới WebSocket server với authentication | `userId: string, username: string` | `Promise<void>` | Connection timeout, Auth error |
| `disconnect()` | Ngắt kết nối WebSocket | - | `void` | - |
| `getState()` | Lấy trạng thái kết nối hiện tại | - | `Readonly<WebSocketState>` | - |

### Topic Management

| Method | Mô tả | Parameters | Return Type | Throws |
|--------|-------|------------|-------------|--------|
| `joinTopic(topicId)` | Tham gia topic room | `topicId: string` | `Promise<TopicJoinedResponse>` | Not connected, Not authenticated, Join timeout |
| `switchTopic(fromTopicId, toTopicId)` | Chuyển từ topic này sang topic khác | `fromTopicId: string, toTopicId: string` | `Promise<TopicSwitchedResponse>` | Not connected, Not authenticated, Switch timeout |
| `leaveTopic()` | Rời khỏi topic hiện tại | - | `void` | - |

### Vote Operations

| Method | Mô tả | Parameters | Return Type | Throws |
|--------|-------|------------|-------------|--------|
| `castVote(topicId, optionId, action)` | Vote/unvote cho option | `topicId: string, optionId: string, action: 'vote' \| 'unvote'` | `Promise<VoteUpdateResponse>` | Not connected, Not authenticated, Vote timeout |
| `getVoteStatus(topicId)` | Lấy trạng thái vote của user trong topic | `topicId: string` | `Promise<VoteStatusResponse>` | Not connected, Not authenticated, Status timeout |

### Event Subscription

| Method | Mô tả | Parameters | Return Type |
|--------|-------|------------|-------------|
| `subscribeVoteUpdates(handler)` | Subscribe vote update events | `handler: VoteUpdateHandler` | `() => void` (unsubscribe) |
| `subscribeTopicJoined(handler)` | Subscribe topic joined events | `handler: TopicJoinedHandler` | `() => void` (unsubscribe) |
| `subscribeTopicSwitched(handler)` | Subscribe topic switched events | `handler: TopicSwitchedHandler` | `() => void` (unsubscribe) |
| `subscribeVoteStatus(handler)` | Subscribe vote status events | `handler: VoteStatusHandler` | `() => void` (unsubscribe) |
| `subscribeVoteErrors(handler)` | Subscribe vote error events | `handler: VoteErrorHandler` | `() => void` (unsubscribe) |
| `subscribeTopicErrors(handler)` | Subscribe topic error events | `handler: TopicErrorHandler` | `() => void` (unsubscribe) |
| `subscribeConnection(handler)` | Subscribe connection state changes | `handler: ConnectionHandler` | `() => void` (unsubscribe) |
| `subscribeErrors(handler)` | Subscribe general errors | `handler: ErrorHandler` | `() => void` (unsubscribe) |

## Event Mapping

### Client → Server Events

| Event | Payload Type | Mô tả |
|-------|--------------|-------|
| `topic:join` | `TopicJoinPayload` | Tham gia topic room |
| `topic:switch` | `TopicSwitchPayload` | Chuyển topic |
| `vote:cast` | `VoteCastPayload` | Vote/unvote option |
| `vote:status` | `VoteStatusPayload` | Lấy trạng thái vote |

### Server → Client Events

| Event | Response Type | Mô tả |
|-------|---------------|-------|
| `topic:joined` | `TopicJoinedResponse` | Xác nhận đã tham gia topic |
| `topic:switched` | `TopicSwitchedResponse` | Xác nhận đã chuyển topic |
| `vote:update` | `VoteUpdateResponse` | Cập nhật vote real-time |
| `vote:status_response` | `VoteStatusResponse` | Trả về trạng thái vote |
| `error:vote` | `VoteErrorResponse` | Lỗi vote operation |
| `error:topic` | `TopicErrorResponse` | Lỗi topic operation |

## Type Definitions

### Core Payload Types

```typescript
interface TopicJoinPayload {
  topicId: string
  userId: string
  username: string
}

interface VoteCastPayload {
  topicId: string
  optionId: string
  userId: string
  username: string
  action: 'vote' | 'unvote'
}
```

### Response Types

```typescript
interface VoteUpdateResponse {
  topicId: string
  optionId: string
  voteCount: number
  action: 'vote' | 'unvote'
  userId: string
  username: string
  timestamp: string
  userVoteStatus: {
    votedOptions: string[]
    totalVotes: number
  }
}

interface TopicJoinedResponse {
  topicId: string
  userCount: number
  topicData: {
    id: string
    title: string
    description?: string
    isActive: boolean
    voteType: 'single' | 'multiple'
    startDate: string
    endDate: string
  }
  options: IOption[]
  userVoteStatus: {
    votedOptions: string[]
    totalVotes: number
    lastVoteTime?: string
  }
}
```

## Usage Examples

### Basic Connection

```typescript
import { webSocketService } from '@/services/websocket.service'

// Connect to WebSocket
await webSocketService.connect('user123', 'john_doe')

// Join a topic
const topicData = await webSocketService.joinTopic('topic456')
console.log('Joined topic:', topicData.topicData.title)
```

### Vote Operations

```typescript
// Cast a vote
const voteResult = await webSocketService.castVote('topic456', 'option789', 'vote')
console.log('Vote count:', voteResult.voteCount)

// Get vote status
const status = await webSocketService.getVoteStatus('topic456')
console.log('User voted options:', status.userVoteStatus.votedOptions)
```

### Event Subscription

```typescript
// Subscribe to vote updates
const unsubscribeVotes = webSocketService.subscribeVoteUpdates((data) => {
  console.log('Vote update:', data)
  // Update UI with new vote count
})

// Subscribe to connection changes
const unsubscribeConnection = webSocketService.subscribeConnection((connected) => {
  console.log('Connection status:', connected)
})

// Cleanup
unsubscribeVotes()
unsubscribeConnection()
```

### Error Handling

```typescript
// Subscribe to vote errors
webSocketService.subscribeVoteErrors((error) => {
  console.error('Vote error:', error.message)
  // Show error message to user
})

// Subscribe to general errors
webSocketService.subscribeErrors((error) => {
  console.error('WebSocket error:', error.message)
  // Handle connection errors
})
```

## Reconnection Logic

Service tự động thực hiện reconnection với exponential backoff:

- **Max attempts**: 5 lần
- **Initial delay**: 1 giây
- **Backoff strategy**: Exponential (1s, 2s, 4s, 8s, 16s)
- **Auto rejoin**: Tự động rejoin topic sau khi reconnect thành công

## Integration với Pinia Stores

Service được thiết kế để tách biệt hoàn toàn khỏi Pinia stores:

```typescript
// Trong Pinia store
import { webSocketService } from '@/services/websocket.service'

export const useVoteStore = defineStore('vote', () => {
  // Sử dụng webSocketService thay vì trực tiếp Socket.io
  const castVote = async (topicId: string, optionId: string) => {
    try {
      const result = await webSocketService.castVote(topicId, optionId, 'vote')
      // Update local state
      return result
    } catch (error) {
      // Handle error
      throw error
    }
  }
  
  return { castVote }
})
```

## Configuration

### Environment Variables

- `NODE_ENV`: 'production' hoặc 'development'
- Production: Sử dụng `window.location.origin`
- Development: Sử dụng `http://localhost:8000`

### Server Requirements

- Socket.io server với namespace `/topics`
- Authentication middleware
- Event handlers cho tất cả events được định nghĩa
- CORS configuration cho WebSocket connections

## Testing

Service có thể được test dễ dàng bằng cách mock Socket.io client:

```typescript
// Mock test example
const mockSocket = {
  connected: true,
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn()
}

// Test connection
// Test vote operations
// Test event subscriptions
```

## Performance Considerations

- **Connection pooling**: Single connection per application instance
- **Event cleanup**: Automatic cleanup khi component unmount
- **Memory management**: Event handlers được quản lý tự động
- **Error boundaries**: Comprehensive error handling và recovery

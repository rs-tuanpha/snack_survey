# Socket.IO API Documentation

## Overview

This document describes the WebSocket API for real-time voting functionality in the SnackSurveyMaster application. The WebSocket implementation provides instant vote updates, user presence tracking, and real-time collaboration features.

## Connection

### Base URL
```
ws://localhost:3000
```

### Namespaces

#### `/topics` - Topic-based Voting
Primary namespace for topic-related operations including voting, user presence, and real-time updates.

## Authentication

All WebSocket connections require authentication via JWT token:

```javascript
const socket = io('ws://localhost:3000/topics', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

## Events

### Client → Server Events

#### `topic:join`
Join a topic room and start receiving real-time updates.

**Payload:**
```typescript
{
  topicId: string;        // MongoDB ObjectId of the topic
  userId: string;         // MongoDB ObjectId of the user
  username: string;       // Display name of the user
}
```

**Example:**
```javascript
socket.emit('topic:join', {
  topicId: '60d21b4667d0d8992e610c85',
  userId: '60d21b4667d0d8992e610c84',
  username: 'johndoe'
});
```

**Response Events:**
- `topic:joined` - Success confirmation
- `error` - Error occurred

---

#### `topic:switch`
Switch from one topic room to another.

**Payload:**
```typescript
{
  fromTopicId: string;    // Current topic ID
  toTopicId: string;      // Target topic ID
  userId: string;         // MongoDB ObjectId of the user
}
```

**Example:**
```javascript
socket.emit('topic:switch', {
  fromTopicId: '60d21b4667d0d8992e610c85',
  toTopicId: '60d21b4667d0d8992e610c86',
  userId: '60d21b4667d0d8992e610c84'
});
```

**Response Events:**
- `topic:switched` - Success confirmation
- `error` - Error occurred

---

#### `vote:cast`
Cast a vote for an option in the current topic.

**Payload:**
```typescript
{
  topicId: string;        // MongoDB ObjectId of the topic
  optionId: string;       // MongoDB ObjectId of the option
  userId: string;         // MongoDB ObjectId of the user
  action: 'vote' | 'unvote';  // Vote action type
}
```

**Example:**
```javascript
socket.emit('vote:cast', {
  topicId: '60d21b4667d0d8992e610c85',
  optionId: '60d21b4667d0d8992e610c86',
  userId: '60d21b4667d0d8992e610c84',
  action: 'vote'
});
```

**Response Events:**
- `vote:success` - Vote recorded successfully
- `vote:update` - Real-time vote count update
- `error` - Error occurred

---

#### `vote:status`
Request current voting status for the user in the topic.

**Payload:**
```typescript
{
  topicId: string;        // MongoDB ObjectId of the topic
  userId: string;         // MongoDB ObjectId of the user
}
```

**Example:**
```javascript
socket.emit('vote:status', {
  topicId: '60d21b4667d0d8992e610c85',
  userId: '60d21b4667d0d8992e610c84'
});
```

**Response Events:**
- `vote:status:response` - Current voting status
- `error` - Error occurred

---

### Server → Client Events

#### `topic:joined`
Confirmation that user has successfully joined a topic room.

**Payload:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    topicId: string;
    userCount: number;        // Number of users in the room
    topicData: {
      id: string;
      title: string;
      description: string;
      isActive: boolean;
      votingType: 'single' | 'multiple';
      timeLimit?: number;     // Time limit in minutes
      createdAt: string;
      updatedAt: string;
    };
  };
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('topic:joined', (data) => {
  console.log(`Joined topic: ${data.data.topicData.title}`);
  console.log(`Users in room: ${data.data.userCount}`);
});
```

---

#### `topic:switched`
Confirmation that user has successfully switched topic rooms.

**Payload:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    fromTopicId: string;
    toTopicId: string;
    userCount: number;        // Number of users in new room
  };
  timestamp: string;
}
```

---

#### `vote:success`
Confirmation that a vote has been recorded successfully.

**Payload:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    topicId: string;
    optionId: string;
    userId: string;
    action: 'vote' | 'unvote';
    voteCount: number;        // New vote count for the option
    userHasVoted: boolean;    // Whether user has voted for this option
  };
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('vote:success', (data) => {
  console.log(`Vote ${data.data.action} successful`);
  console.log(`New vote count: ${data.data.voteCount}`);
});
```

---

#### `vote:update`
Real-time vote count update broadcasted to all users in the topic room.

**Payload:**
```typescript
{
  topicId: string;
  optionId: string;
  voteCount: number;          // Updated vote count
  action: 'vote' | 'unvote';
  userId: string;             // User who performed the action
  username: string;           // Display name of the user
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('vote:update', (data) => {
  // Update UI with new vote count
  updateOptionVoteCount(data.optionId, data.voteCount);
  
  // Show notification
  showNotification(`${data.username} ${data.action}d an option`);
});
```

---

#### `vote:status:response`
Response to a vote status request.

**Payload:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    userId: string;
    topicId: string;
    votedOptions: string[];   // Array of option IDs user has voted for
    lastVoteTime: string | null;
    totalVotes: number;       // Total votes cast by user in this topic
  };
  timestamp: string;
}
```

---

#### `user:joined`
Notification when a new user joins the topic room.

**Payload:**
```typescript
{
  topicId: string;
  userId: string;
  username: string;
  userCount: number;          // Total users in room
  timestamp: string;
}
```

---

#### `user:left`
Notification when a user leaves the topic room.

**Payload:**
```typescript
{
  topicId: string;
  userId: string;
  username: string;
  userCount: number;          // Total users in room
  timestamp: string;
}
```

---

#### `topic:stats`
Periodic statistics update for the topic.

**Payload:**
```typescript
{
  topicId: string;
  stats: {
    totalVotes: number;       // Total votes across all options
    totalParticipants: number; // Number of unique voters
    activeUsers: number;      // Users currently in room
    votingRate: number;       // Percentage of users who have voted
    timeRemaining?: number;   // Time remaining in minutes (if applicable)
  };
  timestamp: string;
}
```

---

#### `error`
Error notification for any failed operation.

**Payload:**
```typescript
{
  success: false;
  message: string;
  error: string;              // Error type/code
  details?: any;              // Additional error details
  timestamp: string;
}
```

**Common Error Types:**
- `AuthenticationError` - Invalid or missing JWT token
- `ValidationError` - Invalid payload data
- `TopicNotFoundError` - Topic doesn't exist
- `OptionNotFoundError` - Option doesn't exist
- `VotingNotAllowedError` - Voting is not allowed (topic closed, expired, etc.)
- `PermissionError` - User doesn't have permission for the action

---

## Connection Flow

### 1. Initial Connection
```javascript
const socket = io('ws://localhost:3000/topics', {
  auth: {
    token: localStorage.getItem('jwt-token')
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});
```

### 2. Join Topic
```javascript
socket.emit('topic:join', {
  topicId: '60d21b4667d0d8992e610c85',
  userId: '60d21b4667d0d8992e610c84',
  username: 'johndoe'
});

socket.on('topic:joined', (data) => {
  // Initialize UI with topic data
  initializeTopicUI(data.data.topicData);
  updateUserCount(data.data.userCount);
});
```

### 3. Cast Vote
```javascript
socket.emit('vote:cast', {
  topicId: '60d21b4667d0d8992e610c85',
  optionId: '60d21b4667d0d8992e610c86',
  userId: '60d21b4667d0d8992e610c84',
  action: 'vote'
});

socket.on('vote:success', (data) => {
  // Update UI to reflect user's vote
  updateUserVoteStatus(data.data.optionId, data.data.userHasVoted);
});

socket.on('vote:update', (data) => {
  // Update vote count for all users
  updateVoteCount(data.optionId, data.voteCount);
});
```

### 4. Handle Disconnection
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Show reconnection UI
  showReconnectionUI();
});

socket.on('reconnect', () => {
  console.log('Reconnected');
  // Rejoin topic and sync state
  socket.emit('topic:join', {
    topicId: currentTopicId,
    userId: currentUserId,
    username: currentUsername
  });
});
```

## Error Handling

### Common Error Scenarios

1. **Authentication Failure**
```javascript
socket.on('error', (error) => {
  if (error.error === 'AuthenticationError') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

2. **Topic Not Found**
```javascript
socket.on('error', (error) => {
  if (error.error === 'TopicNotFoundError') {
    // Show error message and redirect
    showError('Topic not found');
    window.location.href = '/topics';
  }
});
```

3. **Voting Not Allowed**
```javascript
socket.on('error', (error) => {
  if (error.error === 'VotingNotAllowedError') {
    // Disable voting UI
    disableVotingUI();
    showMessage('Voting is not allowed for this topic');
  }
});
```

## Best Practices

### 1. Connection Management
- Always check connection status before emitting events
- Implement automatic reconnection with exponential backoff
- Handle network interruptions gracefully

### 2. State Synchronization
- Request vote status after reconnection
- Sync UI state with server state
- Handle race conditions in vote updates

### 3. User Experience
- Show loading states during vote operations
- Provide immediate feedback for user actions
- Display real-time user presence and activity

### 4. Performance
- Limit the number of concurrent connections per user
- Implement client-side rate limiting for vote operations
- Use efficient data structures for real-time updates

## Client Implementation Example

```javascript
class VotingWebSocket {
  constructor(token) {
    this.socket = io('ws://localhost:3000/topics', {
      auth: { token }
    });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('disconnect', this.onDisconnect.bind(this));
    this.socket.on('topic:joined', this.onTopicJoined.bind(this));
    this.socket.on('vote:update', this.onVoteUpdate.bind(this));
    this.socket.on('error', this.onError.bind(this));
  }

  joinTopic(topicId, userId, username) {
    this.socket.emit('topic:join', { topicId, userId, username });
  }

  castVote(topicId, optionId, userId, action) {
    this.socket.emit('vote:cast', { topicId, optionId, userId, action });
  }

  onVoteUpdate(data) {
    // Update UI with new vote count
    this.updateVoteCount(data.optionId, data.voteCount);
  }

  onError(error) {
    console.error('WebSocket error:', error);
    // Handle error appropriately
  }
}
```

## Security Considerations

1. **Authentication**: All connections require valid JWT tokens
2. **Authorization**: Users can only vote in topics they have access to
3. **Rate Limiting**: Server implements rate limiting for vote operations
4. **Input Validation**: All payloads are validated before processing
5. **Error Handling**: Sensitive information is not exposed in error messages

## Monitoring and Debugging

### Connection Status
```javascript
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);
```

### Event Logging
```javascript
// Log all emitted events
const originalEmit = socket.emit;
socket.emit = function(event, ...args) {
  console.log('Emitting:', event, args);
  return originalEmit.apply(this, [event, ...args]);
};

// Log all received events
socket.onAny((event, ...args) => {
  console.log('Received:', event, args);
});
```

---

*Last updated: December 2025*
*Version: 1.0.0*

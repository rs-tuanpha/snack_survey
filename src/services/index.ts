/**
 * Services Index
 * Central export point for all services with TanStack Query integration
 */

// ============================================================================
// CORE SERVICES
// ============================================================================

// Authentication service (no TanStack Query - handled by auth store)
export { default as authService } from './auth.service'

// ============================================================================
// DATA SERVICES WITH TANSTACK QUERY
// ============================================================================

// Topic service
export { default as topicService } from './topic.service'
export * from './topic.service'

// Option service
export { default as optionService } from './option.service'
export * from './option.service'

// Vote service
export { default as voteService } from './vote.service'
export {
  useVoteStatus,
  useVotingStats,
  useVote,
  useUnvote,
  // useToggleVote, // Removed - doesn't exist
  vote,
  unvote,
  getVoteStatus,
  getVotingStats,
  toggleVote,
  hasUserVoted
} from './vote.service'

// User service
export { default as userService } from './user.service'
export {
  useUsersList,
  useUser,
  useUserProfile,
  useUpdateUser,
  useUpdateUserRole,
  useDeleteUser,
  getUsersList,
  getUserById,
  getCurrentUserProfile,
  updateUser,
  updateUserRole,
  deleteUser,
} from './user.service'

// Stats service
export { default as statsService } from './stats.service'
export {
  useVotingStats as useStatsVotingStats,
  getVotingStats as getStatsVotingStats,
} from './stats.service'

// Error handling service
export { default as errorService } from './error.service'
export * from './error.service'

// ============================================================================
// UTILITY SERVICES
// ============================================================================

// Upload service (no TanStack Query needed)
export * from './upload.service'

// WebSocket service (no TanStack Query needed)
export * from './websocket.service'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export commonly used types for convenience
export type { ITopic } from '@/core/interfaces/model/topic'
export type { IOption } from '@/core/interfaces/model/option'
export type { IUser } from '@/core/interfaces/model/user'

// Re-export API types
export type {
  Topic,
  CreateTopicRequest,
  UpdateTopicRequest,
  TopicResponse,
  TopicListResponse,
  Option,
  CreateOptionRequest,
  UpdateOptionRequest,
  OptionResponse,
  OptionListResponse,
  User,
  UserResponse,
  UserListResponse,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  VotingStatusResponse,
  VotingStatsResponse,
  queryKeys
} from '@/types/api'

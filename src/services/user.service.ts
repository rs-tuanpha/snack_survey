import api from '@/core/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type {
  User,
  UserResponse,
  UserListResponse,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserTeamRequest
} from '@/types/api'
import { queryKeys } from '@/types/api'

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Get list of users with pagination
 */
export function useUsersList(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => getUsersList(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Get user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Get current user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: getCurrentUserProfile,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Update user information
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserRequest }) =>
      updateUser(userId, userData),
    onSuccess: (_, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to update user:', error)
    },
  })
}

/**
 * Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleData }: { userId: string; roleData: UpdateUserRoleRequest }) =>
      updateUserRole(userId, roleData),
    onSuccess: (_, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to update user role:', error)
    },
  })
}

/**
 * Update user team
 */
export function useUpdateUserTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, teamData }: { userId: string; teamData: UpdateUserTeamRequest }) =>
      updateUserTeam(userId, teamData),
    onSuccess: (_, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to update user team:', error)
    },
  })
}

/**
 * Delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_, userId) => {
      // Remove user from cache and invalidate lists
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to delete user:', error)
    },
  })
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Get list of users with pagination
 */
export async function getUsersList(params: { page?: number; limit?: number } = {}): Promise<User[]> {
  try {
    const response = await api.get<UserListResponse>('/api/users', { params })
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User> {
  try {
    const response = await api.get<UserResponse>(`/api/users/${userId}`)
    return response.data.data
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error)
    throw error
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<User> {
  try {
    const response = await api.get<UserResponse>('/api/users/profile')
    return response.data.data
  } catch (error) {
    console.error('Error fetching current user profile:', error)
    throw error
  }
}

/**
 * Update user information
 */
export async function updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
  try {
    const response = await api.put<UserResponse>(`/api/users/${userId}`, userData)
    return response.data.data
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error)
    throw error
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, roleData: UpdateUserRoleRequest): Promise<User> {
  try {
    const response = await api.patch<UserResponse>(`/api/users/${userId}/role`, roleData)
    return response.data.data
  } catch (error) {
    console.error(`Error updating user role ${userId}:`, error)
    throw error
  }
}

/**
 * Update user team
 */
export async function updateUserTeam(userId: string, teamData: UpdateUserTeamRequest): Promise<User> {
  try {
    const response = await api.patch<UserResponse>(`/api/users/${userId}/team`, teamData)
    return response.data.data
  } catch (error) {
    console.error(`Error updating user team ${userId}:`, error)
    throw error
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await api.delete(`/api/users/${userId}`)
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // TanStack Query hooks
  useUsersList,
  useUser,
  useUserProfile,
  useUpdateUser,
  useUpdateUserRole,
  useUpdateUserTeam,
  useDeleteUser,

  // API service functions
  getUsersList,
  getUserById,
  getCurrentUserProfile,
  updateUser,
  updateUserRole,
  updateUserTeam,
  deleteUser,
}

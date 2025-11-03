import api from '@/core/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import type {
  User,
  UserResponse,
  UserListResponse,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  CreateUserRequest,
  UpdateUserStatusRequest,
  AdminResetPasswordRequest
} from '@/types/api'
import { queryKeys } from '@/types/api'

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Get list of users with pagination, search and filter (Admin only)
 */
export function useUsersList(params: { page?: number; limit?: number; search?: string; isActive?: boolean } | (() => { page?: number; limit?: number; search?: string; isActive?: boolean }) = {}) {
  // Handle both direct object and getter function (for computed refs)
  const getParams = typeof params === 'function' ? params : () => params
  
  return useQuery({
    queryKey: computed(() => queryKeys.users.list(getParams())),
    queryFn: () => getUsersList(getParams()),
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

/**
 * Create a new user (Admin only)
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: CreateUserRequest) => createUser(userData),
    onSuccess: () => {
      // Invalidate user lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to create user:', error)
    },
  })
}

/**
 * Toggle user status (enable/disable) (Admin only)
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, statusData }: { userId: string; statusData: UpdateUserStatusRequest }) =>
      toggleUserStatus(userId, statusData),
    onSuccess: (_, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to toggle user status:', error)
    },
  })
}

/**
 * Admin reset user password (Admin only)
 */
export function useAdminResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, resetData }: { userId: string; resetData: AdminResetPasswordRequest }) =>
      adminResetPassword(userId, resetData),
    onSuccess: (_, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
    onError: (error) => {
      console.error('Failed to reset password:', error)
    },
  })
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Get list of users with pagination, search and filter (Admin only)
 */
export async function getUsersList(params: { page?: number; limit?: number; search?: string; isActive?: boolean } = {}): Promise<UserListResponse> {
  try {
    const response = await api.get<UserListResponse>('/api/users', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      message: 'Failed to fetch users',
      timestamp: new Date().toISOString(),
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
      }
    }
  }
}

/**
 * Get list of active users for login page (Public endpoint, no auth required)
 */
export async function getActiveUsersForLogin(params: { page?: number; limit?: number } = {}): Promise<User[]> {
  try {
    const response = await api.get<UserListResponse>('/api/auth/users', { params })
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching active users for login:', error)
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

/**
 * Create a new user (Admin only)
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    const response = await api.post<UserResponse>('/api/users', userData)
    return response.data.data
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Toggle user status (enable/disable) (Admin only)
 */
export async function toggleUserStatus(userId: string, statusData: UpdateUserStatusRequest): Promise<User> {
  try {
    const response = await api.put<UserResponse>(`/api/users/${userId}/status`, statusData)
    return response.data.data
  } catch (error) {
    console.error(`Error toggling user status ${userId}:`, error)
    throw error
  }
}

/**
 * Admin reset user password (Admin only)
 */
export async function adminResetPassword(userId: string, resetData: AdminResetPasswordRequest): Promise<User> {
  try {
    const response = await api.post<UserResponse>(`/api/users/${userId}/reset-password`, resetData)
    return response.data.data
  } catch (error) {
    console.error(`Error resetting password for user ${userId}:`, error)
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
  useDeleteUser,
  useCreateUser,
  useToggleUserStatus,
  useAdminResetPassword,

  // API service functions
  getUsersList,
  getUserById,
  getCurrentUserProfile,
  updateUser,
  updateUserRole,
  deleteUser,
  createUser,
  toggleUserStatus,
  adminResetPassword,
}

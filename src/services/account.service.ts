import type { IAccountModel } from '@/core/interfaces/model/user'
import { supabase } from '@/plugins/supabase'

/**
 * Retrieves all account documents from the database.
 * @returns {Promise<IAccountModel[] | null>} A promise that resolves to an array of account models or null if an error occurs.
 */
export const getAccounts = async (): Promise<IAccountModel[] | null> => {
  const { data, error } = await supabase.from('account').select('*')
  if (error) {
    console.error(error)
    return null
  }
  return data as IAccountModel[]
}

/**
 * Retrieves a single account by its ID.
 * @param {string} accountId - The unique identifier of the account.
 * @returns {Promise<IAccountModel | null>} A promise that resolves to the account model or null if not found or an error occurs.
 */
export const getAccountById = async (accountId: string): Promise<IAccountModel | null> => {
  const { data, error } = await supabase.from('account').select('*').eq('user_id', accountId)
  if (error) {
    console.error(error)
    return null
  }
  return data[0] as IAccountModel
}

/**
 * Updates the password for the currently authenticated user.
 * @param {string} password - The new password to set.
 * @returns {Promise<any>} A promise that resolves to the result of the password update operation.
 */
export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({ password })
}

export const sendPasswordResetEmail = async (email: string) => {
  try {
    // Generate a random reset token
    const resetToken = crypto.randomUUID()

    // Create a password reset record in your database
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.SUPABASE_URL}/auth/reset-password?reset_token=${resetToken}`
    })

    // Return a success message
    return 'Password reset email sent successfully'
  } catch (error) {
    console.error(error)
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Authenticates a user with their email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<any>} A promise that resolves to the result of the authentication attempt.
 */
export const login = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

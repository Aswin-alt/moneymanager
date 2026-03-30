import axiosClient from './axiosClient'
import type { UserResponse } from '../types/auth'

export interface UserUpdateRequest {
  displayName?: string
  defaultCurrency?: string
  avatarUrl?: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export const getProfile = (): Promise<UserResponse> =>
  axiosClient.get('/users/me').then((r) => r.data)

export const updateProfile = (data: UserUpdateRequest): Promise<UserResponse> =>
  axiosClient.put('/users/me', data).then((r) => r.data)

export const changePassword = (data: PasswordChangeRequest): Promise<void> =>
  axiosClient.put('/users/me/password', data).then(() => undefined)

export const deleteMyAccount = (): Promise<void> =>
  axiosClient.delete('/users/me').then(() => undefined)

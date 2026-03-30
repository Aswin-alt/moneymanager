import axiosClient from './axiosClient'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'

export const loginApi = (data: LoginRequest): Promise<AuthResponse> =>
  axiosClient.post<AuthResponse>('/auth/login', data).then((res) => res.data)

export const registerApi = (data: RegisterRequest): Promise<AuthResponse> =>
  axiosClient.post<AuthResponse>('/auth/register', data).then((res) => res.data)

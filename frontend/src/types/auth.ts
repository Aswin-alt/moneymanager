export interface UserResponse {
  id: number
  email: string
  displayName: string
  defaultCurrency: string
  avatarUrl: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  defaultCurrency?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

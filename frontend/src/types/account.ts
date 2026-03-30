export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CRYPTO' | 'CASH'

export interface AccountResponse {
  id: number
  name: string
  accountType: AccountType
  currency: string
  balance: number
  institution: string | null
  accountNumberMasked: string | null
  isActive: boolean
  createdAt: string
}

export interface AccountRequest {
  name: string
  accountType: AccountType
  currency: string
  initialBalance: number
  institution?: string
  accountNumberMasked?: string
}

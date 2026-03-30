export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface TransactionResponse {
  id: number
  accountId: number
  accountName: string
  categoryId: number | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  amount: number
  currency: string
  convertedAmount: number | null
  transactionType: TransactionType
  merchant: string | null
  description: string | null
  transactionDate: string
  isRecurring: boolean
  isAutoCategorized: boolean
  tags: string | null
  createdAt: string
}

export interface TransactionRequest {
  accountId: number
  categoryId?: number
  amount: number
  currency: string
  transactionType: TransactionType
  merchant?: string
  description?: string
  transactionDate: string
  toAccountId?: number
  tags?: string
}

export interface TransactionFilters {
  page?: number
  size?: number
  from?: string
  to?: string
  categoryId?: number
  accountId?: number
  type?: TransactionType
  search?: string
}

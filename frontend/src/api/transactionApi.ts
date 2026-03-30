import axiosClient from './axiosClient'
import type { TransactionResponse, TransactionRequest, TransactionFilters } from '../types/transaction'
import type { PageResponse } from '../types/common'

export const getTransactions = (filters: TransactionFilters = {}): Promise<PageResponse<TransactionResponse>> => {
  const params: Record<string, string | number> = {}
  if (filters.page !== undefined) params.page = filters.page
  if (filters.size !== undefined) params.size = filters.size
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.categoryId !== undefined) params.categoryId = filters.categoryId
  if (filters.accountId !== undefined) params.accountId = filters.accountId
  if (filters.type) params.type = filters.type
  if (filters.search) params.search = filters.search
  return axiosClient.get('/transactions', { params }).then((r) => r.data)
}

export const getTransaction = (id: number): Promise<TransactionResponse> =>
  axiosClient.get(`/transactions/${id}`).then((r) => r.data)

export const createTransaction = (data: TransactionRequest): Promise<TransactionResponse> =>
  axiosClient.post('/transactions', data).then((r) => r.data)

export const updateTransaction = (id: number, data: TransactionRequest): Promise<TransactionResponse> =>
  axiosClient.put(`/transactions/${id}`, data).then((r) => r.data)

export const deleteTransaction = (id: number): Promise<void> =>
  axiosClient.delete(`/transactions/${id}`).then(() => undefined)

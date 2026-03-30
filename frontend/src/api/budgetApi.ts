import axiosClient from './axiosClient'
import type { BudgetSummaryResponse, BudgetRequest } from '../types/budget'

export const getBudgets = (month?: string): Promise<BudgetSummaryResponse[]> =>
  axiosClient.get('/budgets', { params: month ? { month } : {} }).then((r) => r.data)

export const createBudget = (data: BudgetRequest): Promise<BudgetSummaryResponse> =>
  axiosClient.post('/budgets', data).then((r) => r.data)

export const updateBudget = (id: number, data: BudgetRequest): Promise<BudgetSummaryResponse> =>
  axiosClient.put(`/budgets/${id}`, data).then((r) => r.data)

export const deleteBudget = (id: number): Promise<void> =>
  axiosClient.delete(`/budgets/${id}`).then(() => undefined)

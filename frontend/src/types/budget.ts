export type BudgetStatus = 'UNDER' | 'NEAR' | 'OVER'

export interface BudgetSummaryResponse {
  budgetId: number
  categoryId: number
  categoryName: string
  categoryIcon: string
  categoryColor: string
  monthYear: string
  limitAmount: number
  spentAmount: number
  remainingAmount: number
  percentUsed: number
  currency: string
  status: BudgetStatus
}

export interface BudgetRequest {
  categoryId: number
  monthYear: string
  limitAmount: number
  currency: string
  alertAt80: boolean
  alertAt100: boolean
}

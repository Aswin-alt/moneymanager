export type CategoryType = 'INCOME' | 'EXPENSE'

export interface CategoryResponse {
  id: number
  name: string
  icon: string
  color: string
  categoryType: CategoryType
  parentId: number | null
  parentName: string | null
  isSystem: boolean
  sortOrder: number
}

export interface CategoryRequest {
  name: string
  icon: string
  color: string
  categoryType: CategoryType
  parentId?: number
}

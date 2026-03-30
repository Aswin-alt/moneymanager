import axiosClient from './axiosClient'
import type { CategoryResponse, CategoryRequest, CategoryType } from '../types/category'

export const getCategories = (type?: CategoryType): Promise<CategoryResponse[]> =>
  axiosClient.get('/categories', { params: type ? { type } : {} }).then((r) => r.data)

export const createCategory = (data: CategoryRequest): Promise<CategoryResponse> =>
  axiosClient.post('/categories', data).then((r) => r.data)

export const updateCategory = (id: number, data: CategoryRequest): Promise<CategoryResponse> =>
  axiosClient.put(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number): Promise<void> =>
  axiosClient.delete(`/categories/${id}`).then(() => undefined)

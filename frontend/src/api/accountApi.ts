import axiosClient from './axiosClient'
import type { AccountResponse, AccountRequest } from '../types/account'

export const getAccounts = (): Promise<AccountResponse[]> =>
  axiosClient.get('/accounts').then((r) => r.data)

export const getAccount = (id: number): Promise<AccountResponse> =>
  axiosClient.get(`/accounts/${id}`).then((r) => r.data)

export const createAccount = (data: AccountRequest): Promise<AccountResponse> =>
  axiosClient.post('/accounts', data).then((r) => r.data)

export const updateAccount = (id: number, data: AccountRequest): Promise<AccountResponse> =>
  axiosClient.put(`/accounts/${id}`, data).then((r) => r.data)

export const deleteAccount = (id: number): Promise<void> =>
  axiosClient.delete(`/accounts/${id}`).then(() => undefined)

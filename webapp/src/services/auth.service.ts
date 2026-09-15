import { endpoints } from './apiEndpoints'; import { get, post } from './api';
export const login = (body: unknown) => post(endpoints.auth.login, body); export const register = (body: unknown) => post(endpoints.auth.register, body); export const me = () => get(endpoints.auth.me);

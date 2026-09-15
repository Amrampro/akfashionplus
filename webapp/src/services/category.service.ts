import { endpoints } from './apiEndpoints'; import { get } from './api'; export const getCategories = () => get(endpoints.categories);

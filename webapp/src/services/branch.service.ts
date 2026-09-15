import { endpoints } from './apiEndpoints'; import { get } from './api'; export const getBranches = () => get(endpoints.branches);

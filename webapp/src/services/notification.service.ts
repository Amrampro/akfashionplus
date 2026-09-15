import { endpoints } from './apiEndpoints'; import { get } from './api'; export const getNotifications = () => get(endpoints.notifications);

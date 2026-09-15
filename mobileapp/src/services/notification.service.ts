import { get, put } from "./api";
import { endpoints } from "./apiEndpoints";

export const getNotifications = <T = unknown>() =>
  get<T>(endpoints.notifications);

export const markNotificationRead = (id: number) =>
  put(`${endpoints.notifications}/${id}/read`);

export const markAllNotificationsRead = () =>
  put(`${endpoints.notifications}/read-all`);

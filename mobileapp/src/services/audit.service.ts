import { endpoints } from './apiEndpoints'; import { get } from './api'; export const getAuditLogs = () => get(endpoints.admin('audit_logs'));

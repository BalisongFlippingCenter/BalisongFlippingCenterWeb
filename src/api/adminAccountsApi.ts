import { axiosApiInstanceAuth } from "./axios";

export interface AdminAccountSummary {
  id: string;
  email: string;
  displayName: string;
  identifierCode: string;
  role: string;
  accountCreationDate: string;
  banned: boolean;
  banReason: string | null;
  suspendedUntil: string | null;
  suspendReason: string | null;
  mutedUntil: string | null;
  muteReason: string | null;
}

export const searchAccounts = (q: string) =>
  axiosApiInstanceAuth.get<AdminAccountSummary[]>("/admin/accounts/search", { params: { q } }).then((res) => res.data);

export const getAccount = (id: string) =>
  axiosApiInstanceAuth.get<AdminAccountSummary>(`/admin/accounts/${id}`).then((res) => res.data);

export const banAccount = (id: string, reason: string) =>
  axiosApiInstanceAuth.post<AdminAccountSummary>(`/admin/accounts/${id}/ban`, { reason }).then((res) => res.data);

export const unbanAccount = (id: string) =>
  axiosApiInstanceAuth.post<AdminAccountSummary>(`/admin/accounts/${id}/unban`).then((res) => res.data);

export const suspendAccount = (id: string, reason: string, until: string) =>
  axiosApiInstanceAuth.post<AdminAccountSummary>(`/admin/accounts/${id}/suspend`, { reason, until }).then((res) => res.data);

export const unsuspendAccount = (id: string) =>
  axiosApiInstanceAuth.post<AdminAccountSummary>(`/admin/accounts/${id}/unsuspend`).then((res) => res.data);

export const muteAccount = (id: string, reason: string, until: string) =>
  axiosApiInstanceAuth.post<AdminAccountSummary>(`/admin/accounts/${id}/mute`, { reason, until }).then((res) => res.data);

export const unmuteAccount = (id: string) =>
  axiosApiInstanceAuth.post<AdminAccountSummary>(`/admin/accounts/${id}/unmute`).then((res) => res.data);

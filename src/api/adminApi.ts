import { axiosApiInstanceAuth } from "./axios";

export type ReportTargetType = "POST" | "COMMENT" | "PROFILE" | "CONVERSATION" | "MESSAGE";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "ACTIONED";

export interface AdminReport {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  additionalNote: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByAccountId: number | null;
}

export interface AdminReportsPage {
  content: AdminReport[];
  totalPages: number;
  totalElements: number;
  number: number;
}

interface GetReportsParams {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  size?: number;
}

export const getReports = (params: GetReportsParams) =>
  axiosApiInstanceAuth
    .get<AdminReportsPage>("/reports", { params })
    .then((res) => res.data);

export const updateReportStatus = (id: number, status: ReportStatus) =>
  axiosApiInstanceAuth
    .patch<AdminReport>(`/reports/${id}/status`, { status })
    .then((res) => res.data);

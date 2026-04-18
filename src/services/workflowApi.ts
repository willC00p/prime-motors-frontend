import { fetchApi } from './api';

export interface CIBIInvestigationPayload {
  status: string;
  notes?: string;
}

export interface HeadOfficeApprovalPayload {
  approved: boolean;
  notes?: string;
}

export interface BranchApprovalPayload {
  status: string;
  notes?: string;
}

export interface ClientNotificationPayload {
  status: string;
}

export interface UnitReleasePayload {
  status: string;
}

export interface SalesEncodingPayload {
  sales_data: any;
}

// Get application with full workflow details
export const getApplicationWithDetails = async (id: number) => {
  return fetchApi(`/workflow/${id}`);
};

// Update CI/BI Investigation Status
export const updateCIBIInvestigation = async (id: number, payload: CIBIInvestigationPayload) => {
  return fetchApi(`/workflow/${id}/cibi-investigation`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Update Head Office Approval
export const updateHeadOfficeApproval = async (id: number, payload: HeadOfficeApprovalPayload) => {
  return fetchApi(`/workflow/${id}/head-office-approval`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Update Branch Approval
export const updateBranchApproval = async (id: number, payload: BranchApprovalPayload) => {
  return fetchApi(`/workflow/${id}/branch-approval`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Update Client Notification
export const updateClientNotification = async (id: number, payload: ClientNotificationPayload) => {
  return fetchApi(`/workflow/${id}/client-notification`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Update Unit Release
export const updateUnitRelease = async (id: number, payload: UnitReleasePayload) => {
  return fetchApi(`/workflow/${id}/unit-release`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Update Sales Encoding
export const updateSalesEncoding = async (id: number, payload: SalesEncodingPayload) => {
  return fetchApi(`/workflow/${id}/sales-encoding`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Complete Lead
export const completeLead = async (id: number) => {
  return fetchApi(`/workflow/${id}/complete`, {
    method: 'PUT',
  });
};

// Upload Requirement Attachment
export const uploadRequirementAttachment = async (
  id: number,
  file_name: string,
  file_url: string,
  file_type: string,
  file_size: number,
  upload_type: string
) => {
  return fetchApi(`/workflow/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify({
      file_name,
      file_url,
      file_type,
      file_size,
      upload_type,
    }),
  });
};

// Get Requirement Attachments
export const getRequirementAttachments = async (id: number) => {
  return fetchApi(`/workflow/${id}/attachments`);
};

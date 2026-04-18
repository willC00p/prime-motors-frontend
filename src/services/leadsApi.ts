import { fetchApi } from './api';

export interface LeadUpdatePayload {
  workflow_status: string;
  notes?: string;
  requirements_status?: string;
}

export interface AssignInvestigatorPayload {
  investigator_id: number;
}

// Get all leads with filtering and pagination
export const getLeads = async (
  page: number = 1,
  limit: number = 50,
  workflow_status?: string,
  search?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(workflow_status && workflow_status !== 'ALL' && { workflow_status }),
    ...(search && { search }),
  });

  return fetchApi(`/api/leads?${params.toString()}`);
};

// Get leads summary
export const getLeadsSummary = async () => {
  return fetchApi('/api/leads/summary');
};

// Get lead details
export const getLeadDetail = async (id: number) => {
  return fetchApi(`/api/leads/${id}`);
};

// Update lead status
export const updateLeadStatus = async (id: number, payload: LeadUpdatePayload) => {
  return fetchApi(`/api/leads/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Assign investigator
export const assignInvestigator = async (id: number, payload: AssignInvestigatorPayload) => {
  return fetchApi(`/api/leads/${id}/assign-investigator`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Check CI/BI SLA
export const checkCIBISLA = async () => {
  return fetchApi('/api/leads/check-sla', {
    method: 'POST',
  });
};

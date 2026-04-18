import { API_BASE_URL } from '../config/api';

const TOKEN = localStorage.getItem('token');

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

  const response = await fetch(`${API_BASE_URL}/leads?${params}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch leads');
  return response.json();
};

// Get leads summary
export const getLeadsSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/leads/summary`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch summary');
  return response.json();
};

// Get lead details
export const getLeadDetail = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch lead details');
  return response.json();
};

// Update lead status
export const updateLeadStatus = async (id: number, payload: LeadUpdatePayload) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to update lead status');
  return response.json();
};

// Assign investigator
export const assignInvestigator = async (id: number, payload: AssignInvestigatorPayload) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}/assign-investigator`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to assign investigator');
  return response.json();
};

// Check CI/BI SLA
export const checkCIBISLA = async () => {
  const response = await fetch(`${API_BASE_URL}/leads/check-sla`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!response.ok) throw new Error('Failed to check CI/BI SLA');
  return response.json();
};

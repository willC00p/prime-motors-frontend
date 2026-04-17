import { fetchApi } from './api';
import { CIBIApplicationResponse, ApplicationResponse } from '../types/cibi';

export const cibiApi = {
  // CI/BI Applications
  createCIBIApplication: async (data: any) => {
    return fetchApi('/api/cibi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCIBIApplications: async (filters?: { branch_id?: number; status?: string; investigator_id?: number }) => {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.investigator_id) params.append('investigator_id', filters.investigator_id.toString());

    return fetchApi(`/api/cibi?${params.toString()}`);
  },

  getCIBIApplication: async (id: number) => {
    return fetchApi(`/api/cibi/${id}`);
  },

  updateCIBIApplication: async (id: number, data: any) => {
    return fetchApi(`/api/cibi/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteCIBIApplication: async (id: number) => {
    return fetchApi(`/api/cibi/${id}`, {
      method: 'DELETE',
    });
  },

  // Attachments
  addAttachment: async (cibiApplicationId: number, data: any) => {
    return fetchApi(`/api/cibi/${cibiApplicationId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeAttachment: async (attachmentId: number) => {
    return fetchApi(`/api/cibi/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  },

  // Applications (Leads)
  createApplication: async (data: any) => {
    return fetchApi('/api/cibi/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getApplications: async (filters?: { branch_id?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
    if (filters?.status) params.append('status', filters.status);

    return fetchApi(`/api/cibi/applications?${params.toString()}`);
  },

  getApplication: async (id: number) => {
    return fetchApi(`/api/cibi/applications/${id}`);
  },

  updateApplicationStatus: async (applicationId: number, status: string) => {
    return fetchApi(`/api/cibi/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

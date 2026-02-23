import { fetchApi } from './api';
import type { LTORegistration, LTORegistrationFilters } from '../types/LTORegistration';

export const ltoRegistrationApi = {
    // List all registrations
    list: async (filters?: LTORegistrationFilters) => {
        const queryParams = new URLSearchParams();
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);
        
        return fetchApi<LTORegistration[]>(`/api/lto-registration?${queryParams.toString()}`);
    },

    // Get a single registration
    get: async (id: number) => {
        return fetchApi<LTORegistration>(`/api/lto-registration/${id}`);
    },

    // Create new registration
    create: async (data: Partial<LTORegistration>) => {
        console.log('LTO Registration API - Creating new registration:', data);
        try {
            const response = await fetchApi<LTORegistration>('/api/lto-registration', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('LTO Registration API - Create response:', response);
            return response;
        } catch (error) {
            console.error('LTO Registration API - Create error:', error);
            throw error;
        }
    },

    // Update registration
    update: async (id: number, data: Partial<LTORegistration>) => {
        console.log('LTO Registration API - Making update request:', {
            url: `/api/lto-registration/${id}`,
            method: 'PUT',
            data
        });
        try {
            const response = await fetchApi<LTORegistration>(`/api/lto-registration/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('LTO Registration API - Update response:', response);
            return response;
        } catch (error) {
            console.error('LTO Registration API - Update error:', error);
            throw error;
        }
    },

    // Generate report
    generateReport: async (filters?: LTORegistrationFilters) => {
        const queryParams = new URLSearchParams();
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);
        
        return fetchApi<any>(`/api/lto-registrations/report?${queryParams.toString()}`);
    },

    // Export to Excel
    exportToExcel: async (filters?: LTORegistrationFilters) => {
        const queryParams = new URLSearchParams();
        if (filters?.csrNumber) queryParams.append('csrNumber', filters.csrNumber);
        if (filters?.sdrNumber) queryParams.append('sdrNumber', filters.sdrNumber);
        if (filters?.insuranceNumber) queryParams.append('insuranceNumber', filters.insuranceNumber);
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);
        
        const authToken = localStorage.getItem('auth_token');
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const apiUrl = `${API_BASE}/api/lto-registration/export/excel?${queryParams.toString()}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ...(authToken && {
                    'Authorization': `Bearer ${authToken}`
                })
            }
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'lto-registrations.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    }
};

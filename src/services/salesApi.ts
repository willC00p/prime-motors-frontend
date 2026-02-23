import { fetchApi } from './api';
import type { LTORegistration } from '../types/LTORegistration';

export interface Sale {
    id: number;
    dr_no: string;
    si_no: string;
    date_sold: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    sales_items: {
        id: number;
        vehicle_unit: {
            id: number;
            engine_no?: string;
            chassis_no?: string;
        };
        items: {
            id: number;
            brand: string;
            model: string;
        };
    }[];
    lto_registrations?: LTORegistration[];
}

interface SalesFilters {
    startDate?: string;
    endDate?: string;
    status?: string;
}

export const salesApi = {
    // List all sales with optional LTO registration data
    list: async (filters?: SalesFilters) => {
        const queryParams = new URLSearchParams();
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);
        queryParams.append('include', 'lto_registration');
        
        return fetchApi<Sale[]>(`/api/sales?${queryParams.toString()}`);
    },

    // Get a single sale
    get: async (id: number) => {
        return fetchApi<Sale>(`/api/sales/${id}?include=lto_registration`);
    }
    ,

    // Update delivery status/date for a sale
    updateDelivery: async (id: number, payload: { delivery_status?: string; delivery_date?: string | null }) => {
        return fetchApi<Sale>(`/api/sales/${id}/delivery`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

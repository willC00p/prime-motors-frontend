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

  // Models
  getModels: async () => {
    return fetchApi('/api/cibi/models');
  },

  // Generate investigation findings
  generateFindings: (params: any) => {
    // This is a utility function that generates findings on the frontend
    // based on the parameters provided
    const findings: string[] = [];
    const issues: string[] = [];
    const strengths: string[] = [];

    // Safe number conversion - handles strings, null, undefined, objects
    const toNumber = (val: any): number => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const monthly_income = toNumber(params.monthly_income);
    const estimated_monthly_expenses = toNumber(params.estimated_monthly_expenses);
    const { existing_loan, previous_loans_status, credit_standing } = params;
    const capacity_to_pay = toNumber(params.capacity_to_pay);
    if (monthly_income && monthly_income > 0) {
      strengths.push(`Stable monthly income of ₱${monthly_income.toFixed(2)}`);
    } else {
      issues.push("No verifiable income source");
    }

    // Expense Analysis
    if (estimated_monthly_expenses && monthly_income && estimated_monthly_expenses < monthly_income * 0.7) {
      strengths.push("Reasonable monthly expenses relative to income");
    } else if (estimated_monthly_expenses && monthly_income && estimated_monthly_expenses >= monthly_income) {
      issues.push("Estimated expenses exceed or match income");
    }

    // Loan History
    if (previous_loans_status === "Paid") {
      strengths.push("Good history of loan payment");
    } else if (previous_loans_status === "Defaulted") {
      issues.push("History of loan default");
    } else if (previous_loans_status === "Unpaid") {
      issues.push("Outstanding unpaid loans");
    }

    // Credit Standing
    if (credit_standing === "Good") {
      strengths.push("Good credit standing");
    } else if (credit_standing === "Bad") {
      issues.push("Poor credit standing");
    }

    // Capacity to Pay
    if (capacity_to_pay && capacity_to_pay > 0) {
      strengths.push(`Demonstrated capacity to pay of ₱${capacity_to_pay.toFixed(2)}`);
    }

    // Existing Loan
    if (existing_loan) {
      issues.push("Has existing loan obligations");
    } else {
      strengths.push("No existing loan obligations");
    }

    // Combine findings
    if (issues.length === 0 && strengths.length >= 4) {
      findings.push("APPROVED - All criteria met");
    } else if (issues.length <= 1 && strengths.length >= 2) {
      findings.push("APPROVED WITH CONDITIONS - Minor concerns present");
    } else if (issues.length >= 2 || strengths.length < 2) {
      findings.push("FOR FURTHER EVALUATION - Requires additional review");
    }

    findings.push("\nStrengths:\n• " + strengths.join("\n• "));
    if (issues.length > 0) {
      findings.push("\nConcerns:\n• " + issues.join("\n• "));
    }

    return findings.join("\n");
  },
};

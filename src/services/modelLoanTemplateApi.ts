import { api } from './api';
import type { ModelLoanTemplate } from '../types/LoanTemplate';

export const modelLoanTemplateApi = {
    getTemplates: (itemId: number) => 
        api.get<ModelLoanTemplate[]>(`/model-loan-templates/${itemId}`),
    
    createTemplate: (template: Omit<ModelLoanTemplate, 'id' | 'created_at'>) =>
        api.post<ModelLoanTemplate>('/model-loan-templates', template),
    
    updateTemplate: (id: number, template: Partial<Omit<ModelLoanTemplate, 'id' | 'created_at'>>) =>
        api.put<ModelLoanTemplate>(`/model-loan-templates/${id}`, template),
    
    deleteTemplate: (id: number) =>
        api.delete<void>(`/model-loan-templates/${id}`)
};

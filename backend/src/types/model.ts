export interface ModelLoanTemplate {
    id: number;
    item_id: number;
    term_months: number;
    loan_amount: number;
    downpayment_percentage: number;
    rebates_commission: number;
    monthly_amortization: number;
    created_at?: Date;
}

export interface Model {
    id: number;
    item_no: string;
    brand: string;
    model: string;
    color: string[];
    srp?: number;
    loan_templates?: ModelLoanTemplate[];
}

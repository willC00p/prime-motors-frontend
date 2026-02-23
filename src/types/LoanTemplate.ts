export interface ModelLoanTemplate {
    id: number;
    item_id: number;
    term_months: number;
    loan_amount: number;
    downpayment_percentage: number;
    rebates_commission: number;
    monthly_amortization: number;
    created_at?: string;
}

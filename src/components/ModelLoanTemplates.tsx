import React, { useState, useEffect } from 'react';
import { modelLoanTemplateApi } from '../services/modelLoanTemplateApi';
import type { ModelLoanTemplate } from '../types/LoanTemplate';

// Base fixed interest rate (2.6%)
const BASE_FIXED_IR = 0.026;

// Available terms in months
const DEFAULT_TERMS = [3, 6, 12, 18, 24, 30, 36];

// Calculate Fixed Interest Multiplier: Terms × FIR + 1
function calculateFixedInterestMultiplier(termMonths: number): number {
    return (termMonths * BASE_FIXED_IR) + 1;
}

// Calculate loan details based on formula from documentation
function calculateLoanDetails(srp: number, downpaymentPercentage: number, termMonths: number): { 
    loanAmount: number,
    downpaymentAmount: number,
    monthlyAmortization: number,
    totalPayment: number,
    multiplier: number
} {
    // Calculate downpayment amount and amount to finance
    const downpaymentAmount = (srp * downpaymentPercentage) / 100;
    const amountToFinance = srp - downpaymentAmount;
    
    // Calculate the fixed interest multiplier
    const multiplier = calculateFixedInterestMultiplier(termMonths);
    
    // Calculate total payment with interest (Amount to Finance × Multiplier)
    const financedAmount = amountToFinance * multiplier;
    
    // Add downpayment back to get total payment including downpayment
    const totalPayment = financedAmount + downpaymentAmount;
    
    // Calculate monthly amortization (Financed Amount ÷ Terms)
    const monthlyAmortization = financedAmount / termMonths;
    
    return {
        loanAmount: Number(amountToFinance.toFixed(2)),
        downpaymentAmount: Number(downpaymentAmount.toFixed(2)),
        monthlyAmortization: Number(monthlyAmortization.toFixed(2)),
        totalPayment: Number(totalPayment.toFixed(2)),
        multiplier: Number(multiplier.toFixed(3))
    };
}

interface ModelLoanTemplatesProps {
    itemId: number;
    srp?: number;
    onTemplatesChange?: () => void;
}

// Update our template type to include downpayment_amount
interface TemplateWithDownpayment extends ModelLoanTemplate {
    downpayment_amount?: number;
}

export function ModelLoanTemplates({ itemId, srp = 0, onTemplatesChange }: ModelLoanTemplatesProps) {
    const [templates, setTemplates] = useState<Record<number, Partial<ModelLoanTemplate & { downpayment_amount: number }>>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [sellingPrice, setSellingPrice] = useState(srp);

    // Update calculations when SRP changes
    useEffect(() => {
        setSellingPrice(srp);
        setTemplates(prev => {
            const updated = { ...prev };
            DEFAULT_TERMS.forEach(t => {
                const currentTemplate = prev[t] || {};
                const { loanAmount, monthlyAmortization, downpaymentAmount } = calculateLoanDetails(
                    srp,
                    Number(currentTemplate.downpayment_percentage) || 20,
                    t
                );
                updated[t] = {
                    ...currentTemplate,
                    loan_amount: loanAmount,
                    monthly_amortization: monthlyAmortization,
                    downpayment_amount: downpaymentAmount
                };
            });
            return updated;
        });
    }, [srp]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await modelLoanTemplateApi.getTemplates(itemId);
            // Map by term_months for easy editing
            const mapped: Record<number, Partial<ModelLoanTemplate>> = {};
            DEFAULT_TERMS.forEach(term => {
                const found = data.find(t => t.term_months === term);
                mapped[term] = found
                    ? { ...found }
                    : {
                        item_id: itemId,
                        term_months: term,
                        loan_amount: 0,
                        downpayment_percentage: 20,
                        rebates_commission: 0,
                        monthly_amortization: 0
                    };
            });
            setTemplates(mapped);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [itemId]);

    const handleChange = (term: number, field: keyof ModelLoanTemplate | 'srp' | 'downpayment_amount', value: any) => {
        if (field === 'srp') {
            const numericValue = Number(value) || 0;
            setSellingPrice(numericValue);
            
            // Update all terms with new calculations
            setTemplates(prev => {
                const updated = { ...prev };
                DEFAULT_TERMS.forEach(t => {
                    const currentTemplate = prev[t] || {};
                    const { loanAmount, monthlyAmortization, downpaymentAmount } = calculateLoanDetails(
                        numericValue,
                        Number(currentTemplate.downpayment_percentage) || 20,
                        t
                    );
                    updated[t] = {
                        ...currentTemplate,
                        loan_amount: loanAmount,
                        monthly_amortization: monthlyAmortization,
                        downpayment_amount: downpaymentAmount
                    };
                });
                return updated;
            });
            return;
        }

        setTemplates(prev => {
            // Convert input value to number
            const numericValue = field === 'loan_amount' || field === 'downpayment_percentage' || field === 'rebates_commission'
                ? Number(value) || 0
                : value;

            const updatedTemplate = {
                ...prev[term],
                [field]: numericValue
            };
            
            // If downpayment percentage is updated, recalculate loan amount and monthly amortization
            if (field === 'downpayment_percentage') {
                const { loanAmount, monthlyAmortization, downpaymentAmount } = calculateLoanDetails(
                    sellingPrice,
                    numericValue,
                    term
                );
                updatedTemplate.loan_amount = loanAmount;
                updatedTemplate.monthly_amortization = monthlyAmortization;
                updatedTemplate.downpayment_amount = downpaymentAmount;
            }
            
            return {
                ...prev,
                [term]: updatedTemplate
            };
        });
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setError(null);
        try {
            for (const term of DEFAULT_TERMS) {
                const t = templates[term];
                if (!t) continue;
                
                // Convert values to numbers and ensure they're valid
                const templateData = {
                    item_id: itemId,
                    term_months: term,
                    loan_amount: Number(t.loan_amount) || 0,
                    downpayment_percentage: Number(t.downpayment_percentage) || 20,
                    rebates_commission: Number(t.rebates_commission) || 0,
                    monthly_amortization: Number(t.monthly_amortization) || 0
                };

                // If it has an id, update, else create
                if (t.id) {
                    await modelLoanTemplateApi.updateTemplate(t.id, templateData);
                } else {
                    await modelLoanTemplateApi.createTemplate(templateData);
                }
            }
            await loadTemplates();
            onTemplatesChange?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save templates');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Loan Templates ({DEFAULT_TERMS.join(', ')} months)</h3>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
            )}
            <div className="border rounded p-4">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <form onSubmit={e => { e.preventDefault(); handleSaveAll(); }}>
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Selling Price (SRP)</label>
                                    <div className="text-2xl font-semibold text-gray-900">₱{sellingPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                            </div>
                        </div>
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-2 py-1">Term (months)</th>
                                    <th className="px-2 py-1">Loan Amount</th>
                                    <th className="px-2 py-1">Downpayment %</th>
                                    <th className="px-2 py-1">Downpayment Amount</th>
                                    <th className="px-2 py-1">Rebates/Commission</th>
                                    <th className="px-2 py-1">Monthly Amortization</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DEFAULT_TERMS.map(term => (
                                    <React.Fragment key={term}>
                                        <tr>
                                            <td className="px-2 py-1 font-semibold">{term}</td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={templates[term]?.loan_amount 
                                                        ? Number(templates[term].loan_amount).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                          })
                                                        : ''
                                                    }
                                                    readOnly
                                                    className="border rounded px-2 py-1 w-32 bg-gray-50"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    value={templates[term]?.downpayment_percentage ?? ''}
                                                    onChange={e => handleChange(term, 'downpayment_percentage', parseFloat(e.target.value))}
                                                    className="border rounded px-2 py-1 w-24"
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={templates[term]?.downpayment_amount 
                                                        ? Number(templates[term].downpayment_amount).toLocaleString('en-US', {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2
                                                          })
                                                        : ''
                                                    }
                                                    onFocus={(e) => {
                                                        // On focus, show the raw number without formatting
                                                        const rawValue = templates[term]?.downpayment_amount ?? 0;
                                                        // If it's a whole number, don't show decimals
                                                        e.target.value = rawValue % 1 === 0 
                                                            ? Math.floor(rawValue).toString()
                                                            : rawValue.toString();
                                                    }}
                                                    onChange={(e) => {
                                                        let value = e.target.value;
                                                        
                                                        // Only allow one decimal point
                                                        const decimalCount = (value.match(/\./g) || []).length;
                                                        if (decimalCount > 1) {
                                                            const parts = value.split('.');
                                                            value = parts[0] + '.' + parts.slice(1).join('');
                                                        }
                                                        
                                                        // Remove any non-numeric characters except decimal
                                                        value = value.replace(/[^\d.]/g, '');
                                                        
                                                        // Update the input value
                                                        e.target.value = value;
                                                        
                                                        // Convert to number for calculations
                                                        const numericValue = parseFloat(value) || 0;
                                                        const newPercentage = (numericValue / sellingPrice) * 100;
                                                        handleChange(term, 'downpayment_percentage', newPercentage);
                                                    }}
                                                    onBlur={(e) => {
                                                        // On blur, reformat the number with proper formatting
                                                        const value = templates[term]?.downpayment_amount ?? 0;
                                                        // Show decimals only if they exist
                                                        e.target.value = value.toLocaleString('en-US', {
                                                            minimumFractionDigits: value % 1 === 0 ? 0 : 2,
                                                            maximumFractionDigits: 2
                                                        });
                                                    }}
                                                    placeholder="Enter amount"
                                                    className="border rounded px-2 py-1 w-32"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    value={templates[term]?.rebates_commission ?? ''}
                                                    onChange={e => handleChange(term, 'rebates_commission', parseFloat(e.target.value))}
                                                    className="border rounded px-2 py-1 w-32"
                                                    min="0"
                                                    step="any"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={templates[term]?.monthly_amortization 
                                                        ? Number(templates[term].monthly_amortization).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                          })
                                                        : ''
                                                    }
                                                    readOnly
                                                    className="border rounded px-2 py-1 w-32 bg-gray-50"
                                                />
                                            </td>
                                        </tr>
                                        <tr className="text-xs text-gray-500 border-b">
                                            <td colSpan={6} className="px-2 py-1">
                                                <div className="flex justify-between">
                                                    <span>Fixed IR Multiplier: {calculateFixedInterestMultiplier(term).toFixed(3)}</span>
                                                    <span>Total Payment: ₱{templates[term]?.loan_amount && templates[term]?.monthly_amortization 
                                                        ? (Number(templates[term].monthly_amortization) * term).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })
                                                        : '0.00'
                                                    }</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        <button
                            type="submit"
                            className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save All'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

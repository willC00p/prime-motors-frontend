import React, { useState, useEffect } from 'react';
import { cibiApi } from '../services/cibiApi';
import { toast } from 'react-hot-toast';
import {
  CIBIApplicationRequest,
  CIBIApplicationResponse,
  ATTACHMENT_TYPES,
  CIBI_STATUSES,
  RECOMMENDATIONS,
  CIVIL_STATUSES,
  RESIDENCE_TYPES,
  LOAN_HISTORIES,
  CREDIT_STANDINGS,
} from '../types/cibi';
import { modelLoanTemplateApi } from '../services/modelLoanTemplateApi';

interface Item {
  id: number;
  item_no: string;
  brand: string;
  model: string;
  srp?: number;
}

export const CIBIApplicationPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [applications, setApplications] = useState<CIBIApplicationResponse[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const totalSteps = 11;

  const [formData, setFormData] = useState<CIBIApplicationRequest>({
    full_name: '',
    present_address: '',
    permanent_address: '',
    same_address: false,
    date_of_birth: '',
    civil_status: '',
    valid_id: '',
    tin_sss: '',
    employer_name: '',
    position: '',
    length_of_service: '',
    monthly_income: 0,
    employer_address: '',
    contact_person: '',
    contact_person_phone: '',
    loan_type: 'Motor Cycle Loan',
    unit_applied_id: undefined,
    loan_amount: 0,
    down_payment: 0,
    term_months: 0,
    monthly_amortization: 0,
    rebate: 0,
    existing_loan: false,
    creditor_name: '',
    existing_loan_amount: 0,
    existing_loan_status: '',
    previous_loans_status: '',
    credit_standing: '',
    residence_type: '',
    length_of_stay: '',
    verified_by: '',
    residence_remarks: '',
    reference_person: '',
    reference_relationship: '',
    reference_feedback: '',
    estimated_monthly_expenses: 0,
    net_disposable_income: 0,
    capacity_to_pay: 0,
    sufficient_capacity: false,
    comaker_name: '',
    comaker_relationship: '',
    comaker_contact: '',
    comaker_financial_capacity: '',
    investigation_findings: '',
    system_recommendation: '',
    manual_recommendation: '',
    recommendation_remarks: '',
    status: 'Draft',
  });

  const [attachments, setAttachments] = useState<{ type: string; file?: File }[]>(
    ATTACHMENT_TYPES.map((type) => ({ type }))
  );

  // Fetch items and applications on mount
  useEffect(() => {
    fetchItems();
    fetchApplications();
  }, []);

  // Auto-generate investigation findings when relevant fields change
  useEffect(() => {
    const autoGenerateFindings = () => {
      const findings = cibiApi.generateFindings({
        monthly_income: formData.monthly_income,
        estimated_monthly_expenses: formData.estimated_monthly_expenses,
        existing_loan: formData.existing_loan,
        previous_loans_status: formData.previous_loans_status,
        credit_standing: formData.credit_standing,
        capacity_to_pay: formData.capacity_to_pay,
      });

      setFormData((prev) => ({
        ...prev,
        investigation_findings: findings,
      }));
    };

    // Only auto-generate if we have at least some data filled in
    if (formData.monthly_income || formData.estimated_monthly_expenses || formData.previous_loans_status) {
      autoGenerateFindings();
    }
  }, [formData.monthly_income, formData.estimated_monthly_expenses, formData.existing_loan, formData.previous_loans_status, formData.credit_standing, formData.capacity_to_pay]);

  const fetchItems = async () => {
    try {
      const data = await cibiApi.getModels();
      setItems(data);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    }
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const data = await cibiApi.getCIBIApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSameAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      same_address: checked,
      permanent_address: checked ? prev.present_address : '',
    }));
  };

  const calculateNetDisposableIncome = () => {
    const income = formData.monthly_income || 0;
    const expenses = formData.estimated_monthly_expenses || 0;
    return Math.max(0, income - expenses);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Calculate net disposable income
      const netDisposableIncome = calculateNetDisposableIncome();

      const submitData = {
        ...formData,
        net_disposable_income: netDisposableIncome,
      };

      let result;
      if (editingId) {
        result = await cibiApi.updateCIBIApplication(editingId, submitData);
        toast.success('CI/BI Application updated successfully');
      } else {
        result = await cibiApi.createCIBIApplication(submitData);
        toast.success('CI/BI Application created successfully');
      }

      // Handle attachments
      for (const attachment of attachments) {
        if (attachment.file) {
          const formDataWithFile = new FormData();
          formDataWithFile.append('attachment_type', attachment.type);
          formDataWithFile.append('file_name', attachment.file.name);
          formDataWithFile.append('file_size', attachment.file.size.toString());

          // In a real app, upload file to storage and get path
          await cibiApi.addAttachment(result.id, {
            attachment_type: attachment.type,
            file_name: attachment.file.name,
            file_size: attachment.file.size,
          });
        }
      }

      resetForm();
      fetchApplications();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving CI/BI application:', error);
      toast.error('Failed to save CI/BI application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (application: CIBIApplicationResponse) => {
    setFormData(application);
    setEditingId(application.id);
    setCurrentStep(1);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      setIsLoading(true);
      await cibiApi.deleteCIBIApplication(id);
      toast.success('CI/BI Application deleted successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete CI/BI application');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      present_address: '',
      permanent_address: '',
      same_address: false,
      date_of_birth: '',
      civil_status: '',
      valid_id: '',
      tin_sss: '',
      employer_name: '',
      position: '',
      length_of_service: '',
      monthly_income: 0,
      employer_address: '',
      contact_person: '',
      contact_person_phone: '',
      loan_type: 'Motor Cycle Loan',
      unit_applied_id: undefined,
      loan_amount: 0,
      down_payment: 0,
      term_months: 0,
      monthly_amortization: 0,
      rebate: 0,
      existing_loan: false,
      creditor_name: '',
      existing_loan_amount: 0,
      existing_loan_status: '',
      previous_loans_status: '',
      credit_standing: '',
      residence_type: '',
      length_of_stay: '',
      verified_by: '',
      residence_remarks: '',
      reference_person: '',
      reference_relationship: '',
      reference_feedback: '',
      estimated_monthly_expenses: 0,
      net_disposable_income: 0,
      capacity_to_pay: 0,
      sufficient_capacity: false,
      comaker_name: '',
      comaker_relationship: '',
      comaker_contact: '',
      comaker_financial_capacity: '',
      investigation_findings: '',
      system_recommendation: '',
      manual_recommendation: '',
      recommendation_remarks: '',
      status: 'Draft',
    });
    setEditingId(null);
    setCurrentStep(1);
    setAttachments(ATTACHMENT_TYPES.map((type) => ({ type })));
  };

  const renderStep = () => {
    switch (currentStep) {
      // Step 1: Applicant Info
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">I. Applicant Info</h3>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              required
            />
            <textarea
              name="present_address"
              placeholder="Present Address"
              value={formData.present_address || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="same_address"
                name="same_address"
                checked={formData.same_address || false}
                onChange={handleSameAddress}
                className="h-4 w-4"
              />
              <label htmlFor="same_address" className="text-sm">
                Permanent address is same as present address
              </label>
            </div>
            {!formData.same_address && (
              <textarea
                name="permanent_address"
                placeholder="Permanent Address"
                value={formData.permanent_address || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                rows={2}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth || ''}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
              <select
                name="civil_status"
                value={formData.civil_status || ''}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select Civil Status</option>
                {CIVIL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              name="valid_id"
              placeholder="Valid ID (e.g., Driver's License)"
              value={formData.valid_id || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="text"
              name="tin_sss"
              placeholder="TIN / SSS"
              value={formData.tin_sss || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
        );

      // Step 2: Employment / Source of Income
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">II. Employment / Source of Income</h3>
            <input
              type="text"
              name="employer_name"
              placeholder="Employer / Business Name"
              value={formData.employer_name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="text"
              name="position"
              placeholder="Position / Nature of Work"
              value={formData.position || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="text"
              name="length_of_service"
              placeholder="Length of Service / Business Operation (e.g., 5 years)"
              value={formData.length_of_service || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="number"
              name="monthly_income"
              placeholder="Monthly Income"
              value={formData.monthly_income || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <textarea
              name="employer_address"
              placeholder="Employer / Business Address"
              value={formData.employer_address || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={2}
            />
            <input
              type="text"
              name="contact_person"
              placeholder="Contact Person at Employer"
              value={formData.contact_person || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="tel"
              name="contact_person_phone"
              placeholder="Contact Person Phone Number"
              value={formData.contact_person_phone || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
        );

      // Step 3: Loan Details
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">III. Loan Details</h3>
            <select
              name="loan_type"
              value={formData.loan_type || 'Motor Cycle Loan'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="Motor Cycle Loan">Motor Cycle Loan</option>
              <option value="Other">Other</option>
            </select>
            <select
              name="unit_applied_id"
              value={formData.unit_applied_id || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select Unit</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.brand} {item.model} - ₱{item.srp?.toLocaleString()}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="loan_amount"
              placeholder="Loan Amount"
              value={formData.loan_amount || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="number"
              name="down_payment"
              placeholder="Down Payment"
              value={formData.down_payment || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="number"
              name="term_months"
              placeholder="Term (months)"
              value={formData.term_months || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="number"
              name="monthly_amortization"
              placeholder="Monthly Amortization"
              value={formData.monthly_amortization || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="number"
              name="rebate"
              placeholder="Rebate"
              value={formData.rebate || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
        );

      // Step 4: Credit Background
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">IV. Credit Background</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="existing_loan"
                name="existing_loan"
                checked={formData.existing_loan || false}
                onChange={handleInputChange}
                className="h-4 w-4"
              />
              <label htmlFor="existing_loan" className="text-sm">
                Has Existing Loan
              </label>
            </div>
            {formData.existing_loan && (
              <>
                <input
                  type="text"
                  name="creditor_name"
                  placeholder="Creditor Name"
                  value={formData.creditor_name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
                <input
                  type="number"
                  name="existing_loan_amount"
                  placeholder="Loan Amount"
                  value={formData.existing_loan_amount || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
                <select
                  name="existing_loan_status"
                  value={formData.existing_loan_status || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="Updated">Updated</option>
                  <option value="Past Due">Past Due</option>
                </select>
              </>
            )}
            <select
              name="previous_loans_status"
              value={formData.previous_loans_status || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select Previous Loans Status</option>
              {LOAN_HISTORIES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              name="credit_standing"
              value={formData.credit_standing || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select Credit Standing</option>
              {CREDIT_STANDINGS.map((standing) => (
                <option key={standing} value={standing}>
                  {standing}
                </option>
              ))}
            </select>
          </div>
        );

      // Step 5: Residence Verification
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">V. Residence Verification</h3>
            <select
              name="residence_type"
              value={formData.residence_type || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select Residence Type</option>
              {RESIDENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="length_of_stay"
              placeholder="Length of Stay (e.g., 5 years)"
              value={formData.length_of_stay || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="text"
              name="verified_by"
              placeholder="Verified By (Name of Verifier)"
              value={formData.verified_by || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <textarea
              name="residence_remarks"
              placeholder="Remarks"
              value={formData.residence_remarks || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      // Step 6: Character and Neighborhood Check
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">VI. Character and Neighborhood Check</h3>
            <input
              type="text"
              name="reference_person"
              placeholder="Reference Person"
              value={formData.reference_person || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="text"
              name="reference_relationship"
              placeholder="Relationship"
              value={formData.reference_relationship || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <textarea
              name="reference_feedback"
              placeholder="Feedback"
              value={formData.reference_feedback || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      // Step 7: Financial Capacity
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">VII. Financial Capacity</h3>
            <input
              type="number"
              name="estimated_monthly_expenses"
              placeholder="Estimated Monthly Expenses"
              value={formData.estimated_monthly_expenses || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm font-semibold">
                Net Disposable Income: ₱{calculateNetDisposableIncome().toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="capacity_to_pay"
                placeholder="Capacity to Pay"
                value={formData.capacity_to_pay || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
              <select
                name="payment_date"
                defaultValue="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select Payment Date</option>
                <option value="15">15th of Month</option>
                <option value="30">30th of Month</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sufficient_capacity"
                name="sufficient_capacity"
                checked={formData.sufficient_capacity || false}
                onChange={handleInputChange}
                className="h-4 w-4"
              />
              <label htmlFor="sufficient_capacity" className="text-sm">
                Sufficient Capacity to Pay
              </label>
            </div>
          </div>
        );

      // Step 8: Collateral / Comaker
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">VIII. Collateral / Comaker (if applicable)</h3>
            <input
              type="text"
              name="comaker_name"
              placeholder="Comaker Name"
              value={formData.comaker_name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <input
              type="text"
              name="comaker_relationship"
              placeholder="Relationship to Applicant"
              value={formData.comaker_relationship || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <textarea
              name="comaker_contact"
              placeholder="Contact Details"
              value={formData.comaker_contact || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={2}
            />
            <textarea
              name="comaker_financial_capacity"
              placeholder="Financial Capacity"
              value={formData.comaker_financial_capacity || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={2}
            />
          </div>
        );

      // Step 9: Investigation Findings
      case 9:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">IX. Investigation Findings</h3>
            <p className="text-sm text-gray-600">Summary of overall evaluation (editable)</p>
            <textarea
              name="investigation_findings"
              placeholder="Investigation Findings (auto-generated, can be edited)"
              value={formData.investigation_findings || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={6}
            />
          </div>
        );

      // Step 10: Recommendation
      case 10:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">X. Recommendation</h3>
            <div>
              <label className="text-sm font-semibold mb-2 block">System Recommendation</label>
              <input
                type="text"
                name="system_recommendation"
                value={formData.system_recommendation || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Generated from investigation findings</p>
            </div>
            <select
              name="manual_recommendation"
              value={formData.manual_recommendation || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select Manual Recommendation</option>
              {RECOMMENDATIONS.map((rec) => (
                <option key={rec} value={rec}>
                  {rec}
                </option>
              ))}
            </select>
            <textarea
              name="recommendation_remarks"
              placeholder="Remarks"
              value={formData.recommendation_remarks || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      // Step 11: Prepared By & Attachments
      case 11:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">XI. Prepared By & Attachments</h3>
            <input
              type="text"
              name="investigator_signature"
              placeholder="Investigator Signature (typed)"
              value={formData.investigator_signature || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Required Attachments</h4>
              <div className="space-y-3">
                {attachments.map((attachment, idx) => (
                  <div key={idx} className="border rounded-md p-3">
                    <label className="text-sm font-semibold mb-2 block">{attachment.type}</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const newAttachments = [...attachments];
                        newAttachments[idx].file = e.target.files?.[0];
                        setAttachments(newAttachments);
                      }}
                      className="w-full"
                    />
                    {attachment.file && <p className="text-xs text-green-600 mt-1">✓ {attachment.file.name}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">CI/BI Applications</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Application'}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Multi-step form */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <div
                    key={idx + 1}
                    className={`flex-1 h-2 mx-1 rounded-full ${
                      currentStep >= idx + 1 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center mt-2 text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </p>
            </div>

            {/* Form content */}
            <div className="min-h-96 mb-6">{renderStep()}</div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : editingId ? 'Update' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        ) : (
          // Applications list
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No CI/BI applications yet</div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{app.full_name}</h3>
                      <p className="text-sm text-gray-600">{app.present_address}</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          app.manual_recommendation === 'Approved' ? 'bg-green-100 text-green-800' :
                          app.manual_recommendation === 'Disapproved' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.manual_recommendation || 'Pending'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(app)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CIBIApplicationPage;

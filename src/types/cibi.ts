export interface CIBIApplicationRequest {
  full_name: string;
  present_address?: string;
  permanent_address?: string;
  same_address?: boolean;
  date_of_birth?: string;
  civil_status?: string;
  valid_id?: string;
  tin_sss?: string;

  employer_name?: string;
  position?: string;
  length_of_service?: string;
  monthly_income?: number;
  employer_address?: string;
  contact_person?: string;
  contact_person_phone?: string;

  loan_type?: string;
  unit_applied_id?: number;
  loan_amount?: number;
  down_payment?: number;
  term_months?: number;
  monthly_amortization?: number;
  rebate?: number;

  existing_loan?: boolean;
  creditor_name?: string;
  existing_loan_amount?: number;
  existing_loan_status?: string;
  previous_loans_status?: string;
  credit_standing?: string;

  residence_type?: string;
  length_of_stay?: string;
  verified_by?: string;
  residence_remarks?: string;

  reference_person?: string;
  reference_relationship?: string;
  reference_feedback?: string;

  estimated_monthly_expenses?: number;
  net_disposable_income?: number;
  capacity_to_pay?: number;
  sufficient_capacity?: boolean;

  comaker_name?: string;
  comaker_relationship?: string;
  comaker_contact?: string;
  comaker_financial_capacity?: string;

  investigation_findings?: string;

  system_recommendation?: string;
  manual_recommendation?: string;
  recommendation_remarks?: string;

  investigator_id?: number;
  investigator_signature?: string;

  status?: string;
  application_id?: number;
  branch_id?: number;
}

export interface CIBIApplicationResponse extends CIBIApplicationRequest {
  id: number;
  prepared_date: Date;
  created_at: Date;
  updated_at: Date;
  attachments?: CIBIAttachment[];
}

export interface CIBIAttachment {
  id: number;
  cibi_application_id: number;
  attachment_type: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  uploaded_at: Date;
  uploaded_by?: number;
}

export interface Application {
  id: number;
  applicant_name: string;
  applicant_phone?: string;
  applicant_email?: string;
  status: string;
  date_submitted: Date;
  branch_id?: number;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
  cibi_applications?: CIBIApplicationResponse[];
}

export const ATTACHMENT_TYPES = [
  'Inside of house',
  'Outside of house',
  'Neighborhood Sketch',
  'Barangay verification',
  'Valid ID',
  'Proof of income',
  'Remittance',
];

export const APPLICATION_STATUSES = [
  'Application',
  'Leads',
  'Submit Requirements',
  'CI/BI',
  'Result',
  'Submit to Head Office',
  'Submit to Branch',
  'Notify Client',
  'Releasing Units',
  'Encode in Branch Sales Monitoring',
];

export const CIBI_STATUSES = [
  'Draft',
  'Submitted',
  'In Review',
  'Approved',
  'Disapproved',
  'For Further Evaluation',
];

export const RECOMMENDATIONS = [
  'Approved',
  'Disapproved',
  'For Further Evaluation',
];

export const CIVIL_STATUSES = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
];

export const RESIDENCE_TYPES = [
  'Owned',
  'Rented',
  'Living with Relatives',
];

export const LOAN_HISTORIES = [
  'Paid',
  'Unpaid',
  'Defaulted',
];

export const CREDIT_STANDINGS = [
  'Good',
  'Bad',
];

export const EXISTING_LOAN_STATUSES = [
  'Updated',
  'Past Due',
  'N/A',
];

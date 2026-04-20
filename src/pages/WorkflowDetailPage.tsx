import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApplicationWithDetails } from '../services/workflowApi';

interface WorkflowStage {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

export const WorkflowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const isBranchUser = user?.role === 'branch';

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const data = await getApplicationWithDetails(parseInt(id!));
        setApplication(data);
        
        // Set activeTab based on workflow status
        const status = data.workflow_status;
        console.log('Application workflow_status:', status);
        
        if (status === 'LEADS') {
          setActiveTab('leads');
        } else if (status === 'SUBMIT_REQS') {
          setActiveTab('requirements');
        } else if (status === 'PASS_REQUIREMENTS') {
          setActiveTab('passrequirements');
        } else if (status === 'CI_BI') {
          setActiveTab('cibi');
        } else if (status === 'CI_BI_RESULT') {
          setActiveTab('approvals');
        } else if (status === 'BRANCH_APPROVAL') {
          setActiveTab('branch');
        } else if (status === 'CLIENT_NOTIFICATION') {
          setActiveTab('client');
        } else if (status === 'UNIT_RELEASE') {
          setActiveTab('unit');
        } else if (status === 'SALES_ENCODING') {
          setActiveTab('sales');
        } else {
          setActiveTab('overview');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Loading application details...</div>;
  if (!application) return <div className="p-6 text-center text-red-600">Application not found</div>;

  const stages: WorkflowStage[] = [
    { id: 'APPLICATION', label: 'Application', completed: true, current: false },
    { id: 'LEADS', label: 'Leads', completed: application.workflow_status !== 'APPLICATION', current: application.workflow_status === 'LEADS' },
    { id: 'SUBMIT_REQS', label: 'Requirements', completed: ['PASS_REQUIREMENTS', 'CI_BI', 'CI_BI_RESULT', 'HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'SUBMIT_REQS' },
    { id: 'PASS_REQUIREMENTS', label: 'Requirements Passed', completed: ['CI_BI', 'CI_BI_RESULT', 'HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'PASS_REQUIREMENTS' },
    { id: 'CI_BI', label: 'CI/BI Investigation', completed: ['CI_BI_RESULT', 'HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'CI_BI' },
    { id: 'CI_BI_RESULT', label: 'CI/BI Result', completed: ['HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'CI_BI_RESULT' },
    { id: 'HEAD_OFFICE', label: 'Head Office', completed: ['BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'HEAD_OFFICE' },
    { id: 'BRANCH_APPROVAL', label: 'Branch', completed: ['CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'BRANCH_APPROVAL' },
    { id: 'CLIENT_NOTIFICATION', label: 'Client', completed: ['UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'CLIENT_NOTIFICATION' },
    { id: 'UNIT_RELEASE', label: 'Unit Release', completed: ['SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'UNIT_RELEASE' },
    { id: 'SALES_ENCODING', label: 'Sales', completed: application.workflow_status === 'COMPLETED', current: application.workflow_status === 'SALES_ENCODING' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6">
      <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 md:mb-6 text-sm md:text-base">
        <ArrowLeft size={18} />
        Back to Leads
      </button>

      {/* Header - Responsive Grid */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">{application.applicant_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4">
          <div>
            <p className="text-xs md:text-sm text-gray-600">Email</p>
            <p className="text-sm md:text-base font-medium break-all">{application.applicant_email}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">Phone</p>
            <p className="text-sm md:text-base font-medium">{application.applicant_phone}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">Branch</p>
            <p className="text-sm md:text-base font-medium">{application.branches?.name}</p>
          </div>
        </div>
      </div>

      {/* Workflow Progress - Responsive */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6 overflow-x-auto">
        <h2 className="text-base md:text-lg font-semibold mb-4">Workflow Progress</h2>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.id}>
              <div className={`flex flex-col items-center flex-shrink-0 ${stage.completed ? 'opacity-100' : stage.current ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center ${stage.completed ? 'bg-green-500' : stage.current ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  {stage.completed ? <CheckCircle size={18} className="text-white md:hidden" /> : <Clock size={18} className="text-white md:hidden" />}
                  {stage.completed ? <CheckCircle size={24} className="text-white hidden md:block" /> : <Clock size={24} className="text-white hidden md:block" />}
                </div>
                <p className="text-xs mt-1 md:mt-2 text-center max-w-[60px] md:max-w-[80px]">{stage.label}</p>
              </div>
              {idx < stages.length - 1 && <div className={`flex-1 h-1 mx-1 md:mx-2 ${stage.completed ? 'bg-green-500' : 'bg-gray-300'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs - Responsive */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b overflow-x-auto">
          {/* Overview always available */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Overview
          </button>

          {/* Leads Stage - Proceed to submit requirements */}
          {application.workflow_status === 'LEADS' && (
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'leads' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Proceed
            </button>
          )}

          {/* Requirements - Available at SUBMIT_REQS stage */}
          {application.workflow_status === 'SUBMIT_REQS' && (
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'requirements' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Requirements
            </button>
          )}

          {/* Pass Requirements - Available at PASS_REQUIREMENTS stage */}
          {application.workflow_status === 'PASS_REQUIREMENTS' && (
            <button
              onClick={() => setActiveTab('passrequirements')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'passrequirements' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Start CI/BI
            </button>
          )}

          {/* CI/BI Investigation - Available at CI_BI stage */}
          {application.workflow_status === 'CI_BI' && (
            <button
              onClick={() => setActiveTab('cibi')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'cibi' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              CI/BI
            </button>
          )}

          {/* Head Office Approval - Available at CI_BI_RESULT stage for NSM/CEO/GM */}
          {application.workflow_status === 'CI_BI_RESULT' && !isBranchUser && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'approvals' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Approval
            </button>
          )}

          {/* Branch Approval - Available at BRANCH_APPROVAL stage */}
          {application.workflow_status === 'BRANCH_APPROVAL' && (
            <button
              onClick={() => setActiveTab('branch')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'branch' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Branch
            </button>
          )}

          {/* Client Notification - Available at CLIENT_NOTIFICATION stage */}
          {application.workflow_status === 'CLIENT_NOTIFICATION' && (
            <button
              onClick={() => setActiveTab('client')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'client' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Client
            </button>
          )}

          {/* Unit Release - Available at UNIT_RELEASE stage */}
          {application.workflow_status === 'UNIT_RELEASE' && (
            <button
              onClick={() => setActiveTab('unit')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'unit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Unit
            </button>
          )}

          {/* Sales Encoding - Available at SALES_ENCODING stage */}
          {application.workflow_status === 'SALES_ENCODING' && (
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-medium whitespace-nowrap ${activeTab === 'sales' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Sales
            </button>
          )}
        </div>

        <div className="p-3 md:p-6">
          {activeTab === 'overview' && <OverviewTab application={application} />}
          {activeTab === 'leads' && <LeadsActionTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'requirements' && <RequirementsTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'passrequirements' && <PassRequirementsTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'cibi' && <CIBITab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'approvals' && <ApprovalsTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'branch' && <BranchApprovalTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'client' && <ClientNotificationTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'unit' && <UnitReleaseTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'sales' && <SalesEncodingTab application={application} onUpdate={() => window.location.reload()} />}
          
          {/* Fallback when tab is not set yet */}
          {!activeTab && <div className="text-center text-gray-500 py-8">Loading action form...</div>}
        </div>
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ application: any }> = ({ application }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Status</p>
        <p className="font-medium text-lg">{application.workflow_status}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Created By</p>
        <p className="font-medium">{application.creator?.name}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Assigned Investigator</p>
        <p className="font-medium">{application.investigator?.name || 'Not assigned'}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Created</p>
        <p className="font-medium">{new Date(application.created_at).toLocaleDateString()}</p>
      </div>
    </div>
    {application.notes && (
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">Notes</p>
        <p className="mt-2">{application.notes}</p>
      </div>
    )}
  </div>
);

const LeadsActionTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleProceed = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/proceed-to-requirements`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ notes }),
      });
      if (response.ok) {
        onUpdate();
      } else {
        alert('Error proceeding to requirements');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error proceeding to requirements');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          Click "Proceed" to move this application to the Requirements submission stage.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
        <textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          rows={3} 
          className="w-full border rounded px-3 py-2" 
          placeholder="Add any notes before proceeding..."
        />
      </div>
      <button 
        onClick={handleProceed} 
        disabled={submitting} 
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        {submitting ? 'Proceeding...' : 'Proceed to Requirements'}
      </button>
    </div>
  );
};

const CIBITab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [status, setStatus] = useState(application.cibi_investigation_status || '');
  const [notes, setNotes] = useState(application.cibi_investigation_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/cibi-investigation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status, notes }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Investigation Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select status...</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="FURTHER_EVALUATION">Further Evaluation</option>
          <option value="APPROVED">Approved</option>
          <option value="DISAPPROVED">Disapproved</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Investigation Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Updating...' : 'Update Status'}
      </button>
    </div>
  );
};

const RequirementsTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const attachments = application.requirement_attachments || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({
          file_name: file.name,
          file_url: 'https://example.com/' + file.name,
          file_type: file.type,
          file_size: file.size,
          upload_type: 'COMPLETE',
        }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleProceedToCI = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${application.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ workflow_status: 'CI_BI', notes }),
      });
      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to proceed to CI/BI stage');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" id="file-input" />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="mx-auto mb-2" size={32} />
          <p className="font-medium">Click to upload or drag files</p>
          <p className="text-sm text-gray-600">Requirements files (PDF, DOC, etc.)</p>
        </label>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2">Uploaded Files</h3>
        {attachments.length === 0 ? (
          <p className="text-gray-600">No files uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((att: any) => (
              <div key={att.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                <FileText size={18} />
                <span>{att.file_name}</span>
                <span className="ml-auto text-sm text-gray-600">{new Date(att.uploaded_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          rows={4} 
          className="w-full border rounded px-3 py-2" 
          placeholder="Add notes for CI/BI investigation..."
        />
      </div>

      <button 
        onClick={handleProceedToCI} 
        disabled={submitting} 
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {submitting ? 'Proceeding...' : 'Proceed to CI/BI Investigation'}
      </button>
    </div>
  );
};

const PassRequirementsTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const attachments = application.requirement_attachments || [];

  const handleProceedToCI = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${application.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ workflow_status: 'CI_BI', notes }),
      });
      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to proceed to CI/BI stage');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">Requirements Verified ✓</h3>
        <p className="text-sm text-green-700">All submitted requirements have been verified and approved. You can now proceed to CI/BI Investigation.</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Uploaded Requirements</h3>
        {attachments.length === 0 ? (
          <p className="text-gray-600">No files uploaded</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((att: any) => (
              <div key={att.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                <FileText size={18} />
                <span>{att.file_name}</span>
                <span className="ml-auto text-sm text-gray-600">{new Date(att.uploaded_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Additional Notes</label>
        <textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          rows={4} 
          className="w-full border rounded px-3 py-2" 
          placeholder="Any additional notes for CI/BI investigation..."
        />
      </div>

      <button 
        onClick={handleProceedToCI} 
        disabled={submitting} 
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        {submitting ? 'Starting CI/BI...' : 'Start CI/BI Investigation'}
      </button>
    </div>
  );
};

const ApprovalsTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [approved, setApproved] = useState(application.head_office_approved !== null ? application.head_office_approved : true);
  const [notes, setNotes] = useState(application.head_office_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/head-office-approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ approved, notes }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Decision</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" value="true" checked={approved === true} onChange={(e) => setApproved(e.target.value === 'true')} className="mr-2" />
            <span>Approve</span>
          </label>
          <label className="flex items-center">
            <input type="radio" value="false" checked={approved === false} onChange={(e) => setApproved(e.target.value === 'true')} className="mr-2" />
            <span>Disapprove</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" placeholder="Add approval notes..." />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Approval'}
      </button>
    </div>
  );
};

const BranchApprovalTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [status, setStatus] = useState(application.branch_status || '');
  const [notes, setNotes] = useState(application.branch_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/branch-approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status, notes }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Branch Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select status...</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

const ClientNotificationTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [status, setStatus] = useState(application.client_notification_status || '');
  const [notes, setNotes] = useState(application.client_notification_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/client-notification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status, notes }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Notification Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select status...</option>
          <option value="PENDING">Pending</option>
          <option value="NOTIFIED">Notified</option>
          <option value="CONFIRMED">Confirmed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

const UnitReleaseTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [status, setStatus] = useState(application.unit_release_status || '');
  const [notes, setNotes] = useState(application.unit_release_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/unit-release`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status, notes }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Release Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select status...</option>
          <option value="PENDING">Pending</option>
          <option value="RELEASED">Released</option>
          <option value="ASSIGNED">Assigned</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

const SalesEncodingTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => {
  const [status, setStatus] = useState(application.sales_data?.status || '');
  const [notes, setNotes] = useState(application.sales_data?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/workflow/${application.id}/sales-encoding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status, notes }),
      });
      if (response.ok) {
        onUpdate();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Sales Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Select status...</option>
          <option value="PENDING">Pending</option>
          <option value="ENCODED">Encoded</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" />
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Complete'}
      </button>
    </div>
  );
};

export default WorkflowDetailPage;

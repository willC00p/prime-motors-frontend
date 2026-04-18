import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
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
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const data = await getApplicationWithDetails(parseInt(id!));
        setApplication(data);
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
    { id: 'SUBMIT_REQS', label: 'Requirements', completed: ['CI_BI', 'CI_BI_RESULT', 'HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'SUBMIT_REQS' },
    { id: 'CI_BI', label: 'CI/BI Investigation', completed: ['CI_BI_RESULT', 'HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'CI_BI' },
    { id: 'CI_BI_RESULT', label: 'CI/BI Result', completed: ['HEAD_OFFICE', 'BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'CI_BI_RESULT' },
    { id: 'HEAD_OFFICE', label: 'Head Office', completed: ['BRANCH_APPROVAL', 'CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'HEAD_OFFICE' },
    { id: 'BRANCH_APPROVAL', label: 'Branch', completed: ['CLIENT_NOTIFICATION', 'UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'BRANCH_APPROVAL' },
    { id: 'CLIENT_NOTIFICATION', label: 'Client', completed: ['UNIT_RELEASE', 'SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'CLIENT_NOTIFICATION' },
    { id: 'UNIT_RELEASE', label: 'Unit Release', completed: ['SALES_ENCODING', 'COMPLETED'].includes(application.workflow_status), current: application.workflow_status === 'UNIT_RELEASE' },
    { id: 'SALES_ENCODING', label: 'Sales', completed: application.workflow_status === 'COMPLETED', current: application.workflow_status === 'SALES_ENCODING' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={18} />
        Back to Leads
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{application.applicant_name}</h1>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{application.applicant_email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{application.applicant_phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Branch</p>
            <p className="font-medium">{application.branches?.name}</p>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Workflow Progress</h2>
        <div className="flex items-center justify-between overflow-x-auto">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.id}>
              <div className={`flex flex-col items-center ${stage.completed ? 'opacity-100' : stage.current ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage.completed ? 'bg-green-500' : stage.current ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  {stage.completed ? <CheckCircle size={24} className="text-white" /> : <Clock size={24} className="text-white" />}
                </div>
                <p className="text-xs mt-2 text-center max-w-[80px]">{stage.label}</p>
              </div>
              {idx < stages.length - 1 && <div className={`flex-1 h-1 mx-2 ${stage.completed ? 'bg-green-500' : 'bg-gray-300'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('cibi')}
            className={`px-6 py-3 font-medium ${activeTab === 'cibi' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            CI/BI Investigation
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-6 py-3 font-medium ${activeTab === 'requirements' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Requirements
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-6 py-3 font-medium ${activeTab === 'approvals' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Approvals
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab application={application} />}
          {activeTab === 'cibi' && <CIBITab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'requirements' && <RequirementsTab application={application} onUpdate={() => window.location.reload()} />}
          {activeTab === 'approvals' && <ApprovalsTab application={application} onUpdate={() => window.location.reload()} />}
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
  const [attachments, setAttachments] = useState(application.requirement_attachments || []);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Here you'd upload to a file storage service first, then create the attachment record
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
    </div>
  );
};

const ApprovalsTab: React.FC<{ application: any; onUpdate: () => void }> = ({ application, onUpdate }) => (
  <div className="space-y-6">
    {/* Head Office Approval */}
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <User size={18} />
        Head Office Approval
      </h3>
      {application.head_office_approver ? (
        <div className="space-y-2">
          <p><span className="text-gray-600">Approved by:</span> <span className="font-medium">{application.head_office_approver.name}</span></p>
          <p><span className="text-gray-600">Status:</span> <span className="font-medium">{application.head_office_approved ? 'Approved' : 'Disapproved'}</span></p>
          {application.head_office_notes && <p><span className="text-gray-600">Notes:</span> {application.head_office_notes}</p>}
        </div>
      ) : (
        <p className="text-gray-600">Pending approval</p>
      )}
    </div>

    {/* Branch Approval */}
    {application.branch_approver && (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <User size={18} />
          Branch Approval
        </h3>
        <div className="space-y-2">
          <p><span className="text-gray-600">Approved by:</span> <span className="font-medium">{application.branch_approver.name}</span></p>
          <p><span className="text-gray-600">Status:</span> <span className="font-medium">{application.branch_status}</span></p>
          {application.branch_notes && <p><span className="text-gray-600">Notes:</span> {application.branch_notes}</p>}
        </div>
      </div>
    )}
  </div>
);

export default WorkflowDetailPage;

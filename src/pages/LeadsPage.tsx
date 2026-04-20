import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Filter, AlertCircle, Clock, CheckCircle, MapPin, Trash2 } from 'lucide-react';
import { getLeads, getLeadsSummary, deleteLead } from '../services/leadsApi';

interface Lead {
  id: number;
  applicant_name: string;
  applicant_phone?: string;
  applicant_email?: string;
  workflow_status: string;
  requirements_status?: string;
  cibi_result?: string;
  cibi_sla_exceeded: boolean;
  cibi_penalty_amount?: number;
  created_at: string;
  updated_at: string;
  branches: { id: number; name: string } | null;
  investigator?: { id: number; name: string; email: string } | null;
  cibi_applications: Array<{
    id: number;
    status: string;
    system_recommendation: string;
  }>;
}

interface Summary {
  APPLICATION: number;
  LEADS: number;
  SUBMIT_REQS: number;
  CI_BI: number;
  CI_BI_RESULT: number;
  HEAD_OFFICE: number;
  BRANCH_APPROVAL: number;
  CLIENT_NOTIFICATION: number;
  UNIT_RELEASE: number;
  SALES_ENCODING: number;
  SLA_EXCEEDED: number;
}

const WORKFLOW_STAGES = [
  { id: 'APPLICATION', label: 'Application', color: 'bg-gray-100', textColor: 'text-gray-800' },
  { id: 'LEADS', label: 'Leads', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { id: 'SUBMIT_REQS', label: 'Submit Requirements', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { id: 'CI_BI', label: 'CI/BI Investigation', color: 'bg-orange-100', textColor: 'text-orange-800' },
  { id: 'CI_BI_RESULT', label: 'CI/BI Result', color: 'bg-red-100', textColor: 'text-red-800' },
  { id: 'HEAD_OFFICE', label: 'Head Office', color: 'bg-green-100', textColor: 'text-green-800' },
  { id: 'BRANCH_APPROVAL', label: 'Branch Approval', color: 'bg-indigo-100', textColor: 'text-indigo-800' },
  { id: 'CLIENT_NOTIFICATION', label: 'Client Notification', color: 'bg-pink-100', textColor: 'text-pink-800' },
  { id: 'UNIT_RELEASE', label: 'Unit Release', color: 'bg-teal-100', textColor: 'text-teal-800' },
  { id: 'SALES_ENCODING', label: 'Sales Encoding', color: 'bg-cyan-100', textColor: 'text-cyan-800' },
];

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [slaCountdowns, setSlaCountdowns] = useState<Record<number, string>>({}); // Track SLA countdowns

  useEffect(() => {
    fetchLeads();
    fetchSummary();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLeads();
      fetchSummary();
    }, 30000);
    return () => clearInterval(interval);
  }, [page, search, filterStatus]);

  // Update SLA countdown every second
  useEffect(() => {
    const slaInterval = setInterval(() => {
      updateSLACountdowns();
    }, 1000);
    return () => clearInterval(slaInterval);
  }, [leads]);

  const updateSLACountdowns = () => {
    const countdowns: Record<number, string> = {};
    leads.forEach((lead) => {
      if (lead.workflow_status === 'CI_BI' && lead.updated_at) {
        const updatedTime = new Date(lead.updated_at).getTime();
        const slaDeadline = updatedTime + 24 * 60 * 60 * 1000; // 24 hours
        const now = new Date().getTime();
        const remaining = slaDeadline - now;

        if (remaining > 0) {
          const hours = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
          countdowns[lead.id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          countdowns[lead.id] = 'Expired';
        }
      }
    });
    setSlaCountdowns(countdowns);
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeads(page, 20, filterStatus !== 'ALL' ? filterStatus : undefined, search);
      if (data.success) {
        setLeads(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getLeadsSummary();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleDeleteLead = async (leadId: number, leadName: string) => {
    if (!window.confirm(`Are you sure you want to delete the application for ${leadName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteLead(leadId);
      if (response.success) {
        setExpandedId(null);
        fetchLeads();
        fetchSummary();
      } else {
        alert('Failed to delete lead: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead');
    }
  };

  const getStageInfo = (status: string) => {
    return WORKFLOW_STAGES.find((s) => s.id === status);
  };

  const getSLAStatus = (lead: Lead) => {
    if (lead.cibi_sla_exceeded) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-xs font-semibold">
          <AlertCircle size={14} />
          SLA Exceeded (₱{lead.cibi_penalty_amount || 0})
        </div>
      );
    }
    if (lead.workflow_status === 'CI_BI') {
      const remaining = slaCountdowns[lead.id] || 'Calculating...';
      return (
        <div className="flex items-center gap-1 text-yellow-600 text-xs font-semibold">
          <Clock size={14} />
          {remaining}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Monitor application workflow pipeline</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLeads}
            className="px-3 md:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-xs md:text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards - Mobile friendly grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {WORKFLOW_STAGES.slice(0, 5).map((stage) => (
            <div
              key={stage.id}
              className={`${stage.color} ${stage.textColor} p-2 md:p-4 rounded-lg shadow-sm`}
            >
              <div className="text-lg md:text-2xl font-bold">{summary[stage.id as keyof Summary]}</div>
              <div className="text-xs mt-1">{stage.label}</div>
            </div>
          ))}
          <div className="bg-red-100 text-red-800 p-2 md:p-4 rounded-lg shadow-sm">
            <div className="text-lg md:text-2xl font-bold">{summary.SLA_EXCEEDED}</div>
            <div className="text-xs mt-1">SLA Exceeded</div>
          </div>
        </div>
      )}

      {/* Search and Filter - Responsive stack */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 md:px-4 py-2 rounded-lg border border-gray-200">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent w-full outline-none text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 md:px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer md:min-w-[150px]"
        >
          <option value="ALL">All Statuses</option>
          {WORKFLOW_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      {/* Leads - Responsive Table on Desktop, Cards on Mobile */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No leads found</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Investigator</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">SLA</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => {
                    const stageInfo = getStageInfo(lead.workflow_status);
                    const isExpanded = expandedId === lead.id;
                    return (
                      <React.Fragment key={lead.id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                        >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 hover:text-blue-600 underline cursor-pointer" onClick={() => navigate(`/workflow/${lead.id}`)}>
                            {lead.applicant_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div>{lead.applicant_email}</div>
                            <div className="text-xs text-gray-500">{lead.applicant_phone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {lead.branches?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {stageInfo && (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${stageInfo.color} ${stageInfo.textColor}`}>
                                {stageInfo.label}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {lead.investigator?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">{getSLAStatus(lead)}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              className="text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(isExpanded ? null : lead.id);
                              }}
                            >
                              <ChevronDown size={18} className={isExpanded ? 'rotate-180' : ''} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan={7} className="px-6 py-4">
                            <ExpandedLeadDetails lead={lead} navigate={navigate} onDelete={handleDeleteLead} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {leads.map((lead) => {
                const stageInfo = getStageInfo(lead.workflow_status);
                const isExpanded = expandedId === lead.id;
                return (
                  <div
                    key={lead.id}
                    className="p-4 border-b border-gray-200 hover:bg-gray-50"
                  >
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h3
                            className="text-sm font-medium text-blue-600 underline cursor-pointer"
                            onClick={() => navigate(`/workflow/${lead.id}`)}
                          >
                            {lead.applicant_name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">{lead.applicant_email}</p>
                        </div>
                        <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {stageInfo && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${stageInfo.color} ${stageInfo.textColor}`}>
                            {stageInfo.label}
                          </span>
                        )}
                        {getSLAStatus(lead) && (
                          <div className="text-xs">{getSLAStatus(lead)}</div>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <div><strong>Branch:</strong> {lead.branches?.name || 'N/A'}</div>
                        <div><strong>Phone:</strong> {lead.applicant_phone || 'N/A'}</div>
                        <div><strong>Investigator:</strong> {lead.investigator?.name || '-'}</div>
                      </div>
                    </div>

                    {/* Expanded Details on Mobile */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <ExpandedLeadDetails lead={lead} navigate={navigate} onDelete={handleDeleteLead} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-3 md:p-4 border-t border-gray-200 flex-wrap">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2 md:px-3 py-1 rounded border border-gray-300 text-xs md:text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs md:text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-2 md:px-3 py-1 rounded border border-gray-300 text-xs md:text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted component for expanded lead details - READ-ONLY view
const ExpandedLeadDetails: React.FC<{
  lead: Lead;
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  onDelete: (leadId: number, leadName: string) => void;
}> = ({ lead, navigate, onDelete }) => {
  const currentStageInfo = WORKFLOW_STAGES.find(s => s.id === lead.workflow_status);
  const completedStages = WORKFLOW_STAGES.filter(stage => {
    const stageIdx = WORKFLOW_STAGES.findIndex(s => s.id === stage.id);
    const currentIdx = WORKFLOW_STAGES.findIndex(s => s.id === lead.workflow_status);
    return stageIdx < currentIdx;
  });
  
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Workflow Status</h4>
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStageInfo?.color}`}>
            <Clock size={24} className="text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Stage</p>
            <p className="text-lg font-semibold text-gray-900">{currentStageInfo?.label}</p>
            {completedStages.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Completed {completedStages.length} of {WORKFLOW_STAGES.length} stages
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Progress</h4>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${(completedStages.length / WORKFLOW_STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {lead.cibi_applications.length > 0 && (
        <div className="bg-white p-3 md:p-4 rounded border border-gray-200">
          <h5 className="font-semibold text-gray-900 mb-2">CI/BI Details</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <strong>Status:</strong> {lead.cibi_applications[0].status}
            </div>
            <div>
              <strong>Recommendation:</strong> {lead.cibi_applications[0].system_recommendation}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate(`/workflow/${lead.id}`)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
      >
        View Details & Take Action
      </button>

      <button
        onClick={() => onDelete(lead.id, lead.applicant_name)}
        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm md:text-base flex items-center justify-center gap-2"
      >
        <Trash2 size={16} />
        Delete Application
      </button>
    </div>
  );
};

export default LeadsPage;

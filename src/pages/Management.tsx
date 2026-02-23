import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { ModelLoanTemplates } from '../components/ModelLoanTemplates';

interface Branch {
  id: number;
  name: string;
  address: string;
}

interface Model {
  id: number;
  item_no: string;
  brand: string;
  model: string;
  color: string[];
  srp?: number;
  cost_of_purchase?: number;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  contact_number: string;
}

const Management = () => {
  // State for branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState<Partial<Branch>>({ name: '', address: '' });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // State for models
  const [models, setModels] = useState<any[]>([]); // any[] to allow loan_templates
  // Filters for models
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [srpMin, setSrpMin] = useState<number | ''>('');
  const [srpMax, setSrpMax] = useState<number | ''>('');
  const [templateTermFilter, setTemplateTermFilter] = useState<number | ''>('');
  const [templateQuery, setTemplateQuery] = useState('');
  interface ModelFormData {
    item_no: string;
    brand: string;
    model: string;
    color: string;
    srp: string;
    cost_of_purchase: string;
  }

  const [newModel, setNewModel] = useState<ModelFormData>({ 
    item_no: '', 
    brand: '', 
    model: '', 
    color: '',
    srp: '',
    cost_of_purchase: ''
  });
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  // State for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    contact_person: '',
    contact_number: ''
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { showToast } = useToast();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, modelsData, suppliersData] = await Promise.all([
          api.get<Branch[]>('/branches'),
          api.get<any[]>('/models'), // fetch from /models to include loan_templates
          api.get<Supplier[]>('/suppliers')
        ]);
        setBranches(branchesData);
        setModels(modelsData);
        setSuppliers(suppliersData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  // Derived filter lists
  const brands = Array.from(new Set(models.map(m => (m.brand || m.items?.brand || '').toString()).filter(Boolean)));
  const modelsForBrand = Array.from(new Set(models
    .filter(m => !brandFilter || (m.brand || m.items?.brand) === brandFilter)
    .map(m => (m.model || m.items?.model || '').toString())
    .filter(Boolean)
  ));

  // Client-side filtered models list
  const filteredModels = models.filter(m => {
    const q = (searchTerm || '').toLowerCase().trim();
    const brand = (m.brand || m.items?.brand || '').toString();
    const modelName = (m.model || m.items?.model || '').toString();
    const itemNo = (m.item_no || m.items?.item_no || '').toString();
    const colors = Array.isArray(m.color) ? m.color.join(' ') : (m.color || '').toString();
    const srpVal = typeof m.srp === 'number' ? m.srp : (m.srp ? Number(m.srp) : undefined);

    if (brandFilter && brand !== brandFilter) return false;
    if (modelFilter && modelName !== modelFilter) return false;
    if (srpMin !== '' && srpVal !== undefined && srpVal < Number(srpMin)) return false;
    if (srpMax !== '' && srpVal !== undefined && srpVal > Number(srpMax)) return false;

    if (q) {
      const inFields = [brand, modelName, itemNo, colors, String(m.id), (srpVal ?? '').toString()].join(' ').toLowerCase();
      if (!inFields.includes(q)) {
        // Also search inside loan templates
        const templates = m.loan_templates || m.model_loan_templates || [];
        const tplMatch = templates.some((t: any) => {
          const tfields = [t.term_months, t.loan_amount, t.downpayment_percentage, t.monthly_amortization, t.rebates_commission].join(' ').toLowerCase();
          return tfields.includes(q);
        });
        if (!tplMatch) return false;
      }
    }

    if (templateTermFilter !== '') {
      const templates = m.loan_templates || m.model_loan_templates || [];
      const hasTerm = templates.some((t: any) => Number(t.term_months) === Number(templateTermFilter));
      if (!hasTerm) return false;
    }

    if (templateQuery) {
      const q2 = templateQuery.toLowerCase().trim();
      const templates = m.loan_templates || m.model_loan_templates || [];
      const tplMatch = templates.some((t: any) => {
        const tfields = [t.term_months, t.loan_amount, t.downpayment_percentage, t.monthly_amortization, t.rebates_commission].join(' ').toLowerCase();
        return tfields.includes(q2);
      });
      if (!tplMatch) return false;
    }

    return true;
  });

  // Branch CRUD operations
  const handleAddBranch = async () => {
    try {
      const response = await api.post<Branch>('/branches', newBranch);
      setBranches([...branches, response]);
      setNewBranch({ name: '', address: '' });
      showToast({ type: 'success', message: 'Branch added' });
    } catch (err) {
      console.error('Failed to add branch:', err);
      showToast({ type: 'error', message: 'Failed to add branch' });
    }
  };

  const handleUpdateBranch = async (id: number) => {
    if (!editingBranch) return;
    try {
      const response = await api.put<Branch>(`/branches/${id}`, editingBranch);
      setBranches(branches.map(b => b.id === id ? response : b));
      setEditingBranch(null);
      showToast({ type: 'success', message: 'Branch updated' });
    } catch (err) {
      console.error('Failed to update branch:', err);
      showToast({ type: 'error', message: 'Failed to update branch' });
    }
  };

  const handleDeleteBranch = async (id: number) => {
    try {
      await api.delete(`/branches/${id}`);
      setBranches(branches.filter(b => b.id !== id));
      showToast({ type: 'success', message: 'Branch deleted' });
    } catch (err) {
      console.error('Failed to delete branch:', err);
      showToast({ type: 'error', message: 'Failed to delete branch' });
    }
  };

  // Model CRUD operations
  const handleAddModel = async () => {
    try {
      const modelData = {
        ...newModel,
        color: newModel.color.split(',').map((c: string) => c.trim()).filter(Boolean),
        srp: newModel.srp ? Number(newModel.srp) : undefined,
        cost_of_purchase: newModel.cost_of_purchase ? Number(newModel.cost_of_purchase) : undefined
      };
      const response = await api.post<Model>('/items', modelData);
      setModels([...models, response]);
      setNewModel({ item_no: '', brand: '', model: '', color: '', srp: '', cost_of_purchase: '' });
      showToast({ type: 'success', message: 'Model added' });
    } catch (err) {
      console.error('Failed to add model:', err);
      showToast({ type: 'error', message: 'Failed to add model' });
    }
  };

  const handleUpdateModel = async (id: number) => {
    if (!editingModel) return;
    try {
      const response = await api.put<Model>(`/items/${id}`, editingModel);
      setModels(models.map(m => m.id === id ? response : m));
      setEditingModel(null);
      showToast({ type: 'success', message: 'Model updated' });
    } catch (err) {
      console.error('Failed to update model:', err);
      showToast({ type: 'error', message: 'Failed to update model' });
    }
  };

  const handleDeleteModel = async (id: number) => {
    try {
      await api.delete(`/items/${id}`);
      setModels(models.filter(m => m.id !== id));
      showToast({ type: 'success', message: 'Model deleted' });
    } catch (err) {
      console.error('Failed to delete model:', err);
      showToast({ type: 'error', message: 'Failed to delete model' });
    }
  };

  // Supplier CRUD operations
  const handleAddSupplier = async () => {
    try {
      const response = await api.post<Supplier>('/suppliers', newSupplier);
      setSuppliers([...suppliers, response]);
      setNewSupplier({ name: '', contact_person: '', contact_number: '' });
      showToast({ type: 'success', message: 'Supplier added' });
    } catch (err) {
      console.error('Failed to add supplier:', err);
      showToast({ type: 'error', message: 'Failed to add supplier' });
    }
  };

  const handleUpdateSupplier = async (id: number) => {
    if (!editingSupplier) return;
    try {
      const response = await api.put<Supplier>(`/suppliers/${id}`, editingSupplier);
      setSuppliers(suppliers.map(s => s.id === id ? response : s));
      setEditingSupplier(null);
      showToast({ type: 'success', message: 'Supplier updated' });
    } catch (err) {
      console.error('Failed to update supplier:', err);
      showToast({ type: 'error', message: 'Failed to update supplier' });
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      await api.delete(`/suppliers/${id}`);
      setSuppliers(suppliers.filter(s => s.id !== id));
      showToast({ type: 'success', message: 'Supplier deleted' });
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      showToast({ type: 'error', message: 'Failed to delete supplier' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Management Dashboard</h1>

      {/* Branches Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Branches</h2>
        
        {/* Add Branch Form */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Branch Name"
              className="border rounded px-3 py-2"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Address"
              className="border rounded px-3 py-2"
              value={newBranch.address}
              onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
            />
          </div>
          <button
            onClick={handleAddBranch}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Branch
          </button>
        </div>

        {/* Branches List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {branches.map(branch => (
                <tr key={branch.id}>
                  <td className="px-6 py-4">
                    {editingBranch?.id === branch.id ? (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full"
                        value={editingBranch.name}
                        onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                      />
                    ) : branch.name}
                  </td>
                  <td className="px-6 py-4">
                    {editingBranch?.id === branch.id ? (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full"
                        value={editingBranch.address}
                        onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                      />
                    ) : branch.address}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingBranch?.id === branch.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateBranch(branch.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingBranch(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingBranch(branch)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Models Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Models</h2>
        <div className="flex gap-2 mb-4">
          <input className="border rounded px-3 py-2" placeholder="Search models, brand, item no, engine" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <select className="border rounded px-3 py-2" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">All Brands</option>
            {Array.from(new Set(models.map(m => (m.brand || m.items?.brand || '').toString()).filter(Boolean))).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={modelFilter} onChange={e => setModelFilter(e.target.value)}>
            <option value="">All Models</option>
            {Array.from(new Set(models.filter(m => !brandFilter || (m.brand || m.items?.brand) === brandFilter).map(m => (m.model || m.items?.model || '').toString()).filter(Boolean))).map(mo => (
              <option key={mo} value={mo}>{mo}</option>
            ))}
          </select>
          <input type="number" className="border rounded px-3 py-2 w-32" placeholder="Min SRP" value={srpMin} onChange={e => setSrpMin(e.target.value ? Number(e.target.value) : '')} />
          <input type="number" className="border rounded px-3 py-2 w-32" placeholder="Max SRP" value={srpMax} onChange={e => setSrpMax(e.target.value ? Number(e.target.value) : '')} />
          <select className="border rounded px-3 py-2" value={templateTermFilter} onChange={e => setTemplateTermFilter(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Any Term</option>
            {[3,6,12,18,24,30,36].map(t => <option key={t} value={t}>{t} months</option>)}
          </select>
          <input className="border rounded px-3 py-2" placeholder="Search inside templates" value={templateQuery} onChange={e => setTemplateQuery(e.target.value)} />
        </div>

        {/* Add Model Form */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Item Number"
              className="border rounded px-3 py-2"
              value={newModel.item_no}
              onChange={(e) => setNewModel({ ...newModel, item_no: e.target.value })}
            />
            <input
              type="text"
              placeholder="Brand"
              className="border rounded px-3 py-2"
              value={newModel.brand}
              onChange={(e) => setNewModel({ ...newModel, brand: e.target.value })}
            />
            <input
              type="text"
              placeholder="Model"
              className="border rounded px-3 py-2"
              value={newModel.model}
              onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
            />
            <input
              type="text"
              placeholder="Colors (comma-separated)"
              className="border rounded px-3 py-2"
              value={newModel.color}
              onChange={(e) => setNewModel({ 
                ...newModel, 
                color: e.target.value
              })}
            />
            <input
              type="number"
              placeholder="SRP"
              className="border rounded px-3 py-2"
              value={newModel.srp}
              onChange={(e) => setNewModel({
                ...newModel,
                srp: e.target.value
              })}
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Cost of Purchase"
              className="border rounded px-3 py-2"
              value={newModel.cost_of_purchase}
              onChange={(e) => setNewModel({
                ...newModel,
                cost_of_purchase: e.target.value
              })}
              min="0"
              step="0.01"
            />
          </div>
          <button
            onClick={handleAddModel}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Model
          </button>
        </div>

        {/* Models List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colors</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SRP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Templates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredModels.map(model => (
                <React.Fragment key={`model-${model.id}`}>
                  <tr>
                    <td className="px-6 py-4">
                      {editingModel && editingModel.id === model.id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={editingModel.item_no}
                          onChange={(e) => setEditingModel({ ...editingModel, id: model.id, item_no: e.target.value })}
                        />
                      ) : model.item_no}
                    </td>
                    <td className="px-6 py-4">
                      {editingModel && editingModel.id === model.id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={editingModel.brand}
                          onChange={(e) => setEditingModel({ ...editingModel, id: model.id, brand: e.target.value })}
                        />
                      ) : model.brand}
                    </td>
                    <td className="px-6 py-4">
                      {editingModel && editingModel.id === model.id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={editingModel.model}
                          onChange={(e) => setEditingModel({ ...editingModel, id: model.id, model: e.target.value })}
                        />
                      ) : model.model}
                    </td>
                    <td className="px-6 py-4">
                      {editingModel && editingModel.id === model.id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={Array.isArray(editingModel.color) ? editingModel.color.join(', ') : editingModel.color || ''}
                          onChange={(e) => setEditingModel({ 
                            ...editingModel, 
                            id: model.id,
                            color: e.target.value.split(',').map(c => c.trim()) 
                          })}
                        />
                      ) : Array.isArray(model.color) ? model.color.join(', ') : model.color || ''}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingModel && editingModel.id === model.id ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full"
                          value={editingModel.cost_of_purchase ?? ''}
                          onChange={(e) => setEditingModel({ ...editingModel, id: model.id, cost_of_purchase: e.target.value ? Number(e.target.value) : undefined })}
                          min="0"
                          step="0.01"
                        />
                      ) : model.cost_of_purchase?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingModel && editingModel.id === model.id ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full"
                          value={editingModel.srp || ''}
                          onChange={(e) => setEditingModel({ 
                            ...editingModel, 
                            id: model.id,
                            srp: e.target.value ? Number(e.target.value) : undefined
                          })}
                          min="0"
                          step="0.01"
                        />
                      ) : model.srp?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {editingModel && editingModel.id === model.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateModel(model.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingModel(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingModel(model)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                  <tr key={model.id + '-templates'}>
                    <td colSpan={7} className="bg-gray-50 px-6 py-2">
                      <ModelLoanTemplates itemId={model.id} srp={model.srp || 0} />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Management;

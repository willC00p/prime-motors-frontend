import type { Model } from '../types/Model';
import { ModelLoanTemplates } from './ModelLoanTemplates';

interface ModelTableRowProps {
    model: Model;
    editingModel: Model | null;
    setEditingModel: (model: Model | null) => void;
    handleUpdateModel: (id: number) => void;
    handleDeleteModel: (id: number) => void;
}

export function ModelTableRow({
    model,
    editingModel,
    setEditingModel,
    handleUpdateModel,
    handleDeleteModel
}: ModelTableRowProps) {
    return (
        <>
            <tr>
                <td className="px-6 py-4">
                    {editingModel?.id === model.id ? (
                        <input
                            type="text"
                            className="border rounded px-2 py-1 w-full"
                            value={editingModel.item_no}
                            onChange={(e) => setEditingModel({ ...editingModel, item_no: e.target.value })}
                        />
                    ) : model.item_no}
                </td>
                <td className="px-6 py-4">
                    {editingModel?.id === model.id ? (
                        <input
                            type="text"
                            className="border rounded px-2 py-1 w-full"
                            value={editingModel.brand || ''}
                            onChange={(e) => setEditingModel({ ...editingModel, brand: e.target.value })}
                        />
                    ) : model.brand}
                </td>
                <td className="px-6 py-4">
                    {editingModel?.id === model.id ? (
                        <input
                            type="text"
                            className="border rounded px-2 py-1 w-full"
                            value={editingModel.model}
                            onChange={(e) => setEditingModel({ ...editingModel, model: e.target.value })}
                        />
                    ) : model.model}
                </td>
                <td className="px-6 py-4">
                    {editingModel?.id === model.id ? (
                        <input
                            type="text"
                            className="border rounded px-2 py-1 w-full"
                            value={Array.isArray(editingModel.color) ? editingModel.color.join(', ') : editingModel.color || ''}
                            onChange={(e) => setEditingModel({ 
                                ...editingModel, 
                                color: e.target.value.split(',').map(c => c.trim())
                            })}
                        />
                    ) : Array.isArray(model.color) ? model.color.join(', ') : model.color || ''}
                </td>
                <td className="px-6 py-4 text-right">
                    {editingModel?.id === model.id ? (
                        <input
                            type="number"
                            className="border rounded px-2 py-1 w-full"
                            value={editingModel.srp || ''}
                            onChange={(e) => setEditingModel({
                                ...editingModel,
                                srp: e.target.value ? Number(e.target.value) : undefined
                            })}
                            min="0"
                            step="0.01"
                        />
                    ) : model.srp?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                    {editingModel?.id === model.id ? (
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
            </tr>
            {editingModel?.id === model.id && (
                <tr>
                    <td colSpan={6} className="px-6 py-4">
                        <ModelLoanTemplates itemId={model.id} />
                    </td>
                </tr>
            )}
        </>
    );
}

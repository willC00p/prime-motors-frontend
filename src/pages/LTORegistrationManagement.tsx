import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LTORegistration, LTORegistrationFilters } from '../types/LTORegistration';
import { ltoRegistrationApi } from '../services/ltoRegistrationApi';
import { salesApi } from '../services/salesApi';
import LTORegistrationForm from '../components/LTORegistrationForm';
import type { Sale } from '../services/salesApi';

export default function LTORegistrationManagement() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<LTORegistrationFilters>({});
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch sales data with LTO registration info
    const { data: sales, isLoading, isError, error } = useQuery({
        queryKey: ['sales', filters],
        queryFn: () => salesApi.list(filters),
        refetchInterval: 5000, // Refetch every 5 seconds
        refetchOnWindowFocus: true,
        staleTime: 0 // Consider data stale immediately to ensure fresh data
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: ltoRegistrationApi.create,
        onSuccess: () => {
            // Immediately invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.refetchQueries({ queryKey: ['sales'] });
            setIsModalOpen(false);
            setSelectedSale(null);
        },
        onError: (error) => {
            alert('Failed to create registration: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<LTORegistration> }) => {
            console.log('Update Mutation - Starting update with:', { id, data });
            return ltoRegistrationApi.update(id, data);
        },
        onSuccess: (response) => {
            console.log('Update Mutation - Success:', response);
            // Immediately invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.refetchQueries({ queryKey: ['sales'] });
            setIsModalOpen(false);
            setSelectedSale(null);
        },
        onError: (error) => {
            console.error('Update Mutation - Error:', error);
            alert('Failed to update registration: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">
                    <p>Error loading data. Please try refreshing the page.</p>
                    <p className="text-sm text-gray-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">LTO Registration Management</h1>
                <button
                    onClick={() => ltoRegistrationApi.exportToExcel(filters)}
                    className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    Export to Excel
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        value={filters.csrNumber || ''}
                        onChange={(e) => setFilters({ ...filters, csrNumber: e.target.value })}
                        className="border rounded px-3 py-2"
                        placeholder="CSR Number"
                    />
                    
                    <input
                        type="text"
                        value={filters.sdrNumber || ''}
                        onChange={(e) => setFilters({ ...filters, sdrNumber: e.target.value })}
                        className="border rounded px-3 py-2"
                        placeholder="SDR Number"
                    />
                    
                    <input
                        type="text"
                        value={filters.insuranceNumber || ''}
                        onChange={(e) => setFilters({ ...filters, insuranceNumber: e.target.value })}
                        className="border rounded px-3 py-2"
                        placeholder="Insurance Number"
                    />
                    
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="border rounded px-3 py-2"
                        placeholder="Start Date"
                    />
                    
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="border rounded px-3 py-2"
                        placeholder="End Date"
                    />
                </div>
            </div>

            {/* Sales and Registration Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2">DR No.</th>
                            <th className="px-4 py-2">SI No.</th>
                            <th className="px-4 py-2">Customer Name</th>
                            <th className="px-4 py-2">Vehicle</th>
                            <th className="px-4 py-2">Engine No.</th>
                            <th className="px-4 py-2">Chassis No.</th>
                            <th className="px-4 py-2">Plate No.</th>
                            <th className="px-4 py-2">MV File No.</th>
                            <th className="px-4 py-2">Registration Date</th>
                            <th className="px-4 py-2">Expiry Date</th>
                            <th className="px-4 py-2">Documents</th>
                            <th className="px-4 py-2">Insurance</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales?.map((sale) => {
                            const vehicleInfo = sale.sales_items[0];
                            return (
                                <tr key={sale.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">{sale.dr_no}</td>
                                    <td className="px-4 py-2">{sale.si_no}</td>
                                    <td className="px-4 py-2">
                                        {`${sale.first_name} ${sale.middle_name || ''} ${sale.last_name}`}
                                    </td>
                                    <td className="px-4 py-2">
                                        {vehicleInfo ? `${vehicleInfo.items.brand} ${vehicleInfo.items.model}` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {vehicleInfo?.vehicle_unit?.engine_no || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {vehicleInfo?.vehicle_unit?.chassis_no || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sale.lto_registrations?.[0]?.plate_number || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sale.lto_registrations?.[0]?.mv_file_number || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sale.lto_registrations?.[0]?.registration_date 
                                            ? new Date(sale.lto_registrations[0].registration_date).toLocaleDateString() 
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sale.lto_registrations?.[0]?.expiration_date 
                                            ? new Date(sale.lto_registrations[0].expiration_date).toLocaleDateString() 
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sale.lto_registrations?.[0] ? (
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-sm ${
                                                        sale.lto_registrations[0].csr_number ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                        CSR: {sale.lto_registrations[0].csr_number || 'Not Started'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-sm ${
                                                        sale.lto_registrations[0].sdr_number ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                        SDR: {sale.lto_registrations[0].sdr_number || 'Not Started'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-sm ${
                                                        sale.lto_registrations[0].insurance_number ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                        Insurance: {sale.lto_registrations[0].insurance_number || 'Not Started'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div>CSR: Not Started</div>
                                                <div>SDR: Not Started</div>
                                                <div>Insurance: Not Started</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sale.lto_registrations?.[0] && (
                                            <div className="space-y-1 text-sm">
                                                <div>{sale.lto_registrations[0].insurance_provider || 'pending'}</div>
                                                <div className="text-gray-600">{sale.lto_registrations[0].insurance_provider || 'N/A'}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            !sale.lto_registrations?.[0] ? 'bg-gray-100 text-gray-800' :
                                            sale.lto_registrations[0].status === 'completed' ? 'bg-green-100 text-green-800' :
                                            sale.lto_registrations[0].status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {sale.lto_registrations?.[0]?.status || 'Not Started'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => {
                                                setSelectedSale(sale);
                                                setIsModalOpen(true);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            {sale.lto_registrations?.length ? 'Update' : 'Register'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
                        <h2 className="text-xl font-semibold mb-4">
                            {selectedSale.lto_registrations?.length ? 'Update' : 'Create'} LTO Registration
                        </h2>
                        <LTORegistrationForm
                            sale={selectedSale}
                            onSubmit={(data: Partial<LTORegistration>) => {
                                console.log('Form Submit Handler - Selected sale:', selectedSale);
                                if (selectedSale.lto_registrations?.length) {
                                    const registrationId = selectedSale.lto_registrations[0].id;
                                    console.log('Form Submit Handler - Updating existing registration:', {
                                        id: registrationId,
                                        data
                                    });
                                    updateMutation.mutate({
                                        id: registrationId,
                                        data: {
                                            ...data,
                                            id: registrationId,
                                            sale_id: selectedSale.id
                                        }
                                    });
                                } else {
                                    console.log('Form Submit Handler - Creating new registration:', {
                                        ...data,
                                        sale_id: selectedSale.id
                                    });
                                    createMutation.mutate({
                                        ...data,
                                        sale_id: selectedSale.id
                                    });
                                }
                            }}
                            onCancel={() => {
                                setIsModalOpen(false);
                                setSelectedSale(null);
                            }}
                            isSubmitting={createMutation.isPending || updateMutation.isPending}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

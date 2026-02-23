import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LTORegistration, SaleWithDetails } from '../types/LTORegistration';
import LTORegistrationForm from './LTORegistrationForm';
import { fetchApi } from '../services/api';

const fetchPendingSales = async (): Promise<SaleWithDetails[]> => {
    return fetchApi('/api/lto-registration/pending-sales');
};

const createRegistration = async (data: Partial<LTORegistration>): Promise<LTORegistration> => {
    return fetchApi('/api/lto-registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export default function LTORegistrationManager() {
    const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();

    const { data: pendingSales, isLoading, error } = useQuery({
        queryKey: ['pendingSales'],
        queryFn: fetchPendingSales
    });

    const createMutation = useMutation({
        mutationFn: createRegistration,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingSales'] });
            setShowForm(false);
            setSelectedSale(null);
        },
    });

    const handleRegistration = (sale: SaleWithDetails) => {
        setSelectedSale(sale);
        setShowForm(true);
    };

    const handleSubmit = (data: Partial<LTORegistration>) => {
        createMutation.mutate(data);
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading sales</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Pending LTO Registrations</h2>
            
            {showForm && selectedSale ? (
                <LTORegistrationForm
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setSelectedSale(null);
                    }}
                />
            ) : (
                <div className="grid gap-4">
                    {pendingSales?.map((sale) => (
                        <div 
                            key={sale.id}
                            className="bg-white p-4 rounded-lg shadow-md"
                        >
                            <h3 className="text-lg font-semibold">
                                DR No: {sale.dr_no}
                            </h3>
                            <p>
                                Customer: {sale.first_name} {sale.middle_name} {sale.last_name}
                            </p>
                            <p>Date Sold: {new Date(sale.date_sold).toLocaleDateString()}</p>
                            <div className="mt-2">
                                {sale.sales_items.map((item) => (
                                    <div key={item.id} className="ml-4">
                                        <p>Model: {item.items.brand} {item.items.model}</p>
                                        {item.vehicle_unit && (
                                            <>
                                                <p className="text-sm text-gray-600">
                                                    Engine No: {item.vehicle_unit.engine_number || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Chassis No: {item.vehicle_unit.chassis_number || 'N/A'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleRegistration(sale)}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Register
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

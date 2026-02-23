import { useState, useEffect } from 'react';
import type { Sale } from '../services/salesApi';
import type { LTORegistration } from '../types/LTORegistration';

type LTORegistrationKeys = keyof LTORegistration;

interface LTORegistrationFormProps {
    sale: Sale;
    onSubmit: (data: Partial<LTORegistration>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

export default function LTORegistrationForm({ sale, onSubmit, onCancel, isSubmitting }: LTORegistrationFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<LTORegistration>>(() => {
        const existingRegistration = sale.lto_registrations?.[0];
        console.log('LTORegistrationForm - Sale data:', {
            sale,
            ltoRegistrations: sale.lto_registrations,
            existingRegistration
        });
        
        const initialData: Partial<LTORegistration> = {
            // Default values for new registrations
            status: 'pending' as const,
            sale_id: sale.id,
            
            // Initialize all fields with empty values
            csr_number: '',
            sdr_number: '',
            insurance_number: '',
            mv_file_number: '',
            cr_number: '',
            or_number: '',
            plate_number: '',
            insurance_provider: '',
            insurance_policy_number: '',
            registration_fee: undefined,
            insurance_fee: undefined,
            remarks: '',

            // If there's an existing registration, override with its values
            ...(existingRegistration && {
                ...existingRegistration,
                registration_date: existingRegistration.registration_date ? new Date(existingRegistration.registration_date) : undefined,
                expiration_date: existingRegistration.expiration_date ? new Date(existingRegistration.expiration_date) : undefined,
                insurance_expiry: existingRegistration.insurance_expiry ? new Date(existingRegistration.insurance_expiry) : undefined
            })
        };
        
        console.log('LTORegistrationForm - Initializing form with data:', {
            existingRegistration,
            initialData,
            isUpdate: !!sale.lto_registrations
        });
        
        return initialData;
    });

    const vehicleUnit = sale.sales_items[0]?.vehicle_unit;

    const steps = [
        { title: 'Vehicle Information', description: 'Basic vehicle details' },
        { title: 'Registration Details', description: 'LTO registration information' },
        { title: 'Document Numbers', description: 'Required document numbers' },
        { title: 'Insurance Details', description: 'Insurance information' },
        { title: 'Fees & Notes', description: 'Registration and insurance fees' }
    ];

    useEffect(() => {
        if (vehicleUnit) {
            console.log('LTORegistrationForm - Vehicle Unit Data Available:', vehicleUnit);
            setFormData(prev => {
                const newData = {
                    ...prev,
                    engine_number: vehicleUnit.engine_no,
                    chassis_number: vehicleUnit.chassis_no,
                    vehicle_unit_id: vehicleUnit.id
                };
                console.log('LTORegistrationForm - Updated Form with Vehicle Unit Data:', {
                    previousData: prev,
                    newData: newData,
                    changes: {
                        engine_number: vehicleUnit.engine_no,
                        chassis_number: vehicleUnit.chassis_no,
                        vehicle_unit_id: vehicleUnit.id
                    }
                });
                return newData;
            });
        }
    }, [vehicleUnit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent form submission if not on the final step
        if (currentStep !== steps.length - 1) {
            console.log('LTORegistrationForm - Not on final step, preventing submission');
            return false;
        }
        
        // Validate required fields
        const requiredFields = ['engine_number', 'chassis_number'] as const;
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            console.error('LTORegistrationForm - Missing required fields:', missingFields);
            return;
        }

        console.log('LTORegistrationForm - Submitting form data:', {
            formData,
            isUpdate: !!sale.lto_registrations?.length,
            saleId: sale.id
        });
        
        try {
            onSubmit({
                ...formData,
                sale_id: sale.id,
                id: sale.lto_registrations?.[0]?.id
            });
        } catch (error) {
            console.error('LTORegistrationForm - Error submitting form:', error);
        }
    };

    // Format date to YYYY-MM-DD for input value
    const formatDateForInput = (date: Date | undefined | string): string => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0];
    };

    // Handle different types of inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name = '', value, type } = e.target;
        
        console.log('LTORegistrationForm - Input Change:', { field: name, value, type });
        
        const updateFormData = (transformer: (value: string) => any) => {
            setFormData(prev => {
                const newData = {
                    ...prev,
                    [name]: transformer(value)
                };
                console.log('LTORegistrationForm - Field Update:', { 
                    field: name, 
                    previousValue: prev[name as keyof typeof prev],
                    newValue: transformer(value),
                    completeNewData: newData
                });
                return newData;
            });
        };

        // Handle different input types
        switch (type) {
            case 'date':
                updateFormData(val => val ? new Date(val) : undefined);
                break;
                
            case 'number':
                updateFormData(val => val ? Number(val) : undefined);
                break;
                
            default:
                if (name === 'status') {
                    // Validate status value
                    const validStatuses = ['pending', 'processing', 'completed', 'renewed'] as const;
                    if (!validStatuses.includes(value as any)) {
                        console.warn('Invalid status value:', value);
                        return;
                    }
                    updateFormData(val => val as typeof validStatuses[number]);
                } else if (name === 'plate_number') {
                    // For plate number, format and validate
                    let formatted = value.toUpperCase();
                    
                    // Remove any characters that aren't letters, numbers, or spaces
                    formatted = formatted.replace(/[^A-Z0-9\s]/g, '');
                    
                    // Auto-insert space after first three characters if needed
                    if (formatted.length > 3 && formatted[3] !== ' ') {
                        formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3);
                    }
                    
                    // Limit to 7 characters (3 + space + 3)
                    formatted = formatted.slice(0, 7);
                    
                    updateFormData(() => formatted);
                } else {
                    updateFormData(val => val);
                }
        }
    };

    const renderSteps = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.title} className="flex-1">
                        <div className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                                ${index === currentStep
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : index < currentStep
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : 'border-gray-300 text-gray-500'
                                }`}
                            >
                                {index < currentStep ? '✓' : index + 1}
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium">{step.title}</p>
                                <p className="text-xs text-gray-500">{step.description}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="flex-1 border-t-2 border-gray-200 mx-4 mt-4" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderVehicleInfo = () => (
        <div className={currentStep === 0 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <div className="mt-1 text-gray-900">
                        {`${sale.first_name} ${sale.middle_name || ''} ${sale.last_name}`}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Engine Number</label>
                    <input
                        type="text"
                        name="engine_number"
                        value={vehicleUnit?.engine_no || formData.engine_number || ''}
                        readOnly
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Chassis Number</label>
                    <input
                        type="text"
                        name="chassis_number"
                        value={vehicleUnit?.chassis_no || formData.chassis_number || ''}
                        readOnly
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 bg-gray-50"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Plate Number
                        <span className="ml-1 text-xs text-gray-500">(Format: ABC 123)</span>
                    </label>
                    <input
                        type="text"
                        name="plate_number"
                        value={formData.plate_number || ''}
                        onChange={handleInputChange}
                        placeholder="ABC 123"
                        title="Please enter a valid plate number format (e.g., ABC 123). Three letters or numbers, followed by a space, then three numbers."
                        maxLength={7}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 uppercase"
                        style={{ letterSpacing: '1px' }}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        First 3: Letters or numbers, Last 3: Numbers only (e.g., ABC 123, XYZ 789)
                    </p>
                </div>
            </div>
        </div>
    );

    const renderRegistrationDetails = () => (
        <div className={currentStep === 1 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">MV File Number</label>
                    <input
                        type="text"
                        name="mv_file_number"
                        value={formData.mv_file_number || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">CR Number</label>
                    <input
                        type="text"
                        name="cr_number"
                        value={formData.cr_number || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">OR Number</label>
                    <input
                        type="text"
                        name="or_number"
                        value={formData.or_number || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                    <input
                        type="date"
                        name="registration_date"
                        value={formData.registration_date ? formatDateForInput(formData.registration_date) : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                    <input
                        type="date"
                        name="expiration_date"
                        value={formData.expiration_date ? formatDateForInput(formData.expiration_date) : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        name="status"
                        value={formData.status || 'pending'}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="renewed">Renewed</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderDocumentStatus = () => (
        <div className={currentStep === 2 ? 'block' : 'hidden'}>
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">CSR Number</label>
                        <input
                            type="text"
                            name="csr_number"
                            value={formData.csr_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                            placeholder="Enter CSR number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">SDR Number (DIR)</label>
                        <input
                            type="text"
                            name="sdr_number"
                            value={formData.sdr_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                            placeholder="Enter SDR number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Insurance Number</label>
                        <input
                            type="text"
                            name="insurance_number"
                            value={formData.insurance_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                            placeholder="Enter insurance number"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInsuranceDetails = () => (
        <div className={currentStep === 3 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
                        <input
                            type="text"
                            name="insurance_provider"
                            value={formData.insurance_provider || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Insurance Policy Number</label>
                        <input
                            type="text"
                            name="insurance_policy_number"
                            value={formData.insurance_policy_number || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Insurance Expiry</label>
                    <input
                        type="date"
                        name="insurance_expiry"
                        value={formData.insurance_expiry ? formatDateForInput(formData.insurance_expiry) : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>
            </div>
        </div>
    );

    const renderFeesAndNotes = () => (
        <div className={currentStep === 4 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Registration Fee</label>
                        <input
                            type="number"
                            name="registration_fee"
                            value={formData.registration_fee || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Insurance Fee</label>
                        <input
                            type="number"
                            name="insurance_fee"
                            value={formData.insurance_fee || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <textarea
                        name="remarks"
                        value={formData.remarks || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {renderSteps()}
            
            {renderVehicleInfo()}
            {renderRegistrationDetails()}
            {renderDocumentStatus()}
            {renderInsuranceDetails()}
            {renderFeesAndNotes()}

            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                    className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                        currentStep === 0
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                    disabled={currentStep === 0}
                >
                    Previous
                </button>

                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    {currentStep === steps.length - 1 ? (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {isSubmitting ? 'Saving...' : sale.lto_registrations?.length ? 'Update Registration' : 'Create Registration'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentStep(currentStep + 1);
                            }}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}

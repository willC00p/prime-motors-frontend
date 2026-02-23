export type LTORegistration = {
    id: number;
    sale_id: number;
    vehicle_unit_id: number;
    
    // Basic Information
    plate_number?: string;
    engine_number: string;
    chassis_number: string;
    mv_file_number?: string;
    cr_number?: string;
    or_number?: string;
    
    // Dates
    registration_date?: Date;
    expiration_date?: Date;
    
    // Document Numbers
    csr_number?: string; // Certificate of Stock Report Number
    sdr_number?: string; // Sales Delivery Receipt Number
    insurance_number?: string; // Insurance Policy Number
    
    // Insurance Details
    insurance_provider?: string;
    insurance_policy_number?: string;
    insurance_expiry?: Date;
    
    // Fees
    registration_fee?: number;
    insurance_fee?: number;
    
    // Overall Status
    status: 'pending' | 'processing' | 'completed' | 'renewed';
    
    // Metadata
    created_at: Date;
    updated_at: Date;
    remarks?: string;
    
    // Relations
    sale?: any; // You can define a proper Sale type
    vehicle_unit?: any; // You can define a proper VehicleUnit type
}

export type LTORegistrationFilters = {
    status?: string;
    startDate?: string;
    endDate?: string;
    csrNumber?: string;
    sdrNumber?: string;
    insuranceNumber?: string;
}

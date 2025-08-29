// frontend/src/types/vehicle.ts

// This interface defines the raw data structure received directly from the backend API,
// AFTER the camelcase-keys middleware has processed it.
// frontend/src/types/vehicle.ts
export interface IVehicleBackendResponse {
    kalustoNro: number;
    rekNro: string;
    edKatsastus: string; // The backend query formats dates as strings
    katsastusAik: string; // The backend query formats dates as strings
    aktiivinen: boolean;
}
/**
 * Standardized Vehicle object used throughout the frontend application.
 * All properties are in camelCase and named for clarity.
 */
export interface IVehicle {
    // These properties are mapped from IVehicleBackendResponse for frontend consistency.
    vehicleNo: string; // Mapped from kalustoNro (string for consistency across frontend)
    registrationNo: string; // Mapped from rekNro
    previousInspectionDate: string; // Mapped from edKatsastus
    nextInspectionDate: string; // Mapped from katsastusAik
    isActive: boolean; // Mapped from aktiivinen
}

// Data structure for the DataGrid rows.
// It uses the standardized IVehicle structure and adds the mandatory 'id' property.
export interface IVehicleGridRow extends IVehicle {
    id: string; // Mandatory for DataGrid (must be a string).
}

// DTO for creating a new vehicle (sent TO the backend).
export interface ICreateVehicleDto {
    registrationNo: string;
    previousInspectionDate: string; 
    nextInspectionDate: string;
    isActive?: boolean;
}

// DTO for updating an existing vehicle (sent TO the backend).
export type IUpdateVehicleDto = Partial<ICreateVehicleDto>;

// Form data structure used by react-hook-form.
export interface IVehicleFormData {
    registrationNo: string;
    previousInspectionDate: string; // Expects "YYYY-MM-DD"
    nextInspectionDate: string;     // Expects "YYYY-MM-DD"
    isActive: boolean;
}

// For populating dropdowns (if needed for other modules).
export interface IVehicleBasicInfo {
    id: string;
    name: string; // Often useful for dropdowns, can be same as registrationNo
    vehicleNo: string;
    registrationNo: string;
}
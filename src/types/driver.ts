// frontend/src/types/driver.ts

/**
 * Interface representing the raw driver object from the backend API.
 * This directly matches the keys received after `camelcase-keys` middleware.
 */
export interface IBackendDriver {
    kuljId: number;
    nimi: string;
    puhelinNro: string;
    email: string;
    halytys: boolean;
}

/**
 * Standardized Driver object used throughout the frontend application.
 * Properties are in camelCase and named for clarity (e.g., driverId instead of kuljId).
 */
export interface IDriver {
    driverId: number; // Mapped from backend's kuljId
    name: string; // Mapped from backend's nimi
    phoneNo: string; // Mapped from backend's puhelinNro
    email: string; // Mapped from backend's email
    hasAlerts: boolean; // Mapped from backend's halytys
}

// Interface for DataGrid rows
export interface IDriverGridRow extends IDriver {
    id: number; // DataGrid requires a unique 'id' property. Use driverId as id.
}

// DTO for creating a new driver (matches backend CreateDriverDto)
export interface ICreateDriverDto {
    name: string;
    phoneNo: string;
    email: string;
    hasAlerts?: boolean;
}

// DTO for updating an existing driver (matches backend UpdateDriverDto)
export type IUpdateDriverDto = Partial<ICreateDriverDto>;

// Form data structure used by react-hook-form (matches ICreateDriverDto)
export interface IDriverFormData {
    name: string;
    phoneNo: string;
    email: string;
    hasAlerts: boolean;
}

// For populating dropdowns (if needed for other modules like loads)
export interface IDriverBasicInfo {
    id: number; // driverId
    name: string; // Driver's name
    driverId: number;
    driverName: string;
}
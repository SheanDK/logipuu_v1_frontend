// frontend/src/types/drivenInspection.ts

import { Dayjs } from "dayjs";

// Matches the backend response for the list
export interface IDrivenInspectionListItem {
    puutavaraId: number;
    kuormaId: number | null;
    date: string;
    drivingOrderNo: string | null;
    receptionNo: string | null;
    autoNro: string | null;
    driverName: string | null;
    puulaaniName: string;
    customerName: string;
    timberTypes: string;
    unloadingSiteName: string;
    drivingRoute: string | null;
    cubicMeters: number;
    freightKm: number;
    hours: number;
    pcs: number;
    additionalInformation: string | null;
    accepted: boolean;
}

// DTO for UPDATING an existing kuorma record via the modal
export interface IUpdateDrivenInspectionRowDto {
    date?: string | null; // Add date field
    receptionNo?: string | null;
    drivingRoute?: string | null;
    cubicMeters?: number | null;
    freightKm?: number | null;
    hours?: number | null;
    pcs?: number | null;
    additionalInfo?: string | null;
}

// --- NEWLY ADDED INTERFACE ---
// DTO for CREATING a new kuorma record from the modal
// This is sent when the kuormaId is null (N/A)
export interface ICreateKuormaFromPtlDto {
    puutavaraId: number; // The link to the parent puutavaralaji entry
    receptionNo?: string | null;
    drivingRoute?: string | null;
    cubicMeters?: number | null;
    freightKm?: number | null;
    hours?: number | null;
    pcs?: number | null;
    additionalInfo?: string | null;
}
// --- END OF NEW INTERFACE ---

export interface IDrivenInspectionFilters {
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    customerId?: string | null;
    vehicleId?: string | null;
    timberGradeIds?: (string | number)[];
}
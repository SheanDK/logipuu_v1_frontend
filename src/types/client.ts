// src/types/client.ts

// Enum for Client Type, matching the backend
export enum ClientTypeEnum {
    PUULAANI = 0,
    RAHTIKIRJA = 1,
    BOTH = 2,
}

/**
 * Represents the raw client object from the backend API.
 * Properties are in camelCase (after camelcase-keys middleware).
 */
export interface IBackendClient {
    asiakkaanId: number;
    asiakkaanNimi: string;
    osoite: string | null;
    postiNro: string | null;
    paikkakunta: string | null;
    puhelinNro: string | null;
    ytunnus: string | null;
    kohteenVari: string | null;
    tyyppi: ClientTypeEnum;
    aktiivinen: boolean;
    yhteyshenkilo: string | null;
    sahkoposti: string | null;
    lisatietoja: string | null;
}

/**
 * Standardized Client object used throughout the frontend application and DataGrid.
 */
export interface IClient {
    id: string; // Mandatory for DataGrid, string version of asiakkaanId
    clientId: string;
    clientName: string;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    phoneNo: string | null;
    vatId: string | null;
    targetColor: string | null;
    type: ClientTypeEnum; // <<--- ADDED THIS PROPERTY
    isActive: boolean;
    contactPerson: string | null;
    email: string | null;
    additionalInfo: string | null;
}

/**
 * DTO for creating a new client. Matches the backend's CreateClientDto.
 */
export type ICreateClientDto = {
    clientName: string;
    vatId?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    phoneNo?: string | null;
    contactPerson?: string | null;
    email?: string | null;
    additionalInfo?: string | null;
    targetColor?: string | null;
    type: ClientTypeEnum;
    isActive?: boolean;
};

/**
 * DTO for updating an existing client. All fields are optional.
 */
export type IUpdateClientDto = Partial<ICreateClientDto>;

/**

 * Data shape for the form, handled by React Hook Form.
 */
export interface IClientFormData {
    clientName: string;
    vatId: string;
    address: string;
    postalCode: string;
    city: string;
    phoneNo: string;
    contactPerson: string;
    email: string;
    additionalInfo: string;
    targetColor: string;
    isPuulaani: boolean; // For form logic
    isRahtikirja: boolean; // For form logic
    isActive: boolean;
}

// For populating dropdowns
export interface IClientBasicInfo {
    id: string;
    name: string;
    // --- ADD THE MISSING PROPERTIES ---
    clientId: string;
    clientName: string;
    targetColor: string | null;
}


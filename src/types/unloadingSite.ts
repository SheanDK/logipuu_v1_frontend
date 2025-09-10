// frontend/src/types/unloadingSite.ts

/**
 * Represents the raw Unloading Site object from the backend API.
 * Properties are in camelCase (after camelcase-keys middleware).
 */
export interface IBackendUnloadingSite {
    purkupaikkaId: number;
    asiakasId: number;
    purkupaikka: string;
    sijaintiLat: string | null;
    sijaintiLong: string | null;
}

/**
 * Standardized Unloading Site object used throughout the frontend application and DataGrid.
 */
export interface IUnloadingSite {
    id: string; // Mandatory for DataGrid
    
    // Direct mapping from IBackendUnloadingSite
    purkupaikkaId: number;
    asiakasId: number;
    purkupaikka: string;
    sijaintiLat: string | null;
    sijaintiLong: string | null;

    // Optional: Renamed properties for frontend convenience
    unloadingSiteId?: string;
    clientId?: number;
    unloadingSiteName?: string;
    latitude?: string | null;
    longitude?: string | null;
    clientName?: string | null; // From joining client table
}

/**
 * DTO for creating a new unloading site.
 */
export type ICreateUnloadingSiteDto = {
    clientId: number;
    unloadingSiteName: string;
    latitude?: string | null;
    longitude?: string | null;
};

/**
 * DTO for updating an existing unloading site.
 */
export type IUpdateUnloadingSiteDto = Partial<ICreateUnloadingSiteDto>;

/**
 * Data shape for the form, handled by React Hook Form.
 */
export interface IUnloadingSiteFormData {
    clientId: number | '';
    unloadingSiteName: string;
    latitude: string;
    longitude: string;
}


// frontend/src/types/purkupaikka.ts

export interface IBackendPurkupaikka {
  purkupaikkaId: number;
  asiakasId: number | null;
  purkupaikka: string;
  sijaintiLat: number | null;
  sijaintiLong: number | null;
  asiakkaanNimi?: string;
}

export interface IMapDropoffLocation {
    id: number;
    clientId: number | null;
    clientName: string;
    name: string;
    latitude: number;
    longitude: number;
    isVisibleOnMap: boolean; 
}

export interface ICreatePurkupaikkaDto {
    clientId: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
}

export type IUpdatePurkupaikkaDto = Partial<ICreatePurkupaikkaDto>;

export interface IMapPurkupaikkaFormData {
  name: string;
  clientId: string | null;
}

export interface PurkupaikkaFormData {
    name: string;
    clientId: string | null;
}

export interface IBackendPurkupaikkaResponse {
  purkupaikkaId: number;
  asiakasId: number | null;
  purkupaikka: string;
  sijaintiLat: number | null;
  sijaintiLong: number | null;
  isVisibleOnMap: boolean;
  asiakkaanNimi: string;
  clientName: string | null; // This is the actual property from the camelCased SQL alias
  // We can remove asiakkaanNimi as it's not part of this specific API response
}
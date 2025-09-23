// frontend/src/types/timberStack.ts
import { Dayjs } from 'dayjs';

// --- Backend Response Interfaces ---
export interface IBackendPuulaani {
    puulaaniId: number;
    asiakasId: number;
    pvm: Date;
    nimi: string;
    autoNro: string | null;
    lisatiedot: string | null;
    kok: number;
    jaljella: number;
    km: number | null;
    aktiivinen: boolean;
    valmis: boolean;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
    ajomaaraysnro: string | null;
    asiakkaanNimi?: string;
    kohteenVari?: string;
}
export interface IBackendPuutavaralaji {
    puutavaraId: number;
    puulaaniId: number;
    asiakasId: number;
    puutavaraNro: number;
    purkupaikkaId: number;
    kuutiot: number;
    haettu: number;
    jaljella: number;
    valmis: boolean;
    puutavara?: string | null;
    purkupaikka?: string | null;
}
export interface IBackendAutot {
    autoId: number;
    puulaaniId: number;
    kalustoId: number;
}
export interface IPuulaaniFullDetails {
    puulaani: IBackendPuulaani;
    autot: IBackendAutot[];
    puutavarat: IBackendPuutavaralaji[];
}

// --- Frontend UI Interfaces ---
export interface IMapTimberStack {
    id: number;
    clientId: number;
    clientName: string;
    clientColor: string | null;
    name: string;
    latitude: number;
    longitude: number;
    totalVolume: number;
    remainingVolume: number;
    isActive: boolean;
    isCompleted: boolean;
    date: Date | string; // Can be a Date object or string from API
    
    // --- ADD THESE OPTIONAL PROPERTIES ---
    dispatchOrderNo?: string | null;
    additionalInfo?: string | null;
    kilometers?: number | null;
    autoNro?: string | null; // This is generated from autot list
}
export interface IPuutavaraItem {
    puutavaraNro: number;
    puutavara: string;
}

// --- Multi-Step Form Data Structures ---
export interface PuulaaniBasicDetailsFormData {
    name: string;
    clientId: string | null;
    dispatchOrderNo: string;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string;
}

export interface PendingPuulaaniData extends PuulaaniBasicDetailsFormData {
    latitude?: number;
    longitude?: number;
    date?: Dayjs | null;
}
export interface ITimberStackWoodEntry {
    id: number;
    puutavaraId: number;
    woodTypeId: number;
    dropoffLocationId: number;
    totalVolume: number;
    fetchedVolume: number;
    remainingVolume: number;
}
export interface IAddTimberStackWoodEntryFormData {
    woodTypeId: number | null;
    dropoffLocationId: number | null;
    volume: number | null;
}

// Form data structure for the final, detailed modal
export interface PuulaaniFormData {
    name: string;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string | null;
    selectedAutoIds: number[];
    woodEntries: ITimberStackWoodEntry[];
    
    // --- THIS IS THE FIX ---
    // Add clientId as an optional property. It's needed for the 'reset' in create mode.
    clientId?: number | string | null;

    date?: Dayjs | null;
    dispatchOrderNo?: string | null;
    kilometers?: number | null;
    autoNro?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

// --- API Data Transfer Objects (DTOs) ---
export interface ICreateTimberStackDto {
    name: string;
    clientId: number;
    date: string; // 'YYYY-MM-DD'
    latitude: number;
    longitude: number;
    dispatchOrderNo: string | null;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string | null;
    totalVolume: number;
    auto_nro: string | null;
    kilometers?: number | null;
    selectedAutoIds?: number[];
    woodEntries?: {
        woodTypeId: number;
        dropoffLocationId: number;
        totalVolume: number;
    }[];
}

export type IUpdateTimberStackDto = Partial<ICreateTimberStackDto>;

export interface IUpdateTimberStackFullDto {
    puulaani: Partial<IBackendPuulaani>;
    autot: number[];
    puutavarat: {
        puutavara_id: number;
        puutavaranro: number;
        purkupaikka_id: number;
        kuutiot: number;
        haettu: number;
    }[];
}

export interface IMapFilterState {
    status: 'all' | 'active';
    clientId: string | null;
    vehicleId: string | null;
}

// Filters for the Puulaani List View
export interface ITimberStackListFilters {
  status?: 'all' | 'active' | 'completed';
  clientId?: string | null;
  vehicleId?: string | null;
  timberTypeId?: string | null;
}

// The structure of a single row in the Puulaani List View
// This must match the backend response
export interface ITimberStackListItem {
  puulaaniId: number;
  nimi: string;
  asiakkaanNimi: string;
  pvm: string; // Comes as a string from backend, will be formatted
  kok: number;
  jaljella: number;
  sijaintiLat: number | null;
  sijaintiLong: number | null;
}

export type IEditablePuulaani = IMapTimberStack & {
  autot: any[];
  puutavarat: any[];
  // You can also add other detailed properties here if needed, e.g., from the 'puulaani' object
  km?: number | null;
  autoNro?: string | null;
};

export interface IWoodEntry {
    puutavaraId: number;
    puulaaniId: number;
    puutavaraNro: number;
    purkupaikkaId: number;
    kuutiot: number;
    haettu: number;
    jaljella: number;
    valmis: boolean;
    puutavaraName: string; // From a JOIN
    purkupaikkaName: string; // From a JOIN
    // --- THIS IS THE FIX ---
    // Add the missing destination coordinate properties
    purkupaikkaLat?: number | null;
    purkupaikkaLng?: number | null;
}
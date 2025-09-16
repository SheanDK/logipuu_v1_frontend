// frontend/src/types/load.types.ts

export enum LoadTypeEnum {
    PUULAANI = 0,
    POLE_TRANSPORT = 1,
    RAHTIKIRJA = 1,
}

export interface ILoad {
    kuormaId: number;
    tyyppi: LoadTypeEnum;
    asiakasId: number | null;
    puulaaniId: number | null;
    puutavaraId: number | null;
    kuljId: number | null;
    pvm: Date | null;
    ajomaaraysNro: string | null;
    vastaanottoNro: string | null; // Added
    kohde: string | null;
    lahto: string | null;
    reitti: string | null; // Added
    m3: number;
    km: number;
    tunnit: number; // Added
    kpl: number; // Added
    lisatiedot: string | null;
    kalustoNro: number | null;
    isActive: boolean;
    status: string;
}

export interface ILoadListItem {
    kuormaId: number;
    pvm: string;
    ajomaaraysNro: string | null;
    vastaanottoNro: string | null;
    rekNro: string;
    kuljettajanNimi: string;
    puulaaniNimi: string | null;
    asiakkaanNimi: string;
    lahto: string | null;
    kohde: string | null;
    timberType: string | null;
    reitti: string | null;
    m3: number;
    km: number;
    tunnit: number;
    kpl: number;
    lisatiedot: string | null;
    status: string;
    isActive: boolean;
}

export interface ILoadDetails {
    // Core Load Info (from 'kuorma' table)
    kuormaId: number;
    pvm: Date;
    ajomaaraysNro: string | null;
    status: string;
    lisatiedot: string | null;
    kuljId: number;
    
    // --- THIS IS THE FIX ---
    // Add the raw ID fields needed by the form
    tyyppi: LoadTypeEnum;
    asiakasId: number;
    puulaaniId: number | null;
    puutavaraId: number | null;
    kalustoNro: number | null;
    // NOTE: m3 is now represented by taskVolume
    // ----------------------

    // Customer Info
    asiakkaanNimi: string;

    // Vehicle Info
    rekNro: string;

    // Driver Info
    kuljettajanNimi: string;

    // Origin (Puulaani) Info
    originName: string;
    originAddress: string | null;
    originLat: number | null;
    originLng: number | null;
    originInstructions: string | null;

    // Timber Task Info (from puutavaralaji)
    taskTimberTypeName: string;
    taskVolume: number;
    taskRemainingVolumeBeforeThisTrip: number;

    // Destination (Purkupaikka) Info
    destinationName: string;
    destinationAddress: string | null;
    destinationLat: number | null;
    destinationLng: number | null;
}

// --- THIS IS THE FIX (PART 2) ---
export interface ICreateLoadDto {
    tyyppi: LoadTypeEnum;
    asiakasId: number;
    puulaaniId?: number;
    puutavaraId?: number;
    kalustoNro: number;
    kuljId: number;
    pvm: Date;
    ajomaaraysNro?: string | null;
    kohde?: string | null;
    lahto?: string | null;
    m3?: number | null;
    km?: number | null;
    lisatiedot?: string | null;
    // Add the new editable fields here as well
    vastaanottoNro?: string | null;
    reitti?: string | null;
    tunnit?: number | null;
    kpl?: number | null;
}

export type IUpdateLoadDto = Partial<ICreateLoadDto>;

// For the form's state
export interface ILoadFormData {
    tyyppi: LoadTypeEnum;
    asiakasId: string | null;
    puulaaniId: string | null;
    puutavaraId: string | null;
    kalustoNro: string | null;
    kuljId: string | null;
    pvm: Date | null;
    ajomaaraysNro?: string | null; // Allow both undefined and null
    kohde?: string | null;
    lahto?: string | null;
    m3?: number | null; // Allow both undefined and null
    km?: number | null;
    lisatiedot?: string | null;
}

// For updating just the status
export interface ILoadStatusUpdateDto {
    status: string;
}

export interface ICompleteLoadDto {
    actualM3: number;
    actualKm: number;
}

export interface ILoadFilters {
    status?: 'active' | 'pending_inspection' | 'all';
    asiakasId?: string;
    kalustoNro?: string;
    kuljId?: string;
}

export interface IMapTrip {
    tripId: number;
    driverName: string;
    vehicleRegNo: string;
    originName: string;
    destinationName: string;
    status: string;
    originCoords: { lat: number, lng: number };
    destinationCoords: { lat: number, lng: number };
}
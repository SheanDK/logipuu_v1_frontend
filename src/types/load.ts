// frontend/src/types/load.types.ts

export enum LoadTypeEnum {
    PUULAANI = 0,
    POLE_TRANSPORT = 1,
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
    kohde: string | null;
    lahto: string | null;
    m3: number;
    km: number;
    lisatiedot: string | null;
    kalustoNro: number | null;
    isActive: boolean;
    status: string;
}

export interface ILoadListItem {
    kuormaId: number;
    pvm: string;
    asiakkaanNimi: string;
    lahto: string | null;
    kohde: string | null;
    rekNro: string;
    kuljettajanNimi: string;
    tyyppi: string;
    isActive: boolean;
    status: string;
}

// DTO for creating a new load
export interface ICreateLoadDto {
    tyyppi: LoadTypeEnum;
    asiakasId: number;
    puulaaniId?: number;
    kalustoNro: number;
    kuljId: number;
    pvm: Date;
    ajomaaraysNro?: string;
    kohde?: string;
    lahto?: string;
    m3?: number;
    km?: number;
    lisatiedot?: string;
    puutavaraId?: number;
}

export interface ILoadFormData {
    tyyppi: LoadTypeEnum;
    asiakasId: string | null;
    puulaaniId: string | null;
    
    // --- THIS IS THE FIX ---
    // Add the missing property for the timber task selection
    puutavaraId: string ;

    kalustoNro: string | null;
    kuljId: string | null;
    pvm: Date | null;
    ajomaaraysNro?: string;
    kohde?: string;
    lahto?: string;
    m3?: number;
    km?: number;
    lisatiedot?: string;
    
}

// --- THIS IS THE NEW INTERFACE FOR THE LOAD DETAILS VIEW ---
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
    m3: number; // This should be taskVolume, let's align
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
export interface ILoadStatusUpdateDto {
    status: string;
}
export type IUpdateLoadDto = Partial<ICreateLoadDto>;
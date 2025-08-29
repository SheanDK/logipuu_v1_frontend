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

export type IUpdateLoadDto = Partial<ICreateLoadDto>;
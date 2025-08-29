// frontend/src/types/waybill.types.ts

export interface IWaybill {
    id: string; // For DataGrid
    rahtiId: number;
    pvm: string; // Date string
    kuormaId: number;
    rahtikirjanNro: string | null;
    reitti: string | null;
    m3: number;
    m3Hinta: number;
    km: number;
    kmHinta: number;
    kpl: number;
    kplHinta: number;
    jako: number;
    jakoHinta: number;
    tievero: number;
    kokoHinta: number;
    lisatiedot: string | null;
}

export interface ICreateWaybillDto {
    pvm: string;
    kuormaId: number;
    rahtikirjanNro?: string | null;
    reitti?: string | null;
    m3: number;
    m3Hinta?: number;
    km: number;
    kmHinta?: number;
    kpl?: number;
    kplHinta?: number;
    jako?: number;
    jakoHinta?: number;
    tievero?: number;
    kokoHinta: number;
    lisatiedot?: string | null;
}

export interface IUpdateWaybillDto {
    pvm?: string;
    kuormaId?: number;
    rahtikirjanNro?: string | null;
    reitti?: string | null;
    m3?: number;
    m3Hinta?: number;
    km?: number;
    kmHinta?: number;
    kpl?: number;
    kplHinta?: number;
    jako?: number;
    jakoHinta?: number;
    tievero?: number;
    kokoHinta?: number;
    lisatiedot?: string | null;
}

export interface IWaybillFormData {
    pvm: string;
    kuormaId: number | ''; // Load ID from Load dropdown
    rahtikirjanNro: string;
    reitti: string;
    m3: number;
    m3Hinta: number;
    km: number;
    kmHinta: number;
    kpl: number;
    kplHinta: number;
    jako: number;
    jakoHinta: number;
    tievero: number;
    kokoHinta: number;
    lisatiedot: string;
}
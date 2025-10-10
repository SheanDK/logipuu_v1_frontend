//frontend/src/typs/consignment.ts

export interface IConsignmentKuormaListItem {
    kuormaId: number;
    pvm: string;
    asiakkaanNimi: string;
    // NEW: Add fields from screenshot SS1
    autoNro: string; // For "Auto" column
    kuljettajanNimi: string; // For "Kuljettaja" column
    rahtikirjaCount: number;
    status: string;
}

export interface IRahtikirjaItem {
    id?: number;
    // NEW: Add all fields from screenshot SS2/SS3
    rahtikirjanNumero?: string; // "Nro" field
    reitti: string;
    m3: number | string;
    km: number | string;
    kpl?: number | string; // "Kpl" field
    jako?: number | string; // "Jako" field
    // tievero and lisatiedot can be added if needed
}

export interface IConsignmentForm {
    asiakasId: number | null;
    pvm: string;
    lisatiedot?: string;
    rahtikirjat: IRahtikirjaItem[];
}
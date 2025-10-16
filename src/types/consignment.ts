//frontend/src/typs/consignment.ts

export interface IConsignmentKuormaListItem {
    kuormaId: number;
    pvm: string;
    asiakkaanNimi: string;
    autoNro: string;
    kuljettajanNimi: string;
    rahtikirjaCount: number;
    status: string;
}

export interface IRahtikirjaItem {
    id?: number;
    rahtikirjanNumero?: string;
    reitti: string;
    // FIX: Allow form inputs to be strings, as HTML inputs always return strings.
    m3: number | string;
    km: number | string;
    kpl?: number | string;
    jako?: number | string;
    tievero?: number | string; // For 'Road Toll'
    lisatiedot?: string;       // For 'Notes'
}

export interface IConsignmentForm {
    asiakasId: number | null | ''; 
    pvm: string;
    lisatiedot?: string;
    rahtikirjat: IRahtikirjaItem[];
}
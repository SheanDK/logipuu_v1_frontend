// frontend/src/types/otherInfo.ts

// --- CORRECTION: Import from the correct file names and with correct member names ---
import { IMapPurkupaikkaFormData } from './unloadingSite';
import { PuulaaniFormData } from './timberStack'; // The correct exported name is PuulaaniFormData

export type MarkerType = 'Puulaani' | 'Purkupaikka' | 'Muu merkki';

export interface IBackendMuuMerkki {
  muutietoId: number;
  nimi: string;
  tyyppi: string;
  lisatieto: string | null;
  vari: string;
  sijaintiLat: number | null;
  sijaintiLong: number | null;
}

export interface IBackendOtherMarker {
    muutietoId: number;
    nimi: string;
    tyyppi: string; // This will hold the icon name, e.g., 'Warning'
    vari: string; // This will hold the hex color, e.g., '#FF0000'
    lisatieto: string | null;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
}

export interface IMapOtherMarker {
  id: number;
  name: string;
  iconType: string;
  additionalInfo: string | null;
  color: string;
  latitude: number;
  longitude: number;
}

// Form data for the OtherMarkerFormModal
export interface OtherMarkerFormData {
    name: string;
    iconType: string | null;
    color: string;
    additionalInfo: string;
}

// DTO for creating an "Other Marker"
export interface ICreateOtherMarkerDto {
  name: string;
  iconType: string;
  additionalInfo: string | null;
  color: string;
  latitude: number;
  longitude: number;
}
// DTO for updating an "Other Marker"
export type IUpdateOtherMarkerDto = Partial<ICreateOtherMarkerDto>;

// A combined type used for multi-step forms, if needed
export type CombinedMarkerFormData = Partial<IMapPurkupaikkaFormData & OtherMarkerFormData & PuulaaniFormData>;
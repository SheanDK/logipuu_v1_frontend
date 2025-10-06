// FRONTEND/src/types/woodCategory.ts

/**
 * Raw backend response AFTER your camelcase-keys middleware.
 * Keys match what the frontend receives directly from the API.
 */
export interface IWoodCategoryBackendResponse {
  puutavaraId: number;      // Primary key
  nimi: string;             // Display name
  lisatiedot?: string | null; // Optional description
  aktiivinen: boolean;      // Active flag
}

/**
 * Normalized frontend model used across the app.
 * Keys are clear, stable, and adapted for UI components (e.g., DataGrid).
 */
export interface IWoodCategory {
  id: string;               // String for stable DataGrid keys
  name: string;             // Mapped from 'nimi'
  description: string;      // Mapped from 'lisatiedot' ('' if null)
  isActive: boolean;        // Mapped from 'aktiivinen'
}

/** DataGrid row type (adds mandatory `id`). */
export interface IWoodCategoryGridRow extends IWoodCategory {
  id: string;
}

/** DTO sent to backend when creating a new category. */
export interface ICreateWoodCategoryDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

/** DTO for partial updates. */
export type IUpdateWoodCategoryDto = Partial<ICreateWoodCategoryDto>;

/** Form shape for react-hook-form. */
export interface IWoodCategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

/** Lightweight info for dropdowns or lookups. */
export interface IWoodCategoryBasicInfo {
  id: string;
  name: string;
  active: boolean;
}

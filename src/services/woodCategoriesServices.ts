// FRONTEND SERVICE: woodCategoriesService.ts
import apiClient from './apiClient';

// Frontend-facing types (unchanged)
export type IWoodCategory = {
  id: string;           // force string for stable keys
  name: string;
  description?: string;
  active: boolean;
};

export type ICreateWoodCategoryDto = {
  name: string;
  description?: string;
  active?: boolean;     // make optional; backend defaults to true
};

export type IUpdateWoodCategoryDto = Partial<ICreateWoodCategoryDto>;

const API_ENDPOINT = '/wood-categories';

// --- mapping helpers ---

// Backend -> Frontend
const toFE = (b: any): IWoodCategory => ({
  id: String(b.puutavaraNro ?? b.puutavara_nro ?? b.id),
  name: String(b.puutavara ?? b.name ?? ''),
  description: b.lisatiedot ?? b.description ?? '',
  active: Boolean(b.aktiivinen ?? b.active ?? false),
});

// Frontend -> Backend
const toBE = (f: ICreateWoodCategoryDto | IUpdateWoodCategoryDto) => ({
  ...(f.name !== undefined ? { puutavara: f.name } : {}),
  ...(f.description !== undefined ? { lisatiedot: f.description } : {}),
  ...(f.active !== undefined ? { aktiivinen: f.active } : {}),
});

// --- API calls ---

export const fetchAllWoodTypes = async (): Promise<IWoodCategory[]> => {
  const { data } = await apiClient.get(API_ENDPOINT);
  return (Array.isArray(data) ? data : []).map(toFE);
};

export const createWoodType = async (
  dto: ICreateWoodCategoryDto
): Promise<IWoodCategory> => {
  const { data } = await apiClient.post(API_ENDPOINT, toBE(dto));
  return toFE(data);
};

export const updateWoodType = async (
  id: string | number,
  dto: IUpdateWoodCategoryDto
): Promise<IWoodCategory> => {
  const { data } = await apiClient.put(`${API_ENDPOINT}/${id}`, toBE(dto));
  return toFE(data);
};

export const deleteWoodType = async (id: string | number): Promise<void> => {
  await apiClient.delete(`${API_ENDPOINT}/${id}`);
};

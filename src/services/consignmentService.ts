// frontend/src/services/consignmentService.ts
import apiClient from './apiClient';
import type { BillingRow } from '../types';

export type ConsignmentSearchParams = {
  dateFrom: string;
  dateTo: string;
  customerId?: string | number | null;
  vehicleId?: string | number | null;
  unbilled?: boolean;
  billed?: boolean;
};

export type ConsignmentRow = BillingRow & {
  unitPriceM3: number;
  unitPriceKm: number;
  unitPriceHour: number;
  unitPricePiece: number;
  roadTax: number;
  total: number;
  waybillNumber?: string;
  route?: string;
  notes?: string;
};

export type UpsertConsignmentDto = {
  kuormaId?: number;
  date: string;
  waybillNumber?: string;
  route?: string;
  notes?: string;
  quantityM3?: number;
  unitPriceM3?: number;
  km?: number;
  unitPriceKm?: number;
  hours?: number;
  unitPriceHour?: number;
  pieces?: number;
  unitPricePiece?: number;
  roadTax?: number;
  total?: number;
};

export type InvoiceConsignmentsResponse = {
  updated: number;
  updatedKuormaIds: number[];
  alreadyBilled: number;
  alreadyIds: number[];
  notFound: number;
  notFoundIds: number[];
  billedDate?: string;
};

export const CONSIGNMENT_API = '/consignments';

// --- HELPER FUNCTION: Correctly Map Snake_Case to CamelCase ---
const mapToConsignmentRow = (r: any): ConsignmentRow => {
  return {
    id: r.rahtiId || r.rahti_id || `temp-${Math.random()}`,
    kuormaId: Number(r.kuormaId || r.kuorma_id),
    date: r.pvm ? String(r.pvm).split('T')[0] : '',
    customer: r.asiakas || '',
    vehicle: r.autoNro || r.auto_nro || '',
    driverName: r.knimi || '',
    woodType: r.puutavara || '',
    waybillNumber: r.rahtikirjanNro || r.rahtikirjan_nro || '',
    route: r.reitti || '',
    notes: r.lisatiedot || '',

    // Quantities
    quantityM3: Number(r.m3 || 0),
    km: Number(r.km || 0),
    pieces: Number(r.kpl || 0),
    hours: Number(r.jako || 0),

    // Unit Prices (Check both backend names: m3_hinta and m3Hinta)
    unitPriceM3: Number(r.m3_hinta || r.m3Hinta || 0),
    unitPriceKm: Number(r.km_hinta || r.kmHinta || 0),
    unitPricePiece: Number(r.kpl_hinta || r.kplHinta || 0),
    unitPriceHour: Number(r.jako_hinta || r.jakoHinta || 0),

    // Default unit price fallback (usually M3 price)
    unitPrice: Number(r.m3_hinta || r.m3Hinta || 0),

    roadTax: Number(r.tievero || 0),
    total: Number(r.kokohinta || r.koko_hinta || 0),
    sum: Number(r.kokohinta || r.koko_hinta || 0),

    billed: Boolean(r.pvmLaskutus || r.pvm_laskutus),
    billedDate: r.pvmLaskutus || r.pvm_laskutus || null,
  };
};

export async function searchConsignments(params: ConsignmentSearchParams): Promise<ConsignmentRow[]> {
  const query = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    customerId: params.customerId ?? undefined,
    vehicleId: params.vehicleId ?? undefined,
    unbilled: params.unbilled ? '1' : '0',
    billed: params.billed ? '1' : '0',
  };

  const { data } = await apiClient.get(`${CONSIGNMENT_API}/search`, { params: query });
  return (Array.isArray(data) ? data.map(mapToConsignmentRow) : []);
}

export async function getConsignmentById(id: number | string): Promise<ConsignmentRow | null> {
  const { data } = await apiClient.get(`${CONSIGNMENT_API}/${id}`);
  if (!data) return null;
  return mapToConsignmentRow(data);
}

export async function createConsignment(dto: UpsertConsignmentDto): Promise<ConsignmentRow> {
  const payload = {
    ...dto,
    koko_hinta: dto.total,
    // Map DTO back to snake_case for backend insert if needed, 
    // but Controller/Service usually handles camelCase -> snake_case
    // We send camelCase as per DTO definition, assuming backend handles it.
    // BUT since we are sending specific fields:
    m3_hinta: dto.unitPriceM3,
    km_hinta: dto.unitPriceKm,
    kpl_hinta: dto.unitPricePiece,
    jako_hinta: dto.unitPriceHour,
    jako: dto.hours
  };
  const { data } = await apiClient.post(CONSIGNMENT_API, payload);
  return mapToConsignmentRow(data);
}

export async function updateConsignment(id: number, dto: UpsertConsignmentDto): Promise<ConsignmentRow> {
  const payload = {
    ...dto,
    koko_hinta: dto.total,
    // Explicitly map prices for update
    m3_hinta: dto.unitPriceM3,
    km_hinta: dto.unitPriceKm,
    kpl_hinta: dto.unitPricePiece,
    jako_hinta: dto.unitPriceHour,
    jako: dto.hours
  };
  const { data } = await apiClient.patch(`${CONSIGNMENT_API}/${id}`, payload);
  return mapToConsignmentRow(data);
}

export async function deleteConsignment(id: number | string) {
  const { data } = await apiClient.delete(`${CONSIGNMENT_API}/${id}`);
  return data as { deleted: boolean };
}

export async function deleteManyConsignments(ids: (number | string)[]) {
  const out = { deletedIds: [] as number[], billedIds: [] as number[], notFoundIds: [] as number[] };
  for (const raw of ids) {
    if (String(raw).startsWith('temp-')) {
      out.deletedIds.push(NaN);
      continue;
    }
    const id = Number(raw);
    try {
      await deleteConsignment(id);
      out.deletedIds.push(id);
    } catch (err: any) {
      const st = err?.response?.status;
      if (st === 409) out.billedIds.push(id);
      else if (st === 404) out.notFoundIds.push(id);
      else throw err;
    }
  }
  return out;
}

export async function invoiceConsignments(
  kuormaIds: Array<number | string>
): Promise<InvoiceConsignmentsResponse> {
  const ids = (kuormaIds || [])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n)) as number[];

  const res = await apiClient.post<InvoiceConsignmentsResponse>(
    `${CONSIGNMENT_API}/invoice`,
    { kuormaIds: ids }
  );

  return res.data;
}
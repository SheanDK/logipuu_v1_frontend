// FRONTEND SERVICE: invoicingService.ts
import apiClient from './apiClient';

/** Shape displayed by the DataGrid */
export type BillingRow = {
  id: string | number;
  kuormaId?: number;
  date: string | null;          // ISO date string (YYYY-MM-DD)
  customer: string | null;
  vehicle: string | null;
  woodType: string | null;
  quantityM3: number;
  unitPrice: number;
  sum: number;
  billed: boolean;

  // extras for updating modal
  puulaaniName?: string | null;
  waybillNumber?: string | null;
  vastaanottoNro?: string | null;
  driverName?: string | null;
  route?: string | null;
  notes?: string | null;
  billedDate?: string | null;

  km?: number | null;
  unitPriceKm?: number | null;
  hours?: number | null;
  unitPriceHour?: number | null;
  pieces?: number | null;
  unitPricePiece?: number | null;
};

/** Query params accepted from the UI */
export type InvoicingSearchParams = {
  dateFrom: string;                 // 'YYYY-MM-DD'
  dateTo: string;                   // 'YYYY-MM-DD'
  customerId?: string | number | null;
  vehicleId?: string | number | null;

  // MUST be IDs (numbers or numeric strings), not names
  woodTypeIds?: Array<string | number>;

  // Either supply `status` list or the two booleans
  status?: Array<'unbilled' | 'billed'>;
  unbilled?: boolean;
  billed?: boolean;
};

// src/services/invoicingService.ts
export type UpdateInvoicingDto = {
  waybillNumber?: string;
  vastaanottoNro?: string;
  route?: string;
  notes?: string;

  // price lines; send only when changed
  quantityM3?: number;
  unitPriceM3?: number;
  km?: number;
  unitPriceKm?: number;
  hours?: number;
  unitPriceHour?: number;
  pieces?: number;
  unitPricePiece?: number;

  total?: number;
  billedDate?: string | null;
};

export type InvoiceManyResult = {
  total: number;
  updated: number;
  alreadyBilled: number;
  notFound: number;
  updatedIds: Array<number>; // kuorma_id that were actually updated now
};

export const API_ENDPOINT = '/invoicing';

/** Normalize a mixed list (string | number) into number[] */
const toNumberList = (values?: Array<string | number>) =>
  (values ?? [])
    .map(v => (typeof v === 'string' ? v.trim() : v))
    .filter(v => v !== '' && v !== null && v !== undefined)
    .map(v => Number(v))
    .filter(n => !Number.isNaN(n));

/** Call GET /api/invoicing/search with normalized query params */
export async function searchInvoicing(params: InvoicingSearchParams): Promise<BillingRow[]> {
  // Resolve billed/unbilled from either source
  const fromStatus = Array.isArray(params.status)
    ? { unbilled: params.status.includes('unbilled'), billed: params.status.includes('billed') }
    : null;

  const unbilled = fromStatus ? fromStatus.unbilled : !!params.unbilled;
  const billed = fromStatus ? fromStatus.billed : !!params.billed;

  const woodTypeIdList = toNumberList(params.woodTypeIds);

  const query = {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    customerId: params.customerId ?? undefined,
    vehicleId: params.vehicleId ?? undefined,
    woodTypeIds: woodTypeIdList.join(','), // e.g., "12,34,56"
    unbilled: unbilled ? '1' : '0',
    billed: billed ? '1' : '0',
  };

  //console.log('[FE invoicingService] GET /invoicing/search', query);
  //console.log('[invoicingService] GET', `${API_ENDPOINT}/search`, query);

  const { data } = await apiClient.get(`${API_ENDPOINT}/search`, { params: query });

  // console.log('[invoicingService] received', Array.isArray(data) ? `${data.length} rows` : typeof data);

  return Array.isArray(data) ? data : [];
}

/** Update an existing row; returns the refreshed BillingRow shape */
export async function updateBillingRow(
  id: number | string,
  dto: UpdateInvoicingDto
): Promise<BillingRow> {
  const url = `${API_ENDPOINT}/${id}`;
  console.log('[FE][updateBillingRow] PATCH', url, 'payload:', dto);
  try {
    const { data } = await apiClient.patch(url, dto);
    console.log('[FE][updateBillingRow] OK ->', data);
    return data as BillingRow;
  } catch (err: any) {
    if (!err?.response) {
      console.error('[FE][updateBillingRow] NETWORK/NO-RESPONSE', err);
      throw new Error('No response from server. Please check CORS, preflight (OPTIONS), and proxy.');
    }
    const status = err.response.status;
    const msg = err.response.data?.error || err.response.data?.message || err.message;
    console.error('[FE][updateBillingRow] FAILED', status, msg);
    throw new Error(`Update failed (${status}): ${msg}`);
  }
}

/** Batch-invoice selected rows */
export async function invoiceBillingRows(ids: (string | number)[]): Promise<InvoiceManyResult> {
  const url = `${API_ENDPOINT}/invoice`;
  try {
    const { data } = await apiClient.post(url, { ids });
    return data as InvoiceManyResult;
  } catch (err: any) {
    if (!err?.response) {
      console.error('[FE][invoiceBillingRows] NETWORK/NO-RESPONSE', err);
      throw new Error('No response from server. Please check CORS, preflight (OPTIONS), and proxy.');
    }
    const status = err.response.status;
    const msg = err.response.data?.error || err.response.data?.message || err.message;
    console.error('[FE][invoiceBillingRows] FAILED', status, msg);
    throw new Error(`Invoice failed (${status}): ${msg}`);
  }
}

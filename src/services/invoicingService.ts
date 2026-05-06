//frontend/src/services/invoicingService.ts
import apiClient from './apiClient';
import { InvoicingSearchParams, BillingRow, UpdateInvoicingDto, InvoiceManyResult } from '../types';

export const API_ENDPOINT = '/invoicing';
const toNumberList = (values?: Array<string | number>) =>
  (values ?? [])
    .map(v => (typeof v === 'string' ? v.trim() : v))
    .filter(v => v !== '' && v !== null && v !== undefined)
    .map(v => Number(v))
    .filter(n => !Number.isNaN(n));


export async function searchInvoicing(params: InvoicingSearchParams): Promise<BillingRow[]> {

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
    woodTypeIds: woodTypeIdList.join(','),
    unbilled: unbilled ? '1' : '0',
    billed: billed ? '1' : '0',
  };

  const { data } = await apiClient.get(`${API_ENDPOINT}/search`, { params: query });

  return Array.isArray(data) ? data : [];
}


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

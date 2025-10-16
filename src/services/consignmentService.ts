// // FRONTEND SERVICE: consignmentService.ts
// import apiClient from './apiClient';
// import type { BillingRow } from './invoicingService'; 

// export type ConsignmentSearchParams = {
//   dateFrom: string;                 // YYYY-MM-DD
//   dateTo: string;                   // YYYY-MM-DD
//   customerId?: string | number | null;
//   vehicleId?: string | number | null;
//   // status flags
//   unbilled?: boolean;
//   billed?: boolean;
// };

// export type ConsignmentRow = BillingRow & {
//   kuormaId?: number;
//   roadTax?: number | null;
//   total?: number | null;
//   unitPriceM3?: number | null;
//   unitPriceKm?: number | null;
//   unitPriceHour?: number | null;
//   unitPricePiece?: number | null;
//   hours?: number | null;
// };

// export type SaveConsignmentDto = {
//   kuormaId?: number;              
//   date?: string;                  // YYYY-MM-DD
//   waybillNumber?: string;
//   route?: string;
//   notes?: string;

//   quantityM3?: number;
//   unitPriceM3?: number;
//   km?: number;
//   unitPriceKm?: number;
//   pieces?: number;
//   unitPricePiece?: number;
//   hours?: number;
//   unitPriceHour?: number;

//   roadTax?: number;
//   total?: number;                 
// };

// export type UpsertConsignmentDto = {
//   kuormaId?: number;           
//   date: string;                // YYYY-MM-DD
//   waybillNumber?: string;
//   route?: string;
//   notes?: string;

//   quantityM3?: number;
//   unitPriceM3?: number;
//   km?: number;
//   unitPriceKm?: number;
//   hours?: number;
//   unitPriceHour?: number;
//   pieces?: number;
//   unitPricePiece?: number;

//   roadTax?: number;
//   total?: number;
// };

// export type InvoiceConsignmentsResponse = {
//   updated: number;
//   updatedKuormaIds: number[];
//   alreadyBilled: number;
//   alreadyIds: number[];
//   notFound: number;
//   notFoundIds: number[];
//   billedDate?: string; // YYYY-MM-DD
// };


// export const CONSIGNMENT_API = '/consignments';

// const toNum = (v: any) => (v == null || v === '' ? 0 : Number(v));

// /** GET /api/consignments/search */
// export async function searchConsignments(params: ConsignmentSearchParams): Promise<ConsignmentRow[]> {
//   const query = {
//     dateFrom: params.dateFrom,
//     dateTo: params.dateTo,
//     customerId: params.customerId ?? undefined,
//     vehicleId: params.vehicleId ?? undefined,
//     unbilled: params.unbilled ? '1' : '0',
//     billed: params.billed ? '1' : '0',
//   };

//   const { data } = await apiClient.get(`${CONSIGNMENT_API}/search`, { params: query });
//   return (Array.isArray(data) ? data : []) as ConsignmentRow[];
// }

// /** GET /api/consignments/:id */
// export async function getConsignmentById(id: number | string): Promise<ConsignmentRow | null> {
//   const { data } = await apiClient.get(`${CONSIGNMENT_API}/${id}`);
//   if (!data) return null;
//   return data as ConsignmentRow;
// }

// // POST /api/consignments
// export async function createConsignment(dto: UpsertConsignmentDto) {
//   //console.log('[FE][API][POST /consignments] payload=', dto);
//   const { data } = await apiClient.post('/consignments', dto);
//   //console.log('[FE][API][POST /consignments] response=', data);
//   return data as ConsignmentRow;
// }

// // PATCH /api/consignments/:id
// export async function updateConsignment(id: number, dto: UpsertConsignmentDto) {
//   //console.log('[FE][API][PATCH /consignments/:id] id=', id, 'payload=', dto);
//   const { data } = await apiClient.patch(`/consignments/${id}`, dto);
//  // console.log('[FE][API][PATCH /consignments/:id] response=', data);
//   return data as ConsignmentRow;
// }

// export async function deleteConsignment(id: number | string) {
//   //console.log('[FE][API][DELETE /consignments/:id]', id);
//   const { data } = await apiClient.delete(`/consignments/${id}`);
//   return data as { deleted: boolean };
// }

// /** Apuri massapoistoon: poistaa temp-rivit vain FE:stä, numerot BE:stä */
// export async function deleteManyConsignments(ids: (number | string)[]) {
//   const out = { deletedIds: [] as number[], billedIds: [] as number[], notFoundIds: [] as number[] };
//   for (const raw of ids) {
//     // Local-temp rivit (id alkaa "temp-") poistetaan vain frontista
//     if (String(raw).startsWith('temp-')) {
//       out.deletedIds.push(NaN);
//       continue;
//     }
//     const id = Number(raw);
//     try {
//       await deleteConsignment(id);
//       out.deletedIds.push(id);
//     } catch (err: any) {
//       const st = err?.response?.status;
//       if (st === 409) out.billedIds.push(id);
//       else if (st === 404) out.notFoundIds.push(id);
//       else throw err;
//     }
//   }
//   return out;
// }

// export async function invoiceConsignments(
//   kuormaIds: Array<number | string>
// ): Promise<InvoiceConsignmentsResponse> {
//   const ids = (kuormaIds || [])
//     .map((x) => Number(x))
//     .filter((n) => Number.isFinite(n)) as number[];

//   const res = await apiClient.post<InvoiceConsignmentsResponse>(
//     '/consignments/invoice',
//     { kuormaIds: ids }
//   );

//   return res.data;
// }

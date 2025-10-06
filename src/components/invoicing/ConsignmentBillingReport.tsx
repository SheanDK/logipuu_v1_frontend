// src/components/invoicing/ConsigmentBillingReport.tsx
'use client';

import React, { useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Divider, Button
} from '@mui/material';
import type { BillingRow } from '@/services/invoicingService';
import dayjs from 'dayjs';
import { useTranslation } from '@/i18n/useTranslation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

type Props = { rows: BillingRow[] };

const n = (v: any) => Number(v ?? 0);
const fix2 = (v: any) => Number(v ?? 0).toFixed(2);
const dash2 = (v: any) => (Number(v ?? 0) === 0 ? '-' : Number(v).toFixed(2));

/** Compute a single line’s quantities and value totals (qty * unit price) + road tax and grand total. */
const computeLine = (r: any) => {
  const qM3 = n(r.quantityM3);
  const qKm = n(r.km);
  const qPc = n(r.pieces);
  const qHr = n(r.hours);

  const pM3 = n(r.unitPriceM3 ?? r.unitPrice);
  const pKm = n(r.unitPriceKm);
  const pPc = n(r.unitPricePiece);
  const pHr = n(r.unitPriceHour);

  const road = n(r.roadTax ?? r.tollTax ?? r.tievero);

  const m3Val = qM3 * pM3;
  const kmVal = qKm * pKm;
  const pcVal = qPc * pPc;
  const hrVal = qHr * pHr;

  // Prefer provided total if it exists; otherwise compute from parts.
  const givenTotal = n(r.total ?? r.sum);
  const computed = m3Val + kmVal + pcVal + hrVal + road;

  return {
    m3: qM3, m3Value: m3Val,
    km: qKm, kmValue: kmVal,
    hour: qHr, hourValue: hrVal,
    pcs: qPc, pcsValue: pcVal,
    roadTax: road,
    total: givenTotal > 0 ? givenTotal : computed,
  };
};

type Totals = ReturnType<typeof computeLine>;
const zeroTotals = (): Totals => ({ m3:0,m3Value:0, km:0,kmValue:0, hour:0,hourValue:0, pcs:0,pcsValue:0, roadTax:0, total:0 });
const addTotals = (a: Totals, b: Totals): Totals => ({
  m3: a.m3 + b.m3, m3Value: a.m3Value + b.m3Value,
  km: a.km + b.km, kmValue: a.kmValue + b.kmValue,
  hour: a.hour + b.hour, hourValue: a.hourValue + b.hourValue,
  pcs: a.pcs + b.pcs, pcsValue: a.pcsValue + b.pcsValue,
  roadTax: a.roadTax + b.roadTax,
  total: a.total + b.total,
});

/**
 * Printable consignment report:
 * - Groups by Customer → Vehicle like in the legacy example
 * - Column headers and section headers match the screenshot
 * - Per-vehicle subtotal row shows quantity sums and (qty * unit price) sums
 * - Grand total at the end aggregates the entire report
 * - Colors/styles are left untouched; only structure/text mirrors the legacy
 */
const ConsigmentBillingReport: React.FC<Props> = ({ rows }) => {
  const { t } = useTranslation(['consigmentBillingReport', 'common']);
  const router = useRouter();

  if (!rows || rows.length === 0) {
    return <Typography>{t('consigmentBillingReport:errors.noData') || 'No data'}</Typography>;
  }

  /** Sort by date; accept strict YYYY-MM-DD or fall back to JS Date parse. */
  const sorted = useMemo(() => {
    const toTs = (d?: string | null) => {
      if (!d) return 0;
      const strict = dayjs(d, 'YYYY-MM-DD', true);
      return strict.isValid() ? strict.valueOf() : (new Date(d).getTime() || 0);
    };
    return [...rows].sort((a, b) => toTs(a.date) - toTs(b.date));
  }, [rows]);

  /** Header period (first and last date after sorting). */
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const startDate = first?.date ? dayjs(first.date).format('DD.MM.YYYY') : '';
  const endDate = last?.date ? dayjs(last.date).format('DD.MM.YYYY') : '';

  /** Build Customer → Vehicle grouping map. */
  const groups = useMemo(() => {
    const byCust = new Map<string, Map<string, BillingRow[]>>();
    for (const r of sorted) {
      const cust = (r.customer ?? t('consigmentBillingReport:placeholders.noCustomer')) as string;
      const veh = (r.vehicle ?? t('consigmentBillingReport:placeholders.noVehicle')) as string;
      if (!byCust.has(cust)) byCust.set(cust, new Map());
      const vm = byCust.get(cust)!;
      if (!vm.has(veh)) vm.set(veh, []);
      vm.get(veh)!.push(r);
    }
    return byCust;
  }, [sorted, t]);

  /** Grand totals across the full dataset. */
  const grand = useMemo(() => sorted.reduce((acc, r) => addTotals(acc, computeLine(r)), zeroTotals()), [sorted]);

  return (
    <Box id="wb-print-root" sx={{ p: 4, color: '#000', bgcolor: '#fff' }}>
      {/* Screen-only back button */}
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          {t('common:buttons.back') || 'Back'}
        </Button>
      </Box>

      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('consigmentBillingReport:header.company')}
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {t('consigmentBillingReport:header.title')}
          </Typography>
          <Typography variant="body1">
            {t('consigmentBillingReport:header.period', { start: startDate, end: endDate })}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Customer → Vehicle sections */}
      {Array.from(groups.entries()).map(([customer, vehicles], ci) => (
        <Box key={`c-${ci}`} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {/* “Asiakas: <name>” exactly like the legacy header */}
            {t('consigmentBillingReport:section.customer', { name: customer }) || `Asiakas: ${customer}`}
          </Typography>

          {Array.from(vehicles.entries()).map(([vehicle, list], vi) => {
            const vt = list.reduce((acc, r) => addTotals(acc, computeLine(r)), zeroTotals());
            return (
              <Box key={`v-${ci}-${vi}`} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  {/* “Auto: <name>” exactly like the legacy subheader */}
                  {t('consigmentBillingReport:section.vehicle', { name: vehicle }) || `Auto: ${vehicle}`}
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ccc' }}>
                  <Table size="small">
                    <TableHead
                      sx={{
                        backgroundColor: '#e0e0e0',
                        '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '0.75rem' }
                      }}
                    >
                      <TableRow>
                        <TableCell>{t('consigmentBillingReport:columns.date') || 'Pvm'}</TableCell>
                        <TableCell>{t('consigmentBillingReport:columns.waybillNumber') || 'RahtikirjanNro'}</TableCell>
                        <TableCell>{t('consigmentBillingReport:columns.route') || 'Ajoreitti'}</TableCell>
                        <TableCell>{t('consigmentBillingReport:columns.notes') || 'Lisätiedot'}</TableCell>

                        <TableCell align="right">{t('consigmentBillingReport:columns.m3') || 'm3'}</TableCell>
                        <TableCell align="right">{t('consigmentBillingReport:columns.m3Price') || 'm3 Hinta'}</TableCell>

                        <TableCell align="right">{t('consigmentBillingReport:columns.km') || 'Km'}</TableCell>
                        <TableCell align="right">{t('consigmentBillingReport:columns.kmPrice') || 'Km Hinta'}</TableCell>

                        <TableCell align="right">{t('consigmentBillingReport:columns.pieces') || 'Kpl'}</TableCell>
                        <TableCell align="right">{t('consigmentBillingReport:columns.piecePrice') || 'Kpl Hinta'}</TableCell>

                        <TableCell align="right">{t('consigmentBillingReport:columns.hours') || 'Tunti'}</TableCell>
                        <TableCell align="right">{t('consigmentBillingReport:columns.hourPrice') || 'Tunti Hinta'}</TableCell>

                        <TableCell align="right">{t('consigmentBillingReport:columns.roadTax') || 'Tievero'}</TableCell>
                        <TableCell align="right">{t('consigmentBillingReport:columns.total') || 'Kokohinta'}</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {list.map((r: any) => {
                        const line = computeLine(r);
                        return (
                          <TableRow key={String(r.id)} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                            <TableCell>{r.date ? dayjs(r.date).format('DD.MM.YYYY') : ''}</TableCell>
                            <TableCell>{r.waybillNumber}</TableCell>
                            <TableCell>{r.route}</TableCell>
                            <TableCell>{r.notes}</TableCell>

                            {/* Quantities */}
                            <TableCell align="right">{dash2(line.m3)}</TableCell>
                            {/* Unit price (per row) */}
                            <TableCell align="right">{dash2(r.unitPriceM3 ?? r.unitPrice)}</TableCell>

                            <TableCell align="right">{dash2(line.km)}</TableCell>
                            <TableCell align="right">{dash2(r.unitPriceKm)}</TableCell>

                            <TableCell align="right">{dash2(line.pcs)}</TableCell>
                            <TableCell align="right">{dash2(r.unitPricePiece)}</TableCell>

                            <TableCell align="right">{dash2(line.hour)}</TableCell>
                            <TableCell align="right">{dash2(r.unitPriceHour)}</TableCell>

                            <TableCell align="right">{dash2(line.roadTax)}</TableCell>
                            <TableCell align="right">{dash2(line.total)}</TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Vehicle-level subtotal row: quantity sums + (qty * unit price) sums */}
                      <TableRow sx={{ backgroundColor: '#e0e0e0', '& .MuiTableCell-root': { fontWeight: 'bold' } }}>
                        {/* 4 text columns before the numeric blocks */}
                        <TableCell colSpan={4} align="right">
                          {t('consigmentBillingReport:totals') || 'Yhteensä:'}
                        </TableCell>

                        {/* Quantities */}
                        <TableCell align="right">{fix2(vt.m3)}</TableCell>
                        {/* Values (qty * unit price) */}
                        <TableCell align="right">{fix2(vt.m3Value)}</TableCell>

                        <TableCell align="right">{fix2(vt.km)}</TableCell>
                        <TableCell align="right">{fix2(vt.kmValue)}</TableCell>

                        <TableCell align="right">{fix2(vt.pcs)}</TableCell>
                        <TableCell align="right">{fix2(vt.pcsValue)}</TableCell>

                        <TableCell align="right">{fix2(vt.hour)}</TableCell>
                        <TableCell align="right">{fix2(vt.hourValue)}</TableCell>

                        <TableCell align="right">{fix2(vt.roadTax)}</TableCell>
                        <TableCell align="right">{fix2(vt.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Print controls */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="contained" onClick={() => window.print()} className="no-print">
          {t('consigmentBillingReport:buttons.print') || 'Print'}
        </Button>
        <Typography variant="caption">
          {t('consigmentBillingReport:page', { current: 1, total: 1 })}
        </Typography>
      </Box>

      {/* Print CSS (A4 landscape). Colors remain unchanged. */}
      <style jsx global>{`
        @page { size: A4 landscape; margin: 20mm; }
        @media print {
          .MuiAppBar-root, header, nav, footer, .no-print { display: none !important; }
          #wb-print-root { position: static !important; width: auto !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr, img { page-break-inside: avoid; break-inside: avoid; }
          .MuiTableCell-root { font-size: 8pt !important; }
          .MuiPaper-root { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </Box>
  );
};

export default ConsigmentBillingReport;

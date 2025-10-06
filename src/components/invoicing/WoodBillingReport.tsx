// src/components/invoicing/WoodBillingReport.tsx
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

const fix2 = (v: any) => Number(v ?? 0).toFixed(2);
/** Show "-" for zeros; otherwise fixed to 2 decimals. */
const dash2 = (v: any) => (Number(v ?? 0) === 0 ? '-' : Number(v).toFixed(2));

const n = (v: any) => Number(v ?? 0);

const computeLineTotals = (r: any) => {
  const qM3 = n(r.quantityM3);
  const qKm = n(r.km);
  const qHr = n(r.hours);
  const qPc = n(r.pieces);

  const pM3 = n(r.unitPriceM3 ?? r.unitPrice);
  const pKm = n(r.unitPriceKm);
  const pHr = n(r.unitPriceHour);
  const pPc = n(r.unitPricePiece);

  const m3Val = qM3 * pM3;
  const kmVal = qKm * pKm;
  const hrVal = qHr * pHr;
  const pcVal = qPc * pPc;

  const givenTotal = n(r.total ?? r.sum);
  const computedTotal = m3Val + kmVal + hrVal + pcVal;

  return {
    m3: qM3, m3Value: m3Val,
    km: qKm, kmValue: kmVal,
    hours: qHr, hoursValue: hrVal,
    pieces: qPc, piecesValue: pcVal,
    total: givenTotal > 0 ? givenTotal : computedTotal,
  };
};

type Totals = ReturnType<typeof computeLineTotals>;

const zeroTotals = (): Totals => ({
  m3: 0, m3Value: 0,
  km: 0, kmValue: 0,
  hours: 0, hoursValue: 0,
  pieces: 0, piecesValue: 0,
  total: 0,
});

const addTotals = (a: Totals, b: Totals): Totals => ({
  m3: a.m3 + b.m3,
  m3Value: a.m3Value + b.m3Value,
  km: a.km + b.km,
  kmValue: a.kmValue + b.kmValue,
  hours: a.hours + b.hours,
  hoursValue: a.hoursValue + b.hoursValue,
  pieces: a.pieces + b.pieces,
  piecesValue: a.piecesValue + b.piecesValue,
  total: a.total + b.total,
});

/**
 * Printable wood billing report (A4 landscape) grouped by Customer → Vehicle.
 * - Column headers as in the reference image
 * - Per-vehicle "Yhteensä" row with quantity sums & value sums (qty * unit price)
 * - Grand totals at the end with the same logic
 */
const WoodBillingReport: React.FC<Props> = ({ rows }) => {
  const { t } = useTranslation(['woodBillingReport', 'common']);
  const router = useRouter();

  if (!rows || rows.length === 0) {
    return <Typography>{t('woodBillingReport:errors.noData')}</Typography>;
  }

  // Sort by date (stable parse; fallback to Date)
  const sorted = useMemo(() => {
    const toTs = (d?: string | null) => {
      if (!d) return 0;
      const strict = dayjs(d, 'YYYY-MM-DD', true);
      return strict.isValid() ? strict.valueOf() : (new Date(d).getTime() || 0);
    };
    return [...rows].sort((a, b) => toTs(a.date) - toTs(b.date));
  }, [rows]);

  // Period for header
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const startDate = first?.date ? dayjs(first.date).format('DD.MM.YYYY') : '';
  const endDate = last?.date ? dayjs(last.date).format('DD.MM.YYYY') : '';

  // Group rows by customer → vehicle
  const groups = useMemo(() => {
    const byCustomer = new Map<string, Map<string, BillingRow[]>>();
    for (const r of sorted) {
      const customer = (r.customer ?? t('woodBillingReport:placeholders.noCustomer')) as string;
      const vehicle = (r.vehicle ?? t('woodBillingReport:placeholders.noVehicle')) as string;
      if (!byCustomer.has(customer)) byCustomer.set(customer, new Map());
      const vm = byCustomer.get(customer)!;
      if (!vm.has(vehicle)) vm.set(vehicle, []);
      vm.get(vehicle)!.push(r);
    }
    return byCustomer;
  }, [sorted, t]);

  // Grand totals
  const grandTotals = useMemo(() => {
    return sorted.reduce((acc, r) => addTotals(acc, computeLineTotals(r)), zeroTotals());
  }, [sorted]);

  return (
    <Box id="wb-print-root" sx={{ p: 4, color: '#000', bgcolor: '#fff' }}>
      {/* Screen-only back button */}
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          {t('common:buttons.back')}
        </Button>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('woodBillingReport:header.company')}
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {t('woodBillingReport:header.title')}
          </Typography>
          <Typography variant="body1">
            {t('woodBillingReport:header.period', { start: startDate, end: endDate })}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Customer → Vehicle sections */}
      {Array.from(groups.entries()).map(([customer, vehiclesMap], idx) => (
        <Box key={`cust-${idx}`} sx={{ mb: 3 }}>
          {/* Customer header (single line) */}
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('woodBillingReport:section.customer', { name: customer })}
          </Typography>

          {/* Each vehicle block with its own table + per-vehicle totals */}
          {Array.from(vehiclesMap.entries()).map(([vehicle, list], vi) => {
            const vt = list.reduce((acc, r) => addTotals(acc, computeLineTotals(r)), zeroTotals());
            return (
              <Box key={`veh-${idx}-${vi}`} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('woodBillingReport:section.vehicle', { name: vehicle })}
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
                        <TableCell>{t('woodBillingReport:columns.date')}</TableCell>
                        <TableCell>{t('woodBillingReport:columns.receiptNumber')}</TableCell>
                        <TableCell>{t('woodBillingReport:columns.timberStack')}</TableCell>
                        <TableCell>{t('woodBillingReport:columns.woodType')}</TableCell>
                        <TableCell>{t('woodBillingReport:columns.route')}</TableCell>
                        <TableCell>{t('woodBillingReport:columns.notes')}</TableCell>

                        <TableCell align="right">{t('woodBillingReport:columns.m3')}</TableCell>
                        <TableCell align="right">{t('woodBillingReport:columns.m3Price')}</TableCell>

                        <TableCell align="right">{t('woodBillingReport:columns.km')}</TableCell>
                        <TableCell align="right">{t('woodBillingReport:columns.kmPrice')}</TableCell>

                        <TableCell align="right">{t('woodBillingReport:columns.hours')}</TableCell>
                        <TableCell align="right">{t('woodBillingReport:columns.hourPrice')}</TableCell>

                        <TableCell align="right">{t('woodBillingReport:columns.pieces')}</TableCell>
                        <TableCell align="right">{t('woodBillingReport:columns.piecePrice')}</TableCell>

                        <TableCell align="right">{t('woodBillingReport:columns.totalPrice')}</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {list.map((r: any) => {
                        const line = computeLineTotals(r);
                        return (
                          <TableRow key={String(r.id)} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                            <TableCell>{r.date ? dayjs(r.date).format('DD.MM.YYYY') : ''}</TableCell>
                            <TableCell>{r.vastaanottoNro}</TableCell>
                            <TableCell>{r.puulaaniName}</TableCell>
                            <TableCell>{r.woodType}</TableCell>
                            <TableCell>{r.route}</TableCell>
                            <TableCell>{r.notes}</TableCell>

                            {/* quantities */}
                            <TableCell align="right">{dash2(line.m3)}</TableCell>
                            {/* unit price (line-level: show unit price, totals row will show qty*price) */}
                            <TableCell align="right">{dash2(r.unitPriceM3 ?? r.unitPrice)}</TableCell>

                            <TableCell align="right">{dash2(line.km)}</TableCell>
                            <TableCell align="right">{dash2(r.unitPriceKm)}</TableCell>

                            <TableCell align="right">{dash2(line.hours)}</TableCell>
                            <TableCell align="right">{dash2(r.unitPriceHour)}</TableCell>

                            <TableCell align="right">{dash2(line.pieces)}</TableCell>
                            <TableCell align="right">{dash2(r.unitPricePiece)}</TableCell>

                            {/* total (per row) */}
                            <TableCell align="right">{dash2(line.total)}</TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Per-vehicle totals row */}
                      <TableRow sx={{ backgroundColor: '#e0e0e0', '& .MuiTableCell-root': { fontWeight: 'bold' } }}>
                        {/* 6 non-numeric columns before metrics */}
                        <TableCell colSpan={6} align="right">
                          {t('woodBillingReport:totals')}
                        </TableCell>

                        {/* quantities */}
                        <TableCell align="right">{dash2(vt.m3)}</TableCell>
                        {/* value sums (qty * unit price) */}
                        <TableCell align="right">{dash2(vt.m3Value)}</TableCell>

                        <TableCell align="right">{dash2(vt.km)}</TableCell>
                        <TableCell align="right">{dash2(vt.kmValue)}</TableCell>

                        <TableCell align="right">{dash2(vt.hours)}</TableCell>
                        <TableCell align="right">{dash2(vt.hoursValue)}</TableCell>

                        <TableCell align="right">{dash2(vt.pieces)}</TableCell>
                        <TableCell align="right">{dash2(vt.piecesValue)}</TableCell>

                        <TableCell align="right">{dash2(vt.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Footer */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="contained" onClick={() => window.print()} className="no-print">
          {t('woodBillingReport:buttons.print')}
        </Button>
        <Typography variant="caption">
          {t('woodBillingReport:page', { current: 1, total: 1 })}
        </Typography>
      </Box>

      {/* Print styles (keep colors as-is) */}
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

export default WoodBillingReport;

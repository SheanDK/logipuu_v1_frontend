// src/components/invoicing/WoodBillingReport.tsx
'use client';

import React, { useMemo, useRef } from 'react';
import Image from 'next/image';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, Stack, Container, Divider, useTheme
} from '@mui/material';
import type { BillingRow } from '@/services/invoicingService';
import dayjs from 'dayjs';
import { useTranslation } from '@/i18n/useTranslation';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import i18n from '@/i18n/i18n';

type Props = { rows: BillingRow[] };

const n = (v: any) => Number(v ?? 0);
const fix2 = (v: any) => Number(v ?? 0).toFixed(2);
const dash2 = (v: any) => (Number(v ?? 0) === 0 ? '-' : Number(v).toFixed(2));

const computeLineTotals = (r: any) => {
    const qM3 = n(r.quantityM3); const qKm = n(r.km); const qHr = n(r.hours); const qPc = n(r.pieces);
    const pM3 = n(r.unitPriceM3 ?? r.unitPrice); const pKm = n(r.unitPriceKm); const pHr = n(r.unitPriceHour); const pPc = n(r.unitPricePiece);
    const m3Val = qM3 * pM3; const kmVal = qKm * pKm; const hrVal = qHr * pHr; const pcVal = qPc * pPc;
    const givenTotal = n(r.total ?? r.sum);
    const computedTotal = m3Val + kmVal + hrVal + pcVal;
    return { m3: qM3, m3Value: m3Val, km: qKm, kmValue: kmVal, hours: qHr, hoursValue: hrVal, pieces: qPc, piecesValue: pcVal, total: givenTotal > 0 ? givenTotal : computedTotal };
};
type Totals = ReturnType<typeof computeLineTotals>;
const zeroTotals = (): Totals => ({ m3: 0, m3Value: 0, km: 0, kmValue: 0, hours: 0, hoursValue: 0, pieces: 0, piecesValue: 0, total: 0 });
const addTotals = (a: Totals, b: Totals): Totals => ({ m3: a.m3 + b.m3, m3Value: a.m3Value + b.m3Value, km: a.km + b.km, kmValue: a.kmValue + b.kmValue, hours: a.hours + b.hours, hoursValue: a.hoursValue + b.hoursValue, pieces: a.pieces + b.pieces, piecesValue: a.piecesValue + b.piecesValue, total: a.total + b.total });

const WoodBillingReport: React.FC<Props> = ({ rows }) => {
    const { t } = useTranslation(['woodBillingReport', 'common']);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Colors for Web View (Print will override)
    const headerBgColor = isDark ? 'action.hover' : '#f5f5f5';
    const totalRowBgColor = isDark ? 'action.selected' : '#e3f2fd';
    const grandTotalBgColor = isDark ? 'background.default' : '#f0f0f0';

    const sorted = useMemo(() => {
        const toTs = (d?: string | null) => { if (!d) return 0; return new Date(d).getTime() || 0; };
        return [...rows].sort((a, b) => toTs(a.date) - toTs(b.date));
    }, [rows]);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const startDate = first?.date ? dayjs(first.date).locale(i18n.language).format('L') : '';
    const endDate = last?.date ? dayjs(last.date).locale(i18n.language).format('L') : '';

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

    const grandTotals = useMemo(() => {
        return sorted.reduce((acc, r) => addTotals(acc, computeLineTotals(r)), zeroTotals());
    }, [sorted]);

    const printDateTime = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    const formatDate = (dateStr: string | null) => { if (!dateStr) return '-'; return dayjs(dateStr).locale(i18n.language).format('L'); };

    const handlePrint = () => window.print();

    const handleDownloadPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const img = new window.Image();
        img.src = '/images/Bitwell-logo.png';

        img.onload = () => { doc.addImage(img, 'PNG', 14, 10, 50, 12); generatePdfContent(doc); };
        img.onerror = () => generatePdfContent(doc);

        function generatePdfContent(doc: jsPDF) {
            doc.setFontSize(16); doc.setFont("helvetica", "bold");
            const title = t('woodBillingReport:header.title', { defaultValue: 'Wood Billing Report' });
            doc.text(title, pageWidth - 14, 18, { align: 'right' });

            doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
            const dateStr = `${t('woodBillingReport:header.period', { start: startDate, end: endDate })}`;
            doc.text(dateStr, pageWidth - 14, 24, { align: 'right' });

            let yPos = 35;
            const headers = [t('columns.date'), t('columns.receiptNumber'), t('columns.timberStack'), t('columns.woodType'), t('columns.route'), t('columns.notes'), 'm³', 'Price', 'Km', 'Price', 'Hrs', 'Price', 'Pcs', 'Price', 'Total'];

            Array.from(groups.entries()).forEach(([customer, vehicles]) => {
                if (yPos > 180) { doc.addPage(); yPos = 20; }
                doc.setFontSize(12); doc.setTextColor(51, 51, 51); doc.setFont("helvetica", "bold");
                // FIX: Correct Translation Interpolation
                doc.text(t('woodBillingReport:section.customer', { name: customer }), 14, yPos);
                doc.setDrawColor(200); doc.line(14, yPos + 1, 200, yPos + 1);
                yPos += 6;

                Array.from(vehicles.entries()).forEach(([vehicle, list]) => {
                    const vt = list.reduce((acc, r) => addTotals(acc, computeLineTotals(r)), zeroTotals());
                    if (yPos > 180) { doc.addPage(); yPos = 20; }
                    doc.setFontSize(10); doc.setTextColor(51, 51, 51); doc.setFont("helvetica", "bold");
                    doc.text(t('woodBillingReport:section.vehicle', { name: vehicle }), 14, yPos);
                    yPos += 2;

                    const bodyData = list.map((r: any) => {
                        const l = computeLineTotals(r);
                        return [formatDate(r.date), r.vastaanottoNro || '-', r.puulaaniName || '-', r.woodType || '-', r.route || '-', r.notes || '-', dash2(l.m3), dash2(r.unitPriceM3 ?? r.unitPrice), dash2(l.km), dash2(r.unitPriceKm), dash2(l.hours), dash2(r.unitPriceHour), dash2(l.pieces), dash2(r.unitPricePiece), fix2(l.total)];
                    });

                    bodyData.push(['', '', '', '', '', t('totals', { defaultValue: 'Total:' }), fix2(vt.m3), fix2(vt.m3Value), fix2(vt.km), fix2(vt.kmValue), fix2(vt.hours), fix2(vt.hoursValue), fix2(vt.pieces), fix2(vt.piecesValue), fix2(vt.total)]);

                    autoTable(doc, {
                        startY: yPos,
                        head: [headers],
                        body: bodyData,
                        theme: 'plain',
                        styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak', valign: 'middle' },
                        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, halign: 'left' },
                        columnStyles: {
                            0: { cellWidth: 15 }, 1: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 15 }, 4: { cellWidth: 20 }, 5: { cellWidth: 'auto' },
                            6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'right' }, 11: { halign: 'right' }, 12: { halign: 'right' }, 13: { halign: 'right' }, 14: { halign: 'right', fontStyle: 'bold' }
                        },
                        didParseCell: (data) => {
                            if (data.row.index === bodyData.length - 1) {
                                data.cell.styles.fontStyle = 'bold';
                                if (data.column.index === 14) { data.cell.styles.fillColor = [227, 242, 253]; }
                                else { data.cell.styles.fillColor = [255, 255, 255]; }
                                if (data.section === 'body') { data.cell.styles.lineWidth = { top: 0.1, bottom: 0, left: 0, right: 0 }; }
                            }
                        },
                        margin: { left: 14, right: 14 }
                    });
                    yPos = (doc as any).lastAutoTable.finalY + 8;
                });
                yPos += 5;
            });

            // Grand Total Box (PDF)
            if (yPos > 160) { doc.addPage(); yPos = 20; }
            doc.setDrawColor(200); doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos, pageWidth - 28, 25, 'F'); doc.setDrawColor(200); doc.rect(14, yPos, pageWidth - 28, 25, 'S');
            doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(t('grandTotal', { defaultValue: 'Grand Total' }), 16, yPos + 6);
            doc.setFontSize(9);
            let xPos = 16; const spacing = 35;
            const drawStat = (label: string, val: string) => {
                doc.setFont("helvetica", "normal"); doc.setTextColor(80); doc.text(label, xPos, yPos + 12);
                doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text(val, xPos, yPos + 17);
                xPos += spacing;
            };
            drawStat("Total m³", fix2(grandTotals.m3)); drawStat("Total Km", fix2(grandTotals.km)); drawStat("Total Hrs", fix2(grandTotals.hours)); drawStat("Total Pcs", fix2(grandTotals.pieces));
            const totalValX = pageWidth - 20;
            doc.setFontSize(10); doc.setTextColor(51, 51, 51); doc.text(t('woodBillingReport:totalValue', { defaultValue: 'Total Value' }), totalValX, yPos + 12, { align: 'right' });
            doc.setFontSize(14); doc.setTextColor(51, 51, 51); doc.text(`${fix2(grandTotals.total)} ${t('common:units.currency', { defaultValue: '€' })}`, totalValX, yPos + 19, { align: 'right' });

            doc.save(`Wood_Billing_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
        }
    };

    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Wood Billing');
        worksheet.columns = [
            { header: t('columns.date'), key: 'date', width: 12 }, { header: t('section.customer'), key: 'customer', width: 25 }, { header: t('section.vehicle'), key: 'vehicle', width: 15 },
            { header: t('columns.receiptNumber'), key: 'receipt', width: 15 }, { header: t('columns.timberStack'), key: 'stack', width: 20 }, { header: t('columns.woodType'), key: 'woodType', width: 15 },
            { header: t('columns.route'), key: 'route', width: 20 }, { header: t('columns.notes'), key: 'notes', width: 30 },
            { header: 'm³', key: 'm3', width: 10 }, { header: 'm³ Price', key: 'm3Price', width: 10 },
            { header: 'Km', key: 'km', width: 10 }, { header: 'Km Price', key: 'kmPrice', width: 10 },
            { header: 'Hrs', key: 'hrs', width: 10 }, { header: 'Hrs Price', key: 'hrsPrice', width: 10 },
            { header: 'Pcs', key: 'pcs', width: 10 }, { header: 'Pcs Price', key: 'pcsPrice', width: 10 }, { header: 'Total', key: 'total', width: 15 },
        ];
        worksheet.getRow(1).font = { bold: true }; worksheet.getColumn('notes').alignment = { wrapText: true };
        sorted.forEach((r: any) => {
            const line = computeLineTotals(r);
            const row = worksheet.addRow({
                date: formatDate(r.date), customer: r.customer, vehicle: r.vehicle, receipt: r.vastaanottoNro, stack: r.puulaaniName, woodType: r.woodType, route: r.route, notes: r.notes,
                m3: n(line.m3), m3Price: n(r.unitPriceM3 ?? r.unitPrice), km: n(line.km), kmPrice: n(r.unitPriceKm),
                hrs: n(line.hours), hrsPrice: n(r.unitPriceHour), pcs: n(line.pieces), pcsPrice: n(r.unitPricePiece), total: n(line.total)
            });
            for (let i = 9; i <= 17; i++) { row.getCell(i).alignment = { horizontal: 'right' }; row.getCell(i).numFmt = '0.00'; }
        });
        // Grand Total Row
        worksheet.addRow({});
        const totalRow = worksheet.addRow({ route: t('grandTotal', { defaultValue: 'GRAND TOTAL' }), m3: grandTotals.m3, km: grandTotals.km, hrs: grandTotals.hours, pcs: grandTotals.pieces, total: grandTotals.total });
        totalRow.font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'wood_billing_report.xlsx');
    };

    if (!rows || rows.length === 0) {
        return <Container sx={{ py: 4 }}><Typography variant="h6" color="error">{t('woodBillingReport:errors.noData')}</Typography></Container>;
    }

    return (
        <>
            <style jsx global>{`
        @media print {
            @page { size: landscape; margin: 10mm; }
            html, body { margin: 0; padding: 0; width: 100%; background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: visible !important; }
            body * { visibility: hidden; }
            .no-print { display: none !important; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background-color: #fff !important; color: #000 !important; }
            .MuiPaper-root { box-shadow: none !important; border: none !important; }
            .MuiTableCell-root { border-bottom: 1px solid #000 !important; color: #000 !important; padding: 4px 2px !important; white-space: normal !important; }
            .MuiTableContainer-root { overflow: visible !important; display: block !important; width: 100% !important; }
            .MuiTable-root { width: 100% !important; min-width: 0 !important; }
            ::-webkit-scrollbar { display: none; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            .grand-total-box { background-color: #f0f0f0 !important; border: 1px solid #ccc !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

            <Box className="printable-area" sx={{ backgroundColor: 'background.default', minHeight: '100vh', p: { xs: 1, sm: 2, md: 4 } }}>
                <Container maxWidth="xl">
                    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.paper' }} className="break-avoid">
                        {/* Header */}
                        <Box sx={{ mb: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box sx={{ width: '200px' }}> <Image src="/images/Bitwell-logo.png" alt="Company Logo" width={200} height={50} priority style={{ objectFit: 'contain' }} /> </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h5" component="h1" fontWeight="bold" color="text.primary">{t('woodBillingReport:header.title')}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t('woodBillingReport:header.period', { start: startDate, end: endDate })}</Typography>
                                </Box>
                            </Stack>
                            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Stack direction="row" spacing={1}>
                                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>{t('buttons.print', { defaultValue: 'PRINT' })}</Button>
                                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>PDF</Button>
                                    <Button variant="outlined" startIcon={<GridOnIcon />} onClick={handleDownloadExcel}>EXCEL</Button>
                                </Stack>
                            </Box>
                            <Divider sx={{ my: 2, borderColor: 'divider', '@media print': { borderColor: '#000' } }} />
                        </Box>

                        {/* Content */}
                        <Box>
                            {Array.from(groups.entries()).map(([customer, vehiclesMap], idx) => (
                                <Box key={`cust-${idx}`} sx={{ mb: 5 }} className="break-avoid">
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, borderBottom: `1px solid ${isDark ? '#444' : '#ddd'}`, pb: 0.5, '@media print': { color: '#000', borderBottom: '1px solid #000' } }}>
                                        {t('woodBillingReport:section.customer', { name: customer })}
                                    </Typography>

                                    {Array.from(vehiclesMap.entries()).map(([vehicle, list], vi) => {
                                        const vt = list.reduce((acc, r) => addTotals(acc, computeLineTotals(r)), zeroTotals());
                                        return (
                                            <Box key={`veh-${idx}-${vi}`} sx={{ mb: 4, ml: 2 }} className="break-avoid">
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                                                    {t('woodBillingReport:section.vehicle', { name: vehicle })}
                                                </Typography>
                                                <TableContainer component={Paper} variant="outlined" sx={{ border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`, '@media print': { border: '1px solid #000' } }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ backgroundColor: headerBgColor }}>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.date')}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.receiptNumber')}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.timberStack')}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.woodType')}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.route')}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>{t('columns.notes')}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>m³</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.m3Price', { defaultValue: 'm³ Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Km</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.kmPrice', { defaultValue: 'km Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hrs</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.hourPrice', { defaultValue: 'Hour Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pcs</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.piecePrice', { defaultValue: 'Piece Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: totalRowBgColor }}>{t('totals', { defaultValue: 'Totals' })}</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {list.map((r: any) => {
                                                                const line = computeLineTotals(r);
                                                                return (
                                                                    <TableRow key={String(r.id)} hover>
                                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.date)}</TableCell>
                                                                        <TableCell>{r.vastaanottoNro}</TableCell>
                                                                        <TableCell>{r.puulaaniName}</TableCell>
                                                                        <TableCell>{r.woodType}</TableCell>
                                                                        <TableCell>{r.route}</TableCell>
                                                                        <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 150 }}>{r.notes}</TableCell>
                                                                        <TableCell align="right">{dash2(line.m3)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPriceM3 ?? r.unitPrice)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.km)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPriceKm)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.hours)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPriceHour)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.pieces)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPricePiece)}</TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(line.total)}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                            {/* Subtotal */}
                                                            <TableRow sx={{ backgroundColor: isDark ? 'action.hover' : '#fafafa', borderTop: '2px solid #ddd', '@media print': { borderTop: '2px solid #000', backgroundColor: 'transparent' } }}>
                                                                <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>{t('totals')}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.m3)}</TableCell>
                                                                <TableCell align="right">{dash2(vt.m3Value)}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.km)}</TableCell>
                                                                <TableCell align="right">{dash2(vt.kmValue)}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.hours)}</TableCell>
                                                                <TableCell align="right">{dash2(vt.hoursValue)}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.pieces)}</TableCell>
                                                                <TableCell align="right">{dash2(vt.piecesValue)}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.total)}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ))}
                        </Box>

                        {/* Grand Total */}
                        <Box className="grand-total-box" sx={{ mt: 4, p: 2, bgcolor: grandTotalBgColor, borderRadius: 1, border: `1px solid ${isDark ? '#444' : '#ccc'}`, pageBreakInside: 'avoid', '@media print': { border: '1px solid #000', backgroundColor: 'transparent' } }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', '@media print': { borderBottom: '1px solid #000' } }}>{t('grandTotal', { defaultValue: 'Grand Total' })}</Typography>
                            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                                <Box><Typography variant="caption" color="text.secondary">{t('columns.m3Price', { defaultValue: 'm³ Price' })}</Typography><Typography variant="subtitle1" fontWeight="bold">{fix2(grandTotals.m3)}</Typography></Box>
                                <Box><Typography variant="caption" color="text.secondary">{t('columns.kmPrice', { defaultValue: 'km Price' })}</Typography><Typography variant="subtitle1" fontWeight="bold">{fix2(grandTotals.km)}</Typography></Box>
                                <Box><Typography variant="caption" color="text.secondary">{t('columns.hourPrice', { defaultValue: 'Hour Price' })}</Typography><Typography variant="subtitle1" fontWeight="bold">{fix2(grandTotals.hours)}</Typography></Box>
                                <Box><Typography variant="caption" color="text.secondary">{t('columns.piecePrice', { defaultValue: 'Piece Price' })}</Typography><Typography variant="subtitle1" fontWeight="bold">{fix2(grandTotals.pieces)}</Typography></Box>
                                <Box sx={{ ml: 'auto !important' }}><Typography variant="caption" color="primary" sx={{ '@media print': { color: '#000' } }}>{t('totalValue', { defaultValue: 'Total Value' })}</Typography><Typography variant="h5" fontWeight="bold" color="primary" sx={{ '@media print': { color: '#000' } }}>{fix2(grandTotals.total)} {t('common:units.currency', { defaultValue: '€' })}</Typography></Box>
                            </Stack>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default WoodBillingReport;
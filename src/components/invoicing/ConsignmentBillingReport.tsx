//src/components/invoicing/ConsignmentBillingReport.tsx
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
const dash2 = (v: any) => {
    const num = Number(v ?? 0);
    return num === 0 ? '-' : num.toFixed(2);
};

// ... (computeLine, Totals, addTotals helper functions remain same) ...
const computeLine = (r: any) => {
    const qM3 = n(r.quantityM3); const qKm = n(r.km); const qPc = n(r.pieces); const qHr = n(r.hours);
    const pM3 = n(r.unitPriceM3 ?? r.unitPrice); const pKm = n(r.unitPriceKm); const pPc = n(r.unitPricePiece); const pHr = n(r.unitPriceHour);
    const road = n(r.roadTax ?? r.tollTax ?? r.tievero);
    const m3Val = qM3 * pM3; const kmVal = qKm * pKm; const pcVal = qPc * pPc; const hrVal = qHr * pHr;
    const givenTotal = n(r.total ?? r.sum);
    const computed = m3Val + kmVal + pcVal + hrVal + road;
    return { m3: qM3, m3Value: m3Val, km: qKm, kmValue: kmVal, hour: qHr, hourValue: hrVal, pcs: qPc, pcsValue: pcVal, roadTax: road, total: givenTotal > 0 ? givenTotal : computed };
};
type Totals = ReturnType<typeof computeLine>;
const zeroTotals = (): Totals => ({ m3: 0, m3Value: 0, km: 0, kmValue: 0, hour: 0, hourValue: 0, pcs: 0, pcsValue: 0, roadTax: 0, total: 0 });
const addTotals = (a: Totals, b: Totals): Totals => ({ m3: a.m3 + b.m3, m3Value: a.m3Value + b.m3Value, km: a.km + b.km, kmValue: a.kmValue + b.kmValue, hour: a.hour + b.hour, hourValue: a.hourValue + b.hourValue, pcs: a.pcs + b.pcs, pcsValue: a.pcsValue + b.pcsValue, roadTax: a.roadTax + b.roadTax, total: a.total + b.total });

const ConsignmentBillingReport: React.FC<Props> = ({ rows }) => {
    const { t } = useTranslation(['consigmentBillingReport', 'common']);
    const theme = useTheme();
    // We want Light Mode colors for PDF/Print consistency regardless of user theme
    const headerBgColor = '#f5f5f5';
    const totalRowBgColor = '#e3f2fd'; // Light Blue
    const grandTotalBgColor = '#f0f0f0';
    const isDark = theme.palette.mode === 'dark'; // Keep for screen view

    const sorted = useMemo(() => {
        if (!rows) return [];
        return [...rows].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());
    }, [rows]);

    const groups = useMemo(() => {
        const byCust = new Map<string, Map<string, BillingRow[]>>();
        for (const r of sorted) {
            const cust = (r.customer ?? t('common:placeholders.noCustomer', { defaultValue: 'No Customer' })) as string;
            const veh = (r.vehicle ?? t('common:placeholders.noVehicle', { defaultValue: 'No Vehicle' })) as string;
            if (!byCust.has(cust)) byCust.set(cust, new Map());
            const vm = byCust.get(cust)!;
            if (!vm.has(veh)) vm.set(veh, []);
            vm.get(veh)!.push(r);
        }
        return byCust;
    }, [sorted, t]);

    const grand = useMemo(() => sorted.reduce((acc, r) => addTotals(acc, computeLine(r)), zeroTotals()), [sorted]);

    const printDateTime = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return dayjs(dateStr).locale(i18n.language).format('L'); // 'L' is the localized date format
    };

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
            const title = t('consigmentBillingReport:header.title', { defaultValue: 'Consignment Billing Report' });
            doc.text(title, pageWidth - 14, 18, { align: 'right' });

            doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
            const dateStr = `${t('consigmentBillingReport:header.generated', { defaultValue: 'Generated:' })} ${printDateTime}`;
            doc.text(dateStr, pageWidth - 14, 24, { align: 'right' });

            let yPos = 35;
            // TRANSLATED HEADERS
            const headers = [
                t('columns.date', { defaultValue: 'Date' }),
                t('columns.waybillNumber', { defaultValue: 'Waybill' }),
                t('columns.route', { defaultValue: 'Route' }),
                t('columns.notes', { defaultValue: 'Notes' }),
                'm³',
                t('columns.m3Price', { defaultValue: 'm³ Price' }),
                'Km',
                t('columns.kmPrice', { defaultValue: 'Km Price' }),
                'Pcs',
                t('columns.piecePrice', { defaultValue: 'Pcs Price' }),
                'Hrs',
                t('columns.hourPrice', { defaultValue: 'H Price' }),
                t('columns.roadTax', { defaultValue: 'Tax' }),
                t('columns.total', { defaultValue: 'Total' })
            ];

            Array.from(groups.entries()).forEach(([customer, vehicles]) => {
                if (yPos > 180) { doc.addPage(); yPos = 20; }
                doc.setFontSize(12); doc.setTextColor(51, 51, 51); // Dark Gray
                doc.setFont("helvetica", "bold");
                doc.text(t('consigmentBillingReport:section.customer', { name: customer }), 14, yPos);
                doc.setDrawColor(200); doc.line(14, yPos + 1, 200, yPos + 1);
                yPos += 6;

                Array.from(vehicles.entries()).forEach(([vehicle, list]) => {
                    const vt = list.reduce((acc, r) => addTotals(acc, computeLine(r)), zeroTotals());
                    if (yPos > 180) { doc.addPage(); yPos = 20; }
                    doc.setFontSize(10); doc.setTextColor(51, 51, 51);
                    doc.setFont("helvetica", "bold");
                    doc.text(t('consigmentBillingReport:section.vehicle', { name: vehicle }), 14, yPos);
                    yPos += 2;

                    const bodyData = list.map((r: any) => {
                        const l = computeLine(r);
                        return [formatDate(r.date), r.waybillNumber || '-', r.route || '-', r.notes || '-', dash2(l.m3), dash2(r.unitPriceM3 ?? r.unitPrice), dash2(l.km), dash2(r.unitPriceKm), dash2(l.pcs), dash2(r.unitPricePiece), dash2(l.hour), dash2(r.unitPriceHour), dash2(l.roadTax), fix2(l.total)];
                    });

                    // Translated Subtotal
                    bodyData.push(['', '', '', t('consigmentBillingReport:totals', { defaultValue: 'Total:' }), fix2(vt.m3), '', fix2(vt.km), '', fix2(vt.pcs), '', fix2(vt.hour), '', fix2(vt.roadTax), fix2(vt.total)]);

                    autoTable(doc, {
                        startY: yPos,
                        head: [headers],
                        body: bodyData,
                        theme: 'plain',
                        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', valign: 'middle' },
                        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, halign: 'left' },
                        columnStyles: {
                            0: { cellWidth: 18, halign: 'left' }, 1: { cellWidth: 15, halign: 'left' }, 2: { cellWidth: 25, halign: 'left' }, 3: { cellWidth: 'auto', halign: 'left' },
                            4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'right' }, 11: { halign: 'right' }, 12: { halign: 'right' }, 13: { halign: 'right', fontStyle: 'bold' }
                        },
                        didParseCell: (data) => {
                            if (data.row.index === bodyData.length - 1) { // Total Row
                                data.cell.styles.fontStyle = 'bold';
                                if (data.column.index === 13) { data.cell.styles.fillColor = [227, 242, 253]; }
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

            // Grand Total Box
            if (yPos > 160) { doc.addPage(); yPos = 20; }
            doc.setDrawColor(200); doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos, pageWidth - 28, 25, 'F');
            doc.setDrawColor(200); doc.rect(14, yPos, pageWidth - 28, 25, 'S');

            doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(t('consigmentBillingReport:grandTotal', { defaultValue: 'Grand Total' }), 16, yPos + 6);

            doc.setFontSize(9);
            let xPos = 16; const spacing = 35;

            const drawStat = (labelKey: string, val: string) => {
                doc.setFont("helvetica", "normal"); doc.setTextColor(80);
                doc.text(t(labelKey, { defaultValue: 'Total' }), xPos, yPos + 12);
                doc.setFont("helvetica", "bold"); doc.setTextColor(0);
                doc.text(val, xPos, yPos + 17);
                xPos += spacing;
            };
            // Use translation keys for Grand Total Labels
            drawStat('consigmentBillingReport:columns.m3', fix2(grand.m3));
            drawStat('consigmentBillingReport:columns.km', fix2(grand.km));
            drawStat('consigmentBillingReport:columns.pcs', fix2(grand.pcs));
            drawStat('consigmentBillingReport:columns.hours', fix2(grand.hour));
            drawStat('consigmentBillingReport:columns.roadTax', fix2(grand.roadTax));

            const totalValX = pageWidth - 20;
            doc.setFontSize(10); doc.setTextColor(51, 51, 51);
            doc.text(t('consigmentBillingReport:totalValue', { defaultValue: 'Total Value' }), totalValX, yPos + 12, { align: 'right' });
            doc.setFontSize(14); doc.setTextColor(51, 51, 51);
            const currency = t('common:units.currency', { defaultValue: '€' });
            doc.text(`${fix2(grand.total)} ${currency}`, totalValX, yPos + 19, { align: 'right' });

            doc.save(`Consignment_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
        }
    };

    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Consignments');

        // Translated Excel Headers
        worksheet.columns = [
            { header: t('columns.date', { defaultValue: 'Date' }), key: 'date', width: 12 },
            { header: t('columns.customer', { defaultValue: 'Customer' }), key: 'customer', width: 25 },
            { header: t('columns.vehicle', { defaultValue: 'Vehicle' }), key: 'vehicle', width: 15 },
            { header: t('columns.waybillNumber', { defaultValue: 'Waybill' }), key: 'waybill', width: 15 },
            { header: t('columns.route', { defaultValue: 'Route' }), key: 'route', width: 20 },
            { header: t('columns.notes', { defaultValue: 'Notes' }), key: 'notes', width: 30 },
            { header: 'm³', key: 'm3', width: 10 }, { header: t('columns.m3Price', { defaultValue: 'm3 Price' }), key: 'm3Price', width: 10 },
            { header: 'Km', key: 'km', width: 10 }, { header: t('columns.kmPrice', { defaultValue: 'km Price' }), key: 'kmPrice', width: 10 },
            { header: 'Pcs', key: 'pcs', width: 10 }, { header: t('columns.piecePrice', { defaultValue: 'pcs Price' }), key: 'pcsPrice', width: 10 },
            { header: 'Hrs', key: 'hrs', width: 10 }, { header: t('columns.hourPrice', { defaultValue: 'hrs Price' }), key: 'hrsPrice', width: 10 },
            { header: t('columns.roadTax', { defaultValue: 'Tax' }), key: 'tax', width: 10 },
            { header: t('columns.total', { defaultValue: 'Total' }), key: 'total', width: 15 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getColumn('notes').alignment = { wrapText: true };

        sorted.forEach((r: any) => {
            const line = computeLine(r);
            const row = worksheet.addRow({
                date: formatDate(r.date), customer: r.customer, vehicle: r.vehicle, waybill: r.waybillNumber, route: r.route, notes: r.notes,
                m3: n(line.m3), m3Price: n(r.unitPriceM3 ?? r.unitPrice),
                km: n(line.km), kmPrice: n(r.unitPriceKm),
                pcs: n(line.pcs), pcsPrice: n(r.unitPricePiece),
                hrs: n(line.hour), hrsPrice: n(r.unitPriceHour),
                tax: n(line.roadTax), total: n(line.total)
            });
            for (let i = 7; i <= 16; i++) { row.getCell(i).alignment = { horizontal: 'right' }; row.getCell(i).numFmt = '0.00'; }
        });

        // Grand Total Row
        worksheet.addRow({});
        const totalRow = worksheet.addRow({
            route: t('consigmentBillingReport:grandTotal', { defaultValue: 'GRAND TOTAL' }),
            m3: grand.m3, km: grand.km, pcs: grand.pcs, hrs: grand.hour, tax: grand.roadTax, total: grand.total
        });
        totalRow.font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'consignment_report.xlsx');
    };

    if (!rows || rows.length === 0) {
        return <Container sx={{ py: 4 }}><Typography variant="h6" color="error">{t('consigmentBillingReport:errors.noData')}</Typography></Container>;
    }

    return (
        <>
            <style jsx global>{`
        @media print {
            @page { size: landscape; margin: 10mm; }
            html, body { 
                margin: 0; padding: 0; width: 100%; 
                background-color: #ffffff !important; 
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            body * { visibility: hidden; }
            .no-print { display: none !important; }
            
            .printable-area, .printable-area * { 
                visibility: visible; 
            }
            .printable-area {
                position: absolute; left: 0; top: 0; 
                width: 100%; margin: 0; padding: 0;
                background-color: #ffffff !important;
                color: #000000 !important;
            }
            
            /* Print Specific Colors & Borders */
            .MuiTypography-colorPrimary { color: #333 !important; } /* Force dark text for print */
            .MuiTableCell-root { border-bottom: 1px solid #ddd !important; color: #000 !important; padding: 4px 2px !important; }
            .MuiTableHead-root .MuiTableRow-root { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
            tr[style*="background-color: ${totalRowBgColor}"] { background-color: ${totalRowBgColor} !important; -webkit-print-color-adjust: exact; }
            .grand-total-box { background-color: #f0f0f0 !important; border: 1px solid #ccc !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

            <Box className="printable-area" sx={{ backgroundColor: 'background.default', minHeight: '100vh', p: { xs: 1, sm: 2, md: 4 } }}>
                <Container maxWidth="xl">
                    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.paper' }} className="break-avoid">

                        {/* Header */}
                        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ width: '200px' }}> <Image src="/images/Bitwell-logo.png" alt="Company Logo" width={200} height={50} priority style={{ objectFit: 'contain' }} /> </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h5" component="h1" fontWeight="bold" color="text.primary">
                                    {t('consigmentBillingReport:header.title', { defaultValue: 'Consignment Billing Report' })}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {t('consigmentBillingReport:header.generated', { defaultValue: 'Generated:' })} {printDateTime}
                                </Typography>
                            </Box>
                        </Box>

                        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>{t('buttons.print', { defaultValue: 'PRINT' })}</Button>
                                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>PDF</Button>
                                <Button variant="outlined" startIcon={<GridOnIcon />} onClick={handleDownloadExcel}>EXCEL</Button>
                            </Stack>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {/* Report Data */}
                        <Box>
                            {Array.from(groups.entries()).map(([customer, vehicles], ci) => (
                                <Box key={`c-${ci}`} sx={{ mb: 5, breakInside: 'avoid' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, borderBottom: `1px solid ${isDark ? '#444' : '#ddd'}`, pb: 0.5 }}>
                                        {t('consigmentBillingReport:section.customer', { name: customer })}
                                    </Typography>

                                    {Array.from(vehicles.entries()).map(([vehicle, list], vi) => {
                                        const vt = list.reduce((acc, r) => addTotals(acc, computeLine(r)), zeroTotals());
                                        return (
                                            <Box key={`v-${ci}-${vi}`} sx={{ mb: 4, ml: 2, breakInside: 'avoid' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                                                    {t('consigmentBillingReport:section.vehicle', { name: vehicle })}
                                                </Typography>

                                                <TableContainer component={Paper} variant="outlined" sx={{ border: `1px solid ${isDark ? '#444' : '#e0e0e0'}` }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ backgroundColor: headerBgColor }}>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.date', { defaultValue: 'Date' })}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.waybillNumber', { defaultValue: 'Waybill' })}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.route', { defaultValue: 'Route' })}</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>{t('columns.notes', { defaultValue: 'Notes' })}</TableCell>

                                                                {/* Numeric Columns */}
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>m³</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.m3Price', { defaultValue: 'm³ Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Km</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.kmPrice', { defaultValue: 'Km Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pcs</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.piecePrice', { defaultValue: 'Pcs Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hrs</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8em', color: 'text.secondary' }}>{t('columns.hourPrice', { defaultValue: 'Hours Price' })}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tax</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: totalRowBgColor }}>{t('columns.total', { defaultValue: 'Total' })}</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {list.map((r: any) => {
                                                                const line = computeLine(r);
                                                                return (
                                                                    <TableRow key={String(r.id)} hover>
                                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.date)}</TableCell>
                                                                        <TableCell>{r.waybillNumber}</TableCell>
                                                                        <TableCell>{r.route}</TableCell>
                                                                        <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 200 }}>{r.notes}</TableCell>

                                                                        <TableCell align="right">{dash2(line.m3)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPriceM3 ?? r.unitPrice)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.km)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPriceKm)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.pcs)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPricePiece)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.hour)}</TableCell>
                                                                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{dash2(r.unitPriceHour)}</TableCell>
                                                                        <TableCell align="right">{dash2(line.roadTax)}</TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(line.total)}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                            {/* Subtotal */}
                                                            <TableRow sx={{ backgroundColor: '#fafafa', borderTop: '2px solid #ddd' }}>
                                                                <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>{t('consigmentBillingReport:totals', { defaultValue: 'Total' })}:</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.m3)}</TableCell>
                                                                <TableCell />
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.km)}</TableCell>
                                                                <TableCell />
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.pcs)}</TableCell>
                                                                <TableCell />
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.hour)}</TableCell>
                                                                <TableCell />
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fix2(vt.roadTax)}</TableCell>
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

                        {/* Grand Total Footer */}
                        <Box className="grand-total-box" sx={{
                            mt: 4,
                            p: 2,
                            bgcolor: isDark ? 'background.default' : '#f0f0f0',
                            borderRadius: 1,
                            border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                            breakInside: 'avoid',
                            '@media print': { border: '1px solid #000', backgroundColor: 'transparent' }
                        }}>
                            <Typography variant="h6" gutterBottom sx={{
                                fontWeight: 'bold',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '@media print': { borderBottom: '1px solid #000' }
                            }}>
                                {t('consigmentBillingReport:grandTotal', { defaultValue: 'Grand Total' })}
                            </Typography>

                            <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('consigmentBillingReport:labels.m3', { defaultValue: 'Total m³' })}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold">{fix2(grand.m3)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('consigmentBillingReport:labels.km', { defaultValue: 'Total Km' })}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold">{fix2(grand.km)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('consigmentBillingReport:labels.pcs', { defaultValue: 'Total Pcs' })}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold">{fix2(grand.pcs)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('consigmentBillingReport:labels.hrs', { defaultValue: 'Total Hrs' })}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold">{fix2(grand.hour)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('consigmentBillingReport:labels.tax', { defaultValue: 'Total Tax' })}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold">{fix2(grand.roadTax)}</Typography>
                                </Box>
                                <Box sx={{ ml: 'auto !important' }}>
                                    <Typography variant="caption" color="primary">
                                        {t('consigmentBillingReport:totalValue', { defaultValue: 'Total Value' })}
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary">
                                        {fix2(grand.total)} {t('common:units.currency', { defaultValue: '€' })}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default ConsignmentBillingReport;
// src/components/invoicing/ChipInvoicingReport.tsx
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, Stack, Container, Divider, alpha
} from '@mui/material';
import dayjs from 'dayjs';
import { useTranslation } from '@/i18n/useTranslation';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Props = { rows: any[] };

const f2 = (v: any) => Number(v ?? 0).toFixed(2);
const dash = (v: any) => Number(v ?? 0) === 0 ? '-' : Number(v).toFixed(2);

const ChipInvoicingReport: React.FC<Props> = ({ rows }) => {
    // 🚀 ChipInvoicing namespace එක භාවිතා කිරීම
    const { t } = useTranslation(['chipInvoicing', 'common']);

    const groups = useMemo(() => {
        const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const byCust = new Map<string, Map<string, any[]>>();
        sorted.forEach(r => {
            const cust = r.customer || t('chipInvoicing:placeholders.customerId');
            const veh = r.vehicle || t('chipInvoicing:placeholders.vehicle');
            if (!byCust.has(cust)) byCust.set(cust, new Map());
            const vm = byCust.get(cust)!;
            if (!vm.has(veh)) vm.set(veh, []);
            vm.get(veh)!.push(r);
        });
        return byCust;
    }, [rows, t]);

    const grand = useMemo(() => {
        return rows.reduce((acc, r) => ({
            m3: acc.m3 + Number(r.actualM3 || 0),
            ton: acc.ton + Number(r.actualTon || 0),
            hr: acc.hr + Number(r.actualHr || 0),
            total: acc.total + Number(r.total || 0)
        }), { m3: 0, ton: 0, hr: 0, total: 0 });
    }, [rows]);

    const handlePrint = () => window.print();

    const handleDownloadPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18); doc.setTextColor(163, 143, 109);
        doc.text(t('chipInvoicing:report.title'), 14, 20);

        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`${t('chipInvoicing:report.generated') || 'Generated'}: ${dayjs().format('DD.MM.YYYY HH:mm')}`, pageWidth - 14, 20, { align: 'right' });

        let y = 30;
        Array.from(groups.entries()).forEach(([customer, vehicles]) => {
            doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(`${t('chipInvoicing:filterSections.customer').toUpperCase()}: ${customer}`, 14, y);
            y += 5;

            Array.from(vehicles.entries()).forEach(([vehicle, list]) => {
                autoTable(doc, {
                    startY: y,
                    head: [[
                        t('chipInvoicing:table.headers.date'),
                        t('chipInvoicing:table.headers.id'),
                        t('chipInvoicing:table.headers.titleName'),
                        t('chipInvoicing:table.headers.actualM3'),
                        t('chipInvoicing:table.headers.actualTon'),
                        t('chipInvoicing:table.headers.actualHr'),
                        t('chipInvoicing:table.headers.unitPriceM3'),
                        t('chipInvoicing:table.headers.unitPriceTon'),
                        t('chipInvoicing:table.headers.unitPriceHr'),
                        t('chipInvoicing:table.headers.total')
                    ]],
                    body: list.map(r => [
                        dayjs(r.date).format('DD.MM.YYYY'), r.loadId, r.titleName,
                        dash(r.actualM3), dash(r.actualTon), dash(r.actualHr),
                        dash(r.unitPriceM3), dash(r.unitPriceTon), dash(r.unitPriceHr),
                        f2(r.total) + " €"
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 7 },
                    headStyles: { fillColor: [163, 143, 109] }
                });
                y = (doc as any).lastAutoTable.finalY + 10;
            });
        });
        doc.save(`Chip_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <Box className="printable-area" sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
            <style jsx global>{` @media print { .no-print { display: none !important; } body { background: white !important; } } `}</style>

            <Container maxWidth="xl">
                <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                        <Box> <Image src="/images/Bitwell-logo.png" alt="Logo" width={180} height={45} /> </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#a38f6d' }}>
                                {t('chipInvoicing:report.title')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('chipInvoicing:report.generated')}: {dayjs().format('DD.MM.YYYY HH:mm')}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 3 }} className="no-print">
                        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>{t('chipInvoicing:actions.report')}</Button>
                        <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf} color="error">PDF</Button>
                        <Button variant="outlined" startIcon={<GridOnIcon />} color="success">EXCEL</Button>
                    </Stack>

                    <Divider sx={{ mb: 4 }} />

                    {Array.from(groups.entries()).map(([customer, vehicles]) => (
                        <Box key={customer} sx={{ mb: 6 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#a38f6d', mb: 2 }}>
                                {t('chipInvoicing:filterSections.customer').toUpperCase()}: {customer}
                            </Typography>

                            {Array.from(vehicles.entries()).map(([vehicle, list]) => (
                                <Box key={vehicle} sx={{ mb: 4, ml: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                        {t('chipInvoicing:placeholders.vehicle').toUpperCase()}: {vehicle}
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: alpha('#a38f6d', 0.1) }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:table.headers.date')}</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:table.headers.id')}</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:table.headers.titleName')}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>m³</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ton</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hrs</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>m³ Pr</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Ton Pr</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Hr Pr</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: alpha('#a38f6d', 0.1) }}>{t('chipInvoicing:table.headers.total')}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {list.map((r) => (
                                                    <TableRow key={r.loadId}>
                                                        <TableCell>{dayjs(r.date).format('DD.MM.YYYY')}</TableCell>
                                                        <TableCell>{r.loadId}</TableCell>
                                                        <TableCell>{r.titleName}</TableCell>
                                                        <TableCell align="right">{dash(r.actualM3)}</TableCell>
                                                        <TableCell align="right">{dash(r.actualTon)}</TableCell>
                                                        <TableCell align="right">{dash(r.actualHr)}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{dash(r.unitPriceM3)}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{dash(r.unitPriceTon)}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{dash(r.unitPriceHr)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{f2(r.total)} €</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            ))}
                        </Box>
                    ))}

                    <Box sx={{ mt: 5, p: 3, bgcolor: alpha('#a38f6d', 0.05), borderRadius: 2, border: '1px solid #a38f6d' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('chipInvoicing:dialogs.editChipLoad.headers.loadInfo').toUpperCase()}</Typography>
                        <Stack direction="row" spacing={6}>
                            <Box><Typography variant="caption">{t('chipInvoicing:table.headers.actualM3')}</Typography><Typography variant="h6" fontWeight="bold">{f2(grand.m3)}</Typography></Box>
                            <Box><Typography variant="caption">{t('chipInvoicing:table.headers.actualTon')}</Typography><Typography variant="h6" fontWeight="bold">{f2(grand.ton)}</Typography></Box>
                            <Box><Typography variant="caption">{t('chipInvoicing:table.headers.actualHr')}</Typography><Typography variant="h6" fontWeight="bold">{f2(grand.hr)}</Typography></Box>
                            <Box sx={{ ml: 'auto !important', textAlign: 'right' }}>
                                <Typography variant="caption" color="primary" fontWeight="bold">{t('chipInvoicing:table.headers.total').toUpperCase()}</Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a38f6d' }}>{f2(grand.total)} €</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ChipInvoicingReport;
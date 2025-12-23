//frontend/src/app/(main)/reports/load-reports/page.tsx
// frontend/src/app/(main)/reports/load-reports/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
    Box, Paper, Typography, Button, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Container, CircularProgress, Alert, Divider,
    TableFooter
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next'; 
import dayjs from 'dayjs'; // Import dayjs for date formatting

import { ILoadListItem } from '@/types';
import i18n from '@/i18n/i18n';

export default function LoadReportPage() {
    const { t } = useTranslation(['loadReport', 'common']);
    const [reportData, setReportData] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const dataString = localStorage.getItem('reportData');
            if (dataString) {
                const rawData = JSON.parse(dataString) as ILoadListItem[];
                const processedData = rawData.map(item => ({
                    ...item,
                    m3: item.m3 ? Number(item.m3) : 0,
                    km: item.km ? Number(item.km) : 0,
                    tunnit: item.tunnit ? Number(item.tunnit) : 0,
                    kpl: item.kpl ? Number(item.kpl) : 0,
                }));
                setReportData(processedData);
            } else {
                setError(t('errors.noData'));
            }
        } catch (e) {
            setError(t('errors.loadFail'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const totalCubicMeters = useMemo(() => {
        const total = reportData.reduce((sum, item) => sum + (item.m3 || 0), 0);
        return total.toFixed(2);
    }, [reportData]);

    // Helper function to format date (Removes time)
    const formatDate = (dateString: string | Date | undefined | null) => {
        if (!dateString) return '-';
        return dayjs(dateString).format('DD.MM.YYYY');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const printDateTime = new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date());
    
        const img = new window.Image();
        img.src = '/images/hkk-logo.png';
        img.onload = () => {
            doc.addImage(img, 'PNG', 14, 10, 40, 15);
            doc.setFontSize(20);
            doc.text(t('title'), 14, 35);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`${t('generatedOn')} ${printDateTime}`, 14, 41);

            const tableColumn = [
                t('table.headers.date'), t('table.headers.driver'), t('table.headers.vehicle'),
                t('table.headers.customer'), t('table.headers.puulaani'), t('table.headers.cubic'),
                t('table.headers.freight')
            ];
            const tableRows: (string | number)[][] = [];

            reportData.forEach(item => {
                const rowData = [
                    formatDate(item.pvm), // FIX: Format date here
                    item.kuljettajanNimi || '-', 
                    item.rekNro || '-',
                    item.asiakkaanNimi, 
                    item.puulaaniName || item.lahto || '-',
                    item.m3?.toFixed(2) || '0.00', 
                    item.km?.toFixed(2) || '0.00'
                ];
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                foot: [
                    ['', '', '', '', t('table.footer.total'), totalCubicMeters, '']
                ],
                startY: 45,
                headStyles: { fontStyle: 'bold' },
                footStyles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] },
                didDrawPage: (data) => {
                    const totalPages = (doc.internal as any).getNumberOfPages();
                    doc.setFontSize(8);
                    doc.text(
                        t('pageCounter', { page: data.pageNumber, total: totalPages }), 
                        data.settings.margin.left, 
                        doc.internal.pageSize.height - 10
                    );
                }
            });

            doc.save('load-report.pdf');
        };
        img.onerror = () => {
            alert(t('errors.logoFail'));
        };
    };


    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(t('excelSheetName') || 'Report');

        worksheet.columns = [
            { header: t('table.headers.date'), key: 'date', width: 15 },
            { header: t('table.headers.driver'), key: 'driver', width: 20 },
            { header: t('table.headers.vehicle'), key: 'vehicle', width: 15 },
            { header: t('table.headers.customer'), key: 'customer', width: 20 },
            { header: t('table.headers.puulaani'), key: 'puulaani', width: 20 },
            { header: t('table.headers.cubic'), key: 'cubic', width: 15 },
            { header: t('table.headers.freight'), key: 'freight', width: 15 },
            { header: t('table.headers.additionalInfo'), key: 'info', width: 25 },
        ];

        worksheet.getRow(1).font = { bold: true };

        reportData.forEach((item) => {
            worksheet.addRow({
                date: formatDate(item.pvm), // FIX: Format date here
                driver: item.kuljettajanNimi || '-',
                vehicle: item.rekNro || '-',
                customer: item.asiakkaanNimi,
                puulaani: item.puulaaniName || item.lahto || '-',
                cubic: item.m3 || 0,
                freight: item.km || 0,
                info: item.lisatiedot || '-'
            });
        });

        worksheet.addRow({});
        
        const totalRow = worksheet.addRow({
            puulaani: t('table.footer.total'),
            cubic: parseFloat(totalCubicMeters)
        });
        
        totalRow.font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'load-report.xlsx');
    };

    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>; }
    if (error) { return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>; }

    const printDateTime = new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date());

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Reset margins and paddings for body and html */
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                    }

                    /* Hide non-printable elements */
                    body * {
                        visibility: hidden;
                    }
                    .no-print {
                        display: none !important;
                    }

                    /* Make printable area visible */
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }

                    /* Styles for the printable container */
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 10mm; /* Reduced padding from 20px/default */
                        box-sizing: border-box;
                    }

                    /* Override MUI container styles */
                    .printable-area .MuiContainer-root {
                        max-width: 100% !important; /* Force full width */
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    /* Override MUI Paper styles */
                    .printable-area .MuiPaper-root {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important; /* Remove internal padding */
                        background-color: transparent !important;
                        width: 100% !important;
                    }

                    /* Table Styles */
                    .printable-area .MuiTableContainer-root {
                        overflow: visible !important;
                        width: 100% !important;
                    }
                    .printable-area .MuiTable-root {
                        width: 100% !important;
                        table-layout: fixed; /* Optional: distribute width more evenly */
                    }
                    .printable-area .MuiTableCell-root {
                        font-size: 9pt; /* Slightly smaller font */
                        padding: 4px 6px; /* Reduced padding */
                        white-space: normal;
                        word-break: break-word;
                        border-bottom: 1px solid #ddd; /* Ensure borders are visible */
                    }
                    
                    /* Header Styles */
                    .printable-area h1, .printable-area h4 {
                         font-size: 16pt !important;
                         margin-bottom: 5px !important;
                    }
                    
                    /* Page Settings */
                    @page {
                        size: A4 landscape; /* Recommend Landscape for wide tables */
                        margin: 10mm; /* Reduced page margins */
                        
                        @bottom-right {
                            content: "Page " counter(page) " of " counter(pages);
                            font-size: 8pt;
                            color: #888;
                        }
                    }
                    .printable-area {
                        counter-reset: page;
                    }
                }
            `}</style>

            <Box className="printable-area" sx={{ backgroundColor: 'background.default', minHeight: '100vh', p: { xs: 1, sm: 2, md: 4 } }}>
                <Container maxWidth="lg">
                    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                        <Box sx={{ mb: 2 }}>
                             <Image src="/images/hkk-logo.png" alt="Company Logo" width={200} height={40} priority />
                        </Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                                <Typography variant="h5" component="h1">{t('title')}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('generatedOn')} {printDateTime}
                                    </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} className="no-print">
                                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>{t('buttons.print')}</Button>
                                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>{t('buttons.pdf')}</Button>
                                <Button variant="outlined" startIcon={<GridOnIcon />} onClick={handleDownloadExcel}>{t('buttons.excel')}</Button>
                            </Stack>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.date')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.driver')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.vehicle')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.customer')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.puulaani')}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('table.headers.cubic')}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('table.headers.freight')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.additionalInfo')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.map((row) => (
                                        <TableRow key={row.kuormaId}>
                                            <TableCell>{formatDate(row.pvm)}</TableCell> {/* FIX: Format date here */}
                                            <TableCell>{row.kuljettajanNimi}</TableCell>
                                            <TableCell>{row.rekNro}</TableCell>
                                            <TableCell>{row.asiakkaanNimi}</TableCell>
                                            <TableCell>{row.puulaaniName || row.lahto}</TableCell>
                                            <TableCell align="right">{row.m3?.toFixed(2) ?? '0.00'}</TableCell>
                                            <TableCell align="right">{row.km?.toFixed(2) ?? '0.00'}</TableCell>
                                            <TableCell>{row.lisatiedot}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow sx={{ backgroundColor: '#eeeeee' }}>
                                        <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold', border: 0 }}>
                                            {t('table.footer.total')}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', border: 0 }}>
                                            {totalCubicMeters}
                                        </TableCell>
                                        <TableCell colSpan={2} sx={{ border: 0 }} />
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Container>
            </Box>
        </>
    );
}
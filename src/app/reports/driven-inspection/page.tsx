// frontend/src/app/reports/driven-inspection/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Button, Alert, CircularProgress } from '@mui/material';
import { ILoadListItem } from '@/types';
import dayjs from 'dayjs';

const ReportLayout = ({ reportData }: { reportData: ILoadListItem[] }) => {
    if (!reportData || reportData.length === 0) {
        return <Typography>No data available for the report.</Typography>;
    }

    const startDate = dayjs(reportData[0]?.pvm, "DD.MM.YYYY").format('DD.MM.YYYY');
    const endDate = dayjs(reportData[reportData.length - 1]?.pvm, "DD.MM.YYYY").format('DD.MM.YYYY');

    const totals = reportData.reduce((acc, row) => {
        acc.m3 += Number(row.m3) || 0;
        acc.km += Number(row.km) || 0;
        acc.tunnit += Number(row.tunnit) || 0;
        acc.kpl += Number(row.kpl) || 0;
        return acc;
    }, { m3: 0, km: 0, tunnit: 0, kpl: 0 });

    return (
        <Box sx={{ p: 4, fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, '@media print': { display: 'flex' } }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>HKK KULJETUS</Typography>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>AJETUT/TARKASTUS RAPORTTI</Typography>
                    <Typography variant="body1">Ajanjakso: {startDate} - {endDate}</Typography>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ccc' }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#e0e0e0', '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '0.75rem' } }}>
                        <TableRow>
                            <TableCell>Pvm</TableCell><TableCell>AjomääräysNro</TableCell><TableCell>VastaanottoNro</TableCell>
                            <TableCell>Puulaani</TableCell><TableCell>Puutavara</TableCell><TableCell>Asiakas</TableCell>
                            <TableCell>AutoNro</TableCell><TableCell>Reitti</TableCell><TableCell>Lisätiedot</TableCell>
                            <TableCell align="right">m3</TableCell><TableCell align="right">Km</TableCell>
                            <TableCell align="right">Tunnit</TableCell><TableCell align="right">Kpl</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reportData.map((row) => (
                            <TableRow key={row.kuormaId} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                <TableCell>{row.pvm}</TableCell><TableCell>{row.ajomaaraysNro}</TableCell>
                                <TableCell>{row.vastaanottoNro}</TableCell><TableCell>{row.puulaaniNimi}</TableCell>
                                <TableCell>{row.timberType}</TableCell><TableCell>{row.asiakkaanNimi}</TableCell>
                                <TableCell>{row.rekNro}</TableCell><TableCell>{row.reitti}</TableCell>
                                <TableCell>{row.lisatiedot}</TableCell>
                                <TableCell align="right">{Number(row.m3).toFixed(2)}</TableCell><TableCell align="right">{Number(row.km).toFixed(2)}</TableCell>
                                <TableCell align="right">{Number(row.tunnit).toFixed(2)}</TableCell><TableCell align="right">{Number(row.kpl).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: '#e0e0e0', '& .MuiTableCell-root': { fontWeight: 'bold' } }}>
                            <TableCell colSpan={9} align="right">Yhteensä</TableCell>
                            <TableCell align="right">{totals.m3.toFixed(2)}</TableCell><TableCell align="right">{totals.km.toFixed(2)}</TableCell>
                            <TableCell align="right">{totals.tunnit.toFixed(2)}</TableCell><TableCell align="right">{totals.kpl.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', '@media print': { display: 'flex' } }}>
                <Button variant="contained" onClick={() => window.print()} className="no-print">Print Report</Button>
                <Typography variant="caption">page 1 / 1</Typography>
            </Box>
              <style jsx global>{`
            @page {
                size: A4 landscape; /* Define paper size and orientation */
                margin: 20mm; /* Optional: Set margins for the printed page */
            }
            @media print {
                html, body {
                    width: 297mm; /* A4 landscape width */
                    height: 210mm; /* A4 landscape height */
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .no-print {
                    display: none;
                }
                .MuiPaper-root {
                    box-shadow: none !important;
                    border: 1px solid #ddd !important;
                }
                .MuiTableCell-root {
                    font-size: 8pt !important; /* Make font smaller for print */
                }
            }
        `}</style>
    </Box>
);
};

export default function DrivenInspectionReportPage() {
    const [reportData, setReportData] = useState<ILoadListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const dataString = localStorage.getItem('reportData');
            if (dataString) {
                const data = JSON.parse(dataString);
                data.sort((a: ILoadListItem, b: ILoadListItem) => new Date(a.pvm).getTime() - new Date(b.pvm).getTime());
                setReportData(data);
            } else { setError('No data found to generate the report.'); }
        } catch (e) { setError('Failed to parse report data.'); }
    }, []);

    if (error) return <Alert severity="error" sx={{m: 2}}>{error}</Alert>;
    if (!reportData) return <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box>;
    return <ReportLayout reportData={reportData} />;
}
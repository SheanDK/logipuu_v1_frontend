// frontend/src/components/invoicing/ChipInvoicingReport.tsx

'use client';
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import dayjs from 'dayjs';
import { t } from 'i18next';

const ChipInvoicingReport = ({ rows }: { rows: any[] }) => {
    const totalM3 = rows.reduce((sum, r) => sum + Number(r.actual_m3 || 0), 0);
    const totalTon = rows.reduce((sum, r) => sum + Number(r.actual_ton || 0), 0);

    return (
        <Box sx={{ p: 4, bgcolor: '#white' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
                {t('chipInvoicing:title')}
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 4 }}>
                {t('chipInvoicing:generatedOn')}: {dayjs().format('DD.MM.YYYY HH:mm')}
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ccc' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:date')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:vehicle')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:customer')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:itemName')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">{t('chipInvoicing:m3')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">{t('chipInvoicing:tons')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.load_id}>
                                <TableCell>{dayjs(row.scheduled_date).format('DD.MM.YYYY')}</TableCell>
                                <TableCell>{row.vehicleRegNo}</TableCell>
                                <TableCell>{row.customerName}</TableCell>
                                <TableCell>{row.title_name}</TableCell>
                                <TableCell align="right">{Number(row.actual_m3 || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">{Number(row.actual_ton || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {/* Summary Row */}
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>{t('chipInvoicing:totals')}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalM3.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalTon.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">{t('chipInvoicing:authorizedBy')}</Typography>
                <Typography variant="caption">{t('chipInvoicing:plannerSignature')}</Typography>
            </Box>
        </Box>
    );
};

export default ChipInvoicingReport;
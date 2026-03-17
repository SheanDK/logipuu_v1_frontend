// frontend/src/components/loads/ViewConsignmentModal.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Box, Divider, CircularProgress, alpha, useTheme } from '@mui/material';
import { getTripById } from '@/services/loadService';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface ViewConsignmentModalProps {
    open: boolean;
    onClose: () => void;
    loadId: number | null;
}

const STATUS_TKEY: Record<string, string> = {
    'Assigned': 'assigned',
    'In Progress': 'in_progress',
    'At Origin': 'at_origin',
    'En Route to Destination': 'en_route_to_destination',
    'At Destination': 'at_destination',
    'Completed': 'completed',
    'Paused': 'paused',
    'Draft': 'draft',
};

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'Assigned': 'info',
    'In Progress': 'primary',
    'At Origin': 'warning',
    'En Route to Destination': 'info',
    'At Destination': 'warning',
    'Completed': 'success',
    'Paused': 'warning',
    'Draft': 'default',
};


export default function ViewConsignmentModal({ open, onClose, loadId }: ViewConsignmentModalProps) {
    const [loadData, setLoadData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation(['loadsPage', 'common']); // Load translations
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    useEffect(() => {
        if (open && loadId) {
            setLoading(true);
            getTripById(loadId)
                .then(data => {
                    setLoadData(data);
                })
                .catch(err => {
                    console.error("Failed to load consignment:", err);
                })
                .finally(() => setLoading(false));
        } else {
            setLoadData(null);
        }
    }, [open, loadId]);

    const translateStatus = (status?: string) => {
        if (!status) return '-';
        const key = STATUS_TKEY[status];
        // Ensure translations are loaded (using 'status' prefix from loadsPage.json)
        return key ? t(`status.${key}`, { defaultValue: status }) : status;
    };

    if (!open) return null;

    // Helper to safely format numbers
    const fmtNum = (val: any) => Number(val || 0).toFixed(2);
    const fmtInt = (val: any) => Number(val || 0);

    // Calculate totals from waybills
    const totalM3 = loadData?.rahtikirjat?.reduce((s: number, i: any) => s + (Number(i.m3) || 0), 0) || 0;
    const totalKm = loadData?.rahtikirjat?.reduce((s: number, i: any) => s + (Number(i.km) || 0), 0) || 0;
    const totalKpl = loadData?.rahtikirjat?.reduce((s: number, i: any) => s + (Number(i.kpl) || 0), 0) || 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {t('modal.consignmentDetails', { defaultValue: 'Consignment Details' })} #{loadData?.kuormaId || '...'}
                    </Typography>
                    {loadData?.status && (
                        <Chip
                            label={translateStatus(loadData.status)}
                            color={STATUS_COLOR[loadData.status] || 'default'}
                            size="small"
                        />
                    )}
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : loadData ? (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* Header Info */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{t('columns.date')}</Typography>
                                <Typography variant="body1" fontWeight="500">
                                    {loadData.pvm ? dayjs(loadData.pvm).format('DD.MM.YYYY') : '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{t('columns.vehicleNo')}</Typography>
                                <Typography variant="body1" fontWeight="500">{loadData.rekNro || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{t('columns.driver')}</Typography>
                                <Typography variant="body1" fontWeight="500">{loadData.kuljettajanNimi || '-'}</Typography>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Waybills Table */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                {t('modal.waybills', { defaultValue: 'Waybills' })} ({loadData.rahtikirjat?.length || 0})
                            </Typography>
                            <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.customer')}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{t('modal.waybillNo', { defaultValue: 'Waybill #' })}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{t('columns.route')}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('columns.cubicMetres')}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('columns.freightKm')}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('columns.pcs')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(!loadData.rahtikirjat || loadData.rahtikirjat.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                    {t('messages.noWaybills', { defaultValue: 'No waybills found.' })}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            loadData.rahtikirjat.map((wb: any, idx: number) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell>{wb.customerName || '-'}</TableCell>
                                                    <TableCell>{wb.rahtikirjanNro || '-'}</TableCell>
                                                    <TableCell>{wb.reitti || '-'}</TableCell>
                                                    <TableCell align="right">{fmtNum(wb.m3)}</TableCell>
                                                    <TableCell align="right">{fmtNum(wb.km)}</TableCell>
                                                    <TableCell align="right">{fmtInt(wb.kpl)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        {/* Totals Row */}
                                        <TableRow sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#f0f7ff' }}>
                                            <TableCell colSpan={3} align="right">{t('modal.total', { defaultValue: 'Total:' })}</TableCell>
                                            <TableCell align="right">{fmtNum(totalM3)}</TableCell>
                                            <TableCell align="right">{fmtNum(totalKm)}</TableCell>
                                            <TableCell align="right">{fmtInt(totalKpl)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Global Notes */}
                        {loadData.lisatiedot && (
                            <Box sx={{ p: 2, bgcolor: isDarkMode ? alpha('#fff', 0.03) : '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #a38f6d' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>{t('columns.additionalInfo')}</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{loadData.lisatiedot}</Typography>
                            </Box>
                        )}
                    </Stack>
                ) : (
                    <Typography color="error">{t('errors.loadFailed', { defaultValue: 'Failed to load data.' })}</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#f8f9fa' }}>
                <Button onClick={onClose} variant="contained" color="primary">{t('common:buttons.close', { defaultValue: 'Close' })}</Button>
            </DialogActions>
        </Dialog>
    );
}
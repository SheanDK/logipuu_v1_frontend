// frontend/src/components/loads/ChipTransportDetailsModal.tsx
'use client';

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, useTheme, alpha, Divider
} from '@mui/material';
import dayjs from 'dayjs';
import { useTranslation } from '@/i18n/useTranslation';

const ChipTransportDetailsModal = ({ open, onClose, loadData }: any) => {
    const { t } = useTranslation(['chip-management']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';


    if (!loadData) return null;

    const getChipStatusColor = (status: string) => {
        switch (status) {
            case 'NOT_SENT': return { label: 'Planned', color: '#e53935' };
            case 'DISPATCHED': return { label: 'Sent', color: '#fbc02d' };
            case 'LOADED': return { label: 'Loaded', color: '#1976d2' };
            case 'UNLOADED': return { label: 'Unloaded', color: '#00bcd4' };
            case 'COMPLETED': case 'SENT': return { label: 'Done', color: '#43a047' };
            default: return { label: status, color: '#9e9e9e' };
        }
    };

    const statusInfo = getChipStatusColor(loadData.status);

    const InfoBox = ({ label, value }: { label: string, value: string }) => (
        <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {value || '-'}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle
                component="div"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#fdfaf5'
                }}
            >
                <Typography variant="h6" fontWeight="bold">
                    {t('chip-management:details:chipTransportDetails')} #{loadData.load_id || loadData.loadId}
                </Typography>

                <Chip
                    label={statusInfo.label}
                    sx={{
                        bgcolor: alpha(statusInfo.color, 0.1),
                        color: statusInfo.color,
                        fontWeight: 'bold',
                        border: `1px solid ${statusInfo.color}`,
                        fontSize: '10px',
                        height: '24px',
                        textTransform: 'uppercase'
                    }}
                />
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 1 }}>
                        <InfoBox label="Date" value={dayjs(loadData.pvm).format('DD.MM.YYYY')} />
                        <InfoBox label="Vehicle No" value={loadData.rekNro || loadData.vehicleRegNo} />
                        <InfoBox label="Driver" value={loadData.driverName || 'N/A'} />
                    </Stack>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#a38f6d', fontSize: '11px', textTransform: 'uppercase' }}>
                            {t('chip-management:details:loadDetails')}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('chip-management:details:customer')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('chip-management:details:itemName')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }} align="right">{t('chip-management:details:m3')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }} align="right">{t('chip-management:details:tons')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }} align="right">{t('chip-management:details:pcs')}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }} align="right">{t('chip-management:details:km')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>{loadData.customerName || '-'}</TableCell>
                                        <TableCell sx={{ fontSize: '12px' }}>{loadData.titleName || '-'}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '12px' }}>{Number(loadData.actualM3 || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '12px' }}>{Number(loadData.actualTon || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '12px' }}>{loadData.actualPcs || 0}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '12px' }}>{loadData.actualKm || 0}</TableCell>
                                    </TableRow>
                                    {/* Total Row */}
                                    <TableRow sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#f0f7ff' }}>
                                        <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('chip-management:details:total')}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px' }}>{Number(loadData.actualM3 || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px' }}>{Number(loadData.actualTon || 0).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px' }}>{loadData.actualPcs || 0}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px' }}>{loadData.actualKm || 0}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Driver Notes */}
                    <Box sx={{ p: 2, bgcolor: isDarkMode ? alpha('#fff', 0.03) : '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #a38f6d' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: '#a38f6d' }}>{t('chip-management:details:driverNotes')}</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {loadData.actualDetails || t('chip-management:details:noDriverNotes')}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#f8f9fa' }}>
                <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, minWidth: '100px', borderRadius: '20px', fontWeight: 'bold' }}>
                    {t('chip-management:details:close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChipTransportDetailsModal;
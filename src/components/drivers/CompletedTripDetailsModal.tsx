// frontend/src/components/drivers/CompletedTripDetailsModal.tsx
'use client';

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, IconButton, Box, Stack, Divider, CircularProgress,
    Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

interface Waybill {
    asiakasId?: string;
    customerName?: string;
    rahtikirjanNro: string;
    reitti: string;
    m3: number;
    km: number;
    kpl: number;
}

interface CompletedTripDetails {
    kuormaId: number;
    pvm: string;
    asiakkaanNimi: string;
    lahto: string;
    kohde: string;
    rekNro: string;
    kuljettajanNimi: string;
    tyyppi: string | number;
    m3: number;
    km: number;
    lisatiedot: string;
    status?: string;
    rahtikirjat?: Waybill[];
}

interface CompletedTripDetailsModalProps {
    open: boolean;
    onCloseAction: () => void;
    data?: CompletedTripDetails | null;
    tripDetails?: CompletedTripDetails | null;
    isLoading?: boolean;
}

export default function CompletedTripDetailsModal({ open, onCloseAction, data, tripDetails, isLoading }: CompletedTripDetailsModalProps) {
    const { t } = useTranslation(['completedTripDetails', 'common', 'loadsPage']);

    const details = data || tripDetails;
    const fmtNum = (val: any) => Number(val || 0).toFixed(2);
    const fmtInt = (val: any) => Number(val || 0);

    const isConsignment = details?.tyyppi === 1 || details?.tyyppi === 'Consignment';

    // Calculate totals
    const totalM3 = isConsignment
        ? (details?.rahtikirjat?.reduce((s, i) => s + (Number(i.m3) || 0), 0) || 0)
        : (details?.m3 || 0);

    const totalKm = details?.km || details?.rahtikirjat?.reduce((s, i) => s + (Number(i.km) || 0), 0) || 0;
    const totalKpl = details?.rahtikirjat?.reduce((s, i) => s + (Number(i.kpl) || 0), 0) || 0;

    const translateStatus = (status?: string) => {
        if (!status) return '-';
        return t(`loadsPage:status.${status.toLowerCase()}`, { defaultValue: status });
    };

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth={isConsignment ? "sm" : "sm"}>
            <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', pb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {isConsignment
                            ? `${t('titleConsignment', { defaultValue: 'Consignment Details' })} #${details?.kuormaId || ''}`
                            : `${t('titleTimber', { defaultValue: 'Timber Load Details' })} #${details?.kuormaId || ''}`
                        }
                    </Typography>
                    {details?.status && (
                        <Chip
                            label={translateStatus(details.status)}
                            color={details.status === 'Completed' ? 'success' : 'default'}
                            size="small"
                        />
                    )}
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : !details ? (
                    <Typography color="error" align="center">{t('error', { defaultValue: 'No details available.' })}</Typography>
                ) : (
                    <Stack spacing={3} sx={{ mt: 1 }}>

                        {/* ================= HEADER SECTION ================= */}
                        {isConsignment ? (
                            // CONSIGNMENT HEADER: Date | Vehicle | Driver
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.date')}</Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {details.pvm ? dayjs(details.pvm).format('DD.MM.YYYY') : '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('common:vehicle', { defaultValue: 'Vehicle No' })}</Typography>
                                    <Typography variant="body1" fontWeight="500">{details.rekNro || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('common:driver', { defaultValue: 'Driver' })}</Typography>
                                    <Typography variant="body1" fontWeight="500">{details.kuljettajanNimi || '-'}</Typography>
                                </Box>
                            </Box>
                        ) : (
                            // TIMBER HEADER: Date | Type | Customer
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.date')}</Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {details.pvm ? dayjs(details.pvm).format('DD.MM.YYYY') : '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.type')}</Typography>
                                    <Box mt={0.5}><Chip label={details.tyyppi} size="small" variant="outlined" /></Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.customer')}</Typography>
                                    <Typography variant="body1" fontWeight="500" noWrap>{details.asiakkaanNimi || '-'}</Typography>
                                </Box>
                            </Box>
                        )}

                        <Divider />

                        {/* ================= DETAILS SECTION ================= */}
                        {isConsignment ? (
                            // CONSIGNMENT VIEW (TABLE)
                            <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    {t('labels.waybills', { defaultValue: 'Waybills' })} ({details.rahtikirjat?.length || 0})
                                </Typography>
                                <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('labels.customer')}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('labels.waybillNo', { defaultValue: 'Waybill #' })}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{t('labels.route', { defaultValue: 'Route' })}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('labels.cubicMetres', { defaultValue: 'Volume (m³)' })}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('labels.freightKm', { defaultValue: 'Distance (km)' })}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('labels.pcs', { defaultValue: 'Pcs' })}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(!details.rahtikirjat || details.rahtikirjat.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                        {t('messages.noWaybills', { defaultValue: 'No waybills found.' })}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                details.rahtikirjat.map((wb, idx) => (
                                                    <TableRow key={idx} hover>
                                                        <TableCell>{wb.customerName || details.asiakkaanNimi || '-'}</TableCell>
                                                        <TableCell>{wb.rahtikirjanNro || '-'}</TableCell>
                                                        <TableCell>{wb.reitti || '-'}</TableCell>
                                                        <TableCell align="right">{fmtNum(wb.m3)}</TableCell>
                                                        <TableCell align="right">{fmtNum(wb.km)}</TableCell>
                                                        <TableCell align="right">{fmtInt(wb.kpl)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                            {/* Totals Row - to show Volume and Pcs totals only */}
                                            <TableRow sx={{ bgcolor: '#e3f2fd', '& td': { fontWeight: 'bold' } }}>
                                                <TableCell colSpan={3} align="right">
                                                    {t('labels.total', { defaultValue: 'Total:' })}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {fmtNum(totalM3)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    -
                                                </TableCell>
                                                <TableCell align="right">
                                                    {fmtInt(totalKpl)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        ) : (
                            // TIMBER VIEW (SUMMARY CARDS)
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.origin')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{details.lahto || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.destination')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{details.kohde || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.volume')} </Typography>
                                    <Typography variant="body2" fontWeight="bold">{fmtNum(details.m3)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.distance')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{fmtNum(details.km)}</Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Notes Section */}
                        {details.lisatiedot && (
                            <Box sx={{ bgcolor: '#fffde7', p: 2, borderRadius: 1, border: '1px solid #fff9c4' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('labels.notes')}</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{details.lisatiedot}</Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onCloseAction} variant="contained" color="primary">
                    {t('common:buttons.close', { defaultValue: 'Close' })}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
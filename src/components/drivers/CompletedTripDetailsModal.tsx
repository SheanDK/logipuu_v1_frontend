// frontend/src/components/drivers/CompletedTripDetailsModal.tsx
'use client';

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, IconButton, Box, Stack, Divider, CircularProgress,
    Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, alpha, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

interface CompletedTripDetailsModalProps {
    open: boolean;
    onCloseAction: () => void;
    data?: any | null;
    isLoading?: boolean;
}

export default function CompletedTripDetailsModal({ open, onCloseAction, data, isLoading }: CompletedTripDetailsModalProps) {
    const { t } = useTranslation(['completedTrips', 'completedTripDetails', 'common', 'loadsPage', 'chipDriver']);

    if (!data && !isLoading) return null;

    const fmtNum = (val: any) => Number(val || 0).toFixed(2);
    const fmtInt = (val: any) => Math.floor(Number(val || 0));

    // --- 🚀 DATA IDENTIFICATION ---
    const kuormaId = data?.kuormaId || data?.load_id || data?.id;
    const isConsignment = data?.tyyppi === 'Consignment' || Number(data?.tyyppi) === 1;
    const isChip = data?.actualM3 !== undefined || data?.actual_m3 !== undefined;
    const isTimber = !isConsignment && !isChip;


    // --- 🧮 TOTALS FOR CONSIGNMENT ---
    const totalM3 = data?.rahtikirjat?.reduce((s: number, i: any) => s + (Number(i.m3) || 0), 0) || 0;
    const totalKpl = data?.rahtikirjat?.reduce((s: number, i: any) => s + (Number(i.kpl) || 0), 0) || 0;

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
            {/* --- DIALOG TITLE --- */}
            <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                        {isConsignment ? t('completedTrips:consignment') : isChip ? t('completedTrips:chipTransport') : t('completedTrips:timberLoad')}
                        {` #${kuormaId || ''}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={(data?.status?.toLowerCase() === 'done' ? t('completedTrips:done') : t('completedTrips:done')).toUpperCase()}
                            size="small"
                            color={data?.status?.toLowerCase() === 'done' ? 'info' : 'success'}
                            sx={{ fontWeight: 'bold' }}
                        />
                        {isChip && <IconButton onClick={onCloseAction} size="small"><CloseIcon /></IconButton>}
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ py: 2 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                ) : (
                    <Stack spacing={2.5}>

                        {/* --- HEADER SECTION (SS1 & SS2 Style) --- */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: 2, p: 2,
                            bgcolor: alpha('#f5f5f5', 0.5),
                            borderRadius: 2
                        }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('completedTrips:date')}</Typography>
                                <Typography variant="body2" fontWeight="500">
                                    {dayjs(data?.pvm || data?.scheduled_date).format(t('completedTrips:dateFormat'))}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">{isTimber ? t('completedTrips:type') : isConsignment ? t('completedTrips:vehicleNo') : t('completedTrips:vehicle')}</Typography>
                                {isTimber ? (
                                    <Box mt={0.5}><Chip label={t('completedTrips:timberLoad')} size="small" variant="outlined" sx={{ height: 20, fontSize: '10px' }} /></Box>
                                ) : (
                                    <Typography variant="body2" fontWeight="500">{data?.rekNro || data?.vehicle_reg || data?.vehicle_number || '-'}</Typography>
                                )}
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">{isConsignment ? t('completedTrips:driver') : t('completedTrips:customer')}</Typography>
                                <Typography variant="body2" fontWeight="500" noWrap>
                                    {isConsignment ? data?.kuljettajanNimi : (data?.asiakkaanNimi || data?.titleName || data?.title_name || '-')}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', borderColor: '#a38f6d' }} />

                        {/* --- CONTENT SECTION --- */}

                        {isConsignment ? (
                            /* 📦 CONSIGNMENT VIEW*/
                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight="bold">{t('completedTrips:waybills')} ({data?.rahtikirjat?.length || 0})</Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('completedTrips:customer')}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('completedTrips:waybill')}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('completedTrips:route')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('completedTrips:volume')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('completedTrips:distance')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>{t('completedTrips:pcs')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data?.rahtikirjat?.map((wb: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell sx={{ fontSize: '11px' }}>{wb.customerName || data?.asiakkaanNimi || '-'}</TableCell>
                                                    <TableCell sx={{ fontSize: '11px' }}>{wb.rahtikirjanNro}</TableCell>
                                                    <TableCell sx={{ fontSize: '11px' }}>{wb.reitti}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '11px' }}>{fmtNum(wb.m3)}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '11px' }}>{fmtNum(wb.km)}</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '11px' }}>{fmtInt(wb.kpl)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ bgcolor: '#e3f2fd', '& td': { fontWeight: 'bold', fontSize: '11px' } }}>
                                                <TableCell colSpan={3} align="right">{t('completedTrips:total')}:</TableCell>
                                                <TableCell align="right">{fmtNum(totalM3)}</TableCell>
                                                <TableCell align="right">-</TableCell>
                                                <TableCell align="right">{fmtInt(totalKpl)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        ) : isTimber ? (
                            /* 🌲 TIMBER VIEW */
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">{t('completedTrips:origin')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{data?.lahto || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">{t('completedTrips:destination')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{data?.kohde || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">{t('completedTrips:volume')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{fmtNum(data?.m3)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">{t('completedTrips:distance')}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{fmtNum(data?.km)}</Typography>
                                </Box>
                            </Box>
                        ) : (
                            /* 🪵 CHIP VIEW */
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                                <MetricCard label={t('completedTrips:totalM3')} value={`${fmtNum(data?.actualM3 || data?.actual_m3)} ${t('common:units.m3')}`} />
                                <MetricCard label={t('completedTrips:weight')} value={`${fmtNum(data?.actualTon || data?.actual_ton)} ${t('common:units.ton').toUpperCase()}`} />
                                <MetricCard label={t('completedTrips:pieces')} value={fmtInt(data?.actualPcs || data?.actual_pcs)} />
                                <MetricCard label={t('completedTrips:hours')} value={`${fmtNum(data?.actualHr || data?.actual_hr)} ${t('common:units.hours')}`} />
                                <MetricCard label={t('completedTrips:distance')} value={`${fmtNum(data?.actualKm || data?.actual_km)} ${t('common:units.km')}`} />
                                <MetricCard label={t('completedTrips:waiting')} value={`${fmtNum(data?.actualWaiting || data?.actual_waiting)} ${t('common:units.hours')}`} />
                            </Box>
                        )}

                        {/* --- NOTES SECTION --- */}
                        {(data?.lisatiedot || data?.actual_details || data?.actualDetails) && (
                            <Box sx={{
                                bgcolor: isTimber ? '#fffde7' : alpha('#fbc02d', 0.05),
                                p: 2, borderRadius: 1,
                                border: isTimber ? '1px solid #fff9c4' : '1px solid #eee'
                            }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">{t('completedTrips:notes')}</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{data?.lisatiedot || data?.actual_details || data?.actualDetails}</Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onCloseAction}
                    variant="contained"
                    sx={{ bgcolor: '#8c7a5d', '&:hover': { bgcolor: '#76654a' }, textTransform: 'none', minWidth: 100 }}
                >
                    {t('common:buttons.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function MetricCard({ label, value }: { label: string, value: string | number }) {
    return (
        <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, border: '1px solid #ffe0b2' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ fontSize: '9px' }}>{label}</Typography>
            <Typography variant="body1" fontWeight="800">{value}</Typography>
        </Paper>
    );
}
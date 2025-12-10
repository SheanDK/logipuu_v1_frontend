// frontend/src/components/drivers/ActiveTripDetailsModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, Box, Stack, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// --- FIX 1: Import useTranslation ---
import { useTranslation } from 'react-i18next';

interface ActiveTripDetailsModalProps {
    open: boolean;
    onCloseAction: () => void;
    activeTrip: any;
}

const StyledTableCell = (props: any) => <TableCell sx={{ py: 1, px: 1.5 }} {...props} />;
const StyledHeaderCell = (props: any) => <StyledTableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }} {...props} />;

export default function ActiveTripDetailsModal({ open, onCloseAction, activeTrip }: ActiveTripDetailsModalProps) {
    // --- FIX 2: Initialize translation hook ---
    const { t } = useTranslation('tripDetails');

    if (!activeTrip) {
        return null;
    }

    const { ajomaaraysNro, legs = [], asiakkaanNimi, rekNro } = activeTrip;
    const firstLeg = legs[0] || {};

    // --- FIX 3: Helper function to translate status ---
    const getTranslatedStatus = (status: string) => {
        const keyMap: { [key: string]: string } = {
            'In Progress': 'inProgress',
            'Paused': 'paused',
            'Completed': 'completed',
            'Assigned': 'assigned'
        };
        const statusKey = keyMap[status];
        return statusKey ? t(`status.${statusKey}`) : status;
    };

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* --- FIX 4: Translate Title --- */}
                {t('title')}: {ajomaaraysNro || `Trip #${firstLeg.kuormaId}`}
                <IconButton onClick={onCloseAction}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Summary Section */}
                    <Box>
                        {/* --- FIX 5: Translate Summary Section --- */}
                        <Typography variant="h6" gutterBottom>{t('summary.title')}</Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" spacing={4}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">{t('summary.customer')}</Typography>
                                    <Typography variant="body1" fontWeight="medium">{asiakkaanNimi || t('na')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">{t('summary.vehicle')}</Typography>
                                    <Typography variant="body1" fontWeight="medium">{rekNro || t('na')}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                    
                    {/* Legs/Loads Section */}
                    <Box>
                        {/* --- FIX 6: Translate Table Headers --- */}
                        <Typography variant="h6" gutterBottom>{t('loads.title')}</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <StyledHeaderCell>{t('loads.from')}</StyledHeaderCell>
                                        <StyledHeaderCell>{t('loads.to')}</StyledHeaderCell>
                                        <StyledHeaderCell>{t('loads.timberType')}</StyledHeaderCell>
                                        <StyledHeaderCell align="right">{t('loads.volume')}</StyledHeaderCell> 
                                        <StyledHeaderCell align="center">{t('loads.status')}</StyledHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {legs.map((leg: any) => (
                                        <TableRow key={leg.kuormaId}>
                                            <StyledTableCell>{leg.puulaaniName || t('na')}</StyledTableCell>
                                            <StyledTableCell>{leg.purkupaikkaName || t('na')}</StyledTableCell>
                                            <StyledTableCell>{leg.puutavaralaji || t('na')}</StyledTableCell>
                                            <StyledTableCell align="right">
                                                {Number(leg.m3).toFixed(2)}
                                            </StyledTableCell>
                                            <StyledTableCell align="center">
                                                {/* --- FIX 7: Use translated status --- */}
                                                <Chip 
                                                    label={getTranslatedStatus(leg.status)} 
                                                    size="small" 
                                                    color={leg.status === 'In Progress' || leg.status === 'Paused' ? 'primary' : 'default'} 
                                                />
                                            </StyledTableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
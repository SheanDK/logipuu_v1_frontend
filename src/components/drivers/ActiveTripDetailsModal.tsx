// frontend/src/components/drivers/ActiveTripDetailsModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, Box, Stack, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ActiveTripDetailsModalProps {
    open: boolean;
    onCloseAction: () => void;
    activeTrip: any;
}

const StyledTableCell = (props: any) => <TableCell sx={{ py: 1, px: 1.5 }} {...props} />;
const StyledHeaderCell = (props: any) => <StyledTableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }} {...props} />;

export default function ActiveTripDetailsModal({ open, onCloseAction, activeTrip }: ActiveTripDetailsModalProps) {
    if (!activeTrip) {
        return null;
    }

    const { ajomaaraysNro, legs = [], asiakkaanNimi, rekNro } = activeTrip;
    const firstLeg = legs[0] || {};

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Trip Details: {ajomaaraysNro || `Trip #${firstLeg.kuormaId}`}
                <IconButton onClick={onCloseAction}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Summary Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Summary</Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" spacing={4}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Customer</Typography>
                                    <Typography variant="body1" fontWeight="medium">{asiakkaanNimi || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                                    <Typography variant="body1" fontWeight="medium">{rekNro || 'N/A'}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                    
                    {/* Legs/Loads Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Loads in this Trip</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <StyledHeaderCell>From (Puulaani)</StyledHeaderCell>
                                        <StyledHeaderCell>To (Drop-off)</StyledHeaderCell>
                                        <StyledHeaderCell>Timber Type</StyledHeaderCell>
                                        {/* --- NEW COLUMN HEADER --- */}
                                        <StyledHeaderCell align="right">Volume (m³)</StyledHeaderCell> 
                                        <StyledHeaderCell align="center">Status</StyledHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {legs.map((leg: any) => (
                                        <TableRow key={leg.kuormaId}>
                                            <StyledTableCell>{leg.puulaaniName || 'N/A'}</StyledTableCell>
                                            <StyledTableCell>{leg.purkupaikkaName || 'N/A'}</StyledTableCell>
                                            <StyledTableCell>{leg.puutavaralaji || 'N/A'}</StyledTableCell>
                                            {/* --- NEW COLUMN CELL --- */}
                                            <StyledTableCell align="center">
                                                {/* Format the number to 2 decimal places */}
                                                {Number(leg.m3).toFixed(2)}
                                            </StyledTableCell>
                                            <StyledTableCell align="center">
                                                <Chip 
                                                    label={leg.status} 
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
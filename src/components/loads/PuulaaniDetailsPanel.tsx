// frontend/src/components/loads/PuulaaniDetailsPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, Divider, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '@/contexts/AuthContext';
import { PuulaaniDetails } from '@/types';

interface PuulaaniDetailsPanelProps {
    details: PuulaaniDetails | null;
    isLoading: boolean;
    onCloseAction: () => void;
    onCreateLoadAction: (puulaaniDetails: PuulaaniDetails) => void;
    onEditLoadAction: (loadId: number) => void;
    onSaveAction: (updatedDetails: PuulaaniDetails) => Promise<void>;
}

const StyledTableCell = (props: any) => <TableCell sx={{ py: 1, px: 2, borderColor: 'divider' }} {...props} />;
const StyledHeaderCell = (props: any) => <StyledTableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover', color: 'text.secondary' }} {...props} />;

export default function PuulaaniDetailsPanel({ details, isLoading, onCloseAction, onCreateLoadAction, onEditLoadAction, onSaveAction }: PuulaaniDetailsPanelProps) {
    const { user } = useAuth();
    const [editableDetails, setEditableDetails] = useState<PuulaaniDetails | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditableDetails(details ? JSON.parse(JSON.stringify(details)) : null);
        setIsDirty(false);
    }, [details]);

    const handleCheckboxChange = (timberEntryId: number) => {
        if (!editableDetails) return;
        const updatedEntries = editableDetails.timberEntries.map(entry => 
            entry.puutavaraId === timberEntryId ? { ...entry, valmis: !entry.valmis } : entry
        );
        setEditableDetails({ ...editableDetails, timberEntries: updatedEntries });
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!editableDetails) return;
        setIsSaving(true);
        await onSaveAction(editableDetails);
        setIsSaving(false);
        setIsDirty(false);
    };

    if (isLoading || !editableDetails) {
        return (<Box sx={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1050 }}>{isLoading && <CircularProgress />}</Box>);
    }
    
    const { timberEntries, relatedLoads } = editableDetails;

    return (
        <Paper elevation={10} sx={{ position: 'absolute', bottom: { xs: 0, sm: 24 }, left: { xs: 0, sm: '50%' }, transform: { xs: 'none', sm: 'translateX(-50%)' }, zIndex: 1050, width: { xs: '100%', sm: 'auto', md: 800 }, maxHeight: { xs: '80vh', sm: '70vh' }, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(8px)', borderRadius: { xs: '16px 16px 0 0', sm: 3 }, borderTop: '1px solid rgba(0,0,0,0.12)', boxShadow: '0px -8px 40px -12px rgba(0,0,0,0.2)' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Stack sx={{ flexGrow: 1 }}>
                    <Typography variant="overline" lineHeight={1.2} color="text.secondary">PUULAANI DETAILS</Typography>
                    <Typography variant="h6" fontWeight={600}>{editableDetails.puulaani?.nimi || 'Unknown Puulaani'}</Typography>
                </Stack>
                {isDirty && (
                    <Button color="primary" variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSave} disabled={isSaving} sx={{ mr: 1 }}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
                <IconButton onClick={onCloseAction}><CloseIcon /></IconButton>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ px: 1 }}>Timber Types (Puutavaralajit)</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead><TableRow>
                                    <StyledHeaderCell>Type</StyledHeaderCell>
                                    <StyledHeaderCell align="right">Total (m³)</StyledHeaderCell>
                                    <StyledHeaderCell align="right">Hauled (m³)</StyledHeaderCell>
                                    <StyledHeaderCell align="right">Remaining (m³)</StyledHeaderCell>
                                    <StyledHeaderCell align="center">Completed</StyledHeaderCell>
                                </TableRow></TableHead>
                                <TableBody>
                                    {timberEntries.map((entry) => (
                                        <TableRow key={entry.puutavaraId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <StyledTableCell>{entry.laji}</StyledTableCell>
                                            <StyledTableCell align="right">{Number(entry.kuutiot).toFixed(2)}</StyledTableCell>
                                            <StyledTableCell align="right">{Number(entry.haettu).toFixed(2)}</StyledTableCell>
                                            <StyledTableCell align="right" sx={{ fontWeight: 'bold', color: Number(entry.jaljella) < 0 ? 'error.main' : 'text.primary' }}>{Number(entry.jaljella).toFixed(2)}</StyledTableCell>
                                            <StyledTableCell align="center"><Checkbox checked={!!entry.valmis} onChange={() => handleCheckboxChange(entry.puutavaraId)} /></StyledTableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Loads (Kuormakirjat)</Typography>
                            <Button variant="contained" sx={{backgroundColor: '#607d8b', '&:hover': {backgroundColor: '#546e7a'}}} size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => onCreateLoadAction(editableDetails)} disabled={!editableDetails.puulaani}>New Load</Button>
                        </Box>
                         <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead><TableRow>
                                    <StyledHeaderCell>Timber Type</StyledHeaderCell>
                                    <StyledHeaderCell>Date</StyledHeaderCell>
                                    <StyledHeaderCell>Driver</StyledHeaderCell>
                                    <StyledHeaderCell align="right">Hauled (m³)</StyledHeaderCell>
                                    <StyledHeaderCell align="right">Remaining (m³)</StyledHeaderCell>
                                    {/* <StyledHeaderCell align="center">Actions</StyledHeaderCell> */}
                                </TableRow></TableHead>
                                <TableBody>
                                    {relatedLoads.length > 0 ? relatedLoads.map((load) => {
                                        const isOwner = Number(user?.driverNumericId) === Number(load.kuljId);
                                         return (
                                            <TableRow 
                                                key={load.kuormaId} 
                                                hover={isOwner} 
                                                sx={{ 
                                                    cursor: isOwner ? 'pointer' : 'default', 
                                                    opacity: isOwner ? 1 : 0.7 
                                                }}
                                                // Only allow clicking if the user is the owner
                                                onClick={() => isOwner && onEditLoadAction(load.kuormaId)}
                                            >
                                                <StyledTableCell>{load.puutavaralaji || 'N/A'}</StyledTableCell>
                                                <StyledTableCell>{new Date(load.pvm).toLocaleDateString('fi-FI')}</StyledTableCell>
                                                <StyledTableCell>{load.kuljettajanNimi || 'N/A'}</StyledTableCell>
                                                <StyledTableCell align="right">{Number(load.haettu).toFixed(2)}</StyledTableCell>
                                                <StyledTableCell align="center">
                                                    {isOwner && <IconButton size="small"><EditIcon fontSize="small" /></IconButton>}
                                                </StyledTableCell>
                                            </TableRow>
                                        );
                                    }) : <TableRow><StyledTableCell colSpan={6} align="center" sx={{p: 3, fontStyle: 'italic', color: 'text.secondary'}}>No loads found for this Puulaani.</StyledTableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
}
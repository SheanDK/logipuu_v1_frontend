// frontend/src/components/loads/PuulaaniDetailsPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useAuth } from '@/contexts/AuthContext';
import { PuulaaniDetails } from '@/types';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';

interface PuulaaniDetailsPanelProps {
    details: PuulaaniDetails | null;
    isLoading: boolean;
    onCloseAction: () => void;
    onCreateLoadAction: (puulaaniDetails: PuulaaniDetails) => void;
    onEditLoadAction: (loadId: number) => void;
    onSaveAction: (updatedDetails: PuulaaniDetails) => Promise<void>;
    onDeleteLoadAction: (load: any) => void;
    onStartTripAction: (load: any) => void;
    activeLoadId: number | null;
    hasActiveTrip: boolean;
    isOffline: boolean;
}

const StyledTableCell = (props: any) => <TableCell sx={{ py: 1, px: 2, borderColor: 'divider' }} {...props} />;
const StyledHeaderCell = (props: any) => <StyledTableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover', color: 'text.secondary' }} {...props} />;

export default function PuulaaniDetailsPanel({
    details, isLoading,
    onCloseAction, onCreateLoadAction,
    onEditLoadAction, onSaveAction,
    onDeleteLoadAction, onStartTripAction,
    activeLoadId, hasActiveTrip,
    isOffline
}: PuulaaniDetailsPanelProps) {

    const { user } = useAuth();
    const theme = useTheme();
    const [editableDetails, setEditableDetails] = useState<PuulaaniDetails | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { t, i18n } = useTranslation('puulaaniDetailsPanel');

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

    // Map backend status → translation key
    const statusMap: Record<string, string> = {
        'Assigned': 'assigned',
        'In Progress': 'in_progress',
        'Paused': 'paused',
        'Completed': 'completed',
        'En Route to Destination': 'en_route_to_destination',
        'At Origin': 'at_origin',
        'At Destination': 'at_destination',
        'Pending Sync': 'pending_sync',
        'N/A': 'na',
        '-': 'na'
    };

    const locale = (i18n.language || 'en').toLowerCase().startsWith('fi') ? 'fi-FI' : 'en-US';

    const glassSurface = alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.92 : 0.98);
    const glassBorder = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 0.4);
    const glassShadow = theme.palette.mode === 'dark' ? '0px -8px 40px -12px rgba(0,0,0,0.7)' : '0px -8px 40px -12px rgba(0,0,0,0.3)';

    return (
        <Paper
            elevation={10}
            sx={{
                position: 'absolute',
                bottom: { xs: 0, sm: 24 },
                left: { xs: 0, sm: '50%' },
                transform: { xs: 'none', sm: 'translateX(-50%)' },
                zIndex: 1050,
                width: { xs: '100%', sm: 'auto', md: 800 },
                maxHeight: { xs: '80vh', sm: '70vh' },
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: glassSurface,
                backdropFilter: 'blur(8px)',
                borderRadius: { xs: '16px 16px 0 0', sm: 3 },
                borderTop: `1px solid ${glassBorder}`,
                boxShadow: glassShadow,
            }}
        >

            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Stack sx={{ flexGrow: 1 }}>
                    <Typography variant="overline" lineHeight={1.2} color="text.secondary">{t('header.label')}</Typography>
                    <Typography variant="h6" fontWeight={600}>{editableDetails.puulaani?.nimi || t('header.unknown')}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    
                    {isDirty && (
                        <Button
                            color="primary"
                            variant="contained"
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={isSaving || isOffline}
                        >
                            {isSaving ? t('actions.saving') : t('actions.saveChanges')}
                        </Button>
                    )}
                    <IconButton onClick={onCloseAction}><CloseIcon /></IconButton>
                </Stack>
            </Box>

            {/* Timber Types */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ px: 1 }}>{t('timber.title')}</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <StyledHeaderCell>{t('timber.columns.type')}</StyledHeaderCell>
                                        <StyledHeaderCell align="right">{t('timber.columns.total')}</StyledHeaderCell>
                                        <StyledHeaderCell align="right">{t('timber.columns.hauled')}</StyledHeaderCell>
                                        <StyledHeaderCell align="right">{t('timber.columns.remaining')}</StyledHeaderCell>
                                        <StyledHeaderCell align="center">{t('timber.columns.completed')}</StyledHeaderCell>
                                    </TableRow>
                                </TableHead>
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

                    {/* Loads */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">{t('loads.title')}</Typography>
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: '#607d8b', '&:hover': { backgroundColor: '#546e7a' } }}
                                size="small"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => onCreateLoadAction(editableDetails)}
                            >
                                {t('loads.create')}
                            </Button>
                        </Box>
                        {isOffline && (
                            <Alert severity="warning" color="warning" sx={{ mb: 1, mx: 1 }}>
                                {t('loads.offlineNotice')}
                            </Alert>
                        )}
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <StyledHeaderCell>{t('loads.columns.timberType')}</StyledHeaderCell>
                                        <StyledHeaderCell>{t('loads.columns.date')}</StyledHeaderCell>
                                        <StyledHeaderCell>{t('loads.columns.driver')}</StyledHeaderCell>
                                        <StyledHeaderCell align="right">{t('loads.columns.hauled')}</StyledHeaderCell>
                                        <StyledHeaderCell align="center">{t('loads.columns.actions')}</StyledHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {relatedLoads.map((load) => {
                                        const isOfflineDraft = Boolean((load as any)?.isOfflineDraft);
                                        const isOwner = Number(user?.driverNumericId) === Number(load.kuljId);
                                        const actionsDisabled = isOffline || isOfflineDraft;
                                        const canEditOrDelete = !actionsDisabled && isOwner && load.status === 'Assigned';
                                        const isActive = load.kuormaId === activeLoadId;
                                        const canStart = !actionsDisabled && isOwner && load.status === 'Assigned' && !hasActiveTrip;

                                        const statusKey = statusMap[load.status];
                                        const localizedStatus = statusKey ? t(`status.${statusKey}`) : load.status;

                                        const driverNameToDisplay = 
                                    load.kuljettajanNimi && load.kuljettajanNimi !== 'N/A'
                                        ? load.kuljettajanNimi
                                        : isOwner
                                            ? user?.fullName
                                            : t('common.na');

                                        return (
                                            <TableRow
                                                key={load.kuormaId}
                                                hover={isOwner && !isActive && !isOfflineDraft}
                                                sx={{
                                                    cursor: canEditOrDelete ? 'pointer' : 'default',
                                                    backgroundColor: isActive
                                                        ? 'primary.light'
                                                        : isOfflineDraft
                                                            ? 'action.hover'
                                                            : 'transparent',
                                                    '&:hover': {
                                                        backgroundColor: isActive
                                                            ? 'primary.light'
                                                            : isOfflineDraft
                                                                ? 'action.hover'
                                                                : (isOwner ? 'action.hover' : 'transparent')
                                                    },
                                                    opacity: isOwner || isActive ? 1 : 0.7,
                                                    fontStyle: isOfflineDraft ? 'italic' : 'normal'
                                                }}
                                                onClick={() => canEditOrDelete && onEditLoadAction(load.kuormaId)}
                                            >
                                                <StyledTableCell>{load.puutavaralaji || t('common.na')}</StyledTableCell>
                                                <StyledTableCell>{new Date(load.pvm).toLocaleDateString('fi-FI')}</StyledTableCell>
                                                <StyledTableCell>{driverNameToDisplay}</StyledTableCell>
                                                <StyledTableCell align="right">{Number(load.haettu).toFixed(2)}</StyledTableCell>
                                                <StyledTableCell align="center">
                                                    {isActive ? (
                                                        <Chip label={localizedStatus} color="primary" size="small" />
                                                    ) : isOfflineDraft ? (
                                                        <Chip label={localizedStatus} color="warning" size="small" variant="outlined" />
                                                    ) : (
                                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                                            {canStart && (
                                                                <IconButton
                                                                    size="small"
                                                                    title={t('loads.actions.start')}
                                                                    color="success"
                                                                    onClick={(e) => { e.stopPropagation(); onStartTripAction(load); }}
                                                                >
                                                                    <PlayCircleOutlineIcon />
                                                                </IconButton>
                                                            )}
                                                            {canEditOrDelete && (
                                                                <IconButton
                                                                    size="small"
                                                                    title={t('loads.actions.edit')}
                                                                    onClick={(e) => { e.stopPropagation(); onEditLoadAction(load.kuormaId); }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                            {canEditOrDelete && (
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    title={t('loads.actions.delete')}
                                                                    onClick={(e) => { e.stopPropagation(); onDeleteLoadAction(load); }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                            {actionsDisabled && !isOfflineDraft && (
                                                                <Chip label={t('loads.offlineDisabled')} size="small" color="default" />
                                                            )}
                                                        </Stack>
                                                    )}
                                                </StyledTableCell>
                                            </TableRow>
                                                            );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
}

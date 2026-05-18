// src/app/[lng]/(main)/vehicles/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Button, Typography, Paper, CircularProgress, Alert,
    AlertColor, Chip, Stack, IconButton, Divider, alpha, useTheme,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
    Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FolderIcon from '@mui/icons-material/Folder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { fetchAllVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../../../services/vehicleService';
import VehicleFormModal from '../../../../components/vehicles/VehicleFormModal';
import ManageGroupsModal from '../../../../components/chip-order/ManageGroupsModal';
import ConfirmationDialog from '../../../../components/common/DeleteConfirmationDialog';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import dayjs from 'dayjs';

export default function VehiclesPage() {
    const { user } = useAuth();
    const { t } = useTranslation(['vehicles', 'common', 'chip-management']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [vehicles, setVehicles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [expandedGroups, setExpandedGroups] = useState<string[]>(['General']);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

    // --- Column Management & Sorting States ---
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'registrationNo',
        direction: 'asc'
    });

    // Menu States
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [activeCol, setActiveCol] = useState<any>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, col: any) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setActiveCol(col);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setActiveCol(null);
    };

    const columns = [
        { id: 'regNo', label: t('columns.registrationNo'), key: 'registrationNo', width: '40%' },
        { id: 'inspection', label: t('columns.nextInspectionDate'), key: 'nextInspectionDate', width: '25%' },
        { id: 'status', label: t('columns.status'), key: 'isActive', width: '15%', align: 'center' },
    ];

    const canView = useMemo(() => user?.permissions?.includes('vehicles_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('vehicles_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('vehicles_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('vehicles_delete'), [user]);

    const loadVehicles = useCallback(async () => {
        if (!canView) return;
        setIsLoading(true);
        try {
            const rawData = await fetchAllVehicles();
            const mappedData = rawData.map((v: any) => ({
                ...v,
                id: String(v.kalustoNro),
                vehicleNo: String(v.kalustoNro),
                registrationNo: v.rekNro,
                nextInspectionDate: v.katsastus_aik || v.katsastusAik || v.nextInspectionDate,
                isActive: v.aktiivinen,
                planning_group: v.planningGroup || v.planning_group || 'General'
            }));
            setVehicles(mappedData);
        } catch (err: any) {
            setFeedback({ type: 'error', message: t('feedback.loadFailed') });
        } finally {
            setIsLoading(false);
        }
    }, [canView, t]);

    useEffect(() => { if (user) loadVehicles(); }, [user, loadVehicles]);

    // --- Grouping Logic ---
    const groupedVehicles = useMemo(() => {
        const grouped = vehicles.reduce((acc: any, v: any) => {
            const group = v.planning_group || 'General';
            if (!acc[group]) acc[group] = [];
            acc[group].push(v);
            return acc;
        }, {});

        // --- Sorting ---
        const sortedGroups = Object.keys(grouped).sort();

        return sortedGroups.reduce((obj: any, groupName) => {
            // --- Sorting ---
            obj[groupName] = grouped[groupName].sort((a: any, b: any) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
            return obj;
        }, {});
    }, [vehicles, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
    };

    const handleSave = async (data: any, vehicleNo?: string) => {
        setIsSaving(true);
        try {
            if (vehicleNo) await updateVehicle(vehicleNo, data);
            else await createVehicle(data);
            setIsModalOpen(false);
            loadVehicles();
        } finally { setIsSaving(false); }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await deleteVehicle(String(deleteTarget.kalustoNro));
            setDeleteTarget(null);
            loadVehicles();
        } catch (err) { }
    };

    if (isLoading || !user) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 3, height: 'calc(100vh - 128px)', width: '100%', bgcolor: 'background.paper', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">{t('title')}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('subtitle')}</Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="outlined" startIcon={<FolderIcon />}
                        onClick={() => setGroupModalOpen(true)}
                        sx={{ borderColor: '#a38f6d', color: '#a38f6d', fontWeight: 'bold' }}
                    >
                        {t('chip-management:planning.common.buttons.vehicleGrouping')}
                    </Button>
                    {canCreate && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingVehicle(null); setIsModalOpen(true); }} sx={{ bgcolor: '#a38f6d' }}>
                            {t('buttons.addVehicle')}
                        </Button>
                    )}
                </Stack>
            </Box>

            {feedback && <Alert severity={feedback.type} sx={{ mb: 2 }}>{feedback.message}</Alert>}

            {/* --- Table Container --- */}
            <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>

                {/* --- Dynamic Header Row --- */}
                <Box sx={{ display: 'flex', bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa', p: 1, borderBottom: '2px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
                    {columns.map((col) => !hiddenColumns.includes(col.id) && (
                        <Box
                            key={col.id}
                            sx={{
                                width: col.width,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 1,
                                height: 32
                            }}
                        >
                            <Box
                                onClick={() => handleSort(col.key)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    '&:hover': { color: '#a38f6d' },
                                    flex: 1,
                                    overflow: 'hidden'
                                }}
                            >
                                <Typography variant="caption" noWrap sx={{ fontWeight: '900', textTransform: 'uppercase' }}>
                                    {col.label}
                                </Typography>
                                {sortConfig.key === col.key && (
                                    sortConfig.direction === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14, ml: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
                                )}
                            </Box>
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, col)} sx={{ ml: 0.5 }}>
                                <MoreVertIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    ))}
                    {!hiddenColumns.includes('actions') && (
                        <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>
                                {t('columns.actions')}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {Object.entries(groupedVehicles).map(([groupName, groupVehicles]: [string, any]) => {
                    const isExpanded = expandedGroups.includes(groupName);
                    return (
                        <Box key={groupName}>
                            {/* Folder Header Row */}
                            <Box
                                onClick={() => toggleGroup(groupName)}
                                sx={{
                                    display: 'flex', alignItems: 'center', p: 1, px: 2,
                                    bgcolor: alpha('#a38f6d', 0.1), borderBottom: '1px solid', borderColor: 'divider',
                                    cursor: 'pointer', '&:hover': { bgcolor: alpha('#a38f6d', 0.15) }
                                }}
                            >
                                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                                <FolderIcon sx={{ color: '#a38f6d', mx: 1.5, fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: '800', color: '#a38f6d' }}>
                                    {groupName.toUpperCase()} ({groupVehicles.length})
                                </Typography>
                            </Box>

                            {/* Vehicle Rows */}
                            {isExpanded && groupVehicles.map((v: any) => (
                                <Box key={v.kalustoNro} sx={{ display: 'flex', alignItems: 'center', p: 0.8, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>

                                    {!hiddenColumns.includes('regNo') && (
                                        <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
                                            <LocalShippingIcon sx={{ color: v.aktiivinen ? '#a38f6d' : '#ccc', fontSize: 18 }} />
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography variant="body2" fontWeight="700" noWrap>{v.rekNro}</Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px' }}>#{v.kalustoNro} | {v.planning_group}</Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {!hiddenColumns.includes('inspection') && (
                                        <Box sx={{ width: '25%', px: 1 }}>
                                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                {v.nextInspectionDate ? dayjs(v.nextInspectionDate).format('DD.MM.YYYY') : '-'}
                                            </Typography>
                                        </Box>
                                    )}

                                    {!hiddenColumns.includes('status') && (
                                        <Box sx={{ width: '15%', textAlign: 'center' }}>
                                            <Chip label={v.aktiivinen ? 'Active' : 'Inactive'} color={v.aktiivinen ? 'success' : 'default'} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '10px', height: '20px' }} />
                                        </Box>
                                    )}

                                    {!hiddenColumns.includes('actions') && (
                                        <Box sx={{ width: '20%', textAlign: 'center' }}>
                                            <IconButton size="small" onClick={() => { setEditingVehicle(v); setIsModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(v)}><DeleteIcon fontSize="small" /></IconButton>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    );
                })}
            </Box>

            {/* --- Column Management Dialog --- */}
            <Dialog open={manageDialogOpen} onClose={() => setManageDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#fdfaf5', borderBottom: '1px solid #eee' }}>{t('common:manageColumns')}</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {columns.map((col) => (
                            <FormControlLabel
                                key={col.id}
                                control={<Checkbox size="small" checked={!hiddenColumns.includes(col.id)} onChange={() => setHiddenColumns(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id])} sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                                label={<Typography variant="body2">{col.label}</Typography>}
                            />
                        ))}
                        <FormControlLabel
                            control={<Checkbox size="small" checked={!hiddenColumns.includes('actions')} onChange={() => setHiddenColumns(prev => prev.includes('actions') ? prev.filter(c => c !== 'actions') : [...prev, 'actions'])} sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                            label={<Typography variant="body2">{t('columns.actions')}</Typography>}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#fdfaf5' }}>
                    <Button fullWidth variant="contained" onClick={() => setManageDialogOpen(false)} sx={{ bgcolor: '#a38f6d', borderRadius: '10px', fontWeight: 'bold' }}>DONE</Button>
                </DialogActions>
            </Dialog>

            {/* --- Column Menu --- */}
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { width: 220, borderRadius: '8px', mt: 0.5 } }}>
                <MenuItem onClick={() => { if (activeCol) setSortConfig({ key: activeCol.key, direction: 'asc' }); handleMenuClose(); }}>
                    <ListItemIcon><ArrowUpwardIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Sort by ASC" />
                </MenuItem>
                <MenuItem onClick={() => { if (activeCol) setSortConfig({ key: activeCol.key, direction: 'desc' }); handleMenuClose(); }}>
                    <ListItemIcon><ArrowDownwardIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Sort by DESC" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon><FilterListIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Filter" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { if (activeCol) setHiddenColumns(prev => [...prev, activeCol.id]); handleMenuClose(); }}>
                    <ListItemIcon><VisibilityOffIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Hide column" />
                </MenuItem>
                <MenuItem onClick={() => { setManageDialogOpen(true); handleMenuClose(); }}>
                    <ListItemIcon><ViewColumnIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Manage columns" />
                </MenuItem>
            </Menu>

            {/* Modals */}
            <ManageGroupsModal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} vehicles={vehicles} onUpdate={loadVehicles} />
            {isModalOpen && <VehicleFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingVehicle} isSaving={isSaving} />}
            <ConfirmationDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title={t('confirmDelete.title')}
                message={t('confirmDelete.message', { registrationNo: deleteTarget?.registrationNo })}
            />
        </Paper>
    );
}
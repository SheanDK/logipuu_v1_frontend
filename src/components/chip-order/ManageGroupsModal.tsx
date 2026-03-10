// frontend/src/components/chip-order/ManageGroupsModal.tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Stack, Box, Typography, Divider, Checkbox, FormControlLabel,
    Accordion, AccordionSummary, AccordionDetails, useTheme, alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import chipPlanningService from '@/services/chipPlanningService';
import { useTranslation } from '@/i18n/useTranslation';

// Chip Title Modal Component
const ManageGroupsModal = ({ open, onClose, vehicles, onUpdate }: any) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const { t } = useTranslation(['chip-management', 'common']);

    // --- States ---
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroup, setEditingGroup] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [localExtraGroups, setLocalExtraGroups] = useState<string[]>([]);

    // temp vehicles
    const [tempVehicles, setTempVehicles] = useState<any[]>([]);
    // Accordion control
    const [expanded, setExpanded] = useState<string | false>('General');

    // Modal open
    useEffect(() => {
        if (open) {
            setTempVehicles(JSON.parse(JSON.stringify(vehicles)));
        }
    }, [open, vehicles]);

    const activeVehicles = useMemo(() => {
        return tempVehicles.filter((v: any) => v.aktiivinen === true);
    }, [tempVehicles]);

    const groupedData = useMemo(() => {
        const data = activeVehicles.reduce((acc: any, v: any) => {
            const group = v.planningGroup || v.planning_group || 'General';
            if (!acc[group]) acc[group] = [];
            acc[group].push(v);
            return acc;
        }, {});
        localExtraGroups.forEach(g => { if (!data[g]) data[g] = []; });
        return data;
    }, [activeVehicles, localExtraGroups]);

    // Accordion toggle
    const handleAccordionToggle = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    // Vehicle toggle to local group
    const handleLocalToggleVehicle = (kalustoNro: number, targetGroup: string, isChecking: boolean) => {
        const nextGroup = isChecking ? targetGroup : 'General';
        setTempVehicles(prev => prev.map(v =>
            v.kalustoNro === kalustoNro ? { ...v, planningGroup: nextGroup, planning_group: nextGroup } : v
        ));
    };

    const handleAddGroupLocal = () => {
        if (newGroupName.trim()) {
            setLocalExtraGroups(prev => [...prev, newGroupName.trim()]);
            setExpanded(newGroupName.trim());
            setNewGroupName('');
        }
    };

    // Rename group
    const handleRenameConfirm = async (oldName: string) => {
        if (!renameValue.trim() || oldName === renameValue) { setEditingGroup(null); return; }
        await chipPlanningService.renameGroup(oldName, renameValue.trim());
        setTempVehicles(prev => prev.map(v =>
            (v.planningGroup === oldName || v.planning_group === oldName)
                ? { ...v, planningGroup: renameValue.trim(), planning_group: renameValue.trim() } : v
        ));
        setLocalExtraGroups(prev => prev.map(g => g === oldName ? renameValue.trim() : g));
        setEditingGroup(null);
        setExpanded(renameValue.trim());
    };

    // Delete group
    const handleDeleteGroup = async (groupName: string) => {
        if (groupName === 'General') return;
        if (window.confirm(`Delete group "${groupName}"?`)) {
            await chipPlanningService.deleteGroup(groupName);
            setTempVehicles(prev => prev.map(v =>
                (v.planningGroup === groupName || v.planning_group === groupName)
                    ? { ...v, planningGroup: 'General', planning_group: 'General' } : v
            ));
            setLocalExtraGroups(prev => prev.filter(g => g !== groupName));
        }
    };

    // Final save
    const handleFinalSave = async () => {
        try {
            // Find updated vehicles
            const updates = tempVehicles.filter(tv => {
                const original = vehicles.find((v: any) => v.kalustoNro === tv.kalustoNro);
                return (tv.planningGroup || tv.planning_group) !== (original?.planningGroup || original?.planning_group);
            });

            // Update vehicles
            await Promise.all(updates.map(v =>
                chipPlanningService.updateVehicleGroup(v.kalustoNro, v.planningGroup || v.planning_group || 'General')
            ));

            onUpdate();
            onClose();
        } catch (err) { console.error(err); }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#fdfaf5', borderBottom: '1px solid', borderColor: 'divider' }}>
                {t('chip-management:vehicleGrouping.title')}
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, p: 1, bgcolor: isDarkMode ? alpha('#fff', 0.03) : '#f9f9f9', borderRadius: '8px' }}>
                        <TextField size="small" fullWidth placeholder={t('chip-management:vehicleGrouping.subtitle')} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddGroupLocal()} />
                        <Button variant="contained" onClick={handleAddGroupLocal} sx={{ bgcolor: '#a38f6d', fontWeight: 'bold' }}>{t('chip-management:vehicleGrouping.newGroup')}</Button>
                    </Box>
                    <Divider />

                    {Object.entries(groupedData).map(([groupName, groupVehicles]: [string, any]) => (
                        <Accordion
                            key={groupName}
                            expanded={expanded === groupName}
                            onChange={handleAccordionToggle(groupName)}
                            disableGutters
                            elevation={0}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1, bgcolor: 'transparent' }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1.5 }}>
                                    <FolderIcon sx={{ color: '#a38f6d', fontSize: 20 }} />
                                    {editingGroup === groupName ? (
                                        <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <TextField size="small" autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} sx={{ flex: 1, '& .MuiOutlinedInput-input': { p: '4px 8px' } }} onKeyPress={(e) => e.key === 'Enter' && handleRenameConfirm(groupName)} />
                                            <Box component="span" onClick={() => handleRenameConfirm(groupName)} sx={{ display: 'flex', p: 0.5, borderRadius: '50%', cursor: 'pointer', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}><CheckIcon fontSize="small" /></Box>
                                            <Box component="span" onClick={() => setEditingGroup(null)} sx={{ display: 'flex', p: 0.5, borderRadius: '50%', cursor: 'pointer', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}><CloseIcon fontSize="small" /></Box>
                                        </Stack>
                                    ) : (
                                        <>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>{groupName} ({groupVehicles.length})</Typography>
                                            {groupName !== 'General' && (
                                                <Stack direction="row" spacing={1}>
                                                    <Box component="span" onClick={(e) => { e.stopPropagation(); setEditingGroup(groupName); setRenameValue(groupName); }} sx={{ display: 'flex', p: 0.5, borderRadius: '50%', cursor: 'pointer', color: 'action.active', '&:hover': { bgcolor: alpha('#000', 0.08) } }}><EditIcon sx={{ fontSize: 18 }} /></Box>
                                                    <Box component="span" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(groupName); }} sx={{ display: 'flex', p: 0.5, borderRadius: '50%', cursor: 'pointer', color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}><DeleteIcon sx={{ fontSize: 18 }} /></Box>
                                                </Stack>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#fafafa', borderTop: '1px solid', borderColor: 'divider', maxHeight: 300, overflow: 'auto' }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                    {activeVehicles.map((v: any) => {
                                        const vGroup = v.planningGroup || v.planning_group || 'General';
                                        const isChecked = vGroup === groupName;
                                        return (
                                            <FormControlLabel
                                                key={v.kalustoNro}
                                                control={<Checkbox size="small" checked={isChecked} onChange={(e) => handleLocalToggleVehicle(v.kalustoNro, groupName, e.target.checked)} />}
                                                label={<Typography variant="caption" sx={{ fontWeight: isChecked ? 'bold' : 'normal', color: !isChecked && vGroup !== 'General' ? 'orange' : 'inherit' }}>{v.rekNro} {(!isChecked && vGroup !== 'General') ? `(${vGroup})` : ''}</Typography>}
                                            />
                                        );
                                    })}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '20px', px: 3, fontWeight: 'bold' }}>{t('common:buttons.cancel')}</Button>
                <Button onClick={handleFinalSave} variant="contained" sx={{ bgcolor: '#a38f6d', borderRadius: '20px', px: 4, fontWeight: 'bold' }}>{t('common:buttons.done')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageGroupsModal;
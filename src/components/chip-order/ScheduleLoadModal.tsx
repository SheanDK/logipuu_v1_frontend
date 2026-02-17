// src/components/chip-order/ScheduleLoadModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import chipService from '@/services/chipService';
import * as puulaaniService from '@/services/timberStackService';
import * as unloadingSiteService from '@/services/unloadingSiteService';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, MenuItem, Typography, CircularProgress, Box
} from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

interface ScheduleLoadModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    programId: string | number;
    selectedDate: string;
    vehicleName: string;
}

const ScheduleLoadModal: React.FC<ScheduleLoadModalProps> = ({ open, onClose, onSuccess, programId, selectedDate, vehicleName }) => {
    const { t } = useTranslation(['chip-management']);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingSites, setLoadingSites] = useState<any[]>([]);
    const [unloadingSites, setUnloadingSites] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // FIX: Initial state (Empty string)
    const [formData, setFormData] = useState({
        order_id: '',
        lahto_paikka: '',
        purku_paikka: '',
        planned_m3: 45,
    });


    useEffect(() => {
        if (!open) {
            setFormData({
                order_id: '',
                lahto_paikka: '',
                purku_paikka: '',
                planned_m3: 45,
            });
        } else {
            const loadData = async () => {
                setIsFetching(true);
                try {
                    const [activeOrders, p_laani, p_sites] = await Promise.all([
                        chipService.getActiveOrders(),
                        puulaaniService.fetchAllTimberStacks({ status: 'all', clientId: '', vehicleId: '', markerTypes: [] }),
                        unloadingSiteService.fetchAllDropoffLocations()
                    ]);
                    setOrders(activeOrders || []);
                    setLoadingSites(p_laani || []);
                    setUnloadingSites(p_sites || []);
                } catch (err) {
                    console.error("Error loading data", err);
                } finally {
                    setIsFetching(false);
                }
            };
            loadData();
        }
    }, [open]);

    const handleSave = async () => {
        if (!formData.order_id || !formData.lahto_paikka || !formData.purku_paikka) {
            alert(t('chip-management:planning.scheduleModal.fillAll'));
            return;
        }

        setIsSaving(true);
        try {
            await chipService.scheduleLoad({
                program_id: Number(programId),
                order_id: Number(formData.order_id),
                pvm: selectedDate,
                lahto_paikka: Number(formData.lahto_paikka),
                purku_paikka: Number(formData.purku_paikka),
                planned_m3: Number(formData.planned_m3)
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Scheduling failed", error);
            alert(t('chip-management:planning.scheduleModal.error500'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa' }}>
                {t('chip-management:planning.scheduleModal.title')}: {vehicleName}
            </DialogTitle>
            <DialogContent dividers>
                {isFetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            {t('chip-management:planning.date')}: <b>{selectedDate ? new Date(selectedDate).toLocaleDateString() : ''}</b>
                        </Typography>

                        <TextField
                            select
                            label={t('chip-management:planning.scheduleModal.selectOrder')}
                            fullWidth
                            value={formData.order_id || ''}
                            onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                        >
                            {orders.map(o => (
                                <MenuItem key={o.order_id} value={o.order_id}>
                                    {o.asiakkaan_nimi} - {o.tuote_tyyppi}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label={t('chip-management:planning.scheduleModal.loadingSite')}
                            fullWidth
                            value={formData.lahto_paikka || ''}
                            onChange={(e) => setFormData({ ...formData, lahto_paikka: e.target.value })}
                        >
                            {loadingSites.map(s => (
                                <MenuItem key={s.puulaaniId} value={s.puulaaniId}>{s.nimi}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label={t('chip-management:planning.scheduleModal.unloadingSite')}
                            fullWidth
                            value={formData.purku_paikka || ''}
                            onChange={(e) => setFormData({ ...formData, purku_paikka: e.target.value })}
                        >
                            {unloadingSites.map(s => (
                                <MenuItem key={s.purkupaikkaId} value={s.purkupaikkaId}>{s.purkupaikka}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label={t('chip-management:planning.scheduleModal.plannedM3')}
                            type="number"
                            fullWidth
                            value={formData.planned_m3 || ''}
                            onChange={(e) => setFormData({ ...formData, planned_m3: Number(e.target.value) })}
                        />
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit">{t('chip-management:orderModal.cancel')}</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving || isFetching}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' } }}
                >
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : t('chip-management:planning.scheduleModal.saveGig')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleLoadModal;
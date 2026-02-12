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

interface ScheduleLoadModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    programId: string | number;
    selectedDate: string;
    vehicleName: string;
}

const ScheduleLoadModal: React.FC<ScheduleLoadModalProps> = ({ open, onClose, onSuccess, programId, selectedDate, vehicleName }) => {
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
            alert("Please fill all required fields.");
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
            alert("Internal Server Error (500). Please check if IDs are valid.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa' }}>
                Schedule Load: {vehicleName}
            </DialogTitle>
            <DialogContent dividers>
                {isFetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            Date: <b>{selectedDate ? new Date(selectedDate).toLocaleDateString() : ''}</b>
                        </Typography>

                        {/* TextField value එක කවදාවත් undefined නොවන බවට සහතික වීමට || '' එක් කළා */}
                        <TextField
                            select
                            label="Select Chip Order"
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
                            label="Loading Site (Origin)"
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
                            label="Unloading Site (Destination)"
                            fullWidth
                            value={formData.purku_paikka || ''}
                            onChange={(e) => setFormData({ ...formData, purku_paikka: e.target.value })}
                        >
                            {unloadingSites.map(s => (
                                <MenuItem key={s.purkupaikkaId} value={s.purkupaikkaId}>{s.purkupaikka}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Planned m³"
                            type="number"
                            fullWidth
                            value={formData.planned_m3 || ''}
                            onChange={(e) => setFormData({ ...formData, planned_m3: Number(e.target.value) })}
                        />
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving || isFetching}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' } }}
                >
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : 'SAVE GIG'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleLoadModal;
// frontend/src/components/chip-order/ChipOrderModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import chipService from '@/services/chipService';
import * as clientService from '@/services/clientService';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, MenuItem, CircularProgress, Typography
} from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

interface ChipOrderModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ChipOrderModal: React.FC<ChipOrderModalProps> = ({ open, onClose, onSuccess }) => {
    const { t } = useTranslation(['chip-management']);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCustomers, setFetchingCustomers] = useState(false);

    const [formData, setFormData] = useState({
        asiakas_id: '',
        pvm_alku: '',
        pvm_loppu: '',
        kuormia_tavoite: 1,
        tuote_tyyppi: '',
        lisatiedot: ''
    });

    // fetch all clients
    useEffect(() => {
        const loadCustomers = async () => {
            if (open) {
                setFetchingCustomers(true);
                try {
                    const data = await clientService.fetchAllClients();
                    console.log("Customers Data:", data);
                    setCustomers(data || []);
                } catch (err) {
                    console.error("Error loading customers", err);
                } finally {
                    setFetchingCustomers(false);
                }
            }
        };
        loadCustomers();
    }, [open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.asiakas_id) return;
        setLoading(true);
        try {
            await chipService.createOrder(formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating order", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ bgcolor: '#f8f9fa', fontWeight: 'bold' }}>
                {t('chip-management:orderModal.createTitle')}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mt: 1 }}>

                    {/* Customer Dropdown */}
                    <TextField
                        select
                        fullWidth
                        label={fetchingCustomers ? t('chip-management:orderModal.loading') : `${t('chip-management:orderModal.customerSelect')} *`}
                        name="asiakas_id"
                        value={formData.asiakas_id}
                        onChange={handleChange}
                        required
                    >
                        {customers.length > 0 ? (
                            customers.map((c) => (
                                // Database එකේ ඇති field names (asiakkaanId, asiakkaanNimi) මෙහිදී භාවිතා කරන්න
                                <MenuItem key={c.asiakkaanId} value={c.asiakkaanId}>
                                    {c.asiakkaanNimi}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>{t('chip-management:orderModal.noCustomers')}</MenuItem>
                        )}
                    </TextField>

                    {/* Date Selection */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label={`${t('chip-management:orderModal.startDate')} *`}
                            type="date"
                            name="pvm_alku"
                            InputLabelProps={{ shrink: true }}
                            value={formData.pvm_alku}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label={`${t('chip-management:orderModal.endDate')} *`}
                            type="date"
                            name="pvm_loppu"
                            InputLabelProps={{ shrink: true }}
                            value={formData.pvm_loppu}
                            onChange={handleChange}
                            required
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label={t('chip-management:orderModal.targetLoads')}
                            type="number"
                            name="kuormia_tavoite"
                            value={formData.kuormia_tavoite}
                            onChange={handleChange}
                        />
                        <TextField
                            fullWidth
                            label={t('chip-management:orderModal.productType')}
                            name="tuote_tyyppi"
                            placeholder={t('chip-management:orderModal.productPlaceholder')}
                            value={formData.tuote_tyyppi}
                            onChange={handleChange}
                        />
                    </Stack>

                    <TextField
                        fullWidth
                        label={t('chip-management:orderModal.furtherInfo')}
                        multiline
                        rows={3}
                        name="lisatiedot"
                        value={formData.lisatiedot}
                        onChange={handleChange}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit">{t('chip-management:orderModal.cancel')}</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.asiakas_id}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' } }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('chip-management:orderModal.saveOrder')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChipOrderModal;
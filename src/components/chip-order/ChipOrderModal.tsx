// frontend/src/components/chip-order/ChipOrderModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import chipOrderService from '@/services/chipOrderService';
import * as clientService from '@/services/clientService';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, MenuItem, CircularProgress, useTheme, alpha
} from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

interface ChipOrderModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ChipOrderModal: React.FC<ChipOrderModalProps> = ({ open, onClose, onSuccess }) => {
    const { t } = useTranslation(['chip-management']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCustomers, setFetchingCustomers] = useState(false);

    const [formData, setFormData] = useState({
        asiakas_id: '',
        start_date: '',
        end_date: '',
        target_qty: 1,
        tuote_tyyppi: '',
        notes: ''
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
            await chipOrderService.create(formData);
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
            <DialogTitle sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa', fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider' }}>
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
                            name="start_date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label={`${t('chip-management:orderModal.endDate')} *`}
                            type="date"
                            name="end_date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label={t('chip-management:orderModal.targetLoads')}
                            type="number"
                            name="target_qty"
                            value={formData.target_qty}
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
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#f8f9fa', borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} color="inherit">{t('chip-management:orderModal.cancel')}</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.asiakas_id}
                    sx={{ bgcolor: '#a38f6d', borderRadius: '8px', fontWeight: 'bold', '&:hover': { bgcolor: '#8c7a5d' } }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('chip-management:orderModal.saveOrder')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChipOrderModal;
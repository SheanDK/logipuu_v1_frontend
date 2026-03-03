// frontend/src/components/chip-order/ChipOrderModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import chipOrderService from '@/services/chipOrderService';
import * as clientService from '@/services/clientService';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, MenuItem, CircularProgress, useTheme, alpha, Typography
} from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

interface ChipOrderModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ChipOrderModal: React.FC<ChipOrderModalProps> = ({ open, onClose, onSuccess }) => {
    const { t } = useTranslation(['chip-management', 'common']);
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

    // පාරිභෝගික දත්ත ලබා ගැනීම
    useEffect(() => {
        const loadCustomers = async () => {
            if (open) {
                setFetchingCustomers(true);
                try {
                    const data = await clientService.fetchAllClients();
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
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: '12px', boxShadow: theme.shadows[10] } }}
        >
            {/* Header: Theme responsive styling */}
            <DialogTitle sx={{
                bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.8) : '#f8f9fa',
                fontWeight: 800,
                borderBottom: '1px solid',
                borderColor: 'divider',
                color: theme.palette.text.primary
            }}>
                <Typography variant="h6" fontWeight="800">
                    {t('chip-management:orderModal.createTitle')}
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ bgcolor: theme.palette.background.default, p: 3 }}>
                <Stack spacing={3} sx={{ mt: 1 }}>

                    {/* Customer Select */}
                    <TextField
                        select
                        fullWidth
                        label={fetchingCustomers ? t('chip-management:orderModal.loading') : `${t('chip-management:orderModal.customerSelect')} *`}
                        name="asiakas_id"
                        value={formData.asiakas_id}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        size="small"
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

                    {/* Date Row */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label={`${t('chip-management:orderModal.startDate')} *`}
                            type="date"
                            name="start_date"
                            size="small"
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
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                        />
                    </Stack>

                    {/* Qty & Product Row */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label={t('chip-management:orderModal.targetLoads')}
                            type="number"
                            name="target_qty"
                            size="small"
                            value={formData.target_qty}
                            onChange={handleChange}
                        />
                        <TextField
                            fullWidth
                            label={t('chip-management:orderModal.productType')}
                            name="tuote_tyyppi"
                            size="small"
                            placeholder={t('chip-management:orderModal.productPlaceholder')}
                            value={formData.tuote_tyyppi}
                            onChange={handleChange}
                        />
                    </Stack>

                    {/* Further Info */}
                    <TextField
                        fullWidth
                        label={t('chip-management:orderModal.furtherInfo')}
                        multiline
                        rows={4}
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        variant="outlined"
                        placeholder="Add any additional notes here..."
                    />
                </Stack>
            </DialogContent>

            {/* Footer: Theme responsive styling */}
            <DialogActions sx={{
                p: 2.5,
                bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.8) : '#f8f9fa',
                borderTop: '1px solid',
                borderColor: 'divider'
            }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ borderRadius: '20px', px: 3, color: theme.palette.text.secondary, borderColor: 'divider' }}
                >
                    {t('common:buttons.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.asiakas_id}
                    sx={{
                        bgcolor: '#a38f6d',
                        borderRadius: '20px',
                        px: 4,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#8c7a5d' }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('chip-management:orderModal.saveOrder')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChipOrderModal;
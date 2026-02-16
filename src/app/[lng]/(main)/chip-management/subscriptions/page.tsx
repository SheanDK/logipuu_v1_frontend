//frontend/src/app/[lng]/(main)/chip-management/subscriptions/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Stack, TextField, InputAdornment, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import chipService from '@/services/chipService';
import ChipSubscriptionModal from '@/components/chip-order/ChipSubscriptionModal';
import { useTranslation } from '@/i18n/useTranslation';
import { Snackbar, Alert, AlertColor } from '@mui/material';

const ChipSubscriptionsPage = () => {
    const { t } = useTranslation(['chip-management']);
    const [subs, setSubs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any | null>(null); // Edit 
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as AlertColor });

    const fetchSubs = useCallback(async () => {
        try {
            const data = await chipService.getActiveOrders();
            setSubs(data || []);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => { fetchSubs(); }, [fetchSubs]);

    const handleRowClick = (sub: any) => {
        setSelectedSub(sub);
        setModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedSub(null);
        setModalOpen(true);
    };

    const filteredSubs = subs.filter(s =>
        (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.lyhenne || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleActionComplete = (message: string, severity: AlertColor = 'success') => {
        setSnackbar({ open: true, message, severity });
        fetchSubs();
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#fdfdfd', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#333' }}>{t('chip-management:subscriptions.title')}</Typography>
                    <Typography variant="caption" color="textSecondary">{t('chip-management:subscriptions.subtitle')}</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '8px', px: 3, fontWeight: 'bold' }}
                >
                    {t('chip-management:subscriptions.newSubscription')}
                </Button>
            </Stack>

            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <TextField
                    size="small" placeholder={t('chip-management:subscriptions.searchPlaceholder')} sx={{ width: 400 }}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:subscriptions.table.id')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:subscriptions.table.customer')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:subscriptions.table.item')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:subscriptions.table.validityPeriod')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('chip-management:subscriptions.table.targetQty')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('chip-management:subscriptions.table.status')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSubs.map((s) => (
                            <TableRow
                                key={s.orderId}
                                hover
                                onClick={() => handleRowClick(s)}
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fdfaf5 !important' } }}
                            >
                                <TableCell>{s.orderId}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{s.customerName}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{s.lyhenne} | {s.productType}</Typography>
                                    <Typography variant="caption" color="textSecondary">{s.titleName}</Typography>
                                </TableCell>

                                {/* --- Validity Period --- */}
                                <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>
                                    {s.startDate && s.endDate ? (
                                        `${s.startDate} - ${s.endDate}`
                                    ) : (
                                        s.startDate || "-"
                                    )}
                                    {s.valid_until_notice && (
                                        <Typography variant="caption" display="block" sx={{ color: '#a38f6d', fontWeight: 'bold', fontSize: '10px' }}>
                                            (Valid until notice)
                                        </Typography>
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    <Chip label={s.targetQty} size="small" sx={{ fontWeight: 'bold', bgcolor: '#e0f2f1', color: '#00695c' }} />
                                </TableCell>

                                <TableCell align="center">
                                    <Chip label="Active" color="success" variant="outlined" size="small" sx={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ChipSubscriptionModal
                open={modalOpen}
                initialData={selectedSub}
                onClose={() => setModalOpen(false)}
                onSuccess={handleActionComplete}
            />

            {/* --- GLOBAL NOTIFICATION SNACKBAR --- */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', fontWeight: 'bold' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ChipSubscriptionsPage;
// frontend/src/app/[lng]/(main)/chip-management/subscriptions/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Stack, TextField, InputAdornment,
    Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
    Tooltip, useTheme, alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

import { chipOrderService } from '@/services/chipOrderService';

import ChipSubscriptionModal from '@/components/chip-order/ChipSubscriptionModal';
import { useTranslation } from '@/i18n/useTranslation';
import { useNotification } from '@/contexts/NotificationContext';

const ChipSubscriptionsPage = () => {
    const { t } = useTranslation(['chip-management', 'common']);
    const { showNotification } = useNotification();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [subs, setSubs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any | null>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeCol, setActiveCol] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);

    // Column Definitions
    const columns = [
        { id: 'id', label: 'ID', key: 'orderId' },
        { id: 'customer', label: t('subscriptions.table.customer'), key: 'customerName' },
        { id: 'item', label: t('subscriptions.table.item'), key: 'abbreviation' },
        { id: 'validity', label: t('subscriptions.table.validityPeriod'), key: 'startDate' },
        { id: 'qty', label: t('subscriptions.table.targetQty'), key: 'targetQty' },
        { id: 'info', label: t('subscriptions.table.furtherInfo'), key: 'notes' },
        { id: 'status', label: t('subscriptions.table.status'), key: 'is_active' },
    ];

    const fetchSubs = useCallback(async () => {
        try {
            const data = await chipOrderService.getActive();
            setSubs(data || []);
        } catch (error) { console.error("Error fetching subs:", error); }
    }, []);

    useEffect(() => { fetchSubs(); }, [fetchSubs]);

    const sortedSubs = useMemo(() => {
        let result = [...subs];
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [subs, sortConfig]);

    const filteredSubs = sortedSubs.filter(s =>
        (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.abbreviation || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, colKey: string) => {
        setAnchorEl(event.currentTarget);
        setActiveCol(colKey);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveCol(null);
    };

    const handleSort = (direction: 'asc' | 'desc') => {
        if (activeCol) setSortConfig({ key: activeCol, direction });
        handleMenuClose();
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>{t('subscriptions.title')}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('subscriptions.subtitle')}</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedSub(null); setModalOpen(true); }}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '8px', px: 3, fontWeight: 'bold' }}
                >
                    {t('subscriptions.newSubscription')}
                </Button>
            </Stack>

            {/* Toolbar Section */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
                <TextField
                    size="small" placeholder={t('subscriptions.searchPlaceholder')} sx={{ width: 400 }}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <Button
                    onClick={() => setManageDialogOpen(true)}
                    startIcon={<ViewColumnIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none', color: '#a38f6d', borderColor: alpha('#a38f6d', 0.3), borderRadius: '8px', fontWeight: '600', px: 2, height: '36px', '&:hover': { borderColor: '#a38f6d', bgcolor: alpha('#a38f6d', 0.05) } }}
                >
                    {t('common:manageColumns') || 'Column Management'}
                </Button>
            </Paper>

            {/* Subscriptions Table */}
            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}>
                        <TableRow>
                            {columns.map((col) => !hiddenColumns.includes(col.id) && (
                                <TableCell key={col.id} sx={{ fontWeight: 'bold', color: 'text.primary', py: 1.5 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={(col.id === 'qty' || col.id === 'status') ? 'center' : 'flex-start'}>
                                        <span style={{ fontSize: '13px' }}>{col.label}</span>
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, col.key)}>
                                            <MoreVertIcon sx={{ fontSize: 14, opacity: 0.5 }} />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSubs.map((s) => (
                            <TableRow
                                key={s.orderId} hover onClick={() => { setSelectedSub(s); setModalOpen(true); }}
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(163, 143, 109, 0.1) !important' : '#fdfaf5 !important' } }}
                            >
                                {!hiddenColumns.includes('id') && <TableCell sx={{ fontSize: '13px' }}>{s.orderId}</TableCell>}

                                {!hiddenColumns.includes('customer') && (
                                    <TableCell><Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>{s.customerName}</Typography></TableCell>
                                )}

                                {!hiddenColumns.includes('item') && (
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: '12px' }}>{s.abbreviation} | {s.productType}</Typography>
                                    </TableCell>
                                )}

                                {!hiddenColumns.includes('validity') && (
                                    <TableCell sx={{ fontSize: '12px' }}>
                                        {s.startDate} {s.endDate ? `- ${s.endDate}` : ''}
                                        {s.valid_until_notice && <Typography variant="caption" display="block" sx={{ color: '#a38f6d', fontWeight: 'bold', fontSize: '10px' }}>(Notice)</Typography>}
                                    </TableCell>
                                )}

                                {!hiddenColumns.includes('qty') && (
                                    <TableCell align="center">
                                        <Chip label={s.targetQty} size="small" sx={{ fontWeight: 'bold', bgcolor: '#e0f2f1', color: '#00695c', height: '20px', fontSize: '11px' }} />
                                    </TableCell>
                                )}

                                {!hiddenColumns.includes('info') && (
                                    <TableCell sx={{ maxWidth: 180 }}>
                                        <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary', fontSize: '11px' }}>
                                            {s.notes || '-'}
                                        </Typography>
                                    </TableCell>
                                )}

                                {!hiddenColumns.includes('status') && (
                                    <TableCell align="center">
                                        <Chip label={t('subscriptions.status.active')} color="success" variant="outlined" size="small" sx={{ fontSize: '10px', fontWeight: 'bold', height: '20px' }} />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Column Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleSort('asc')}><ListItemIcon><ArrowUpwardIcon fontSize="small" /></ListItemIcon><ListItemText primary={t('common:sortAsc')} primaryTypographyProps={{ variant: 'body2' }} /></MenuItem>
                <MenuItem onClick={() => handleSort('desc')}><ListItemIcon><ArrowDownwardIcon fontSize="small" /></ListItemIcon><ListItemText primary={t('common:sortDesc')} primaryTypographyProps={{ variant: 'body2' }} /></MenuItem>
                <Divider /><MenuItem onClick={handleMenuClose}><ListItemIcon><FilterListIcon fontSize="small" /></ListItemIcon><ListItemText primary={t('common:filter')} primaryTypographyProps={{ variant: 'body2' }} /></MenuItem>
            </Menu>

            {/* Manage Columns Dialog */}
            <Dialog open={manageDialogOpen} onClose={() => setManageDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#fdfaf5', borderBottom: '1px solid #eee' }}>{t('common:manageColumns')}</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {columns.map((col) => (
                            <FormControlLabel key={col.id} control={<Checkbox size="small" checked={!hiddenColumns.includes(col.id)} onChange={() => setHiddenColumns(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id])} sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />} label={<Typography variant="body2">{col.label}</Typography>} />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#fdfaf5' }}><Button fullWidth variant="contained" onClick={() => setManageDialogOpen(false)} sx={{ bgcolor: '#a38f6d', borderRadius: '10px', fontWeight: 'bold' }}>{t('common:done') || 'DONE'}</Button></DialogActions>
            </Dialog>

            <ChipSubscriptionModal open={modalOpen} initialData={selectedSub} onClose={() => setModalOpen(false)} onSuccess={() => { fetchSubs(); showNotification(t('common:notifications.success'), 'success'); }} />
        </Box>
    );
};

export default ChipSubscriptionsPage;
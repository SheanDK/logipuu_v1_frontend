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

const ChipSubscriptionsPage = () => {
    const [subs, setSubs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const fetchSubs = useCallback(async () => {
        try {
            const data = await chipService.getActiveOrders();
            setSubs(data || []);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => { fetchSubs(); }, [fetchSubs]);

    const filteredSubs = subs.filter(s =>
        (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.lyhenne || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3, bgcolor: '#fdfdfd', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">Chip Subscriptions (Active Orders)</Typography>
                    <Typography variant="caption" color="textSecondary">Manage quantitative orders from customers</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}
                    sx={{ bgcolor: '#a38f6d', borderRadius: '8px', fontWeight: 'bold' }}
                >
                    NEW SUBSCRIPTION
                </Button>
            </Stack>

            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <TextField
                    size="small" placeholder="Search by customer or title..." sx={{ width: 400 }}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Item (Nimike)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Validity Period</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Target Loads</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSubs.map((s) => (
                            <TableRow key={s.orderId} hover>
                                <TableCell>{s.orderId}</TableCell>
                                <TableCell><Typography variant="body2" fontWeight="bold">{s.customerName}</Typography></TableCell>
                                <TableCell>{s.lyhenne} | {s.productType}</TableCell>
                                <TableCell sx={{ fontSize: '12px' }}>{s.pvm_alku} - {s.pvm_loppu}</TableCell>
                                <TableCell align="center"><Chip label={s.targetQty} size="small" sx={{ fontWeight: 'bold' }} /></TableCell>
                                <TableCell align="center">
                                    <Chip label="Active" color="success" variant="outlined" size="small" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ChipSubscriptionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchSubs}
            />
        </Box>
    );
};

export default ChipSubscriptionsPage;
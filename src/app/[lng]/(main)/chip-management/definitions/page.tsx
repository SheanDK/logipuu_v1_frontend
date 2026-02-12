// src/app/[lng]/(main)/chip-management/definitions/page.tsx


'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import chipService from '@/services/chipService';

const ChipDefinitionsPage = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        chipService.getActiveOrders().then(setOrders);
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography variant="h5" fontWeight="bold">Nimikkeet (Chip Definitions)</Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#a38f6d' }}>
                    NEW DEFINITION
                </Button>
            </Stack>

            <TableContainer component={Paper} sx={{ borderRadius: '8px' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Customer</TableCell>
                            <TableCell>Loading Site</TableCell>
                            <TableCell>Unloading Site</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell>Planned m³</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order: any) => (
                            <TableRow key={order.order_id}>
                                <TableCell>{order.asiakkaan_nimi}</TableCell>
                                <TableCell>{order.loading_site_name}</TableCell>
                                <TableCell>{order.unloading_site_name}</TableCell>
                                <TableCell>{order.tuote_tyyppi}</TableCell>
                                <TableCell>{order.planned_m3}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
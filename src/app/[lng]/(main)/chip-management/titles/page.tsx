//frontend/src/app/[lng]/(main)/chip-management/titles/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import apiClient from '@/services/apiClient';

const ChipTitlesPage = () => {
    const [titles, setTitles] = useState<any[]>([]);

    useEffect(() => {
        fetchTitles();
    }, []);

    const fetchTitles = async () => {
        const res = await apiClient.get('/chip-titles');
        setTitles(res.data);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Nimikkeet (Chip Titles)</Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#a38f6d' }}>
                    NEW TITLE
                </Button>
            </Stack>

            <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Origin (Lastaus)</TableCell>
                            <TableCell>Destination (Purku)</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell>Title Name</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {titles.map((t) => (
                            <TableRow key={t.title_id}>
                                <TableCell>{t.title_id}</TableCell>
                                <TableCell>{t.customer_name}</TableCell>
                                <TableCell>{t.origin_name}</TableCell>
                                <TableCell>{t.destination_name}</TableCell>
                                <TableCell>{t.product_name}</TableCell>
                                <TableCell>{t.nimike_nimi}</TableCell>
                                <TableCell>{t.aktiivinen ? 'Active' : 'Passive'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ChipTitlesPage;
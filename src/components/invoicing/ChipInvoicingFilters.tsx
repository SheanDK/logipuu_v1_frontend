// frontend/src/components/invoicing/ChipInvoicingFilters.tsx
'use client';
import React from 'react';
import { Box, Button, TextField, Checkbox, FormControlLabel, Stack, Paper, Typography } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import SearchIcon from '@mui/icons-material/Search';

const ChipInvoicingFilters = ({ onSubmit, loading, initialValues }: any) => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            dateFrom: initialValues?.dateFrom ?? new Date().toISOString().split('T')[0],
            dateTo: initialValues?.dateTo ?? new Date().toISOString().split('T')[0],
            unbilled: initialValues?.unbilled ?? true,
            billed: initialValues?.billed ?? false,
        }
    });

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#fafafa'
            }}
        >
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: -1, ml: 0.5 }}>
                        SEARCH FILTERS
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={3}
                        alignItems="center"
                    >
                        {/* Date Selection */}
                        <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                            <Controller
                                name="dateFrom"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Date From" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
                                )}
                            />
                            <Controller
                                name="dateTo"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Date To" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
                                )}
                            />
                        </Stack>

                        {/* Status Checkboxes */}
                        <Stack direction="row" spacing={1} sx={{ minWidth: 280 }}>
                            <Controller
                                name="unbilled"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={Boolean(field.value)} sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                                        label="Show Unbilled"
                                    />
                                )}
                            />
                            <Controller
                                name="billed"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={Boolean(field.value)} sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                                        label="Show Billed"
                                    />
                                )}
                            />
                        </Stack>

                        {/* Search Button */}
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={loading}
                            startIcon={!loading && <SearchIcon />}
                            sx={{
                                bgcolor: '#a38f6d',
                                px: 5,
                                height: 40,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#8e7a5a' }
                            }}
                        >
                            {loading ? 'SEARCHING...' : 'SEARCH'}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    );
};

export default ChipInvoicingFilters;
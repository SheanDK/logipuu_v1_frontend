// frontend/src/components/invoicing/ChipInvoicingFilters.tsx
'use client';
import React from 'react';
import { Box, Button, TextField, Checkbox, FormControlLabel, Stack, Paper } from '@mui/material';
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

    const handleFormSubmit = (data: any) => {
        onSubmit({
            dateFrom: data.dateFrom,
            dateTo: data.dateTo,
            unbilled: data.unbilled,
            billed: data.billed
        });
    };

    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
            <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <Controller
                            name="dateFrom"
                            control={control}
                            render={({ field }) => <TextField {...field} label="Date From" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
                        />
                        <Controller
                            name="dateTo"
                            control={control}
                            render={({ field }) => <TextField {...field} label="Date To" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
                        />
                        <Button variant="contained" type="submit" startIcon={<SearchIcon />} sx={{ bgcolor: '#a38f6d', px: 4, height: 40 }}>Search</Button>
                    </Stack>

                    <Stack direction="row" spacing={3}>
                        <Controller
                            name="unbilled"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel control={<Checkbox {...field} checked={Boolean(field.value)} />} label="Show Unbilled" />
                            )}
                        />
                        <Controller
                            name="billed"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel control={<Checkbox {...field} checked={Boolean(field.value)} />} label="Show Billed" />
                            )}
                        />
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    );
};

export default ChipInvoicingFilters;
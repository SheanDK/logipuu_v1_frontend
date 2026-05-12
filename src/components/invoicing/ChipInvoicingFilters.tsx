// frontend/src/components/invoicing/ChipInvoicingFilters.tsx
'use client';
import React from 'react';
import { Box, Button, TextField, Checkbox, FormControlLabel, Stack, Paper, Typography, alpha, useTheme } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

const ChipInvoicingFilters = ({ onSubmit, loading, initialValues }: any) => {
    const { t } = useTranslation('chipInvoicing');
    const theme = useTheme();
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
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.5)
            }}
        >
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2}>
                    <Typography variant="caption" textTransform="uppercase" fontWeight="bold" color="text.secondary" sx={{ mb: -1, ml: 0.5 }}>
                        {t('searchFiltersTitle.title')}
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
                                    <TextField {...field} label={t('searchFiltersTitle.dateFrom')} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
                                )}
                            />
                            <Controller
                                name="dateTo"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label={t('searchFiltersTitle.dateTo')} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
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
                                        label={t('searchFiltersTitle.unbilled')}
                                    />
                                )}
                            />
                            <Controller
                                name="billed"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={Boolean(field.value)} sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                                        label={t('searchFiltersTitle.billed')}
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
                            {loading ? t('actions.searching') : t('actions.search')}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    );
};

export default ChipInvoicingFilters;
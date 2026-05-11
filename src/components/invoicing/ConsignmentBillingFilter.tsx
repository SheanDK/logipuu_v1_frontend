//frontend/src/components/invoicing/ConsignmentBillingFilter.tsx
'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, Autocomplete, Checkbox, FormControlLabel,
  CircularProgress, Typography, Stack, Paper, alpha, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from '@/i18n/useTranslation';
import { fetchClientsListApi } from '@/services/clientService';
import { fetchVehiclesListApi } from '@/services/vehicleService';

export type ConsigmentSearchParams = {
  dateFrom: string;
  dateTo: string;
  customerId?: string | number | null;
  vehicleId?: string | number | null;
  unbilled?: boolean;
  billed?: boolean;
};

const ConsignmentBillingFilters = ({ onSubmit, loading, initialValues }: any) => {
  const { t } = useTranslation(['consigmentBillingFilters', 'common']);
  const theme = useTheme();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      dateFrom: initialValues?.dateFrom ?? '',
      dateTo: initialValues?.dateTo ?? '',
      customer: null,
      vehicle: null,
      isUnbilled: initialValues?.unbilled ?? true,
      isBilled: initialValues?.billed ?? false,
    }
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingOpts(true);
      try {
        const [cs, vs] = await Promise.all([fetchClientsListApi(), fetchVehiclesListApi()]);
        setCustomers(cs);
        setVehicles(vs);
      } finally { setLoadingOpts(false); }
    })();
  }, []);

  const submit = (fm: any) => onSubmit({
    dateFrom: fm.dateFrom,
    dateTo: fm.dateTo,
    customerId: fm.customer?.id ?? null,
    vehicleId: fm.vehicle?.id ?? null,
    unbilled: fm.isUnbilled,
    billed: fm.isBilled,
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
      <Box component="form" onSubmit={handleSubmit(submit)}>
        <Stack spacing={2}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: -1, ml: 0.5 }}>
            SEARCH FILTERS
          </Typography>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="center">

            <Stack direction="row" spacing={1} sx={{ minWidth: { lg: 350 } }}>
              <Controller
                name="dateFrom"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="From" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth />
                )}
              />
              <Controller
                name="dateTo"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="To" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth />
                )}
              />
            </Stack>

            {/* Customer Select */}
            <Box sx={{ flex: 1, minWidth: 200, width: '100%' }}>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={customers}
                    loading={loadingOpts}
                    size="small"
                    getOptionLabel={(o) => o.name || ''}
                    onChange={(_, v) => field.onChange(v)}
                    renderInput={(p) => <TextField {...p} label="Customer" />}
                  />
                )}
              />
            </Box>

            {/* Vehicle Select */}
            <Box sx={{ flex: 1, minWidth: 150, width: '100%' }}>
              <Controller
                name="vehicle"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={vehicles}
                    loading={loadingOpts}
                    size="small"
                    getOptionLabel={(o) => o.name || ''}
                    onChange={(_, v) => field.onChange(v)}
                    renderInput={(p) => <TextField {...p} label="Vehicle" />}
                  />
                )}
              />
            </Box>

            {/* Status & Search Group */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ pl: 1 }}>
              <Stack direction="row">
                <Controller
                  name="isUnbilled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={Boolean(field.value)} size="small" sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                      label={<Typography variant="caption">Unbilled</Typography>}
                    />
                  )}
                />
                <Controller
                  name="isBilled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={Boolean(field.value)} size="small" sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }} />}
                      label={<Typography variant="caption">Billed</Typography>}
                    />
                  )}
                />
              </Stack>

              <Button
                variant="contained"
                type="submit"
                startIcon={!loading && <SearchIcon />}
                disabled={loading}
                sx={{
                  bgcolor: '#a38f6d',
                  minWidth: 120,
                  height: 38,
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#8e7a5a' }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'SEARCH'}
              </Button>
            </Stack>

          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default ConsignmentBillingFilters;
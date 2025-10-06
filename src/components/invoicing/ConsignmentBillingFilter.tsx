'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, TextField, Autocomplete, Checkbox, FormControlLabel,
  CircularProgress, Typography, FormControl, FormHelperText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from '@/i18n/useTranslation';
import { fetchClientsListApi } from '@/services/clientService';
import { fetchVehiclesListApi } from '@/services/vehicleService';
import type { IClientBasicInfo } from '@/types';
import type { IVehicleBasicInfo } from '@/types/vehicle';

/* -----------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------------*/

/** Parameters passed upstream when the filter form is submitted. */
export type ConsigmentSearchParams = {
  dateFrom: string;
  dateTo: string;
  customerId?: string | number | null;
  vehicleId?: string | number | null;
  unbilled?: boolean;
  billed?: boolean;
};

/** Local RHF model: stores selected objects; converted to IDs in submit(). */
type FormModel = {
  dateFrom: string;
  dateTo: string;
  customer: IClientBasicInfo | null;
  vehicle: IVehicleBasicInfo | null;
  isUnbilled: boolean;
  isBilled: boolean;
};

/* -----------------------------------------------------------------------------
 * Validation schema
 * - Requires ISO dates (YYYY-MM-DD)
 * - dateTo must be >= dateFrom
 * - At least one billing status must be checked
 * ---------------------------------------------------------------------------*/
const buildSchema = (t: any) =>
  yup
    .object({
      dateFrom: yup
        .string()
        .required(t('consigmentBillingFilters:errors.dateFromRequired'))
        .matches(/^\d{4}-\d{2}-\d{2}$/, t('consigmentBillingFilters:errors.dateFormat')),
      dateTo: yup
        .string()
        .required(t('consigmentBillingFilters:errors.dateToRequired'))
        .matches(/^\d{4}-\d{2}-\d{2}$/, t('consigmentBillingFilters:errors.dateFormat'))
        .test('range', t('consigmentBillingFilters:errors.dateRange'), function (to) {
          const { dateFrom } = this.parent as FormModel;
          if (!to || !dateFrom) return true;
          return new Date(to) >= new Date(dateFrom);
        }),
      customer: yup.mixed<IClientBasicInfo>().nullable().default(null),
      vehicle: yup.mixed<IVehicleBasicInfo>().nullable().default(null),
      isUnbilled: yup.boolean().required().default(true),
      isBilled: yup.boolean().required().default(false),
    })
    .test(
      'status',
      t('consigmentBillingFilters:errors.statusRequired'),
      (v: any) => !!(v.isUnbilled || v.isBilled)
    );

type Props = {
  onSubmit: (p: ConsigmentSearchParams) => void;
  loading?: boolean;
  initialValues?: Partial<ConsigmentSearchParams> | null;
};

/* -----------------------------------------------------------------------------
 * ConsigmentBillingFilters
 * - Fetches option lists (customers, vehicles)
 * - Validates user input with RHF + Yup
 * - Emits normalized payload with IDs on submit
 * ---------------------------------------------------------------------------*/
const ConsigmentBillingFilters: React.FC<Props> = ({ onSubmit, loading, initialValues }) => {
  const { t } = useTranslation(['consigmentBillingFilters', 'common']);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormModel>({
    resolver: yupResolver(schema),
    defaultValues: {
      dateFrom: '',
      dateTo: '',
      customer: null,
      vehicle: null,
      isUnbilled: true,
      isBilled: false,
    },
    mode: 'onBlur',
  });

  const [customers, setCustomers] = useState<IClientBasicInfo[]>([]);
  const [vehicles, setVehicles] = useState<IVehicleBasicInfo[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  /**
   * Load dropdown options on mount.
   * Uses a mounted flag to avoid state updates after unmount.
   */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingOpts(true);
      try {
        const [cs, vs] = await Promise.all([fetchClientsListApi(), fetchVehiclesListApi()]);
        if (!mounted) return;
        setCustomers(cs);
        setVehicles(vs);
      } finally {
        mounted && setLoadingOpts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** Restore last submitted filters when reopening the form. */
  useEffect(() => {
    if (!initialValues) return;

    const normalizeId = (value: string | number | null | undefined) =>
      value === null || value === undefined ? null : String(value);

    const customerId = normalizeId(initialValues.customerId);
    const vehicleId = normalizeId(initialValues.vehicleId);

    const matchedCustomer =
      customerId
        ? customers.find((c) => {
            const candidateIds = [c.id, (c as any).clientId]
              .filter(Boolean)
              .map(String);
            return candidateIds.includes(customerId);
          }) ?? null
        : null;

    const matchedVehicle =
      vehicleId
        ? vehicles.find((v) => {
            const candidateIds = [v.id, (v as any).vehicleNo, (v as any).registrationNo]
              .filter(Boolean)
              .map(String);
            return candidateIds.includes(vehicleId);
          }) ?? null
        : null;

    const nextDefaults: FormModel = {
      dateFrom: initialValues.dateFrom ?? '',
      dateTo: initialValues.dateTo ?? '',
      customer: matchedCustomer,
      vehicle: matchedVehicle,
      isUnbilled: initialValues.unbilled ?? true,
      isBilled: initialValues.billed ?? false,
    };

    reset(nextDefaults, { keepDirty: false, keepTouched: false, keepErrors: false });
  }, [initialValues, customers, vehicles, reset]);

  /** Normalize RHF form model into the API payload. */
  const submit = (fm: FormModel) =>
    onSubmit({
      dateFrom: fm.dateFrom,
      dateTo: fm.dateTo,
      customerId: fm.customer?.id ?? null,
      vehicleId: fm.vehicle?.id ?? null,
      unbilled: fm.isUnbilled,
      billed: fm.isBilled,
    });

  return (
    <>
      <Box
        component="form"
        id="wbFilters"
        onSubmit={handleSubmit(submit)}
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          alignItems: 'start',
        }}
      >
        {/* Start date */}
        <Controller
          name="dateFrom"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('consigmentBillingFilters:fields.dateFrom') || 'Start date'}
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors.dateFrom}
              helperText={errors.dateFrom?.message}
              fullWidth
            />
          )}
        />

        {/* End date */}
        <Controller
          name="dateTo"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('consigmentBillingFilters:fields.dateTo') || 'End date'}
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors.dateTo}
              helperText={errors.dateTo?.message}
              fullWidth
            />
          )}
        />

        {/* Customer */}
        <Controller
          name="customer"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={customers}
              loading={loadingOpts}
              value={field.value}
              onChange={(_, v) => field.onChange(v)}
              getOptionLabel={(o) => o.name}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label={t('consigmentBillingFilters:fields.customer') || 'Customer'}
                  fullWidth
                  error={!!errors.customer}
                  helperText={errors.customer?.message}
                  InputProps={{
                    ...p.InputProps,
                    endAdornment: (
                      <>
                        {loadingOpts && <CircularProgress size={18} sx={{ mr: 0.5 }} />}
                        {p.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />

        {/* Vehicle */}
        <Controller
          name="vehicle"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={vehicles}
              loading={loadingOpts}
              value={field.value}
              onChange={(_, v) => field.onChange(v)}
              getOptionLabel={(o) => o.name}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label={t('consigmentBillingFilters:fields.vehicle') || 'Vehicle'}
                  fullWidth
                  error={!!errors.vehicle}
                  helperText={errors.vehicle?.message}
                  InputProps={{
                    ...p.InputProps,
                    endAdornment: (
                      <>
                        {loadingOpts && <CircularProgress size={18} sx={{ mr: 0.5 }} />}
                        {p.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />

        {/* Billing status */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControl
            component="fieldset"
            error={!!(errors.isUnbilled || errors.isBilled)}
            sx={{ width: '100%' }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('consigmentBillingFilters:fields.billingStatus') || 'Billing status'} *
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Controller
                name="isUnbilled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label={t('consigmentBillingFilters:labels.unbilled') || 'Unbilled'}
                  />
                )}
              />
              <Controller
                name="isBilled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label={t('consigmentBillingFilters:labels.billed') || 'Billed'}
                  />
                )}
              />
            </Box>

            {(errors.isUnbilled || errors.isBilled) && (
              <FormHelperText>
                {errors.isUnbilled?.message || errors.isBilled?.message}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          type="submit"
          form="wbFilters"
          disabled={loading || isSubmitting}
        >
          {loading || isSubmitting
            ? t('common:loading.searching') || 'Searching…'
            : t('common:buttons.search') || 'Search'}
        </Button>
      </Box>
    </>
  );
};

export default ConsigmentBillingFilters;





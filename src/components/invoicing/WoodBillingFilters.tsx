'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, TextField, Autocomplete, Checkbox, FormControlLabel,
  Tooltip, CircularProgress, Typography, FormControl, FormHelperText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useTranslation } from '@/i18n/useTranslation';
import { fetchClientsListApi } from '@/services/clientService';
import { fetchVehiclesListApi } from '@/services/vehicleService';
import { fetchAllWoodTypes } from '@/services/woodCategoriesServices';

import type { IClientBasicInfo } from '@/types';
import type { IVehicleBasicInfo } from '@/types/vehicle';
import type { IWoodCategory } from '@/services/woodCategoriesServices';

/** Exact params our backend search expects. */
export type InvoicingSearchParams = {
  dateFrom: string;
  dateTo: string;
  customerId?: string | number | null;
  vehicleId?: string | number | null;
  woodTypeIds?: Array<string | number>;
  unbilled?: boolean;
  billed?: boolean;
};

/** Local RHF form model. */
type SearchForm = {
  dateFrom: string;
  dateTo: string;
  customer: IClientBasicInfo | null;
  vehicle: IVehicleBasicInfo | null;
  isUnbilled: boolean;
  isBilled: boolean;
  /** Store wood type IDs (strings) for stability. */
  woodTypes: string[];
};

const buildSchema = (t: (k: string, o?: any) => string) =>
  yup
    .object({
      dateFrom: yup
        .string()
        .required(t('woodBillingFilters:errors.dateFromRequired'))
        .matches(/^\d{4}-\d{2}-\d{2}$/, t('woodBillingFilters:errors.dateFormat'))
        .defined(),
      dateTo: yup
        .string()
        .required(t('woodBillingFilters:errors.dateToRequired'))
        .matches(/^\d{4}-\d{2}-\d{2}$/, t('woodBillingFilters:errors.dateFormat'))
        .test('range', t('woodBillingFilters:errors.dateRange'), function (to) {
          const { dateFrom } = this.parent as SearchForm;
          if (!to || !dateFrom) return true;
          return new Date(to) >= new Date(dateFrom);
        })
        .defined(),
      customer: yup.mixed<IClientBasicInfo>().nullable().default(null).defined(),
      vehicle: yup.mixed<IVehicleBasicInfo>().nullable().default(null).defined(),
      isUnbilled: yup.boolean().required().default(true).defined(),
      isBilled: yup.boolean().required().default(false).defined(),
      woodTypes: yup
        .array(yup.string().required().defined())
        .min(1, t('woodBillingFilters:errors.woodTypesRequired'))
        .default([])
        .defined(),
    })
    .test('at-least-one-status', t('woodBillingFilters:errors.statusRequired'), function (values) {
      const v = values as unknown as SearchForm;
      if (v.isUnbilled || v.isBilled) return true;
      return this.createError({ path: 'isBilled', message: t('woodBillingFilters:errors.statusRequired') });
    });

type Props = {
  onSubmit: (params: InvoicingSearchParams) => void;
  loading?: boolean;
  initialValues?: Partial<InvoicingSearchParams> | null;
};

const WoodBillingFilters: React.FC<Props> = ({ onSubmit, loading, initialValues }) => {
  const { t } = useTranslation(['woodBillingFilters', 'common']);

  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SearchForm>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      dateFrom: '',
      dateTo: '',
      customer: null,
      vehicle: null,
      isUnbilled: true,
      isBilled: false,
      woodTypes: [],
    },
  });

  // Option lists
  const [woodTypeOptions, setWoodTypeOptions] = useState<IWoodCategory[]>([]);
  const [loadingWoodTypes, setLoadingWoodTypes] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<IClientBasicInfo[]>([]);
  const [carOptions, setCarOptions] = useState<IVehicleBasicInfo[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load options
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingOptions(true);
      setLoadingWoodTypes(true);
      try {
        const [clients, vehicles, woodTypesRes] = await Promise.all([
          fetchClientsListApi(),
          fetchVehiclesListApi(),
          fetchAllWoodTypes(),
        ]);
        if (!mounted) return;

        setCustomerOptions(clients);
        setCarOptions(vehicles);

        const activeWood = (woodTypesRes ?? []).filter(w => w.active);
        setWoodTypeOptions(activeWood);

        if (!initialValues || !(initialValues.woodTypeIds && initialValues.woodTypeIds.length)) {
          // Preselect all active wood types (IDs) by default when no saved filters available
          setValue('woodTypes', activeWood.map(w => String(w.id)), { shouldValidate: true });
        }
      } finally {
        if (mounted) {
          setLoadingOptions(false);
          setLoadingWoodTypes(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [setValue, initialValues]);

  useEffect(() => {
    if (!initialValues) return;

    const normalizeId = (value: string | number | null | undefined) =>
      value === null || value === undefined ? null : String(value);

    const customerId = normalizeId(initialValues.customerId);
    const vehicleId = normalizeId(initialValues.vehicleId);

    const matchedCustomer = customerId
      ? customerOptions.find((c) => {
          const candidateIds = [c.id, (c as any)?.clientId]
            .filter(Boolean)
            .map((id) => String(id));
          return candidateIds.includes(customerId);
        }) ?? null
      : null;

    const matchedVehicle = vehicleId
      ? carOptions.find((v) => {
          const candidateIds = [v.id, (v as any)?.vehicleNo, (v as any)?.registrationNo]
            .filter(Boolean)
            .map((id) => String(id));
          return candidateIds.includes(vehicleId);
        }) ?? null
      : null;

    const rawWoodIds = Array.isArray(initialValues.woodTypeIds)
      ? initialValues.woodTypeIds.map((id) => normalizeId(id)).filter(Boolean)
      : [];
    const availableWoodIds = new Set(woodTypeOptions.map((w) => String(w.id)));

    const selectedWoodTypes = rawWoodIds.length
      ? rawWoodIds.filter((id) => availableWoodIds.size === 0 || availableWoodIds.has(id))
      : woodTypeOptions.map((w) => String(w.id));

    reset(
      {
        dateFrom: initialValues.dateFrom ?? '',
        dateTo: initialValues.dateTo ?? '',
        customer: matchedCustomer,
        vehicle: matchedVehicle,
        isUnbilled: initialValues.unbilled ?? true,
        isBilled: initialValues.billed ?? false,
        woodTypes: selectedWoodTypes,
      },
      { keepDirty: false, keepTouched: false, keepErrors: false, keepIsValid: false, keepSubmitCount: false }
    );
  }, [initialValues, customerOptions, carOptions, woodTypeOptions, reset]);

  // Quick actions for wood types
  const handleSelectAll = () =>
    setValue('woodTypes', woodTypeOptions.map(w => String(w.id)), { shouldValidate: true, shouldDirty: true });
  const handleClearAll = () =>
    setValue('woodTypes', [], { shouldValidate: true, shouldDirty: true });

  // Normalize and bubble up
  const onSubmitForm = (form: SearchForm) => {
    onSubmit({
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      customerId: form.customer?.id ?? null,
      vehicleId: form.vehicle?.id ?? null,
      woodTypeIds: form.woodTypes,
      unbilled: form.isUnbilled,
      billed: form.isBilled,
    });
  };

  return (
    <>
      <Box
        component="form"
        id="filtersForm"
        onSubmit={handleSubmit(onSubmitForm)}
        noValidate
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          alignItems: 'start',
        }}
      >
        {/* dateFrom */}
        <Box>
          <Controller
            name="dateFrom"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('woodBillingFilters:fields.dateFrom')}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.dateFrom}
                helperText={errors.dateFrom?.message}
              />
            )}
          />
        </Box>

        {/* dateTo */}
        <Box>
          <Controller
            name="dateTo"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('woodBillingFilters:fields.dateTo')}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.dateTo}
                helperText={errors.dateTo?.message}
              />
            )}
          />
        </Box>

        {/* customer */}
        <Box>
          <Controller
            name="customer"
            control={control}
            render={({ field }) => (
              <Autocomplete<IClientBasicInfo>
                options={customerOptions}
                loading={loadingOptions}
                value={field.value}
                onChange={(_, v) => field.onChange(v)}
                getOptionLabel={(o) => o.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('woodBillingFilters:fields.customer')}
                    fullWidth
                    error={!!errors.customer}
                    helperText={errors.customer?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingOptions ? <CircularProgress size={18} sx={{ mr: .5 }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />
        </Box>

        {/* vehicle */}
        <Box>
          <Controller
            name="vehicle"
            control={control}
            render={({ field }) => (
              <Autocomplete<IVehicleBasicInfo>
                options={carOptions}
                loading={loadingOptions}
                value={field.value}
                onChange={(_, v) => field.onChange(v)}
                getOptionLabel={(o) => o.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('woodBillingFilters:fields.vehicle')}
                    fullWidth
                    error={!!errors.vehicle}
                    helperText={errors.vehicle?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingOptions ? <CircularProgress size={18} sx={{ mr: .5 }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />
        </Box>

        {/* Status */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControl component="fieldset" error={!!(errors.isUnbilled || errors.isBilled)} sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('woodBillingFilters:fields.billingStatus')} *
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Controller
                name="isUnbilled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label={t('woodBillingFilters:labels.unbilled')} />
                )}
              />
              <Controller
                name="isBilled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label={t('woodBillingFilters:labels.billed')} />
                )}
              />
            </Box>
            {(errors.isUnbilled || errors.isBilled) && (
              <FormHelperText>{errors.isUnbilled?.message || errors.isBilled?.message}</FormHelperText>
            )}
          </FormControl>
        </Box>

        {/* Wood types */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControl component="fieldset" error={!!errors.woodTypes} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">{t('woodBillingFilters:fields.woodTypes')}</Typography>
              <Tooltip title={t('woodBillingFilters:tooltips.selectAll')}>
                <span>
                  <Button size="small" variant="contained" onClick={handleSelectAll} disabled={loadingWoodTypes || !woodTypeOptions.length}>
                    {t('woodBillingFilters:buttons.selectAll')}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={t('woodBillingFilters:tooltips.clearAll')}>
                <Button size="small" variant="contained" onClick={handleClearAll}>
                  {t('woodBillingFilters:buttons.clearAll')}
                </Button>
              </Tooltip>
              {loadingWoodTypes && <CircularProgress size={18} sx={{ ml: 1 }} />}
            </Box>

            <Controller
              name="woodTypes"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  }}
                >
                  {woodTypeOptions.map((w) => {
                    const id = String(w.id);
                    const checked = (field.value ?? []).includes(id);
                    return (
                      <FormControlLabel
                        key={id}
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              const prev = new Set<string>(field.value ?? []);
                              if (e.target.checked) prev.add(id);
                              else prev.delete(id);
                              field.onChange(Array.from(prev));
                            }}
                          />
                        }
                        label={w.name}
                      />
                    );
                  })}
                  {!loadingWoodTypes && woodTypeOptions.length === 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', gridColumn: '1 / -1' }}>
                      {t('woodBillingFilters:messages.noWoodTypes')}
                    </Typography>
                  )}
                </Box>
              )}
            />
            {errors.woodTypes && <FormHelperText>{errors.woodTypes.message as string}</FormHelperText>}
          </FormControl>
        </Box>
      </Box>

      {/* Submit */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          type="submit"
          form="filtersForm"
          disabled={loading || isSubmitting}
        >
          {loading || isSubmitting ? t('woodBillingFilters:buttons.searching') : t('woodBillingFilters:buttons.search')}
        </Button>
      </Box>
    </>
  );
};

export default WoodBillingFilters;

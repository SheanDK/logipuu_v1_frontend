// frontend/src/components/drivers/DriverFormModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, FormControlLabel, Checkbox, Typography, Box, Alert
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from '@/i18n/useTranslation';

import { IDriver, ICreateDriverDto, IUpdateDriverDto, IDriverFormData } from '../../types/driver';

const normalizePhone = (raw: unknown) => {
  if (typeof raw !== 'string') return raw;
  let v = raw.trim();

  // Replace leading 00 with +
  if (v.startsWith('00')) v = `+${v.slice(2)}`;

  // Remove spaces, dashes, parentheses, dots
  v = v.replace(/[\s\-().]/g, '');

  return v;
};

const buildSchema = (t: (k: string) => string) =>
  yup.object({
    name: yup
      .string()
      .transform((v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : v))
      .required(t('errors.nameRequired'))
      .min(2, t('errors.nameMin'))
      .max(50, t('errors.nameMax'))
      // letters (incl. diacritics), space, apostrophe, hyphen
      .matches(
        /^[\p{L}\p{M}][\p{L}\p{M}'\- ]+$/u,
        t('errors.nameInvalid') || 'Invalid name format'
      )
      .default(''),

    phoneNo: yup
      .string()
      .transform((v) => (typeof v === 'string' ? normalizePhone(v) : v))
      .required(t('errors.phoneRequired'))
      .max(20, t('errors.phoneMax'))
      // only optional leading + and digits thereafter
      .matches(/^\+?\d+$/, t('errors.phoneInvalid') || 'Phone can only contain + and digits')
      .test(
        'phone-digit-length',
        t('errors.phoneDigits') || 'Phone must have 5–15 digits',
        (v) => {
          if (!v) return false;
          const digits = v.replace(/\D/g, '');
          return digits.length >= 5 && digits.length <= 15;
        }
      )
      // at most one leading +
      .test(
        'phone-plus-position',
        t('errors.phonePlus') || 'Plus sign must be at the start only',
        (v) => (v ? (v.startsWith('+') ? v.indexOf('+') === 0 : !v.includes('+')) : false)
      )
      .default(''),

    email: yup
      .string()
      .transform((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
      .required(t('errors.emailRequired'))
      .email(t('errors.emailInvalid'))
      .max(100, t('errors.emailMax'))
      // require TLD of at least 2 chars
      .matches(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, t('errors.emailInvalid'))
      .default(''),

    hasAlerts: yup.boolean().required().default(true),
  });

interface DriverFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ICreateDriverDto | IUpdateDriverDto, driverId?: number) => Promise<void>;
  initialData?: IDriver | null;
  isSaving: boolean;
  apiError: string | null;
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isSaving,
  apiError,
}) => {

  const { t } = useTranslation(['driverForm', 'common']);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<IDriverFormData>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      reset(initialData ? {
        name: initialData.name,
        phoneNo: initialData.phoneNo,
        email: initialData.email,
        hasAlerts: initialData.hasAlerts,
      } : schema.getDefault());
    }
  }, [initialData, open, reset]);

  const onSubmitHandler: SubmitHandler<IDriverFormData> = async (formData) => {
    const submissionData: ICreateDriverDto | IUpdateDriverDto = {
      name: formData.name,
      phoneNo: formData.phoneNo,
      email: formData.email,
      hasAlerts: formData.hasAlerts,
    };

    await onSave(submissionData, initialData?.driverId);
  };

  const submitLabel = isSaving
    ? null
    : initialData
      ? t('buttons.save')
      : t('buttons.add');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="span" sx={{ mr: 1 }}>
          {initialData ? t('titles.edit') : t('titles.add')}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        <Box component="form" onSubmit={handleSubmit(onSubmitHandler)} id="driver-form" noValidate sx={{ mt: 1 }}>
          {/* Row 1: Name (full width) */}
          <Box sx={{ mb: 2 }}>
            <Controller
              name="Age"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.name')}
                  fullWidth
                  required
                  autoFocus
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  margin="dense"
                />
              )}
            />
          </Box>

          {/* Row 2: Phone + Email (2 columns on >= sm) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 2,
            }}
          >
            <Controller
              name="phoneNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.phoneNo')}
                  fullWidth
                  required
                  error={!!errors.phoneNo}
                  helperText={errors.phoneNo?.message}
                  margin="dense"
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.email')}
                  fullWidth
                  required
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  margin="dense"
                />
              )}
            />
          </Box>

          {/* Row 3: Checkbox (full width) */}
          <Box>
            <Controller
              name="hasAlerts"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={t('fields.isActive')}
                />
              )}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" disabled={isSaving}>
          {t('buttons.cancel')}
        </Button>
        <Button
          type="submit"
          form="driver-form"
          color="primary"
          variant="contained"
          disabled={isSaving || !isDirty || !isValid}
        >
          {isSaving ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverFormModal;
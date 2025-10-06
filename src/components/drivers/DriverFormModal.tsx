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

const buildSchema = (t: (k: string) => string) =>
  yup.object({
    name: yup.string()
      .required(t('errors.nameRequired'))
      .min(2, t('errors.nameMin'))
      .max(50, t('errors.nameMax'))
      .default(''),
    phoneNo: yup.string()
      .required(t('errors.phoneRequired'))
      .max(20, t('errors.phoneMax'))
      .default(''),
    email: yup.string()
      .required(t('errors.emailRequired'))
      .email(t('errors.emailInvalid'))
      .max(100, t('errors.emailMax'))
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
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="name"
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
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
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
// frontend/src/components/vehicles/VehicleFormModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, FormControlLabel, Checkbox, Typography,
  Box
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { IVehicle, ICreateVehicleDto, IUpdateVehicleDto, IVehicleFormData } from '../../types';
import { checkRegistrationNoExists } from '../../services/vehicleService';
import { useTranslation } from '@/i18n/useTranslation';
import dayjs from 'dayjs';

interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  // CORRECTED: vehicleId is now a string
  onSave: (data: ICreateVehicleDto | IUpdateVehicleDto, vehicleId?: string) => Promise<void>;
  initialData?: IVehicle | null;
  isSaving: boolean;
}

const buildSchema = (t: (k: string, o?: any) => string, currentId?: string) =>
  yup.object({
    registrationNo: yup
      .string()
      .required(t('errors.regRequired'))
      .min(2, t('errors.regMin'))
      .max(15, t('errors.regMax'))
      .test('is-unique-reg-no', t('errors.regExists'), async (value) => {
        if (!value) return true;
        try {
          const isTaken = await checkRegistrationNoExists(value, currentId);
          return !isTaken;
        } catch {
          return true; // don’t block on network error
        }
      })
      .default(''),
    previousInspectionDate: yup.string().required(t('errors.prevRequired')).default(''),
    nextInspectionDate: yup
      .string()
      .required(t('errors.nextRequired'))
      .test('is-after-previous', t('errors.dateOrder'), function (value) {
        const { previousInspectionDate } = this.parent as IVehicleFormData;
        if (!previousInspectionDate || !value) return true;
        return new Date(value) > new Date(previousInspectionDate);
      })
      .default(''),
    isActive: yup.boolean().required().default(true),
  });


const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isSaving,
}) => {

  const { t } = useTranslation(['vehicleForm', 'common']);

  const schema = useMemo(
    () => buildSchema(t, initialData?.vehicleNo),
    [t, initialData?.vehicleNo]
  );

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<IVehicleFormData>({
    resolver: yupResolver(schema),
    // you don't need `context` anymore because buildSchema already
    // receives the current vehicle id
    defaultValues: schema.getDefault(),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
         const prevDate = initialData.previousInspectionDate
        ? dayjs(initialData.previousInspectionDate).format('YYYY-MM-DD')
        : '';
      const nextDate = initialData.nextInspectionDate
        ? dayjs(initialData.nextInspectionDate).format('YYYY-MM-DD')
        : '';
        reset({
          registrationNo: initialData.registrationNo,
          previousInspectionDate: prevDate,
          nextInspectionDate: nextDate,
          isActive: initialData.isActive,
        });
      } else {
        reset(schema.getDefault());
      }
    }
  }, [initialData, open, reset, schema]);

  const onSubmitHandler: SubmitHandler<IVehicleFormData> = async (formData) => {
    const submissionData: ICreateVehicleDto | IUpdateVehicleDto = {
      registrationNo: formData.registrationNo,
      previousInspectionDate: formData.previousInspectionDate,
      nextInspectionDate: formData.nextInspectionDate,
      isActive: formData.isActive,
    };

    // Pass the string ID from initialData directly. It's already the correct type.
    await onSave(submissionData, initialData?.vehicleNo);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="span">
          {initialData ? t('titles.edit') : t('titles.add')}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit(onSubmitHandler)} id="vehicle-form" noValidate>
          {/* Row 1: Registration number */}
          <Box sx={{ mb: 2 }}>
            <Controller
              name="registrationNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.registrationNo')}
                  fullWidth
                  required
                  error={!!errors.registrationNo}
                  helperText={errors.registrationNo?.message}
                  margin="dense"
                />
              )}
            />
          </Box>

          {/* Row 2: Dates as CSS Grid (2 columns >= sm) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 2,
            }}
          >
            <Controller
              name="previousInspectionDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.previousInspectionDate')}
                  fullWidth
                  required
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.previousInspectionDate}
                  helperText={errors.previousInspectionDate?.message}
                  margin="dense"
                />
              )}
            />

            <Controller
              name="nextInspectionDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.nextInspectionDate')}
                  fullWidth
                  required
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.nextInspectionDate}
                  helperText={errors.nextInspectionDate?.message}
                  margin="dense"
                />
              )}
            />
          </Box>

          {/* Row 3: Active checkbox */}
          <Box>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={t('fields.isActive')}
                />
              )}
            />
          </Box>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" disabled={isSaving}>
          {t('buttons.cancel')}
        </Button>
        <Button
          type="submit"
          form="vehicle-form"
          color="primary"
          variant="contained"
          disabled={isSaving || !isDirty || !isValid}
        >
          {isSaving ? <CircularProgress size={24} color="inherit" /> : t('buttons.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleFormModal;

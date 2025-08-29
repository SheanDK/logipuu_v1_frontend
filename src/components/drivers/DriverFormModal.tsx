'use client';

import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, FormControlLabel, Checkbox, Typography, Box, Alert
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { IDriver, ICreateDriverDto, IUpdateDriverDto, IDriverFormData } from '../../types/driver';

const driverSchema = yup.object().shape({
  name: yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .default(''),
  phoneNo: yup.string()
    .required('Phone Number is required')
    .max(20, 'Phone Number must not exceed 20 characters')
    .default(''),
  email: yup.string()
    .required('Email is required')
    .email('Enter a valid email')
    .max(100, 'Email must not exceed 100 characters')
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
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<IDriverFormData>({
    resolver: yupResolver(driverSchema),
    defaultValues: driverSchema.getDefault(),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) { 
      reset(initialData ? {
        name: initialData.name,
        phoneNo: initialData.phoneNo,
        email: initialData.email,
        hasAlerts: initialData.hasAlerts,
      } : driverSchema.getDefault());
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth> 
      <DialogTitle>
        <Typography variant="h5" component="span" sx={{ mr: 1 }}>
          {initialData ? 'Edit Driver' : 'Add New Driver'}
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
                    label="Name"
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
                    label="Phone Number"
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
                    label="Email"
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
                    label="Active"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="driver-form" 
          color="primary"
          variant="contained"
          disabled={isSaving || !isDirty || !isValid} 
        >
          {isSaving ? <CircularProgress size={24} color="inherit" /> : (initialData ? 'Save Changes' : 'Add Driver')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverFormModal;
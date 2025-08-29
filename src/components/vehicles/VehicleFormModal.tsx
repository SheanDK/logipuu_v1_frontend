// frontend/src/components/vehicles/VehicleFormModal.tsx
'use client';

import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, FormControlLabel, Checkbox, Typography
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { IVehicle, ICreateVehicleDto, IUpdateVehicleDto, IVehicleFormData } from '../../types/vehicle';
import { checkRegistrationNoExists } from '../../services/vehicleService';

// Yup Validation Schema
const vehicleSchema = yup.object().shape({
  registrationNo: yup.string()
    .required('Registration Number is required')
    .min(2, 'Must be at least 2 characters')
    .max(15, 'Must not exceed 15 characters')
    .test(
        'is-unique-reg-no', 
        'This registration number is already in use.', 
        async function (value) {
            if (!value) return true;
            // The context object is passed from useForm, containing the ID of the vehicle being edited.
            const editingVehicleId = this.options.context?.vehicleId; // This will be a string or undefined
            try {
                const isTaken = await checkRegistrationNoExists(value, editingVehicleId);
                return !isTaken;
            } catch (error) {
                console.error("Async validation failed:", error);
                return true;
            }
        }
    )
    .default(''), 
  previousInspectionDate: yup.string()
    .required('Previous Inspection Date is required')
    .default(''), 
  nextInspectionDate: yup.string()
    .required('Next Inspection Date is required')
    .test(
      'is-after-previous',
      'Next inspection date must be after previous inspection date',
      function (value) {
        const { previousInspectionDate } = this.parent;
        if (!previousInspectionDate || !value) return true;
        return new Date(value) > new Date(previousInspectionDate);
      }
    )
    .default(''), 
  isActive: yup.boolean().required().default(true),
});

interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  // CORRECTED: vehicleId is now a string
  onSave: (data: ICreateVehicleDto | IUpdateVehicleDto, vehicleId?: string) => Promise<void>; 
  initialData?: IVehicle | null;
  isSaving: boolean;
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isSaving,
}) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<IVehicleFormData>({
    resolver: yupResolver(vehicleSchema),
    context: {
        // Pass the string vehicleId to the validation context
        vehicleId: initialData?.vehicleNo,
    },
    defaultValues: vehicleSchema.getDefault(),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) { 
      if (initialData) {
        const prevDate = initialData.previousInspectionDate ? new Date(initialData.previousInspectionDate).toISOString().split('T')[0] : '';
        const nextDate = initialData.nextInspectionDate ? new Date(initialData.nextInspectionDate).toISOString().split('T')[0] : '';
        reset({
          registrationNo: initialData.registrationNo,
          previousInspectionDate: prevDate,
          nextInspectionDate: nextDate,
          isActive: initialData.isActive,
        });
      } else {
        reset(vehicleSchema.getDefault()); 
      }
    }
  }, [initialData, open, reset]); 

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
          {initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit(onSubmitHandler)} id="vehicle-form" noValidate>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}> 
              <Controller
                name="registrationNo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Registration No."
                    fullWidth
                    required
                    autoFocus 
                    error={!!errors.registrationNo}
                    helperText={errors.registrationNo?.message}
                    margin="dense" 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="previousInspectionDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Previous Inspection"
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="nextInspectionDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Next Inspection"
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
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="isActive"
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
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="vehicle-form" 
          color="primary"
          variant="contained"
          disabled={isSaving || !isDirty || !isValid} 
        >
          {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleFormModal;
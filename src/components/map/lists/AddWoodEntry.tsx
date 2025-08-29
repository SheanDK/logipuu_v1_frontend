// frontend/src/components/map/lists/AddWoodEntry.tsx
'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button, Grid, Box, FormHelperText, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { IAddTimberStackWoodEntryFormData, IPuutavaraItem, IMapDropoffLocation } from '../../../types';

interface AddWoodEntryProps {
  onAddAction: (data: IAddTimberStackWoodEntryFormData) => void;
  woodTypeList: IPuutavaraItem[];
  dropoffLocationList: IMapDropoffLocation[];
}

const addWoodEntrySchema = yup.object({
    woodTypeId: yup.number().nullable().required('Wood type is required'),
    dropoffLocationId: yup.number().nullable().required('Unloading site is required'),
    volume: yup.number().typeError('Must be a number').nullable().min(0.01, "Volume must be > 0").required('Cubes is required'),
});

export function AddWoodEntry({ onAddAction, woodTypeList, dropoffLocationList }: AddWoodEntryProps) {
  const { control, handleSubmit, reset, formState: { errors, isValid }, getValues } = useForm<IAddTimberStackWoodEntryFormData>({
    resolver: yupResolver(addWoodEntrySchema) as any,
    defaultValues: {
      woodTypeId: null,
      dropoffLocationId: null,
      volume: null,
    }
  });

  const handleAddClick = () => {
    handleSubmit(() => {
        const values = getValues();
        onAddAction(values);
        reset();
    })();
  };

  return (
    <Paper elevation={0} sx={{ backgroundColor: 'transparent', mt: 1 }}>
        <Box sx={{ width: '100%', border: '1px solid #ccc', p: 1.5, borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" error={!!errors.woodTypeId}>
                        <InputLabel>Type of timber</InputLabel>
                        <Controller name="woodTypeId" control={control} render={({ field }) => (
                            <Select {...field} label="Type of timber" value={field.value ?? ''} sx={{ backgroundColor: 'white' }}>
                                <MenuItem value="" disabled><em>Select Type</em></MenuItem>
                                {woodTypeList.map((p) => (<MenuItem key={p.puutavaraNro} value={p.puutavaraNro}>{p.puutavara}</MenuItem>))}
                            </Select>
                        )}/>
                        {errors.woodTypeId && <FormHelperText>{errors.woodTypeId.message}</FormHelperText>}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" error={!!errors.dropoffLocationId}>
                        <InputLabel>Unloading site</InputLabel>
                        <Controller name="dropoffLocationId" control={control} render={({ field }) => (
                            <Select {...field} label="Unloading site" value={field.value ?? ''} sx={{ backgroundColor: 'white' }}>
                                <MenuItem value="" disabled><em>Select Site</em></MenuItem>
                                {dropoffLocationList.map((p) => (<MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>))}
                            </Select>
                        )}/>
                        {errors.dropoffLocationId && <FormHelperText>{errors.dropoffLocationId.message}</FormHelperText>}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Controller name="volume" control={control} render={({ field }) => (
                        <TextField
                            {...field} fullWidth size="small" type="number" label="Cubes"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            error={!!errors.volume} helperText={errors.volume?.message}
                            sx={{ backgroundColor: 'white' }}
                        />
                    )}/>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button
                        variant="contained" size="medium"
                        disabled={!isValid}
                        onClick={handleAddClick}
                        startIcon={<AddIcon />}
                        fullWidth
                    >
                        Add
                    </Button>
                </Grid>
            </Grid>
        </Box>
    </Paper>
  );
}
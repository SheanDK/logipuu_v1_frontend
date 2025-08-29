// src/components/map/forms/MuuMerkkiForm.tsx
'use client';
import { Box, TextField, IconButton, Typography, FormHelperText } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { useFormContext, Controller } from 'react-hook-form';
import { IMapMuuMerkkiFormData } from '../../../types';

interface MuuMerkkiFormProps {
    onSelectIconAction: () => void;
}
export default function MuuMerkkiForm({ onSelectIconAction }: MuuMerkkiFormProps) {
    const { control, watch, formState: { errors } } = useFormContext<IMapMuuMerkkiFormData>();
    const selectedIconName = watch('iconType');
    const selectedColor = watch('color');
    const IconComponent = selectedIconName ? Icons[selectedIconName as keyof typeof Icons] : null;
    return (
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography>Selected Icon:</Typography>
                <IconButton onClick={onSelectIconAction} color="primary">
                    {IconComponent ? <IconComponent style={{ color: selectedColor }} /> : "Select Icon"}
                </IconButton>
                {errors.iconType && <FormHelperText error>{errors.iconType.message}</FormHelperText>}
            </Box>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Name of marker" fullWidth required error={!!errors.name} helperText={errors.name?.message} />}/>
            <Controller name="color" control={control} render={({ field }) => <TextField {...field} value={field.value ?? '#000000'} label="Icon color" type="color" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.color} helperText={errors.color?.message} />}/>
            <Controller name="additionalInfo" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Additional information" multiline rows={2} fullWidth />}/>
        </Box>
    );
}
// frontend/src/components/map/forms/PuulaaniForm.tsx


// not used on anywhere

'use client';

import {
    FormControl, InputLabel, Select, MenuItem, TextField, Box,
    FormHelperText, Checkbox, FormControlLabel,
    Typography
} from "@mui/material";
import { useFormContext, Controller } from 'react-hook-form';
import { IClientBasicInfo, PuulaaniBasicDetailsFormData } from '../../../types';

interface PuulaaniFormProps {
    customerList: IClientBasicInfo[];
}

export default function PuulaaniForm({ customerList }: PuulaaniFormProps) {
    const { control, formState: { errors } } = useFormContext<PuulaaniBasicDetailsFormData>();

    return (
        <Box display="flex" flexDirection="column" gap={2} mt={1} sx={{ minWidth: '400px' }}>
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <TextField {...field} label="Kohteen Nimi*" fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} />
                )}
            />
            <FormControl fullWidth required error={!!errors.clientId}>
                <InputLabel>Asiakas*</InputLabel>
                <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                        <Select {...field} label="Asiakas*" value={field.value || ''}>
                            {customerList.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                        </Select>
                    )}
                />
                {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
            </FormControl>
            <Controller
                name="dispatchOrderNo"
                control={control}
                render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} label="Ajomääräys Nro" fullWidth />
                )}
            />
             <Box>
                <FormControlLabel control={<Controller name="isActive" control={control} render={({ field }) => <Checkbox {...field} checked={Boolean(field.value)} />}/>} label="Aktiivinen" />
                <FormControlLabel control={<Controller name="isCompleted" control={control} render={({ field }) => <Checkbox {...field} checked={Boolean(field.value)} />}/>} label="Valmis" />
            </Box>
            <Controller
                name="additionalInfo"
                control={control}
                render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} label="Lisätiedot" multiline rows={3} fullWidth />
                )}
            />
            <Typography variant="caption" color="text.secondary">
                *) Nämä kentät eivät voi olla tyhjiä!
            </Typography>
        </Box>
    );
}
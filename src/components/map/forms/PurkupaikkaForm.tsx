// src/components/map/forms/PurkupaikkaForm.tsx
'use client';
import { FormControl, InputLabel, Select, MenuItem, TextField, Box, FormHelperText } from "@mui/material";
import { useFormContext, Controller } from 'react-hook-form';
import { IClientBasicInfo, IMapPurkupaikkaFormData } from '../../../types';

interface PurkupaikkaFormProps {
    customerList: IClientBasicInfo[];
}
export default function PurkupaikkaForm({ customerList }: PurkupaikkaFormProps) {
    const { control, formState: { errors } } = useFormContext<IMapPurkupaikkaFormData>();
    return (
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Unloading site Name" fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} />}/>
            <FormControl fullWidth required error={!!errors.clientId}>
                <InputLabel>Customer</InputLabel>
                <Controller name="clientId" control={control} render={({ field }) => (
                    <Select {...field} label="Customer" value={field.value || ''}>
                        {customerList.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                    </Select>
                )}/>
                {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
            </FormControl>
        </Box>
    );
}
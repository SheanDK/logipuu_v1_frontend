// frontend/src/components/loads/LoadFormModal.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, CircularProgress, Alert,
    Stack, Typography, IconButton, Paper, List, ListItem, ListItemText, Divider,
    Stepper, Step, StepLabel, RadioGroup, Radio, FormControlLabel, Chip, Accordion,
    AccordionSummary, AccordionDetails
} from '@mui/material';
import { useForm, Controller, SubmitHandler, useFieldArray, FormProvider, FieldValues } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import "dayjs/locale/fi";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { useAuth } from '@/contexts/AuthContext';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { 
    IClientBasicInfo, IVehicleBasicInfo, IDriver, LoadTypeEnum, 
    ITimberStackListItem, ICreateLoadDto, IUpdateLoadDto, IWoodEntry, ILoadDetails,
    IBackendClient, IVehicleBackendResponse, IBackendDriver
} from '@/types';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService';
import { fetchAllDrivers } from '@/services/driverService';
import { getActiveTimberStacksByClient, fetchWoodEntriesByPuulaani } from '@/services/timberStackService';
import { createLoad, updateLoad } from '@/services/loadService';
import { isValid } from 'zod/v3';

// --- Data Structures for Multi-Leg Trips ---
interface TripLeg {
    id: string; type: LoadTypeEnum;
    puulaaniId?: string; puulaaniName?: string;
    puutavaraId?: string; puutavaraName?: string; purkupaikkaName?: string;
    lahto?: string; kohde?: string; km?: number;
    m3: number;
}
interface MultiStopLoadFormData {
    tyyppi: LoadTypeEnum;
    asiakasId: string;
    kalustoNro?: string | null; // Optional for drivers
    kuljId?: string | null; // Optional for drivers
    pvm: Date;
    ajomaaraysNro?: string | null;
    lisatiedot?: string | null;
    legs: TripLeg[];
}

// --- THIS IS THE FIX: DYNAMIC VALIDATION SCHEMA ---
const getValidationSchema = (isDriver: boolean) => {
    return yup.object({
        tyyppi: yup.mixed<LoadTypeEnum>().oneOf(Object.values(LoadTypeEnum).filter(v => typeof v === 'number') as LoadTypeEnum[]).required(),
        asiakasId: yup.string().required('Customer is required'),
        pvm: yup.date().required('Date is required').typeError('A valid date is required'),
        ajomaaraysNro: yup.string().nullable(),
        lisatiedot: yup.string().nullable(),
        legs: yup.array().of(yup.object()).min(1, "At least one trip leg must be added.").required(),

        // Conditional validation for non-driver users
        kalustoNro: yup.string().when('$isDriver', {
            is: false,
            then: (schema) => schema.required('Vehicle is required'),
            otherwise: (schema) => schema.nullable().strip(), // If driver, not required and removed from data
        }),
        kuljId: yup.string().when('$isDriver', {
            is: false,
            then: (schema) => schema.required('Driver is required'),
            otherwise: (schema) => schema.nullable().strip(),
        }),
    });
};


interface LoadFormModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (message: string) => void;
    initialData: ILoadDetails | null;
}

const SummaryItem = ({ label, value }: { label: string, value?: string | number | null }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}>
        <Typography variant="body1" color="text.secondary">{label}:</Typography>
        <Typography variant="body1" fontWeight="bold" textAlign="right">{value ?? 'N/A'}</Typography>
    </Stack>
);

const AddPuulaaniLegForm = ({ onAdd, customerId, addedLegs }: { 
    onAdd: (data: Partial<TripLeg>) => void; 
    customerId: string;
    addedLegs: TripLeg[];
}) => {
    const [puulaaniList, setPuulaaniList] = useState<ITimberStackListItem[]>([]);
    const [isPuulaaniLoading, setIsPuulaaniLoading] = useState(false);
    const [selectedPuulaaniId, setSelectedPuulaaniId] = useState('');
    
    const [woodEntryList, setWoodEntryList] = useState<IWoodEntry[]>([]);
    const [isWoodEntryLoading, setIsWoodEntryLoading] = useState(false);
    const [selectedWoodEntryId, setSelectedWoodEntryId] = useState('');
    
    const [volume, setVolume] = useState('');
    const [volumeError, setVolumeError] = useState<string | null>(null);

    useEffect(() => {
        if (customerId) {
            setIsPuulaaniLoading(true);
            setSelectedPuulaaniId('');
            setSelectedWoodEntryId('');
            setVolume('');
            getActiveTimberStacksByClient(Number(customerId))
                .then(setPuulaaniList)
                .catch(err => console.error("Failed to fetch puulaanis:", err))
                .finally(() => setIsPuulaaniLoading(false));
        }
    }, [customerId]);
    
    useEffect(() => {
        if (selectedPuulaaniId) {
            setIsWoodEntryLoading(true);
            setSelectedWoodEntryId('');
            setVolume('');
            fetchWoodEntriesByPuulaani(Number(selectedPuulaaniId))
                .then(entries => setWoodEntryList(entries))
                .catch(err => console.error("Failed to fetch wood entries:", err))
                .finally(() => setIsWoodEntryLoading(false));
        } else {
            setWoodEntryList([]);
        }
    }, [selectedPuulaaniId]);

    // --- FIX: Ensure this function always returns a number ---
    const getAdjustedRemainingVolume = useCallback((woodEntry: IWoodEntry): number => {
        if (!woodEntry) return 0;
        const volumeInCurrentTrip = addedLegs
            .filter(leg => leg.puutavaraId === String(woodEntry.puutavaraId))
            .reduce((sum, leg) => sum + (leg.m3 || 0), 0);
        // Ensure result is a valid number, default to 0 if subtraction results in NaN
        return (Number(woodEntry.jaljella) || 0) - volumeInCurrentTrip;
    }, [addedLegs]);

    const filteredWoodEntryList = useMemo(() => {
        return woodEntryList.filter(entry => getAdjustedRemainingVolume(entry) > 0);
    }, [woodEntryList, getAdjustedRemainingVolume]);

    const selectedWoodEntry = useMemo(() => {
        if (!selectedWoodEntryId) return undefined;
        // Compare numbers with numbers for strict equality
        return woodEntryList.find(w => Number(w.puutavaraId) === Number(selectedWoodEntryId));
    }, [selectedWoodEntryId, woodEntryList]);

    const maxVolume = selectedWoodEntry ? getAdjustedRemainingVolume(selectedWoodEntry) : 0;
    
    useEffect(() => {
        if (!volume || !selectedWoodEntry) {
            setVolumeError(null); return;
        }
        const numVolume = Number(volume);
        if (isNaN(numVolume)) {
            setVolumeError("Invalid number.");
        } else if (numVolume <= 0) {
            setVolumeError("Volume must be > 0.");
        } else if (numVolume > maxVolume) {
            setVolumeError(`Cannot exceed remaining ${maxVolume.toFixed(2)} m³.`);
        } else {
            setVolumeError(null);
        }
    }, [volume, maxVolume, selectedWoodEntry]);
    
     const handleAddClick = () => {
        const puulaani = puulaaniList.find(p => Number(p.puulaaniId) === Number(selectedPuulaaniId));
        
        // This is a much safer check
        if (puulaani && selectedWoodEntry && volume && !volumeError) {
            console.log("SUCCESS: All conditions met. Calling onAdd...");
            onAdd({
                type: LoadTypeEnum.PUULAANI,
                puulaaniId: selectedPuulaaniId,
                puulaaniName: puulaani.nimi,
                puutavaraId: selectedWoodEntryId,
                puutavaraName: selectedWoodEntry.puutavaraName,
                purkupaikkaName: selectedWoodEntry.purkupaikkaName,
                m3: Number(volume)
            });
            // Reset local state after adding
            setSelectedPuulaaniId('');
            setSelectedWoodEntryId('');
            setVolume('');
        } else {
            // Log the state of each variable to see which one is failing
            console.error("FAILED: Conditions not met.", {
                isPuulaaniFound: !!puulaani,
                isSelectedWoodEntry: !!selectedWoodEntry,
                isVolumeEntered: !!volume,
                isVolumeValid: !volumeError
            });
        }
    };
    
    const isAddButtonDisabled = !selectedPuulaaniId || !selectedWoodEntryId || !!volumeError || !volume;

    return (
        <Stack spacing={2} sx={{p: 2}}>
            <FormControl fullWidth size="small" disabled={isPuulaaniLoading}>
                <InputLabel>Origin (Puulaani)</InputLabel>
                <Select value={selectedPuulaaniId} label="Origin (Puulaani)" onChange={(e) => setSelectedPuulaaniId(e.target.value)}>
                    {isPuulaaniLoading ? <MenuItem disabled><em>Loading...</em></MenuItem> : puulaaniList.map((p) => (<MenuItem key={p.puulaaniId} value={String(p.puulaaniId)}>{p.nimi}</MenuItem>))}
                </Select>
            </FormControl>
            <FormControl fullWidth size="small" disabled={!selectedPuulaaniId || isWoodEntryLoading}>
                <InputLabel>Timber Task</InputLabel>
                <Select value={selectedWoodEntryId} label="Timber Task" onChange={(e) => setSelectedWoodEntryId(e.target.value)}>
                    {isWoodEntryLoading ? <MenuItem disabled><em>Loading...</em></MenuItem> : 
                     filteredWoodEntryList.length > 0 ? (
                        // --- FIX: Explicitly type 'w' parameter ---
                        filteredWoodEntryList.map((w: IWoodEntry) => (
                            <MenuItem key={w.puutavaraId} value={String(w.puutavaraId)}>
                                {`${w.puutavaraName} to ${w.purkupaikkaName} (${getAdjustedRemainingVolume(w).toFixed(2)} m³ left)`}
                            </MenuItem>
                        ))
                     ) : ( <MenuItem disabled><em>No available tasks</em></MenuItem> )}
                </Select>
            </FormControl>
            
            <TextField 
                label="Volume (m³)" type="number" size="small" value={volume} 
                onChange={(e) => setVolume(e.target.value)} disabled={!selectedWoodEntryId}
                error={!!volumeError}
                helperText={volumeError || (maxVolume > 0 ? `Max available: ${maxVolume.toFixed(2)}` : 'Select a task')}
                InputProps={{ inputProps: { min: 0.01, step: "0.01" } }}
            />
            
            <Button onClick={handleAddClick} startIcon={<AddCircleOutlineIcon />} variant="outlined" disabled={isAddButtonDisabled}>
                Add Puulaani Leg
            </Button>
        </Stack>
    );
};

const AddRahtikirjaLegForm = ({ onAdd }: { onAdd: (data: Partial<TripLeg>) => void }) => {
    const [lahto, setLahto] = useState('');
    const [kohde, setKohde] = useState('');
    const [m3, setM3] = useState('');
    const [km, setKm] = useState('');

    const handleAddClick = () => {
        if (lahto && kohde) {
            onAdd({ 
                type: LoadTypeEnum.RAHTIKIRJA, 
                lahto, 
                kohde, 
                // --- THIS IS THE FIX ---
                // Convert empty string to undefined so the backend receives null
                m3: m3 ? Number(m3) : undefined, 
                km: km ? Number(km) : undefined 
            });
            setLahto(''); setKohde(''); setM3(''); setKm('');
        }
    };

    return (
        <Stack spacing={2} sx={{p: 2}}>
             <TextField label="Origin Address" size="small" value={lahto} onChange={(e) => setLahto(e.target.value)} />
             <TextField label="Destination Address" size="small" value={kohde} onChange={(e) => setKohde(e.target.value)} />
             <TextField label="Volume (m³)" type="number" size="small" value={m3} onChange={(e) => setM3(e.target.value)} />
             <TextField label="Distance (km)" type="number" size="small" value={km} onChange={(e) => setKm(e.target.value)} />
             <Button onClick={handleAddClick} startIcon={<AddCircleOutlineIcon />} variant="outlined" disabled={!lahto || !kohde}>Add Consignment Leg</Button>
        </Stack>
    );
};


export default function LoadFormModal({ open, onCloseAction, onSaveSuccessAction, initialData }: LoadFormModalProps) {
    const { user } = useAuth();
    const { selectedVehicleId, selectedVehicleRegNo } = useDriverSession();
    const isDriver = useMemo(() => user?.roles.includes('Kuljettaja') || false, [user]);
    const isEditMode = useMemo(() => !!initialData, [initialData]);
    const [activeStep, setActiveStep] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    const [driverList, setDriverList] = useState<IDriver[]>([]);

    const dynamicSchema = useMemo(() => getValidationSchema(isDriver), [isDriver]);

    const methods = useForm<MultiStopLoadFormData>({
        resolver: yupResolver(dynamicSchema) as any,
        context: { isDriver },
        defaultValues: { tyyppi: LoadTypeEnum.PUULAANI, asiakasId: '', pvm: dayjs().toDate(), legs: [] }
    });
    const { control, handleSubmit, reset, watch, trigger, formState: { errors, isValid } } = methods;
    const { fields, append, remove, update } = useFieldArray({ control, name: "legs" });
    
    const watchedValues = watch();
    const watchedCustomerId = watch('asiakasId');

    const loadDropdownData = useCallback(async () => {
        if (!open) return;
        setIsLoading(true);
        setError(null);
        try {
            const promises: [Promise<IBackendClient[]>, Promise<IVehicleBackendResponse[]>?, Promise<IBackendDriver[]>?] = [fetchAllClients()];
            if (!isDriver) {
                promises.push(fetchAllVehicles(), fetchAllDrivers());
            }
            const [clientsData, vehiclesData, driversData] = await Promise.all(promises);
            
            setClientList(clientsData.map((c: IBackendClient) => ({ id: String(c.asiakkaanId), name: c.asiakkaanNimi, clientId: String(c.asiakkaanId), clientName: c.asiakkaanNimi, targetColor: c.kohteenVari })));
            if (vehiclesData) setVehicleList(vehiclesData.map((v: IVehicleBackendResponse) => ({ id: String(v.kalustoNro), name: v.rekNro, vehicleNo: String(v.kalustoNro), registrationNo: v.rekNro })));
            if (driversData) setDriverList(driversData.map((d: IBackendDriver) => ({ driverId: d.kuljId, name: d.nimi, phoneNo: d.puhelinNro, email: d.email, hasAlerts: d.halytys })));
        
        } catch (err) {
            setError("Failed to load necessary data.");
        } finally {
            setIsLoading(false);
        }
    }, [open, isDriver]);

    useEffect(() => { loadDropdownData(); }, [loadDropdownData]);

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            reset({ tyyppi: LoadTypeEnum.PUULAANI, asiakasId: '', pvm: dayjs().toDate(), legs: [] });
        }
    }, [open, reset]);
    
     const handleAddLeg = (legData: Partial<TripLeg>) => {
        const existingLegIndex = fields.findIndex(leg => leg.puutavaraId === legData.puutavaraId);
        if (existingLegIndex > -1) {
            const existingLeg = fields[existingLegIndex];
            const newVolume = (existingLeg.m3 || 0) + (legData.m3 || 0);
            update(existingLegIndex, { ...existingLeg, m3: newVolume });
        } else {
            append({ id: dayjs().toISOString(), ...legData } as TripLeg);
        }
    };

    // --- THIS IS THE FIX (PART 2): Correct onSubmit logic ---
    const onSubmit: SubmitHandler<MultiStopLoadFormData> = async (formData) => {
        setIsSaving(true);
        setError(null);

        const driverId = isDriver ? user?.driverNumericId : Number(formData.kuljId);
        const vehicleId = isDriver ? selectedVehicleId : Number(formData.kalustoNro);
        
        if (!driverId || !vehicleId) {
            setError("Driver or Vehicle is missing. Please re-login.");
            setIsSaving(false);
            return;
        }
        
        // Create a separate 'kuorma' record for each leg
        const legPromises = formData.legs.map(leg => {
            const payload: ICreateLoadDto = {
                tyyppi: leg.type,
                asiakasId: Number(formData.asiakasId),
                pvm: formData.pvm!,
                ajomaaraysNro: formData.ajomaaraysNro,
                lisatiedot: formData.lisatiedot,
                kalustoNro: Number(vehicleId),
                kuljId: Number(driverId),

                // Leg-specific data
                puulaaniId: leg.puulaaniId ? Number(leg.puulaaniId) : undefined,
                puutavaraId: leg.puutavaraId ? Number(leg.puutavaraId) : undefined,
                lahto: leg.lahto || leg.puulaaniName,
                kohde: leg.kohde || leg.purkupaikkaName,
                m3: leg.m3,
                km: leg.km,
            };
            return createLoad(payload);
        });
        
        try {
            await Promise.all(legPromises);
            onSaveSuccessAction('Trip created successfully with all legs!');
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred while creating the trip.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleNext = async () => {
        let fieldsToValidate: (keyof MultiStopLoadFormData)[] = [];

        if (activeStep === 0) {
            fieldsToValidate = ['tyyppi', 'asiakasId', 'pvm'];
            if (!isDriver) {
                fieldsToValidate.push('kalustoNro', 'kuljId');
            }
        } else if (activeStep === 1) {
            fieldsToValidate = ['legs'];
        }

        const isStepValid = await trigger(fieldsToValidate, { shouldFocus: true });

        if (isStepValid) {
            setActiveStep((prev) => prev + 1);
        }
    };

    
    const steps = ['Basic Details', 'Manage Trip Legs', 'Summary'];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='fi'>
            <Dialog open={open} onClose={onCloseAction} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">Create New Multi-Stop Trip</Typography>
                    <IconButton aria-label="close" onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton>
                </DialogTitle>
                <FormProvider {...methods}>
                    <Box component="form" id="load-form" onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
                        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, minHeight: '60vh' }}>
                            {isLoading ? <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box> :
                            <>
                                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>{steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
                                <Box sx={{ mt: 2 }}>
                                    {activeStep === 0 && (
                                        <Stack spacing={2.5}>
                                            <FormControl component="fieldset">
                                                <Typography variant="overline" color="text.secondary">Load Type</Typography>
                                                <Controller name="tyyppi" control={control} render={({ field }) => (
                                                    <RadioGroup row {...field} onChange={(e) => { field.onChange(Number(e.target.value)); remove(); }}>
                                                        <FormControlLabel value={LoadTypeEnum.PUULAANI} control={<Radio />} label="Puulaani (Multi-Pickup)" />
                                                        <FormControlLabel value={LoadTypeEnum.RAHTIKIRJA} control={<Radio />} label="Rahtikirja (Consignment)" />
                                                    </RadioGroup>
                                                )}/>
                                            </FormControl>
                                            <Divider />
                                            <FormControl fullWidth required error={!!errors.asiakasId}><InputLabel>Customer</InputLabel><Controller name="asiakasId" control={control} render={({ field }) => (<Select {...field} label="Customer" value={field.value || ''}>{clientList.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select>)}/>{errors.asiakasId && <FormHelperText>{errors.asiakasId.message}</FormHelperText>}</FormControl>
                                            
                                            {!isDriver && (
                                                <>
                                                    <FormControl fullWidth required error={!!errors.kalustoNro}><InputLabel>Vehicle</InputLabel><Controller name="kalustoNro" control={control} render={({ field }) => (<Select {...field} label="Vehicle" value={field.value || ''}>{vehicleList.map(v => <MenuItem key={v.id} value={v.id}>{v.registrationNo}</MenuItem>)}</Select>)}/>{errors.kalustoNro && <FormHelperText>{errors.kalustoNro.message}</FormHelperText>}</FormControl>
                                                    <FormControl fullWidth required error={!!errors.kuljId}><InputLabel>Driver</InputLabel><Controller name="kuljId" control={control} render={({ field }) => (<Select {...field} label="Driver" value={field.value || ''}>{driverList.map(d => <MenuItem key={d.driverId} value={d.driverId}>{d.name}</MenuItem>)}</Select>)}/>{errors.kuljId && <FormHelperText>{errors.kuljId.message}</FormHelperText>}</FormControl>
                                                </>
                                            )}
                                            
                                            <Controller name="pvm" control={control} render={({ field }) => (<DatePicker label="Date *" value={dayjs(field.value)} onChange={(date) => field.onChange(date?.toDate() ?? null)} slotProps={{ textField: { fullWidth: true, error: !!errors.pvm, helperText: errors.pvm?.message } }}/>)}/>
                                            <Controller name="ajomaaraysNro" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Driving Order No." fullWidth />}/>
                                            <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="General Notes for the Trip" multiline rows={3} fullWidth />}/>
                                        </Stack>
                                    )}
                                    {activeStep === 1 && (
                                        <Stack spacing={2}>
                                            <Typography variant="h6">Trip Legs</Typography>
                                            <Paper variant="outlined" sx={{ minHeight: '100px' }}>
                                                <List dense>
                                                    {fields.map((leg, index) => (
                                                        <ListItem key={leg.id} divider secondaryAction={<IconButton edge="end" onClick={() => remove(index)}><DeleteIcon color="error"/></IconButton>}>
                                                            <ListItemText 
                                                                primary={`${leg.type === LoadTypeEnum.PUULAANI ? `Puulaani: ${leg.puulaaniName}` : `Consignment: ${leg.lahto} -> ${leg.kohde}`}`}
                                                                secondary={`Volume: ${leg.m3 || 'N/A'} m³`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                    {fields.length === 0 && <Typography sx={{p: 2, color: 'text.secondary', textAlign: 'center'}}>No legs added yet.</Typography>}
                                                </List>
                                            </Paper>
                                            {errors.legs && <FormHelperText error sx={{textAlign: 'center'}}>{errors.legs?.message}</FormHelperText>}
                                           {watchedValues.tyyppi === LoadTypeEnum.PUULAANI ? (
                                                <Accordion defaultExpanded disabled={!watchedValues.asiakasId}>
                                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Add Puulaani Leg</Typography></AccordionSummary>
                                                    <AccordionDetails>
                                        {/* --- THIS IS THE FIX --- */}
                                        <AddPuulaaniLegForm 
                                            onAdd={handleAddLeg} 
                                            customerId={watchedValues.asiakasId} 
                                            addedLegs={watchedValues.legs} 
                                                    />
                                                </AccordionDetails>
                                            </Accordion>
                                        ) : (
                                            <Accordion defaultExpanded disabled={!watchedValues.asiakasId}><AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Add Consignment Leg</Typography></AccordionSummary><AccordionDetails><AddRahtikirjaLegForm onAdd={handleAddLeg} /></AccordionDetails></Accordion>
                                        )}
                                    </Stack>
                                    )}
                                    {activeStep === 2 && (
                                        <Paper variant="outlined" sx={{p: 2.5}}>
                                             <Typography variant="h6" gutterBottom>Summary</Typography>
                                             <Stack divider={<Divider flexItem />}>
                                                 <SummaryItem label="Customer" value={clientList.find(c => c.id === watchedValues.asiakasId)?.name} />
                                                 {isDriver ? <SummaryItem label="Vehicle" value={selectedVehicleRegNo} /> : <SummaryItem label="Vehicle" value={vehicleList.find(v=>v.id === watchedValues.kalustoNro)?.registrationNo} />}
                                                 {isDriver ? <SummaryItem label="Driver" value={user?.fullName} /> : <SummaryItem label="Driver" value={driverList.find(d=> String(d.driverId) === watchedValues.kuljId)?.name} />}
                                                 <SummaryItem label="Date" value={dayjs(watchedValues.pvm).format('DD/MM/YYYY')} />
                                                 <SummaryItem label="Driving Order #" value={watchedValues.ajomaaraysNro} />
                                             </Stack>
                                             <Divider sx={{my: 2}}><Chip label={`Trip Legs (${fields.length})`} /></Divider>
                                                <Stack divider={<Divider flexItem />}>
                                                  {fields.map((leg: TripLeg, index: number) => (
                                                 <Box key={leg.id} sx={{py: 1}}>
                                                 <Typography variant="subtitle2" gutterBottom>{`Leg ${index + 1}: ${leg.type === LoadTypeEnum.PUULAANI ? 'Puulaani Pickup' : 'Consignment'}`}</Typography>
                                                         {leg.type === LoadTypeEnum.PUULAANI ? (
                                                            <><SummaryItem label="Origin" value={leg.puulaaniName}/><SummaryItem label="Task" value={`${leg.puutavaraName} -> ${leg.purkupaikkaName}`}/></>
                                                         ) : (
                                                            <><SummaryItem label="Origin" value={leg.lahto}/><SummaryItem label="Destination" value={leg.kohde}/></>
                                                         )}
                                                         <SummaryItem label="Volume" value={leg.m3 ? `${leg.m3} m³` : 'N/A'}/>
                                                         {leg.km && <SummaryItem label="Distance" value={`${leg.km} km`}/>}
                                                     </Box>
                                                 ))}
                                             </Stack>
                                        </Paper>
                                    )}
                                </Box>
                            </>
                            }
                        </DialogContent>
                         <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button onClick={onCloseAction}>Cancel</Button>
                        <Box sx={{ flex: '1 1 auto' }} />
                        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
                        
                        {activeStep < steps.length - 1 && (
                            <Button 
                                variant="contained" 
                                onClick={handleNext}
                                // The button is disabled if the required fields for the current step have errors
                                // or if they haven't been touched/filled yet.
                                disabled={
                                    (activeStep === 0 && (!!errors.asiakasId || !!errors.pvm || !watchedValues.asiakasId))
                                }
                            >
                                Next
                            </Button>
                        )}
                         
                        {activeStep === steps.length - 1 && (
                            <Button 
                                type="submit" 
                                variant="contained" 
                                disabled={isSaving || !isValid} // For the final step, we check the whole form's validity
                            >
                                {isSaving ? <CircularProgress size={24} /> : 'Confirm & Create Trip'}
                            </Button>
                            )}
                        </DialogActions>
                    </Box>
                </FormProvider>
            </Dialog>
        </LocalizationProvider>
    );
}
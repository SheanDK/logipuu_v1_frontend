// frontend/src/components/loads/LoadFormModal.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, CircularProgress, Alert,
    Stack, Typography, IconButton, Paper, List, ListItemButton, ListItemText, Divider,
    Stepper, Step, StepLabel
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { useAuth } from '@/contexts/AuthContext';
import { 
    IClientBasicInfo, IVehicleBasicInfo, IDriver, ILoadFormData, LoadTypeEnum, 
    ITimberStackListItem, ICreateLoadDto, ILoad, IUpdateLoadDto, IWoodEntry,
    IBackendClient, IVehicleBackendResponse, IBackendDriver, ILoadDetails
} from '@/types';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService';
import { fetchAllDrivers } from '@/services/driverService';
import { getActiveTimberStacksByClient, fetchWoodEntriesByPuulaani } from '@/services/timberStackService';
import { createLoad, updateLoad } from '@/services/loadService';

interface LoadFormModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (message: string) => void;
    initialData: ILoadDetails | null;
}

const loadSchema = yup.object({
    asiakasId: yup.string().required('Customer is required'),
    kalustoNro: yup.string().required('Vehicle is required'),
    kuljId: yup.string().required('Driver is required'),
    pvm: yup.date().required('Date is required').typeError('A valid date is required'),
    puulaaniId: yup.string().required('Origin (Puulaani) is required'),
    puutavaraId: yup.string().required('A timber task must be selected'),
    ajomaaraysNro: yup.string().nullable(),
    m3: yup.number()
        .typeError('Must be a valid number')
        .transform(value => (isNaN(value) ? undefined : value))
        .nullable()
        .min(0.01, 'Volume must be greater than 0')
        .test('max-volume', 'Volume cannot exceed remaining amount', function(value) {
            const { woodEntryList, puutavaraId } = this.options.context as any;
            if (!value || !puutavaraId || !woodEntryList) return true;
            const selectedEntry = woodEntryList.find((e: IWoodEntry) => String(e.puutavaraId) === puutavaraId);
            return selectedEntry ? value <= selectedEntry.jaljella : true;
        }),
});

type FormFields = keyof ILoadFormData;

const SummaryItem = ({ label, value }: { label: string, value?: string | number | null }) => (
    <Box sx={{ display: 'flex', py: 1 }}><Typography variant="body2" color="text.secondary" sx={{ width: '120px', flexShrink: 0 }}>{label}:</Typography><Typography variant="body2" fontWeight="bold">{value ?? 'N/A'}</Typography></Box>
);

export default function LoadFormModal({ open, onCloseAction, onSaveSuccessAction, initialData }: LoadFormModalProps) {
    const { user } = useAuth();
    const isDriver = useMemo(() => user?.roles.includes('Kuljettaja'), [user]);
    const [activeStep, setActiveStep] = useState(0);
    const isEditMode = useMemo(() => !!initialData, [initialData]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    const [driverList, setDriverList] = useState<IDriver[]>([]);
    const [puulaaniList, setPuulaaniList] = useState<ITimberStackListItem[]>([]);
    const [isPuulaaniLoading, setIsPuulaaniLoading] = useState(false);
    const [woodEntryList, setWoodEntryList] = useState<IWoodEntry[]>([]);
    const [isWoodEntryLoading, setIsWoodEntryLoading] = useState(false);

    const { control, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<ILoadFormData>({
        resolver: yupResolver(loadSchema)as any,
        mode: 'onChange',
        context: { woodEntryList },
        defaultValues: { tyyppi: LoadTypeEnum.PUULAANI, asiakasId: '', puulaaniId: '', puutavaraId: '', kalustoNro: '', kuljId: '', pvm: dayjs().toDate(), ajomaaraysNro: '', m3: undefined }
    });

    const watchedValues = watch();
    const selectedCustomerId = watch('asiakasId');
    const selectedPuulaaniId = watch('puulaaniId');
    const selectedPuutavaraId = watch('puutavaraId');
    const selectedWoodEntry = useMemo(() => woodEntryList.find(w => String(w.puutavaraId) === selectedPuutavaraId), [selectedPuutavaraId, woodEntryList]);

    const loadDropdownData = useCallback(async () => {
        if (!open) return;
        setIsLoading(true);
        setError(null);
        try {
            const [clientsData, vehiclesData, driversData] = await Promise.all([ fetchAllClients(), fetchAllVehicles(), fetchAllDrivers() ]);
            setClientList(clientsData.map((c: IBackendClient) => ({ id: String(c.asiakkaanId), name: c.asiakkaanNimi, clientId: String(c.asiakkaanId), clientName: c.asiakkaanNimi, targetColor: c.kohteenVari })));
            setVehicleList(vehiclesData.map((v: IVehicleBackendResponse) => ({ id: String(v.kalustoNro), name: v.rekNro, vehicleNo: String(v.kalustoNro), registrationNo: v.rekNro })));
            setDriverList(driversData.map((d: IBackendDriver) => ({ driverId: d.kuljId, name: d.nimi, phoneNo: d.puhelinNro, email: d.email, hasAlerts: d.halytys })));
        } catch (err) { setError("Failed to load necessary data.");
        } finally { setIsLoading(false); }
    }, [open]);

    useEffect(() => { loadDropdownData(); }, [loadDropdownData]);

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            if (isEditMode && initialData) {
                reset({
                    tyyppi: initialData.tyyppi,
                    asiakasId: String(initialData.asiakasId ?? ''),
                    puulaaniId: String(initialData.puulaaniId ?? ''),
                    puutavaraId: String(initialData.puutavaraId ?? ''),
                    kalustoNro: String(initialData.kalustoNro ?? ''),
                    kuljId: String(initialData.kuljId ?? ''),
                    pvm: initialData.pvm ? new Date(initialData.pvm) : new Date(),
                    ajomaaraysNro: initialData.ajomaaraysNro || '',
                    m3: initialData.taskVolume
                });
            } else {
                const defaultVals: Partial<ILoadFormData> = { tyyppi: LoadTypeEnum.PUULAANI, asiakasId: '', puulaaniId: '', puutavaraId: '', kalustoNro: '', kuljId: '', pvm: dayjs().toDate(), ajomaaraysNro: '', m3: undefined };
                if (isDriver && user?.driverNumericId) {
                    defaultVals.kuljId = String(user.driverNumericId);
                }
                reset(defaultVals);
            }
        }
    }, [open, isEditMode, initialData, reset, isDriver, user]);

    useEffect(() => {
        const fetchPuulaanis = async () => {
            if (selectedCustomerId) {
                setIsPuulaaniLoading(true);
                if (!isEditMode || (isEditMode && initialData?.asiakasId !== Number(selectedCustomerId))) {
                    setValue('puulaaniId', '');
                    setValue('puutavaraId', '');
                }
                setWoodEntryList([]);
                try { const puulaanis = await getActiveTimberStacksByClient(Number(selectedCustomerId)); setPuulaaniList(puulaanis);
                } catch (error) { setPuulaaniList([]);
                } finally { setIsPuulaaniLoading(false); }
            } else { setPuulaaniList([]); setWoodEntryList([]); }
        };
        fetchPuulaanis();
    }, [selectedCustomerId, setValue, isEditMode, initialData]);
    
    useEffect(() => {
        const fetchWoodEntries = async () => {
            if (selectedPuulaaniId) {
                setIsWoodEntryLoading(true);
                if (!isEditMode || (isEditMode && initialData?.puulaaniId !== Number(selectedPuulaaniId))) {
                    setValue('puutavaraId', '');
                }
                try {
                    const entries = await fetchWoodEntriesByPuulaani(Number(selectedPuulaaniId));
                    setWoodEntryList(entries.filter(e => e.jaljella > 0));
                } catch (error) { setWoodEntryList([]);
                } finally { setIsWoodEntryLoading(false); }
            } else { setWoodEntryList([]); }
        };
        fetchWoodEntries();
    }, [selectedPuulaaniId, setValue, isEditMode, initialData]);

    const handleNext = async () => {
        let fieldsToValidate: FormFields[] = [];
        if (activeStep === 0) fieldsToValidate = ['asiakasId', 'kalustoNro', 'kuljId', 'pvm'];
        if (activeStep === 1) fieldsToValidate = ['puulaaniId', 'puutavaraId', 'm3'];
        const isValid = await trigger(fieldsToValidate);
        if (isValid) setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const onSubmit: SubmitHandler<ILoadFormData> = async (formData) => {
        setIsSaving(true);
        setError(null);
        const selectedPuulaani = puulaaniList.find(p => p.puulaaniId === Number(formData.puulaaniId));
        const payload: ICreateLoadDto | IUpdateLoadDto = {
            tyyppi: LoadTypeEnum.PUULAANI, asiakasId: Number(formData.asiakasId), puulaaniId: Number(formData.puulaaniId),
            puutavaraId: Number(formData.puutavaraId), kalustoNro: Number(formData.kalustoNro), kuljId: Number(formData.kuljId),
            pvm: formData.pvm!, ajomaaraysNro: formData.ajomaaraysNro, lahto: selectedPuulaani?.nimi,
            kohde: selectedWoodEntry?.purkupaikkaName, m3: formData.m3,
        };
        try {
            if (isEditMode) {
                await updateLoad(initialData!.kuormaId, payload);
                onSaveSuccessAction('Load updated successfully!');
            } else {
                await createLoad(payload as ICreateLoadDto);
                onSaveSuccessAction('Load created successfully!');
            }
        } catch (err: any) { setError(err.response?.data?.message || "An error occurred.");
        } finally { setIsSaving(false); }
    };

    const steps = ['Basic Details', 'Trip Details', 'Summary'];
    
    const isStepValid = () => {
        if (activeStep === 0) return !errors.asiakasId && !errors.kalustoNro && !errors.kuljId && !errors.pvm && watchedValues.asiakasId && watchedValues.kalustoNro && watchedValues.kuljId && watchedValues.pvm;
        if (activeStep === 1) return !errors.puulaaniId && !errors.puutavaraId && !errors.m3 && watchedValues.puulaaniId && watchedValues.puutavaraId && watchedValues.m3;
        return true;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onCloseAction} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">{isEditMode ? 'Edit Load' : 'Create New Load'}</Typography>
                    <IconButton aria-label="close" onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" id="load-form" onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><CircularProgress /></Box>
                        : (
                            <>
                                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
                                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                                    {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
                                </Stepper>
                                <Box sx={{ mt: 2, minHeight: 350 }}>
                                    {activeStep === 0 && (
                                        <Stack spacing={2.5}>
                                            <FormControl fullWidth required error={!!errors.asiakasId}><InputLabel>Customer</InputLabel><Controller name="asiakasId" control={control} render={({ field }) => (<Select {...field} label="Customer" value={field.value || ''}>{clientList.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}</Select>)}/>{errors.asiakasId && <FormHelperText>{errors.asiakasId.message}</FormHelperText>}</FormControl>
                                            <FormControl fullWidth required error={!!errors.kalustoNro}><InputLabel>Vehicle</InputLabel><Controller name="kalustoNro" control={control} render={({ field }) => (<Select {...field} label="Vehicle" value={field.value || ''}>{vehicleList.map((v) => (<MenuItem key={v.id} value={v.id}>{v.registrationNo}</MenuItem>))}</Select>)}/>{errors.kalustoNro && <FormHelperText>{errors.kalustoNro.message}</FormHelperText>}</FormControl>
                                            <FormControl fullWidth required error={!!errors.kuljId} disabled={isDriver}><InputLabel>Driver</InputLabel><Controller name="kuljId" control={control} render={({ field }) => (<Select {...field} label="Driver" value={field.value || ''}>{driverList.map((d) => (<MenuItem key={d.driverId} value={d.driverId}>{d.name}</MenuItem>))}</Select>)}/>{errors.kuljId && <FormHelperText>{errors.kuljId.message}</FormHelperText>}</FormControl>
                                            <Controller name="pvm" control={control} render={({ field }) => (<DatePicker label="Date *" value={field.value ? dayjs(field.value) : null} onChange={(date) => field.onChange(date?.toDate() ?? null)} slotProps={{ textField: { fullWidth: true, error: !!errors.pvm, helperText: errors.pvm?.message } }}/>)}/>
                                            <Controller name="ajomaaraysNro" control={control} render={({ field }) => <TextField {...field} value={field.value || ''} label="Driving Order No." fullWidth />}/>
                                        </Stack>
                                    )}
                                    {activeStep === 1 && (
                                        <Stack spacing={2.5}>
                                            <FormControl fullWidth required error={!!errors.puulaaniId} disabled={!selectedCustomerId || isPuulaaniLoading}><InputLabel>Origin (Puulaani)</InputLabel><Controller name="puulaaniId" control={control} render={({ field }) => (<Select {...field} label="Origin (Puulaani)" value={field.value || ''}>{isPuulaaniLoading ? <MenuItem disabled><em>Loading...</em></MenuItem> : puulaaniList.map((p) => (<MenuItem key={p.puulaaniId} value={p.puulaaniId}>{p.nimi}</MenuItem>))}</Select>)}/>{errors.puulaaniId && <FormHelperText>{errors.puulaaniId.message}</FormHelperText>}</FormControl>
                                            <Paper variant="outlined" sx={{ p: 2, opacity: selectedPuulaaniId ? 1 : 0.5 }}>
                                                <Typography variant="overline" color="text.secondary">Select Timber Task</Typography>
                                                {isWoodEntryLoading ? <Box sx={{my: 2, display: 'flex', justifyContent: 'center'}}><CircularProgress size={24}/></Box>
                                                 : woodEntryList.length > 0 ? (
                                                    <List dense sx={{ width: '100%', maxHeight: 200, overflowY: 'auto', bgcolor: 'background.paper' }}>
                                                        {woodEntryList.map(entry => (<ListItemButton key={entry.puutavaraId} selected={String(entry.puutavaraId) === selectedPuutavaraId} onClick={() => setValue('puutavaraId', String(entry.puutavaraId), { shouldValidate: true })}><ListItemText primary={<Typography variant="body2" fontWeight="bold">{entry.puutavaraName || 'Timber'}</Typography>} secondary={`To: ${entry.purkupaikkaName || 'Unknown'} | Remaining: ${entry.jaljella} m³`}/></ListItemButton>))}
                                                    </List>
                                                 ) : <Typography sx={{mt: 1, p: 1}} color="text.secondary">{ selectedPuulaaniId ? "No available timber entries." : "Select a Puulaani to see tasks."}</Typography>
                                                }
                                                {errors.puutavaraId && <FormHelperText error sx={{ml: 2}}>{errors.puutavaraId.message}</FormHelperText>}
                                            </Paper>
                                            {selectedPuutavaraId && (
                                                <Controller
                                                    name="m3"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            // --- THIS IS THE FIX ---
                                                            // Ensure the value is never undefined. If it's null or undefined, use an empty string.
                                                            value={field.value ?? ''} 
                                                            label="Volume to Load (m³)"
                                                            type="number"
                                                            fullWidth
                                                            required
                                                            error={!!errors.m3}
                                                            helperText={errors.m3?.message || `Max remaining: ${selectedWoodEntry?.jaljella || 0} m³`}
                                                        />
                                                    )}
                                                />
                                            )}
                                        </Stack>
                                    )}
                                    {activeStep === 2 && (
                                         <Paper variant="outlined" sx={{ p: 2.5 }}>
                                            <Typography variant="h6" gutterBottom>Summary</Typography>
                                            
                                            {/* --- THIS IS THE FIX (PART 2): Use Stack with divider prop --- */}
                                            <Stack divider={<Divider flexItem />}>
                                                <SummaryItem label="Customer" value={clientList.find(c => c.id === watchedValues.asiakasId)?.name} />
                                                <SummaryItem label="Vehicle" value={vehicleList.find(v => v.id === watchedValues.kalustoNro)?.registrationNo} />
                                                <SummaryItem label="Driver" value={driverList.find(d => String(d.driverId) === String(watchedValues.kuljId))?.name} />
                                                <SummaryItem label="Date" value={dayjs(watchedValues.pvm).format('DD/MM/YYYY')} />
                                                <SummaryItem label="Origin" value={puulaaniList.find(p => String(p.puulaaniId) === watchedValues.puulaaniId)?.nimi} />
                                                <SummaryItem label="Task" value={`${selectedWoodEntry?.puutavaraName || 'N/A'} to ${selectedWoodEntry?.purkupaikkaName || 'N/A'}`} />
                                                <SummaryItem label="Volume" value={watchedValues.m3 ? `${watchedValues.m3} m³` : 'N/A'} />
                                                {watchedValues.ajomaaraysNro && <SummaryItem label="Driving Order #" value={watchedValues.ajomaaraysNro} />}
                                            </Stack>
                                        </Paper>
                                    )}
                                </Box>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                         <Button onClick={onCloseAction}>Cancel</Button>
                         <Box sx={{ flex: '1 1 auto' }} />
                         {activeStep > 0 && <Button onClick={handleBack} disabled={isSaving}>Back</Button>}
                         {activeStep < steps.length - 1 && <Button variant="contained" onClick={handleNext} disabled={!isStepValid()}>Next</Button>}
                         {activeStep === steps.length - 1 && (
                            <Button type="submit" form="load-form" variant="contained" disabled={isSaving}>
                                {isSaving ? <CircularProgress size={24} /> : (isEditMode ? 'Update Load' : 'Confirm & Start Trip')}
                            </Button>
                         )}
                    </DialogActions>
                </Box>
            </Dialog>
        </LocalizationProvider>
    );
}
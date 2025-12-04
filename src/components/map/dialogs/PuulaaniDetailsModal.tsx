// frontend/src/components/map/dialogs/PuulaaniDetailsModal.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, CircularProgress, Box, Typography, Divider, Checkbox, FormControlLabel, Alert, Paper, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler, FormProvider, useFieldArray, FieldValues } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useWatch } from "react-hook-form";

// --- 1. Import LocationPicker ---
import LocationPicker from '@/components/common/LocationPicker';

import {
    IMapTimberStack, IVehicleBasicInfo, IMapDropoffLocation, IPuutavaraItem, IUpdateTimberStackFullDto, IAddTimberStackWoodEntryFormData,
    PendingPuulaaniData, ICreateTimberStackDto, IClientBasicInfo, PuulaaniFormData
} from '../../../types';
import { useMessage } from '@/utils/useMessage';
import { fetchTimberStackFullDetails, updateTimberStackFull, fetchAllWoodTypes, createTimberStack } from '@/services/timberStackService';
import { fetchAllDropoffLocations } from '@/services/unloadingSiteService';
import { fetchVehiclesListApi } from '@/services/vehicleService';

import AutoSelect from '../lists/AutoSelect';
import { AddWoodEntry } from '../lists/AddWoodEntry';
import { WoodEntryList } from '../lists/WoodEntryList';

import { useTranslation } from '@/i18n/useTranslation';

interface PuulaaniDetailsModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: () => void;
    initialData: IMapTimberStack | Partial<PendingPuulaaniData> | null;
    clientList: IClientBasicInfo[];
    // --- 2. Add the new prop ---
    showMap?: boolean;
}

export default function PuulaaniDetailsModal({
    open,
    onCloseAction,
    onSaveSuccessAction,
    initialData,
    clientList,
    showMap = false
}: PuulaaniDetailsModalProps) {
    const isEditMode = useMemo(() => !!(initialData && 'id' in initialData), [initialData]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    const [woodTypeList, setWoodTypeList] = useState<IPuutavaraItem[]>([]);
    const [dropoffLocationList, setDropoffLocationList] = useState<IMapDropoffLocation[]>([]);
    const { errorMessage, setErrorMessage } = useMessage();

    const { t } = useTranslation(['puulaaniDetailsModal', 'common']);

    const getValidationSchema = useMemo(
    () => (isEdit: boolean) => yup.object({
      name: yup.string().required(t('errors.nameRequired')),
      isActive: yup.boolean().required(),
      isCompleted: yup.boolean().required(),
      additionalInfo: yup.string().nullable(),
      selectedAutoIds: yup.array().of(yup.number().required()).default([]),
      woodEntries: yup.array().of(yup.object()).default([]),
      date: isEdit ? yup.mixed<Dayjs>().nullable().required(t('errors.dateRequired')) : yup.mixed().notRequired(),
      dispatchOrderNo: yup.string().nullable(),
      kilometers: yup.number().typeError(t('errors.mustBeNumber')).nullable().min(0),
      autoNro: yup.string().nullable(),
    }),
    [t]
  );

    const methods = useForm<PuulaaniFormData>({
        resolver: yupResolver(getValidationSchema(isEditMode)) as any,
    });
    const { control, handleSubmit, reset, watch, setValue, formState: { isDirty, isValid } } = methods;

    const latValue = watch('latitude');
    const lngValue = watch('longitude');

    const isActive = useWatch({ control, name: "isActive" });
    const isCompleted = useWatch({ control, name: "isCompleted" });

    const { fields: woodEntryFields, append, remove, update } = useFieldArray({ control, name: "woodEntries", keyName: "keyId" });

    const selectedAutoIds = watch('selectedAutoIds', []);
    useEffect(() => {
        if (isEditMode) {
            const selectedVehiclesText = vehicleList
                .filter(v => selectedAutoIds && selectedAutoIds.includes(Number(v.id)))
                .map(v => v.registrationNo)
                .join(', ');
            setValue('autoNro', selectedVehiclesText);
        }
    }, [selectedAutoIds, vehicleList, setValue, isEditMode]);

    const loadData = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    setError(null);
    try {
        // Fetch common dropdown data
        const [woodTypes, dropoffs, vehicles] = await Promise.all([
            fetchAllWoodTypes(),
            fetchAllDropoffLocations(),
            fetchVehiclesListApi()
        ]);
        setWoodTypeList(woodTypes);
        setVehicleList(vehicles);
        setDropoffLocationList(dropoffs.map(d => ({
            id: d.purkupaikkaId,
            name: d.purkupaikka,
            clientId: d.asiakasId,
            clientName: d.clientName || 'N/A',
            latitude: d.sijaintiLat!,
            longitude: d.sijaintiLong!,
            isVisibleOnMap: d.isVisibleOnMap
        })));

        // Handle Edit Mode
        if (isEditMode && initialData && 'id' in initialData) {
            const details = await fetchTimberStackFullDetails(initialData.id);
            
            // --- THIS IS THE FIX ---
            // Prepare the data structure that the 'reset' function expects.
            const formDataForReset = {
                    name: details.puulaani.nimi,
                    date: details.puulaani.pvm ? dayjs(details.puulaani.pvm) : null,
                    dispatchOrderNo: details.puulaani.ajomaaraysnro,
                    kilometers: details.puulaani.km ? parseFloat(details.puulaani.km) : null,
                    isActive: details.puulaani.aktiivinen,
                    isCompleted: details.puulaani.valmis,
                    additionalInfo: details.puulaani.lisatiedot,
                    autoNro: details.puulaani.autoNro || '',
                    selectedAutoIds: details.autot,
                    latitude: Number(details.puulaani.sijaintiLat),
                    longitude: Number(details.puulaani.sijaintiLong),
                    woodEntries: details.timberEntries.map((p: any) => ({
                        id: p.puutavaraId,
                        puutavaraId: p.puutavaraId,
                        woodTypeId: Number(p.puutavaraNro),
                        dropoffLocationId: Number(p.purkupaikkaId),
                        totalVolume: Number(p.kuutiot),
                        fetchedVolume: Number(p.haettu),
                        remainingVolume: Number(p.jaljella),
                        valmis: p.valmis === true || p.valmis === 'true'
                    }))
                };
                
                reset(formDataForReset);


        // Handle Create Mode (from a map click with pending data)
        } else if (!isEditMode && initialData) {
            reset({
                name: initialData.name || '',
                isActive: (initialData as Partial<PendingPuulaaniData>)?.isActive ?? true,
                isCompleted: (initialData as Partial<PendingPuulaaniData>)?.isCompleted ?? false,
                additionalInfo: (initialData as Partial<PendingPuulaaniData>)?.additionalInfo || null,
                selectedAutoIds: [],
                woodEntries: [],
                latitude: initialData.latitude,
                longitude: initialData.longitude,
            });
        }
    } catch (err: any) {
        setError(err.response?.data?.message || t('errors.loadFailed'));
    } finally {
        setIsLoading(false);
    }
}, [open, initialData, isEditMode, reset, t]);

    useEffect(() => { loadData(); }, [open]);

    const handleLocationChange = (lat: string, lng: string) => {
        setValue('latitude', parseFloat(lat), { shouldDirty: true, shouldValidate: true });
        setValue('longitude', parseFloat(lng), { shouldDirty: true, shouldValidate: true });
    };

    const handleAddWoodEntry = (data: IAddTimberStackWoodEntryFormData) => {
        setErrorMessage(''); // Clear any previous error messages

        const newWoodTypeId = Number(data.woodTypeId!);
        const newDropoffLocationId = Number(data.dropoffLocationId!);
        const volumeToAdd = Number(data.volume);

        // Find the index of an existing entry with the same combination
        const existingEntryIndex = woodEntryFields.findIndex(item =>
            Number(item.woodTypeId) === newWoodTypeId &&
            Number(item.dropoffLocationId) === newDropoffLocationId
        );

        if (existingEntryIndex !== -1) {
            // --- ENTRY EXISTS: UPDATE THE EXISTING ROW ---
            const existingEntry = woodEntryFields[existingEntryIndex];

            const newTotalVolume = (Number(existingEntry.totalVolume) || 0) + volumeToAdd;
            const existingFetchedVolume = Number(existingEntry.fetchedVolume) || 0;

            // Create the updated entry object
            const updatedEntry = {
                ...existingEntry, // Keep all other properties like id, puutavaraId etc.
                totalVolume: newTotalVolume,
                fetchedVolume: existingFetchedVolume, // Fetched volume doesn't change when adding more total volume
                remainingVolume: newTotalVolume - existingFetchedVolume,
                valmis: false 
            };

            // Use the 'update' function from useFieldArray to replace the entry at the found index
            update(existingEntryIndex, updatedEntry);

        } else {
            // --- ENTRY DOES NOT EXIST: ADD A NEW ROW ---
            append({
                id: Date.now(), // Temporary unique ID for React key
                puutavaraId: 0, // This is a new item, not yet in DB
                woodTypeId: newWoodTypeId,
                dropoffLocationId: newDropoffLocationId,
                totalVolume: volumeToAdd,
                fetchedVolume: 0, // A new entry always starts with 0 fetched
                remainingVolume: volumeToAdd,
                valmis: false
            });
        }
    };

    const handleUpdateWoodEntry = (index: number, newValues: { totalVolume: number, fetchedVolume: number }) => {
        const currentEntry = woodEntryFields[index];
        const { totalVolume, fetchedVolume } = newValues;

        // Server-side validation is primary, but a client-side check is good UX.
        if (fetchedVolume > totalVolume) {
            setErrorMessage(t('errors.retrievedGtCubes'));
            return;
        }
        setErrorMessage(''); // Clear error if validation passes

        // Perform a single, atomic update using the 'update' function from useFieldArray
        update(index, {
            ...currentEntry,
            totalVolume: totalVolume,
            fetchedVolume: fetchedVolume,
            remainingVolume: totalVolume - fetchedVolume // Recalculate remaining volume
        });
    };

    const watchedWoodEntries = watch('woodEntries');
    const { totalVolume, remainingVolume } = useMemo(() => {
        const entries = watchedWoodEntries || [];
        const total = entries.reduce((sum, item) => sum + (Number(item.totalVolume) || 0), 0);
        const fetched = entries.reduce((sum, item) => sum + (Number(item.fetchedVolume) || 0), 0);
        return { totalVolume: total, remainingVolume: total - fetched };
    }, [watchedWoodEntries]);

    const onSave: SubmitHandler<PuulaaniFormData> = async (formData) => {
        if (!initialData) return;
        setIsSaving(true); setError(null);
        try {
            if (isEditMode && 'id' in initialData) {
                const payload: IUpdateTimberStackFullDto = {
                    puulaani: {
                        nimi: formData.name,
                        pvm: (formData.date as Dayjs).toDate(),
                        asiakasId: initialData.clientId,
                        ajomaaraysnro: formData.dispatchOrderNo,
                        aktiivinen: formData.isActive,
                        valmis: formData.isCompleted,
                        lisatiedot: formData.additionalInfo,
                        autoNro: formData.autoNro,
                        km: formData.kilometers,
                        sijaintiLat: formData.latitude,
                        sijaintiLong: formData.longitude,
                    },
                    autot: formData.selectedAutoIds,
                    puutavarat: formData.woodEntries.map(e => ({
                        puutavara_id: e.puutavaraId > 0 ? e.puutavaraId : 0,
                        puutavaranro: e.woodTypeId, purkupaikka_id: e.dropoffLocationId,
                        kuutiot: e.totalVolume, haettu: e.fetchedVolume,
                        valmis: e.valmis
                    })),
                };
                await updateTimberStackFull(initialData.id, payload);
            } else {
                const createData = initialData as Partial<PendingPuulaaniData>;
                const createPayload: ICreateTimberStackDto = {
                    name: createData.name!, clientId: Number(createData.clientId),
                    date: createData.date!.format('YYYY-MM-DD'),
                    latitude: createData.latitude!, longitude: createData.longitude!,
                    dispatchOrderNo: createData.dispatchOrderNo || null,
                    isActive: formData.isActive, isCompleted: formData.isCompleted,
                    additionalInfo: formData.additionalInfo, totalVolume: totalVolume,
                    auto_nro: vehicleList.filter(v => formData.selectedAutoIds.includes(Number(v.id))).map(v => v.registrationNo).join(','),
                    selectedAutoIds: formData.selectedAutoIds,
                    woodEntries: formData.woodEntries.map(e => ({
                        woodTypeId: e.woodTypeId,
                        dropoffLocationId: e.dropoffLocationId,
                        totalVolume: e.totalVolume
                    })),
                };
                await createTimberStack(createPayload);
            }
            onSaveSuccessAction();
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (

        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="md">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                        {isEditMode ? t('title.edit') : t('title.create')}
                    </Typography>
                    <IconButton aria-label="close" onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <FormProvider {...methods}>
                    <Box component="form" id="details-form" onSubmit={handleSubmit(onSave as SubmitHandler<FieldValues>)}>
                        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                            ) : error ? (
                                <Alert severity="error">{error}</Alert>
                            ) : (
                                // --- THIS IS THE NEW LAYOUT STRUCTURE ---
                                <Stack spacing={3}>
                                    {/* Section 1: Primary Details */}
                                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                                        <Typography variant="overline" color="text.secondary" gutterBottom>{t('sections.primaryDetails')}</Typography>

                                        {isEditMode ? (
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <Controller name="name" control={control} render={({ field }) => <TextField {...field} label={t('fields.nameOfProperty')} fullWidth size="small" />} />
                                                <TextField label={t('fields.customer')} value={(initialData as IMapTimberStack)?.clientName || ''} fullWidth size="small" disabled variant="filled" />
                                                <Controller name="date" control={control} render={({ field }) => <DatePicker {...field} label={t('fields.date')}  value={field.value || null} format="DD.MM.YYYY" slotProps={{ textField: { size: 'small', fullWidth: true } }} />} />
                                                <Controller name="dispatchOrderNo" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label={t('fields.drivingOrderNo')} fullWidth size="small" />} />
                                                <Controller name="kilometers" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.tripTotalKm')} fullWidth size="small" />} />
                                            </Stack>
                                        ) : (
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <TextField label={t('fields.objectName')} value={initialData?.name || ''} fullWidth size="small" disabled variant="filled" />
                                                <TextField label={t('fields.customer')} value={clientList.find(c => String(c.id) === String(initialData?.clientId))?.name || ''} fullWidth size="small" disabled variant="filled" />
                                            </Stack>
                                        )}
                                    </Paper>

                                    {/* Section 2: Location Map (Conditionally Rendered) */}
                                    {showMap && (
                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                            <Typography variant="overline" color="text.secondary" gutterBottom>{t('sections.location')}</Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <LocationPicker
                                                    initialLat={latValue}
                                                    initialLng={lngValue}
                                                    onLocationChange={handleLocationChange}
                                                    label={t('fields.updateLocationHint')}
                                                />
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* Section 3: Vehicle Assignment (Only in Edit Mode) */}
                                    {isEditMode && (
                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                            <Typography variant="overline" color="text.secondary" gutterBottom>{t('sections.vehicleAssignment')}</Typography>
                                            <Controller name="selectedAutoIds" control={control} render={({ field }) => 
                                                <AutoSelect 
                                                    // --- FIX: Use type assertion and fallback array ---
                                                    // This ensures the value is ALWAYS a number array, even if field.value is undefined/null.
                                                    selectedAutoIds={(field.value as number[] | undefined) || []} 
                                                    onSelectionChangeAction={field.onChange} 
                                                    vehicleList={vehicleList} 
                                                />
                                            } />
                                        </Paper>
                                    )}

                                    {/* Section 4: Timber Logs */}
                                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                                        <Typography variant="overline" color="text.secondary" gutterBottom>{t('sections.timberLogs')}</Typography>
                                        <AddWoodEntry 
                                        onAddAction={handleAddWoodEntry} 
                                        woodTypeList={woodTypeList}
                                         dropoffLocationList={dropoffLocationList} 
                                         />
                                        <WoodEntryList 
                                        entries={woodEntryFields} 
                                        onFieldChangeAction={handleUpdateWoodEntry} 
                                        onDeleteAction={(index) => remove(index)} 
                                        woodTypeList={woodTypeList} 
                                        dropoffLocationList={dropoffLocationList} 
                                        isEditMode={true} 
                                        />
                                    </Paper>

                                    {/* Section 5: Status & Info */}
                                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                                        <Typography variant="overline" color="text.secondary" gutterBottom>{t('sections.statusInfo')}</Typography>
                                        <Stack spacing={2}>
                                            <Box>
                                                <FormControlLabel control={<Controller name="isActive" control={control} render={({ field }) =>
                                                    <Checkbox
                                                        {...field}
                                                        checked={!!field.value}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            if (checked) {
                                                                setValue("isCompleted", false);

                                                            }
                                                            field.onChange(checked);
                                                        }}
                                                    />} />} label={t('fields.active')} />
                                                <FormControlLabel control={<Controller name="isCompleted" control={control} render={({ field }) =>
                                                    <Checkbox
                                                        {...field}
                                                        checked={!!field.value}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            
                                                            if (checked) {
                                                                setValue("isActive", false);
                                                            }
                                                            field.onChange(checked);
                                                        }}
                                                    />} />} label={t('fields.ready')} />
                                            </Box>
                                            <Controller name="additionalInfo" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label={t('fields.additionalInfo')} multiline rows={3} fullWidth size="small" />} />
                                        </Stack>
                                    </Paper>
                                </Stack>
                            )}
                            {errorMessage && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}
                        </DialogContent>
                        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button onClick={onCloseAction}>{t('common:buttons.cancel')}</Button>
                            <Button type="submit" form="details-form" variant="contained" disabled={isSaving || isLoading || (isEditMode && !isDirty)}>
                                {isSaving ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? t('actions.update') : t('actions.create'))}
                            </Button>
                        </DialogActions>
                    </Box>
                </FormProvider>
            </Dialog>
        </LocalizationProvider>
    );
}

//onUpdateEntryAction
//onDeleteEntryAction
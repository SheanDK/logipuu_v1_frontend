// src/components/clients/ClientFormModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, FormControlLabel, Checkbox, Box, Alert, Typography,
  FormControl, FormHelperText,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { IClient, ICreateClientDto, IUpdateClientDto, IClientFormData, ClientTypeEnum } from '../../types';
import { checkTargetColorExists } from '../../services/clientService';
import NativeColorPicker from '../common/ColorPicker';

import { useTranslation } from '@/i18n/useTranslation';

// Validation schema (comments in English)
const buildSchema = (t: (k: string, o?: any) => string, editingClientId?: string) =>
  yup.object({
    clientName: yup.string().required(t('errors.nameRequired')).max(50, t('errors.nameMax')).default(''),

    vatId: yup
  .string()
  .nullable()
  .max(10, t('errors.vatMax'))
  // 1) No letters at all
  .test('vat-no-letters', t('errors.vatInvalidChars'), (v) => !v || !/[A-Za-zÅÄÖåäöÆØæøÞþÐð]/u.test(v))
  // 2) Allowed characters only: digits and a single hyphen
  .matches(/^[0-9-]*$/, t('errors.vatInvalidChars'))
  // 3) Strict Finnish Y-tunnus format: 7 digits, hyphen, 1 digit (optional — poista jos haluat sallia muutkin)
  .test('vat-format-fi', t('errors.vatInvalidFormat'), (v) => {
    if (!v) return true;
    return /^\d{7}-\d$/.test(v);
  })
  .default(''),

    address: yup.string().nullable().max(100, t('errors.addressMax')).default(''),
    postalCode: yup
      .string()
      .nullable()
      .transform((v) => (typeof v === 'string' ? v.trim() : v))
      .max(10, t('errors.postalMax')) // e.g., "123 45" is 6 characters
      .test('no-letters', t('errors.postalNoLetters'), (v) => !v || !/[A-Za-zÅÄÖåäöÆØæøÞþÐð]/u.test(v))
      .test('nordic-postal', t('errors.postalInvalid'), (v) => {
        if (!v) return true;
        const clean = v.replace(/\s/g, ''); // allow Swedish format "NNN NN" by stripping spaces
        // digits only and length 3, 4, or 5 (IS=3, DK/NO=4, FI/SE=5)
        return /^\d+$/.test(clean) && [3, 4, 5].includes(clean.length);
      })
      .default(''),

    city: yup.string().nullable().max(20, t('errors.cityMax')).default(''),

    phoneNo: yup
      .string()
      .nullable()
      .transform((v) => (typeof v === 'string' ? v.trim() : v))
      .max(20, t('errors.phoneMax'))
      .matches(/^[0-9+\-() \t]*$/, t('errors.phoneInvalidChars')) // allow digits and common separators only
      .test('has-digits-len', t('errors.phoneInvalid'), (v) => {
        if (!v) return true;
        const digits = v.replace(/\D/g, '');
        // practical range: 6–20 digits (aligned with E.164 length constraints)
        return digits.length >= 6 && digits.length <= 20;
      })
      .default(''),

    contactPerson: yup.string().nullable().max(50, t('errors.contactMax')).default(''),
    email: yup.string().email(t('errors.emailInvalid')).nullable().max(100, t('errors.emailMax')).default(''),
    additionalInfo: yup.string().nullable().max(1000, t('errors.additionalInfoMax')).default(''),

    targetColor: yup
      .string()
      .nullable()
      .when('isPuulaani', {
        is: true,
        then: (schema) =>
          schema
            .required(t('errors.colorRequired'))
            .matches(/^#([0-9A-Fa-f]{6})$/i, {
              message: t('errors.colorInvalid'),
              excludeEmptyString: true,
            })
            .test('is-color-unique', t('errors.colorExists'), async (value) => {
              if (!value) return true;
              try {
                const isTaken = await checkTargetColorExists(value, editingClientId);
                return !isTaken;
              } catch {
                // do not block saving on server/IO error
                return true;
              }
            }),
      }),

    isPuulaani: yup.boolean().required(),
    isRahtikirja: yup.boolean().required(),
    isActive: yup.boolean().required(),
  }).test('at-least-one-type-selected', t('errors.oneTypeRequired'), function (values) {
    const v = values as unknown as IClientFormData;
    if (v.isPuulaani || v.isRahtikirja) return true;
    return this.createError({ path: 'isRahtikirja', message: t('errors.oneTypeRequired') });
  });

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ICreateClientDto | IUpdateClientDto, clientId?: string) => Promise<void>;
  initialData?: IClient | null;
  isSaving: boolean;
  usedColors: string[];
  currentClientColor: string | null;
  apiError: string | null;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({
  open, onClose, onSave, initialData, isSaving, usedColors, currentClientColor, apiError,
}) => {
  const { t } = useTranslation(['clientForm', 'common']);

  const schema = useMemo(() => buildSchema(t, initialData?.clientId), [t, initialData?.clientId]);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<IClientFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      clientName: '', vatId: '', address: '', postalCode: '', city: '',
      phoneNo: '', contactPerson: '', email: '', additionalInfo: '',
      targetColor: '#FFFFFF', isPuulaani: false, isRahtikirja: false, isActive: true,
    },
  });

  const isPuulaaniChecked = watch('isPuulaani');

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      const isRahtikirja =
        initialData.type === ClientTypeEnum.RAHTIKIRJA ||
        initialData.type === ClientTypeEnum.BOTH;

      reset({
        clientName: initialData.clientName,
        vatId: initialData.vatId || '',
        address: initialData.address || '',
        postalCode: initialData.postalCode || '',
        city: initialData.city || '',
        phoneNo: initialData.phoneNo || '',
        contactPerson: initialData.contactPerson || '',
        email: initialData.email || '',
        additionalInfo: initialData.additionalInfo || '',
        targetColor: initialData.targetColor || '#FFFFFF',
        isPuulaani: initialData.type === ClientTypeEnum.PUULAANI || initialData.type === ClientTypeEnum.BOTH,
        isRahtikirja: isRahtikirja,
        isActive: initialData.isActive,
      }, { keepDirty: false, keepErrors: false, keepTouched: false });
    } else {
      reset({
        clientName: '', vatId: '', address: '', postalCode: '', city: '',
        phoneNo: '', contactPerson: '', email: '', additionalInfo: '',
        targetColor: '#FFFFFF', isPuulaani: false, isRahtikirja: false, isActive: true,
      }, { keepDirty: false, keepErrors: false, keepTouched: false });
    }
  }, [initialData, open, reset]);

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name === 'isPuulaani' && !values.isPuulaani) {
        setValue('targetColor', '#FFFFFF', { shouldValidate: true, shouldDirty: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmitHandler: SubmitHandler<IClientFormData> = async (formData) => {
    let typeValue: ClientTypeEnum;
    if (formData.isPuulaani && formData.isRahtikirja) typeValue = ClientTypeEnum.BOTH;
    else if (formData.isPuulaani) typeValue = ClientTypeEnum.PUULAANI;
    else typeValue = ClientTypeEnum.RAHTIKIRJA;

    const submissionData: ICreateClientDto = {
      clientName: formData.clientName,
      vatId: formData.vatId || null,
      address: formData.address || null,
      postalCode: formData.postalCode || null,
      city: formData.city || null,
      phoneNo: formData.phoneNo || null,
      contactPerson: formData.contactPerson || null,
      email: formData.email || null,
      additionalInfo: formData.additionalInfo || null,
      targetColor: formData.isPuulaani ? formData.targetColor : '#808080',
      type: typeValue,
      isActive: formData.isActive,
    };

    await onSave(submissionData, initialData?.clientId);
  };

  // Show field-level errors + a group-level error for the type checkboxes.
  // Also: correct the Email props and add maxLength constraints for immediate UX.
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="span">
          {initialData ? t('titles.edit') : t('titles.add')}
        </Typography>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmitHandler)} id="client-form" noValidate>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Client Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="clientName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.clientName')}
                    fullWidth
                    required
                    autoFocus
                    error={!!errors.clientName}
                    helperText={errors.clientName?.message}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                  />
                )}
              />
            </Grid>

            {/* VAT ID */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="vatId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.vatId')}
                    fullWidth
                    error={!!errors.vatId}
                    helperText={errors.vatId?.message}
                    slotProps={{ htmlInput: { maxLength: 10 } }}
                  />
                )}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.address')}
                    fullWidth
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                )}
              />
            </Grid>

            {/* Postal Code */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.postalCode')}
                    fullWidth
                    error={!!errors.postalCode}
                    helperText={errors.postalCode?.message}
                    slotProps={{ htmlInput: { maxLength: 10 } }}
                  />
                )}
              />
            </Grid>

            {/* City */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.city')}
                    fullWidth
                    error={!!errors.city}
                    helperText={errors.city?.message}
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                  />
                )}
              />
            </Grid>

            {/* Phone Number */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="phoneNo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.phoneNo')}
                    fullWidth
                    error={!!errors.phoneNo}
                    helperText={errors.phoneNo?.message}
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                  />
                )}
              />
            </Grid>

            {/* Contact Person */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.contactPerson')}
                    fullWidth
                    error={!!errors.contactPerson}
                    helperText={errors.contactPerson?.message}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.email')}
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                )}
              />
            </Grid>

            {/* Additional Info */}
            <Grid item xs={12}>
              <Controller
                name="additionalInfo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.additionalInfo')}
                    fullWidth
                    multiline
                    rows={2}
                    error={!!errors.additionalInfo}
                    helperText={errors.additionalInfo?.message}
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                  />
                )}
              />
            </Grid>

            {/* Type (checkbox group) — single group-level error message */}
            <Grid item xs={12}>
              {(() => {
                // Custom test sets the error path to 'isRahtikirja'
                const typeError =
                  (errors as any).isRahtikirja?.message || (errors as any).isPuulaani?.message;

                return (
                  <FormControl component="fieldset" error={!!typeError} variant="standard">
                    <Typography variant="subtitle2" gutterBottom>
                      {t('fields.typeSectionLabel')} *
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Controller
                        name="isPuulaani"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Checkbox {...field} checked={field.value} />}
                            label={t('fields.isPuulaani')}
                          />
                        )}
                      />
                      <Controller
                        name="isRahtikirja"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Checkbox {...field} checked={field.value} />}
                            label={t('fields.isRahtikirja')}
                          />
                        )}
                      />
                    </Box>

                    {typeError && <FormHelperText>{typeError}</FormHelperText>}
                  </FormControl>
                );
              })()}
            </Grid>

            {/* Target Color (conditional) */}
            {isPuulaaniChecked && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="targetColor"
                  control={control}
                  render={({ field }) => (
                    <NativeColorPicker
                      label={t('fields.targetColor')}
                      value={field.value || '#FFFFFF'}
                      onChange={field.onChange}
                      required={isPuulaaniChecked}
                      error={!!errors.targetColor}
                      helperText={errors.targetColor?.message}
                      disabled={isSaving}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Active */}
            <Grid item xs={12} sm={isPuulaaniChecked ? 6 : 12}>
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
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit" variant="outlined" disabled={isSaving}>
            {t('buttons.cancel')}
          </Button>
          <Button
            type="submit"
            form="client-form"
            color="primary"
            variant="contained"
            disabled={isSaving || !isDirty || !isValid}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : (initialData ? t('buttons.saveChanges') : t('buttons.addClient'))}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ClientFormModal;

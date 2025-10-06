'use client';

import React, { useMemo } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Checkbox, FormControlLabel, Typography
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from '@/i18n/useTranslation';

type NewPayload = { name: string; description?: string; active: boolean };

export default function NewWoodTypeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (payload: NewPayload) => Promise<any>;
}) {

  const { t } = useTranslation(['newWoodTypeModal', 'common']);

  const schema: yup.ObjectSchema<NewPayload> = useMemo(
    () =>
      yup
        .object({
          name: yup
            .string()
            .required(t('newWoodTypeModal:validation.nameRequired'))
            .min(2, t('newWoodTypeModal:validation.nameMin', { min: 2 })),
          description: yup
            .string()
            .optional()
            .transform(v => {
              if (typeof v !== 'string') return undefined;          
              const trimmed = v.trim();
              return trimmed.length ? trimmed : undefined;           
            }),
          active: yup.boolean().required(),
        })
        .required(),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NewPayload>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', description: '', active: true },
  });

  const onSubmit = async (values: NewPayload) => {
    await onCreated(values);
    reset({ name: '', description: '', active: true });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('newWoodTypeModal:title')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('newWoodTypeModal:fields.name')}
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('newWoodTypeModal:fields.description')}
                fullWidth
                multiline
                minRows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={!!field.value} />}
                label={t('newWoodTypeModal:fields.active')}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common:buttons.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? t('newWoodTypeModal:actions.saving') : t('common:buttons.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

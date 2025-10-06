// frontend/src/components/common/ConfirmationDialog.tsx
'use client';

import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Button, CircularProgress, Typography
} from '@mui/material';

import { useTranslation } from '@/i18n/useTranslation';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isConfirming?: boolean;
  confirmButtonText?: string;
  confirmButtonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  cancelButtonText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  isConfirming = false,
  confirmButtonText,
  confirmButtonColor = 'primary',
  cancelButtonText,
}) => {

  //  i18n (fallback common.json if props are not given)
  const { t } = useTranslation('common');
  const cancelText = cancelButtonText ?? t('buttons.cancel');
  const confirmText = confirmButtonText ?? t('buttons.confirm');
  const confirmingText = t('buttons.confirming', { defaultValue: 'Confirming...' });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirmation-dialog-title">
        <Typography variant="h6" component="span">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isConfirming} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          // --- THIS IS THE FIX ---
          // Use the `confirmButtonColor` prop to set the button's color.
          color={confirmButtonColor}
          variant="contained"
          disabled={isConfirming}
          startIcon={isConfirming && <CircularProgress size={20} color="inherit" />}
        >
          {isConfirming ? confirmingText : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
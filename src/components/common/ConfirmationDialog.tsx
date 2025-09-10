// frontend/src/components/common/ConfirmationDialog.tsx
'use client';

import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Button, CircularProgress, Typography
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isConfirming?: boolean;
  confirmButtonText?: string;
  // --- THIS IS THE FIX ---
  // Add the missing optional prop to the interface.
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
  confirmButtonText = 'Confirm',
  // --- THIS IS THE FIX ---
  // Accept the prop and provide a default value.
  confirmButtonColor = 'primary',
  cancelButtonText = 'Cancel',
}) => {
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
          {cancelButtonText}
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
          {isConfirming ? 'Confirming...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
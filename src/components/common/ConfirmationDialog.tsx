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
  isConfirming?: boolean; // Optional prop to show loading state on confirm button
  confirmButtonText?: string;
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
        {/* --- KEY CORRECTION IS HERE --- */}
        {/* Render the title directly as h2 (default for DialogTitle) or customize component prop. */}
        {/* No nested Typography that renders another heading tag. */}
        <Typography variant="h6" component="span"> {/* Use component="span" to wrap the text if variant is h6 to avoid nested headings */}
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
          color="primary"
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
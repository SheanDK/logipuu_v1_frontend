// frontend/src/components/map/dialogs/TypeSelectionDialog.tsx
'use client'

import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    Button, 
    Box, 
    Stack, 
    Typography,
    IconButton 
} from '@mui/material';
import { MarkerType } from '../../../types';

// Import suitable icons from Material-UI
import ForestIcon from '@mui/icons-material/Forest'; // Icon for Puulaani (timber stack)
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Icon for Unloading Site
import PlaceIcon from '@mui/icons-material/Place'; // Generic icon for "Other"
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from '@/i18n/useTranslation';

interface TypeSelectionDialogProps {
  open: boolean;
  onCancelAction: () => void;
  onTypeSelect: (type: MarkerType) => void;
}

const TypeSelectionDialog: React.FC<TypeSelectionDialogProps> = ({ open, onCancelAction, onTypeSelect }) => {
  
  const { t } = useTranslation(['typeSelectionDialog', 'common']) 

  const selectionOptions = [
    {
      type: 'Puulaani' as MarkerType,
      title:  t('puulaani.title'),
      description:  t('puulaani.description'),
      icon: <ForestIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      type: 'Purkupaikka' as MarkerType,
      title: t('purkupaikka.title'),
      description: t('purkupaikka.description'),
      icon: <LocalShippingIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      type: 'Muu merkki' as MarkerType,
      title: t('other.title'),
      description: t('other.description'),
      icon: <PlaceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    }
  ];

  return (
    <Dialog 
        open={open} 
        onClose={onCancelAction} 
        PaperProps={{ sx: { width: '100%', maxWidth: '450px' } }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {t('title')}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onCancelAction}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {selectionOptions.map((option) => (
            <Button
              key={option.type}
              variant="outlined"
              fullWidth
              onClick={() => onTypeSelect(option.type)}
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                textAlign: 'left',
                textTransform: 'none', // Prevents button text from being all caps
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ mr: 2 }}>
                {option.icon}
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {option.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TypeSelectionDialog;
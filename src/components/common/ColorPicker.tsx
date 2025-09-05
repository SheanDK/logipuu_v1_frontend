// frontend/src/components/common/ColorPicker.tsx
'use client';

import React from 'react';
import {
  Box,
  Typography,
  FormHelperText,
  FormControl,
  InputLabel,
  InputAdornment,
  OutlinedInput,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

interface ColorPickerProps {
  label: string;
  value: string | null; // Expects hex color string (e.g., "#RRGGBB") or null
  onChange: (hexColor: string | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

const NativeColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
}) => {

  // This handler is for the native <input type="color">
  // We use onInput because onChange only fires on a VALUE CHANGE.
  // onInput fires whenever the user makes a selection, even if it's the same color.
  const handleColorSelection = (event: React.FormEvent<HTMLInputElement>) => {
    // We get the value from the event's currentTarget
    const selectedColor = event.currentTarget.value;
    onChange(selectedColor || null);
  };

  // This handler is for the text field where user can type the hex code
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = event.target.value;
    // Automatically add '#' if user starts typing a hex code without it
    if (newValue.length > 0 && !newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }
    onChange(newValue || null);
  };

  const handleClearColor = () => {
    onChange(null);
  };

  const inputId = `color-picker-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <FormControl fullWidth margin="dense" error={error} required={required} disabled={disabled} sx={{ mt: 1, mb: 1 }}>
      <InputLabel htmlFor={inputId} shrink sx={{ fontWeight: 'medium', color: error ? 'error.main' : 'text.secondary', fontSize: '0.95rem' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </InputLabel>
      <OutlinedInput
        id={inputId}
        type="text" // Text input to show/type hex value
        value={value || ''}
        onChange={handleTextChange}
        disabled={disabled}
        label={label}
        sx={{
          '& .MuiOutlinedInput-input': {
            paddingRight: '40px', // Adjust padding for the clear button
            fontFamily: 'monospace',
          }
        }}
        startAdornment={
          <InputAdornment position="start">
            <Box
              component="label"
              htmlFor={`${inputId}-native`}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: value || '#ffffff',
                border: '1px solid',
                borderColor: 'divider',
                cursor: disabled ? 'default' : 'pointer',
                mr: 1,
                display: 'inline-block',
                position: 'relative',
              }}
            >
              <input
                id={`${inputId}-native`}
                type="color"
                value={value || '#ffffff'} // Set the current color
                // Use onInput instead of onChange
                onInput={handleColorSelection} // <<<--- CHANGED TO onInput
                disabled={disabled}
                style={{
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  cursor: disabled ? 'default' : 'pointer',
                  border: 'none',
                }}
              />
            </Box>
          </InputAdornment>
        }
        endAdornment={
          value && !disabled && (
            <InputAdornment position="end">
              <IconButton onClick={handleClearColor} edge="end" size="small" aria-label="clear color">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }
      />
      {helperText && <FormHelperText sx={{ ml: '14px' }} error={!!error}>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default NativeColorPicker;
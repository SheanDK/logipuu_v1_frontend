// frontend/src/components/map/markers/AutoSelect.tsx
'use client';

import React, { useMemo } from 'react';
import {
    FormControl, Chip, TextField, Autocomplete
} from '@mui/material';
import { IVehicleBasicInfo } from '@/types';
import { useTranslation } from '@/i18n/useTranslation';

interface AutoSelectProps {
    selectedAutoIds: number[];
    onSelectionChangeAction: (ids: number[]) => void;
    vehicleList: IVehicleBasicInfo[];
    disabled?: boolean;
}

const AutoSelect: React.FC<AutoSelectProps> = ({ 
    selectedAutoIds, 
    onSelectionChangeAction, 
    vehicleList, 
    disabled = false 
}) => {
    
    const { t } = useTranslation(['autoSelect', 'common']);
    const selectedVehicles = useMemo(() => 
        vehicleList.filter(v => selectedAutoIds.includes(Number(v.id))),
        [selectedAutoIds, vehicleList]
    );

    const handleChange = (event: React.SyntheticEvent, newValue: IVehicleBasicInfo[]) => {
        const newIds = newValue.map(v => Number(v.id));
        onSelectionChangeAction(newIds);
    };

    return (
        <FormControl fullWidth size="small" disabled={disabled}>
            <Autocomplete
                multiple
                id="vehicles-autocomplete"
                options={vehicleList} 
                getOptionLabel={(option) => option.name} 
                value={selectedVehicles} 
                onChange={handleChange}
                isOptionEqualToValue={(option, value) => option.id === value.id} 
                disableCloseOnSelect 
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t('label')}
                        placeholder={selectedVehicles.length > 0 ? '' : t('placeholder', 'Select vehicles...')}
                    />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                        const { key, ...otherProps } = getTagProps({ index });
                        return (
                            <Chip
                                key={key} // Pass the key directly
                                variant="outlined"
                                label={option.name}
                                size="small"
                                {...otherProps} // Spread the rest of the props
                            />
                        );
                    })
                }

                ListboxProps={{
                    style: {
                        maxHeight: '250px',
                    }
                }}
            />
        </FormControl>
    );
};

export default AutoSelect;
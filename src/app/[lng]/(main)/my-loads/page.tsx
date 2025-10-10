// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from '@/i18n/useTranslation';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';
import { IVehicleBackendResponse, IVehicleBasicInfo } from '@/types';
import { fetchAllVehicles } from '@/services/vehicleService';

// --- Dynamic Component Imports ---
const ModeSelection = dynamic(() => import('../../../../components/drivers/ModeSelection'), { ssr: false });
const TimberDashboard = dynamic(() => import('../../../../components/drivers/TimberDashboard'), { ssr: false });
// FIX: Add the new consignment component imports
const ConsignmentDriverDashboard = dynamic(() => import('../../../../components/drivers/ConsignmentDriverDashboard'), { ssr: false });
const ConsignmentDriverForm = dynamic(() => import('../../../../components/drivers/ConsignmentDriverForm'), { ssr: false });


export default function DriverDashboardPage() {
    const { selectedVehicleId, selectVehicle } = useDriverSession();
    
    // FIX: Expand the view state type to include all possible consignment views
    const [view, setView] = useState<'mode-select' | 'timber' | 'consignment-list' | 'consignment-form'>('mode-select');
    // FIX: Add state to hold the ID of the consignment being edited
    const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);

    const [vehicles, setVehicles] = useState<IVehicleBasicInfo[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

    // This effect runs once to fetch the list of vehicles for the modal.
    useEffect(() => {
        setIsLoadingVehicles(true);
        fetchAllVehicles()
            .then((data: IVehicleBackendResponse[]) => {
                const mappedVehicles = data.map(v => ({
                    id: String(v.kalustoNro),
                    registrationNo: v.rekNro,
                    name: v.rekNro,
                    vehicleNo: String(v.kalustoNro)
                }));
                setVehicles(mappedVehicles);
            })
            .catch(err => console.error("Failed to fetch vehicles:", err))
            .finally(() => setIsLoadingVehicles(false));
    }, []);

    // FIX: Add handler functions to navigate between the consignment list and form
    const handleNavigateToForm = (id: number | null) => {
        setEditingConsignmentId(id); // null for create mode, a number for edit mode
        setView('consignment-form');
    };

    const handleBackToList = () => {
        setEditingConsignmentId(null);
        setView('consignment-list');
    };

    // --- RENDER LOGIC ---
    
    if (!selectedVehicleId) {
        if (isLoadingVehicles) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
        }
        return <SelectVehicleModal open={true} vehicles={vehicles} onVehicleSelectAction={selectVehicle} />;
    }

    // A vehicle IS selected, so proceed with the view logic.
    switch (view) {
        case 'mode-select':
            // FIX: Update the onModeSelectAction to navigate to the correct list view
            return <ModeSelection onModeSelectAction={(selectedMode) => setView(selectedMode === 'timber' ? 'timber' : 'consignment-list')} />;
        
        case 'timber':
            return <TimberDashboard onBackAction={() => setView('mode-select')} />;

        // FIX: Add cases for the new consignment views
        case 'consignment-list':
            return <ConsignmentDriverDashboard onBackAction={() => setView('mode-select')} onNavigateToFormAction={handleNavigateToForm} />;

        case 'consignment-form':
            return <ConsignmentDriverForm onBackToListAction={handleBackToList} consignmentId={editingConsignmentId} />;

        default:
            return null;
    }
}
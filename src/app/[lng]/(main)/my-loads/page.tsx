// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';
import { IVehicleBackendResponse, IVehicleBasicInfo } from '@/types';
import { fetchAllVehicles } from '@/services/vehicleService';

// --- Dynamic Component Imports ---
const ModeSelection = dynamic(() => import('../../../../components/drivers/ModeSelection'), { ssr: false });
const TimberDashboard = dynamic(() => import('../../../../components/drivers/TimberDashboard'), { ssr: false });
const ConsignmentDriverDashboard = dynamic(() => import('../../../../components/drivers/ConsignmentDriverDashboard'), { ssr: false });
const ConsignmentDriverForm = dynamic(() => import('../../../../components/drivers/ConsignmentDriverForm'), { ssr: false });


export default function DriverDashboardPage() {
    const { selectedVehicleId, selectVehicle } = useDriverSession();
    const [view, setView] = useState<'mode-select' | 'timber' | 'consignment-list' | 'consignment-form'>('mode-select');
    const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);
    const [vehicles, setVehicles] = useState<IVehicleBasicInfo[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

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

    // --- THE FIX IS HERE ---
    // Wrap all handler functions passed as props in useCallback.
    // This prevents them from being recreated on every render, which stops child components from unmounting.
    const handleNavigateToForm = useCallback((id: number | null) => {
        setEditingConsignmentId(id);
        setView('consignment-form');
    }, []); // Empty dependency array as it doesn't depend on any state from this component.

    const handleBackToList = useCallback(() => {
        setEditingConsignmentId(null);
        setView('consignment-list');
    }, []);

    const handleBackToModeSelect = useCallback(() => {
        setView('mode-select');
    }, []);
    // --- END OF FIX ---

    if (!selectedVehicleId) {
        if (isLoadingVehicles) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
        }
        return <SelectVehicleModal open={true} vehicles={vehicles} onVehicleSelectAction={selectVehicle} />;
    }

    switch (view) {
        case 'mode-select':
            return <ModeSelection onModeSelectAction={(selectedMode) => setView(selectedMode === 'timber' ? 'timber' : 'consignment-list')} />;

        case 'timber':
            // Pass the memoized function as a prop
            return <TimberDashboard onBackAction={handleBackToModeSelect} />;
            
        case 'consignment-list':
            // Pass the memoized functions as props
            return <ConsignmentDriverDashboard onBackAction={handleBackToModeSelect} onNavigateToFormAction={handleNavigateToForm} />;

        case 'consignment-form':
            return <ConsignmentDriverForm onBackToListAction={handleBackToList} consignmentId={editingConsignmentId} />;

        default:
            return null;
    }
}

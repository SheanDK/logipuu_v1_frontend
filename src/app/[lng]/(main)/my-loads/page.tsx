// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import SelectVehicleModal from '@/components/drivers/SelectVehicleModal';
import { IVehicleBackendResponse, IVehicleBasicInfo } from '@/types';
import { fetchAllVehicles } from '@/services/vehicleService';

const ModeSelection = dynamic(() => import('../../../../components/drivers/ModeSelection'), { ssr: false });
const TimberDashboard = dynamic(() => import('../../../../components/drivers/TimberDashboard'), { ssr: false });
const ConsignmentDriverDashboard = dynamic(() => import('../../../../components/drivers/ConsignmentDriverDashboard'), { ssr: false });
const ConsignmentDriverForm = dynamic(() => import('../../../../components/drivers/ConsignmentDriverForm'), { ssr: false });
const ChipDriverDashboard = dynamic(() => import('../../../../components/drivers/ChipDriverDashboard'), { ssr: false });


export default function DriverDashboardPage() {
    const { selectedVehicleId, selectVehicle } = useDriverSession();
    const [view, setView] = useState<'mode-select' | 'timber' | 'consignment-list' | 'consignment-form' | 'chip'>('mode-select');
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

    const handleNavigateToForm = useCallback((id: number | null) => {
        setEditingConsignmentId(id);
        setView('consignment-form');
    }, []);

    const handleBackToList = useCallback(() => {
        setEditingConsignmentId(null);
        setView('consignment-list');
    }, []);

    const handleBackToModeSelect = useCallback(() => {
        setView('mode-select');
    }, []);


    if (!selectedVehicleId) {
        if (isLoadingVehicles) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
        }
        return <SelectVehicleModal open={true} vehicles={vehicles} onVehicleSelectAction={selectVehicle} />;
    }

    switch (view) {
        case 'mode-select':
            return (
                <ModeSelection
                    onModeSelectAction={(selectedMode) => {
                        if (selectedMode === 'timber') {
                            setView('timber');
                            return;
                        }
                        if (selectedMode === 'consignment') {
                            setView('consignment-list');
                            return;
                        }
                        setView('chip');
                    }}
                />
            );

        case 'timber':
            return <TimberDashboard onBackAction={handleBackToModeSelect} />;

        case 'consignment-list':
            return <ConsignmentDriverDashboard onBackAction={handleBackToModeSelect} onNavigateToFormAction={handleNavigateToForm} />;

        case 'consignment-form':
            return <ConsignmentDriverForm onBackToListAction={handleBackToList} consignmentId={editingConsignmentId} />;

        case 'chip':
            return <ChipDriverDashboard onBackAction={handleBackToModeSelect} />;

        default:
            return null;
    }
}

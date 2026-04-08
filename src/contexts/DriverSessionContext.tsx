// frontend/src/contexts/DriverSessionContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import * as userService from '../services/userService';

const VEHICLE_ID_STORAGE_KEY = 'driver_vehicle_id';
const VEHICLE_REGNO_STORAGE_KEY = 'driver_vehicle_regno';
const ACTIVE_TRIP_ID_KEY = 'driver_active_trip_id';


interface DriverSessionState {
    selectedVehicleId: string | null;
    selectedVehicleRegNo: string | null;
    selectVehicle: (vehicleId: string, regNo: string) => Promise<void>;
    clearVehicle: () => void;
    isVehicleSelectionRequired: boolean;
    isInitialized: boolean;

    activeTripId: string | null;
    setActiveTrip: (tripId: string | null) => void;
}

const DriverSessionContext = createContext<DriverSessionState | undefined>(undefined);

export const DriverSessionProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();


    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [selectedVehicleRegNo, setSelectedVehicleRegNo] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const storedVehicleId = localStorage.getItem(VEHICLE_ID_STORAGE_KEY);
            const storedVehicleRegNo = localStorage.getItem(VEHICLE_REGNO_STORAGE_KEY);


            if (storedVehicleId && storedVehicleRegNo) {
                setSelectedVehicleId(storedVehicleId);
                setSelectedVehicleRegNo(storedVehicleRegNo);
                
                // Sync with backend on initialization to ensure DB is up to date
                if (localStorage.getItem('authToken')) {
                    userService.updateCurrentVehicleApi(Number(storedVehicleId))
                        .catch(err => {
                            console.error("Initial backend vehicle sync failed:", err);
                            const errorMsg = err.response?.data?.message || err.message;
                            if (errorMsg && errorMsg.includes('already in use')) {
                                enqueueSnackbar(errorMsg, { variant: 'error' });
                                clearVehicle();
                            }
                        });
                }
            }
        } catch (error) {
            console.error("Failed to read from localStorage", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    const isDriver = useMemo(() => {
        const result = user?.roles.includes('Kuljettaja') || false;
        return result;
    }, [user]);

    const isVehicleSelectionRequired = useMemo(() => {
        const result = isDriver && !selectedVehicleId;
        return result;
    }, [isDriver, selectedVehicleId, isInitialized]);

    const selectVehicle = async (vehicleId: string, regNo: string) => {
        // 🚀 පළමුව Backend එකේ වාහනය ලබාගත හැකිදැයි පරීක්ෂා කරයි
        try {
            if (typeof window !== 'undefined' && localStorage.getItem('authToken')) {
                await userService.updateCurrentVehicleApi(Number(vehicleId));
            }
            
            // සාර්ථක නම් පමණක් Local storage සහ State යාවත්කාලීන කරයි
            localStorage.setItem(VEHICLE_ID_STORAGE_KEY, vehicleId);
            localStorage.setItem(VEHICLE_REGNO_STORAGE_KEY, regNo);
            setSelectedVehicleId(vehicleId);
            setSelectedVehicleRegNo(regNo);
            
        } catch (error) {
            console.error("Failed to select vehicle in backend:", error);
            throw error; // Component එකට error එක ලබා දෙයි
        }
    };

    const [activeTripId, setActiveTripIdState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem(ACTIVE_TRIP_ID_KEY);
        return null;
    });

    const setActiveTrip = (tripId: string | null) => {
        if (tripId) {
            localStorage.setItem(ACTIVE_TRIP_ID_KEY, tripId);
            setActiveTripIdState(tripId);
        } else {
            localStorage.removeItem(ACTIVE_TRIP_ID_KEY);
            setActiveTripIdState(null);
        }
    };

    const clearVehicle = () => {
        localStorage.removeItem(VEHICLE_ID_STORAGE_KEY);
        localStorage.removeItem(VEHICLE_REGNO_STORAGE_KEY);
        setSelectedVehicleId(null);
        setSelectedVehicleRegNo(null);
        setActiveTrip(null);
        // Only clear backend if we have a token
        if (typeof window !== 'undefined' && localStorage.getItem('authToken')) {
            userService.updateCurrentVehicleApi(null)
                .catch(err => {
                    // Ignore 401s during clear, as it means the session is already gone
                    if (err.response?.status !== 401) {
                        console.error("Failed to clear current vehicle in backend:", err);
                    }
                });
        }
    };

    useEffect(() => {
        if (isInitialized && !user) {
            clearVehicle();
        }
    }, [user, isInitialized]);

    const value = {
        selectedVehicleId,
        selectedVehicleRegNo,
        selectVehicle,
        clearVehicle,
        isVehicleSelectionRequired,
        isInitialized,
        activeTripId,
        setActiveTrip,

    };

    return (
        <DriverSessionContext.Provider value={value}>
            {children}
        </DriverSessionContext.Provider>
    );
};

export const useDriverSession = (): DriverSessionState => {
    const context = useContext(DriverSessionContext);
    if (context === undefined) {
        throw new Error('useDriverSession must be used within a DriverSessionProvider');
    }
    return context;
};
// frontend/src/contexts/LayoutContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { PaletteMode } from '@mui/material';
import { MapSettings, countryMapSettings, DEFAULT_MAP_SETTING_KEY } from '../config/mapConfig';

// --- CORRECTION 1: Add more icon names to the type ---
export type PuulaaniIconType = 'LocationOn' | 'Forest' | 'Room' | 'FmdGood' | 'PinDrop';
// --- NEW: Define the type for Drop-off icon names ---
export type DropoffIconType = 'Warehouse' | 'Factory' | 'LocalShipping' | 'Business';

interface LayoutState {
    themeMode: PaletteMode;
    navLayout: 'left' | 'top';
    mobileDrawerOpen: boolean;
    mapSettings: MapSettings;
    puulaaniIcon: PuulaaniIconType;
    puulaaniIconSize: number; // <<< NEW STATE for icon size
    dropoffIcon: DropoffIconType;
    dropoffIconSize: number;

}

interface LayoutContextType extends LayoutState {
    toggleThemeMode: () => void;
    toggleNavLayout: () => void;
    toggleMobileDrawer: () => void;
    setMobileDrawerOpen: (open: boolean) => void;
    setMapCountry: (countryKey: string) => void;
    setPuulaaniIcon: (iconName: PuulaaniIconType) => void;
    setPuulaaniIconSize: (size: number) => void; // <<< NEW FUNCTION
    setDropoffIcon: (iconName: DropoffIconType) => void;
    setDropoffIconSize: (size: number) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [themeMode, setThemeMode] = useState<PaletteMode>('light');
    const [navLayout, setNavLayout] = useState<'left' | 'top'>('left');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mapSettingKey, setMapSettingKey] = useState<string>(DEFAULT_MAP_SETTING_KEY);
    const [puulaaniIcon, setPuulaaniIcon] = useState<PuulaaniIconType>('LocationOn');
    const [puulaaniIconSize, setPuulaaniIconSize] = useState<number>(30); // <<< Default size
    const [dropoffIcon, setDropoffIcon] = useState<DropoffIconType>('Warehouse');
    const [dropoffIconSize, setDropoffIconSize] = useState<number>(22);

    useEffect(() => {
        const storedTheme = localStorage.getItem('themeMode') as PaletteMode | null;
        if (storedTheme) setThemeMode(storedTheme);
        
        const storedNav = localStorage.getItem('navLayout') as 'left' | 'top' | null;
        if (storedNav) setNavLayout(storedNav);

        const storedMapKey = localStorage.getItem('mapSettingKey');
        if (storedMapKey) setMapSettingKey(storedMapKey);

        const storedIcon = localStorage.getItem('puulaaniIcon') as PuulaaniIconType | null;
        if (storedIcon) setPuulaaniIcon(storedIcon);

        const storedIconSize = localStorage.getItem('puulaaniIconSize');
        if (storedIconSize) setPuulaaniIconSize(Number(storedIconSize));

        const storedDropoffIcon = localStorage.getItem('dropoffIcon') as DropoffIconType | null;
        if (storedDropoffIcon) setDropoffIcon(storedDropoffIcon);

        const storedDropoffIconSize = localStorage.getItem('dropoffIconSize');
        if (storedDropoffIconSize) setDropoffIconSize(Number(storedDropoffIconSize));
    }, []);

    useEffect(() => { localStorage.setItem('themeMode', themeMode); }, [themeMode]);
    useEffect(() => { localStorage.setItem('navLayout', navLayout); }, [navLayout]);
    useEffect(() => { localStorage.setItem('mapSettingKey', mapSettingKey); }, [mapSettingKey]);
    useEffect(() => { localStorage.setItem('puulaaniIcon', puulaaniIcon); }, [puulaaniIcon]);
    useEffect(() => { localStorage.setItem('dropoffIcon', dropoffIcon); }, [dropoffIcon]);

    const toggleThemeMode = () => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    const toggleNavLayout = () => setNavLayout((prev) => (prev === 'left' ? 'top' : 'left'));
    const toggleMobileDrawer = () => setMobileDrawerOpen((prev) => !prev);
    const setMapCountry = (countryKey: string) => setMapSettingKey(countryKey);
    const handleSetPuulaaniIcon = (iconName: PuulaaniIconType) => setPuulaaniIcon(iconName);
    const handleSetPuulaaniIconSize = (size: number) => setPuulaaniIconSize(size);
    const handleSetDropoffIcon = (iconName: DropoffIconType) => setDropoffIcon(iconName);
    const handleSetDropoffIconSize = (size: number) => setDropoffIconSize(size);

    const mapSettings = useMemo(() => {
        return countryMapSettings.find(c => c.key === mapSettingKey) || countryMapSettings.find(c => c.key === DEFAULT_MAP_SETTING_KEY)!;
    }, [mapSettingKey]);

    return (
        <LayoutContext.Provider
            value={{
                themeMode, 
                navLayout, 
                mobileDrawerOpen, 
                mapSettings,
                puulaaniIcon,
                puulaaniIconSize,
                dropoffIcon,
                dropoffIconSize,
                
                setPuulaaniIcon: handleSetPuulaaniIcon,
                setPuulaaniIconSize: handleSetPuulaaniIconSize,
                toggleThemeMode, 
                toggleNavLayout, 
                toggleMobileDrawer, 
                setMapCountry, 
                setMobileDrawerOpen,
                setDropoffIcon: handleSetDropoffIcon,
                setDropoffIconSize: handleSetDropoffIconSize,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = (): LayoutContextType => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
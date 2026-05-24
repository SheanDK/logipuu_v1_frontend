// frontend/src/contexts/LayoutContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { PaletteMode } from '@mui/material';
import { MapSettings, countryMapSettings, DEFAULT_MAP_SETTING_KEY } from '../config/mapConfig';

// --- TYPES DEFINITION ---
export type PuulaaniIconType = 'LocationOn' | 'Forest' | 'Room' | 'FmdGood' | 'PinDrop';
export type DropoffIconType = 'Warehouse' | 'Factory' | 'LocalShipping' | 'Business';
// NEW: Chip Icon Types
export type ChipIconType = 'Category' | 'Grain' | 'Hub' | 'Business';

interface LayoutState {
    themeMode: PaletteMode;
    navLayout: 'left' | 'top';
    mobileDrawerOpen: boolean;
    mapSettings: MapSettings;
    puulaaniIcon: PuulaaniIconType;
    puulaaniIconSize: number;
    dropoffIcon: DropoffIconType;
    dropoffIconSize: number;
    otherMarkerIconSize: number;
    // NEW: Chip Transport States
    chipIcon: ChipIconType;
    chipIconSize: number;
    chipPathOpacity: number;
}

interface LayoutContextType extends LayoutState {
    toggleThemeMode: () => void;
    toggleNavLayout: () => void;
    toggleMobileDrawer: () => void;
    setMobileDrawerOpen: (open: boolean) => void;
    setMapCountry: (countryKey: string) => void;
    setPuulaaniIcon: (iconName: PuulaaniIconType) => void;
    setPuulaaniIconSize: (size: number) => void;
    setDropoffIcon: (iconName: DropoffIconType) => void;
    setDropoffIconSize: (size: number) => void;
    setOtherMarkerIconSize: (size: number) => void;
    // NEW: Setters for Chips
    setChipIcon: (iconName: ChipIconType) => void;
    setChipIconSize: (size: number) => void;
    setChipPathOpacity: (opacity: number) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    // Basic States
    const [themeMode, setThemeMode] = useState<PaletteMode>('light');
    const [navLayout, setNavLayout] = useState<'left' | 'top'>('left');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mapSettingKey, setMapSettingKey] = useState<string>(DEFAULT_MAP_SETTING_KEY);

    // Icon States
    const [puulaaniIcon, setPuulaaniIcon] = useState<PuulaaniIconType>('LocationOn');
    const [puulaaniIconSize, setPuulaaniIconSize] = useState<number>(34);
    const [dropoffIcon, setDropoffIcon] = useState<DropoffIconType>('Warehouse');
    const [dropoffIconSize, setDropoffIconSize] = useState<number>(26);
    const [otherMarkerIconSize, setOtherMarkerIconSize] = useState<number>(26);

    // NEW: Chip Transport States
    const [chipIcon, setChipIcon] = useState<ChipIconType>('Category');
    const [chipIconSize, setChipIconSize] = useState<number>(32);
    const [chipPathOpacity, setChipPathOpacity] = useState<number>(0.5);

    // --- 1. Effect to Load from LocalStorage on Mount ---
    useEffect(() => {
        const load = (key: string) => localStorage.getItem(key);

        const storedTheme = load('themeMode') as PaletteMode | null;
        if (storedTheme) setThemeMode(storedTheme);

        const storedNav = load('navLayout') as 'left' | 'top' | null;
        if (storedNav) setNavLayout(storedNav);

        const storedMapKey = load('mapSettingKey');
        if (storedMapKey) setMapSettingKey(storedMapKey);

        const storedIcon = load('puulaaniIcon') as PuulaaniIconType | null;
        if (storedIcon) setPuulaaniIcon(storedIcon);

        const storedIconSize = load('puulaaniIconSize');
        if (storedIconSize) setPuulaaniIconSize(Number(storedIconSize));

        const storedDropoffIcon = load('dropoffIcon') as DropoffIconType | null;
        if (storedDropoffIcon) setDropoffIcon(storedDropoffIcon);

        const storedDropoffIconSize = load('dropoffIconSize');
        if (storedDropoffIconSize) setDropoffIconSize(Number(storedDropoffIconSize));

        const storedOtherMarkerIconSize = load('otherMarkerIconSize');
        if (storedOtherMarkerIconSize) setOtherMarkerIconSize(Number(storedOtherMarkerIconSize));

        // NEW: Load Chip Settings
        const storedChipIcon = load('chipIcon') as ChipIconType | null;
        if (storedChipIcon) setChipIcon(storedChipIcon);

        const storedChipIconSize = load('chipIconSize');
        if (storedChipIconSize) setChipIconSize(Number(storedChipIconSize));

        const storedChipPathOpacity = load('chipPathOpacity');
        if (storedChipPathOpacity) setChipPathOpacity(Number(storedChipPathOpacity));
    }, []);

    // --- 2. Effects to Persist to LocalStorage ---
    useEffect(() => { localStorage.setItem('themeMode', themeMode); }, [themeMode]);
    useEffect(() => { localStorage.setItem('navLayout', navLayout); }, [navLayout]);
    useEffect(() => { localStorage.setItem('mapSettingKey', mapSettingKey); }, [mapSettingKey]);
    useEffect(() => { localStorage.setItem('puulaaniIcon', puulaaniIcon); }, [puulaaniIcon]);
    useEffect(() => { localStorage.setItem('puulaaniIconSize', String(puulaaniIconSize)); }, [puulaaniIconSize]);
    useEffect(() => { localStorage.setItem('dropoffIcon', dropoffIcon); }, [dropoffIcon]);
    useEffect(() => { localStorage.setItem('dropoffIconSize', String(dropoffIconSize)); }, [dropoffIconSize]);
    useEffect(() => { localStorage.setItem('otherMarkerIconSize', String(otherMarkerIconSize)); }, [otherMarkerIconSize]);

    // NEW: Persist Chip Settings
    useEffect(() => { localStorage.setItem('chipIcon', chipIcon); }, [chipIcon]);
    useEffect(() => { localStorage.setItem('chipIconSize', String(chipIconSize)); }, [chipIconSize]);
    useEffect(() => { localStorage.setItem('chipPathOpacity', String(chipPathOpacity)); }, [chipPathOpacity]);


    // --- HANDLER FUNCTIONS ---
    const toggleThemeMode = () => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    const toggleNavLayout = () => setNavLayout((prev) => (prev === 'left' ? 'top' : 'left'));
    const toggleMobileDrawer = () => setMobileDrawerOpen((prev) => !prev);
    const setMapCountry = (countryKey: string) => setMapSettingKey(countryKey);

    const handleSetPuulaaniIcon = (iconName: PuulaaniIconType) => setPuulaaniIcon(iconName);
    const handleSetPuulaaniIconSize = (size: number) => setPuulaaniIconSize(size);
    const handleSetDropoffIcon = (iconName: DropoffIconType) => setDropoffIcon(iconName);
    const handleSetDropoffIconSize = (size: number) => setDropoffIconSize(size);
    const handleSetOtherMarkerIconSize = (size: number) => setOtherMarkerIconSize(size);

    // NEW: Chip Handlers
    const handleSetChipIcon = (iconName: ChipIconType) => setChipIcon(iconName);
    const handleSetChipIconSize = (size: number) => setChipIconSize(size);
    const handleSetChipPathOpacity = (opacity: number) => setChipPathOpacity(opacity);


    const mapSettings = useMemo(() => {
        return countryMapSettings.find(c => c.key === mapSettingKey) || countryMapSettings.find(c => c.key === DEFAULT_MAP_SETTING_KEY)!;
    }, [mapSettingKey]);

    return (
        <LayoutContext.Provider
            value={{
                themeMode, navLayout, mobileDrawerOpen, mapSettings,
                puulaaniIcon, puulaaniIconSize, dropoffIcon, dropoffIconSize, otherMarkerIconSize,
                // NEW
                chipIcon, chipIconSize, chipPathOpacity,

                toggleThemeMode, toggleNavLayout, toggleMobileDrawer,
                setMobileDrawerOpen, setMapCountry,
                setPuulaaniIcon: handleSetPuulaaniIcon,
                setPuulaaniIconSize: handleSetPuulaaniIconSize,
                setDropoffIcon: handleSetDropoffIcon,
                setDropoffIconSize: handleSetDropoffIconSize,
                setOtherMarkerIconSize: handleSetOtherMarkerIconSize,
                // NEW Setters
                setChipIcon: handleSetChipIcon,
                setChipIconSize: handleSetChipIconSize,
                setChipPathOpacity: handleSetChipPathOpacity
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
// src/config/navConfig.ts
import React from 'react';

// Import all necessary icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import BusinessIcon from '@mui/icons-material/Business';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WorkspacesIcon from '@mui/icons-material/Workspaces'; // For Arrangement
import TuneIcon from '@mui/icons-material/Tune'; // For Control
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // For App Settings
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

// --- 1. Update the interface to support nested children ---
export interface NavItemConfig {
    text: string;
    icon: React.ReactElement;
    path?: string; // Optional: A category might not have a path
    isTopNav?: boolean;
    permission?: string;
    roles?: string[];
    children?: NavItemConfig[]; // Array of sub-items
}

// --- 2. Restructure the navigation items with parent-child relationships ---
export const navigationItems: NavItemConfig[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', isTopNav: true },

    // --- OFFICE Category ---
    {
        text: 'Office',
        icon: <ReceiptLongIcon />,
        isTopNav: true, // This will be a dropdown in the top nav
        children: [
            { text: 'Driven/Inspection', icon: <AssignmentIcon />, path: '/driven-inspection', permission: 'driven_inspection_view' },
            // Add placeholder paths for new items
            { text: 'Driven & Inspection', icon: <ReceiptLongIcon />, path: '/driven-inspection' },
            { text: 'Puulaani Invoicing', icon: <ReceiptLongIcon />, path: '/invoicing/puulaani' },
            { text: 'Consignment Invoicing', icon: <ReceiptLongIcon />, path: '/invoicing/consignment' },
        ]
    },

    // --- ARRANGEMENT Category ---
    {
        text: 'Arrangement',
        icon: <WorkspacesIcon />,
        isTopNav: true,
        children: [
            { text: 'Timber Management', icon: <ViewListIcon />, path: '/timber-management', permission: 'timber_stack_view' },
            { text: 'Timber Map', icon: <MapIcon />, path: '/timber-stacks', permission: 'timber_stack_view' },
            { text: 'Load Management', icon: <LocalShippingIcon />, path: '/loads', permission: 'load_view' },
        ]
    },
    
    // --- CONTROL Category ---
    {
        text: 'Control',
        icon: <TuneIcon />,
        isTopNav: true,
        children: [
            { text: 'Clients', icon: <BusinessIcon />, path: '/clients', permission: 'client_view' },
            { text: 'Drivers', icon: <PeopleIcon />, path: '/drivers', permission: 'driver_view' },
            { text: 'Vehicles', icon: <DirectionsCarIcon />, path: '/vehicles', permission: 'vehicle_view' },
            { text: 'Reports', icon: <BarChartIcon />, path: '/reports', permission: 'report_view' },
        ]
    },

    // --- APP SETTINGS Category ---
    {
        text: 'App Settings',
        icon: <AdminPanelSettingsIcon />,
        isTopNav: false, // Keep this group in sidebar only for a cleaner look
        children: [
            { text: 'Users', icon: <GroupIcon />, path: '/users', permission: 'user_view' },
            { text: 'Application Settings', icon: <SettingsIcon />, path: '/admin/settings', roles: ['Superuser'] },
            { text: 'My Profile', icon: <AccountCircleIcon />, path: '/settings/user' },
        ]
    },
];
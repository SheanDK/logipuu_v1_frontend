// frontend/src/config/navConfig.ts
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
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import TuneIcon from '@mui/icons-material/Tune';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';

export interface NavItemConfig {
    text: string;
    icon: React.ReactElement;
    path?: string;
    isTopNav?: boolean;
    permission?: string;
    roles?: string[];
    children?: NavItemConfig[];
}

// --- NAVIGATION FOR OFFICE STAFF, ADMINS, ETC. ---
export const officeNavigationItems: NavItemConfig[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', isTopNav: true },
    {
        text: 'Arrangement',
        icon: <WorkspacesIcon />,
        isTopNav: true,
        children: [
            { text: 'Timber Map', icon: <MapIcon />, path: '/timber-stacks', permission: 'timber map_view' },
            { text: 'Load Management', icon: <LocalShippingIcon />, path: '/loads', permission: 'load management_view' }, // Assuming a 'load_view' permission
            { text: 'Timber Management', icon: <ViewListIcon />, path: '/timber-management', permission: 'timber management_view' },
        ]
    },
    {
        text: 'Office',
        icon: <ReceiptLongIcon />,
        isTopNav: true,
        children: [
            { text: 'Driven/Inspection', icon: <AssignmentIcon />, path: '/driven-inspection' },
            { text: 'Puulaani Invoicing', icon: <ReceiptLongIcon />, path: '/invoicing/puulaani' },
            { text: 'Consignment Invoicing', icon: <ReceiptLongIcon />, path: '/invoicing/consignment' },
        ]
    },
    {
        text: 'Control',
        icon: <TuneIcon />,
        isTopNav: true,
        children: [
            { text: 'Clients', icon: <BusinessIcon />, path: '/clients', permission: 'clients_view' },
            { text: 'Drivers', icon: <PeopleIcon />, path: '/drivers', permission: 'drivers_view' },
            { text: 'Vehicles', icon: <DirectionsCarIcon />, path: '/vehicles', permission: 'vehicles_view' },
            { text: 'Reports', icon: <BarChartIcon />, path: '/reports', permission: 'reports_view' },
        ]
    },
    {
        text: 'App Settings',
        icon: <AdminPanelSettingsIcon />,
        isTopNav: false,
        children: [
            { text: 'Users', icon: <GroupIcon />, path: '/users', permission: 'users_view' },
            { text: 'Application Settings', icon: <SettingsIcon />, path: '/admin/settings', roles: ['Superuser'] },
            { text: 'My Profile', icon: <AccountCircleIcon />, path: '/settings/user' },
        ]
    },
];

// --- NAVIGATION FOR DRIVERS ---
export const driverNavigationItems: NavItemConfig[] = [
    { 
        text: 'My Dashboard', 
        icon: <DashboardIcon />, 
        path: '/my-loads',
        isTopNav: true,
        roles: ['Kuljettaja'] 
    },
    { 
        text: 'Completed Trips', 
        icon: <HistoryIcon />, 
        path: '/my-loads/completed-trips',
        isTopNav: true,
        roles: ['Kuljettaja']
    },
    {
        text: 'App Settings',
        icon: <AdminPanelSettingsIcon />,
        isTopNav: false,
        roles: ['Kuljettaja'],
        children: [
            { 
                text: 'My Profile', 
                icon: <AccountCircleIcon />, 
                path: '/settings/user',
                roles: ['Kuljettaja']
            },
        ]
    },
];
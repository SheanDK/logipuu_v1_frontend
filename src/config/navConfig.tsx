// frontend/src/config/navConfig.ts
import React from 'react';

// Import all necessary icons
import DashboardIcon from '@mui/icons-material/Dashboard';
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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import ForestIcon from '@mui/icons-material/Forest';
import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';


export interface NavItemConfig {
    tKey: string;
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
    { text: 'Dashboard', tKey: 'dashboard', icon: <DashboardIcon />, path: '/dashboard', isTopNav: true },
    {
        text: 'Arrangement',
        tKey: 'arrangement',
        icon: <WorkspacesIcon />,
        isTopNav: true,
        children: [
            { text: 'Timber Map', tKey: 'timberMap', icon: <MapIcon />, path: '/timber-stacks', permission: 'timber map_view' },
            { text: 'Timber Management', tKey: 'timberManagement', icon: <ViewListIcon />, path: '/timber-management', permission: 'timber management_view' },

            // --- CHIP TRANSPORT SECTION ---
            {
                text: 'Chip Titles',
                tKey: 'chipManagement',
                icon: <TableChartIcon />,
                path: '/chip-management',
                permission: 'chip management_view'
            },
            {
                text: 'Chip Planning',
                tKey: 'chipPlanning',
                icon: <CalendarMonthIcon />,
                path: '/chip-management/planning',
                permission: 'chip management_planning'
            },
            {
                text: 'Chip Subscriptions',
                tKey: 'chipSubscriptions',
                icon: <ReceiptLongIcon />,
                path: '/chip-management/subscriptions',
                permission: 'chip management_subscriptions'
            },
        ]
    },
    {
        text: 'Office',
        tKey: 'office',
        icon: <ReceiptLongIcon />,
        isTopNav: true,
        children: [
            { text: 'Load Management', tKey: 'loadManagement', icon: <LocalShippingIcon />, path: '/loads', permission: 'load management_view' },
            { text: 'Puulaani Invoicing', tKey: 'puulaaniInvoicing', icon: <ReceiptLongIcon />, path: '/puulaani-invoicing' },
            { text: 'Consignment Invoicing', tKey: 'consignmentInvoicing', icon: <ReceiptLongIcon />, path: '/consignment-invoicing' },
        ]
    },
    {
        text: 'Control',
        tKey: 'control',
        icon: <TuneIcon />,
        isTopNav: true,
        children: [
            { text: 'Clients', tKey: 'clients', icon: <BusinessIcon />, path: '/clients', permission: 'clients_view' },
            { text: 'Drivers', tKey: 'drivers', icon: <PeopleIcon />, path: '/drivers', permission: 'drivers_view' },
            { text: 'Vehicles', tKey: 'vehicles', icon: <DirectionsCarIcon />, path: '/vehicles', permission: 'vehicles_view' },
            { text: 'Wood Categories', tKey: 'woodCategories', icon: <ForestIcon />, path: '/wood-categories', permission: 'wood categories_view' }
        ]
    },
    {
        text: 'App Settings',
        tKey: 'appSettings',
        icon: <AdminPanelSettingsIcon />,
        isTopNav: false,
        children: [
            { text: 'Users', tKey: 'users', icon: <GroupIcon />, path: '/users', permission: 'users_view' },
            { text: 'Application Settings', tKey: 'applicationSettings', icon: <SettingsIcon />, path: '/admin/settings', roles: ['Superuser'] },
            { text: 'My Profile', tKey: 'myProfile', icon: <AccountCircleIcon />, path: '/settings/user' },
        ]
    },
];

// --- NAVIGATION FOR DRIVERS ---
export const driverNavigationItems: NavItemConfig[] = [
    {
        text: 'My Dashboard',
        tKey: 'myDashboard',
        icon: <DashboardIcon />,
        path: '/my-loads',
        isTopNav: true,
        roles: ['Kuljettaja']
    },
    {
        text: 'Completed Trips',
        tKey: 'completedTrips',
        icon: <HistoryIcon />,
        path: '/my-loads/completed-trips',
        isTopNav: true,
        roles: ['Kuljettaja']
    },
    {
        text: 'App Settings',
        tKey: 'appSettings',
        icon: <AdminPanelSettingsIcon />,
        isTopNav: false,
        roles: ['Kuljettaja'],
        children: [
            {
                text: 'My Profile',
                tKey: 'myProfile',
                icon: <AccountCircleIcon />,
                path: '/settings/user',
                roles: ['Kuljettaja']
            },
            {
                text: 'User Manual',
                tKey: 'userManual',
                path: '/settings/manual',
                icon: <MenuBookIcon />,
            }
        ]
    },
];
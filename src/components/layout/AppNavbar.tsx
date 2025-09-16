// frontend/src/components/layout/AppNavbar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
    AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, 
    Avatar, Box, Tooltip, Button, Divider, ListItemIcon, ListItemText, Chip, Paper
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Import Icons
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/LightMode';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Import Contexts and Config
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useDriverSession } from '../../contexts/DriverSessionContext';
import { officeNavigationItems, driverNavigationItems, NavItemConfig } from '../../config/navConfig';

// --- Helper Component for the main Top Navigation Menu ---
const TopNavMenu = ({ navLinks, pathname }: { navLinks: NavItemConfig[], pathname: string }) => {
    const [openMenu, setOpenMenu] = useState<{ name: string, anchor: HTMLElement } | null>(null);
    const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>, menuName: string) => setOpenMenu({ name: menuName, anchor: event.currentTarget });
    const handleCategoryMenuClose = () => setOpenMenu(null);
    
    return (
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
            {navLinks.map((item) => {
                if (item.children) {
                    const isParentActive = item.children.some(child => child.path && pathname.startsWith(child.path));
                    return (
                        <Box key={item.text}>
                            <Button startIcon={item.icon} onClick={(e) => handleCategoryMenuOpen(e, item.text)} endIcon={<ArrowDropDownIcon />} sx={{ color: isParentActive ? 'primary.main' : 'inherit', fontWeight: isParentActive ? 'bold' : 'normal' }}>
                                {item.text}
                            </Button>
                            <Menu anchorEl={openMenu?.anchor} open={openMenu?.name === item.text} onClose={handleCategoryMenuClose} MenuListProps={{ onMouseLeave: handleCategoryMenuClose }} /* ...other props */ >
                                {item.children.map((child) => (
                                    <MenuItem key={child.path} component={Link} href={child.path!} onClick={handleCategoryMenuClose} selected={pathname.startsWith(child.path!)}>
                                        <ListItemIcon>{child.icon}</ListItemIcon>
                                        <ListItemText>{child.text}</ListItemText>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    );
                }
                const isActive = item.path && pathname.startsWith(item.path);
                return (
                    <Button component={Link} href={item.path!} key={item.path} startIcon={item.icon} sx={{ color: isActive ? 'primary.main' : 'inherit', fontWeight: isActive ? 'bold' : 'normal' }}>
                        {item.text}
                    </Button>
                );
            })}
        </Box>
    );
};

// --- Helper Component for User actions and menus ---
const UserActions = () => {
    const { user, logout } = useAuth();
    const { themeMode, toggleThemeMode, navLayout, toggleNavLayout } = useLayout();
    const { selectedVehicleRegNo, clearVehicle } = useDriverSession();
    const router = useRouter();

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);
    const handleLogout = () => { clearVehicle(); logout(); handleCloseUserMenu(); };
    const handleGoToSettings = () => { router.push('/settings/user'); handleCloseUserMenu(); };
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user?.roles.includes('Kuljettaja') && selectedVehicleRegNo && (
                <Paper variant="outlined" sx={{ mr: 2, p: '2px 8px', borderRadius: 1, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                    <Chip icon={<AccountCircleIcon />} label={user.fullName} size="small" />
                    <Divider orientation="vertical" flexItem />
                    <Chip icon={<DirectionsCarIcon />} label={selectedVehicleRegNo} size="small" variant="outlined" />
                </Paper>
            )}

            <Tooltip title={`Toggle Theme`}><IconButton sx={{ ml: 1 }} onClick={toggleThemeMode} color="inherit">{themeMode === 'dark' ? <LightModeIcon /> : <Brightness4Icon />}</IconButton></Tooltip>
            <Tooltip title={`Switch Navigation`}><IconButton sx={{ ml: 1 }} onClick={toggleNavLayout} color="inherit">{navLayout === 'left' ? <ViewDayIcon /> : <ViewSidebarIcon />}</IconButton></Tooltip>
            
            {user && (
                <Box sx={{ ml: 2 }}>
                    <Tooltip title="Open settings">
                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}><Avatar alt={user.fullName || 'U'} sx={{ width: 36, height: 36 }}>{(user.fullName || 'U').charAt(0).toUpperCase()}</Avatar></IconButton>
                    </Tooltip>
                    <Menu sx={{ mt: '45px' }} anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu} /* ...other props */ >
                        <MenuItem disabled><Typography fontWeight="bold">{user.fullName}</Typography></MenuItem>
                        <Divider />
                        <MenuItem onClick={handleGoToSettings}><Typography>Profile Settings</Typography></MenuItem>
                        <MenuItem onClick={handleLogout}><Typography>Logout</Typography></MenuItem>
                    </Menu>
                </Box>
            )}
        </Box>
    );
};

// --- Main Navbar Component ---
export default function AppNavbar() {
    const { user } = useAuth();
    const { navLayout, toggleMobileDrawer } = useLayout();
    const pathname = usePathname();

    // Memoized logic to get the correct navigation items based on user role
    const navItems = useMemo(() => {
        if (!user) return [];
        const isDriver = user.roles.includes('Kuljettaja');
        const items = isDriver ? driverNavigationItems : officeNavigationItems;
        // The filtering logic can be further extracted if it gets more complex
        const filterItems = (list: NavItemConfig[]): NavItemConfig[] => list.map(item => {
            if (item.children) {
                const visibleChildren = filterItems(item.children);
                if (visibleChildren.length > 0) return { ...item, children: visibleChildren };
                return null;
            }
            if (item.permission && !user.permissions?.includes(item.permission)) return null;
            if (item.roles && !item.roles.some(role => user.roles.includes(role))) return null;
            return item;
        }).filter(Boolean) as NavItemConfig[];
        return filterItems(items);
    }, [user]);

    const topNavLinks = useMemo(() => navItems.filter(item => item.isTopNav), [navItems]);
    
    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'background.paper', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Toolbar>
                {navLayout === 'left' && (
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleMobileDrawer} sx={{ mr: 2, display: { md: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                )}
                <Link href="/dashboard" passHref style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <Image src="/images/softrain-logo.png" alt="Logo" width={150} height={40} priority style={{ marginRight: '16px' }} />
                </Link>
                
                <Box sx={{ flexGrow: 1 }} />
                
                {navLayout === 'top' && <TopNavMenu navLinks={topNavLinks} pathname={pathname} />}
                
                <UserActions />
            </Toolbar>
        </AppBar>
    );
}
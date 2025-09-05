// frontend/src/components/layout/AppNavbar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
    AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, 
    Avatar, Box, Tooltip, Button, Divider, ListItemIcon, ListItemText 
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/LightMode';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { officeNavigationItems, driverNavigationItems, NavItemConfig } from '../../config/navConfig';

export default function AppNavbar() {
    const { user, logout } = useAuth();
    const { themeMode, toggleThemeMode, navLayout, toggleNavLayout, toggleMobileDrawer } = useLayout();
    const router = useRouter();
    const pathname = usePathname();

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [openMenu, setOpenMenu] = useState<{ name: string, anchor: HTMLElement } | null>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);
    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget);
    const handleCloseNavMenu = () => setAnchorElNav(null);
    const handleLogout = () => { logout(); handleCloseUserMenu(); };
    const handleGoToSettings = () => { router.push('/settings/user'); handleCloseUserMenu(); };
    const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>, menuName: string) => setOpenMenu({ name: menuName, anchor: event.currentTarget });
    const handleCategoryMenuClose = () => setOpenMenu(null);

    const getFilteredNavItems = useMemo(() => {
        if (!user) return [];
        
        const isDriver = user.roles.includes('Kuljettaja');
        const navigationItems = isDriver ? driverNavigationItems : officeNavigationItems;

        const filterItems = (items: NavItemConfig[]): NavItemConfig[] => {
            return items.map(item => {
                if (item.children) {
                    const visibleChildren = filterItems(item.children);
                    if (visibleChildren.length > 0) {
                        return { ...item, children: visibleChildren };
                    }
                    return null;
                }
                if (item.permission && !user.permissions?.includes(item.permission)) return null;
                if (item.roles && !item.roles.some(role => user.roles.includes(role))) return null;
                return item;
            }).filter(Boolean) as NavItemConfig[];
        };

        return filterItems(navigationItems);
    }, [user]);
    
    const topNavLinks = useMemo(() => 
        getFilteredNavItems.filter(item => item.isTopNav === true),
        [getFilteredNavItems]
    );

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'background.paper', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Toolbar>
                {navLayout === 'left' && (<IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleMobileDrawer} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>)}
                <Link href="/dashboard" passHref style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <Image src="/images/softrain-logo.png" alt="Logo" width={150} height={40} priority style={{ marginRight: '16px' }} />
                </Link>
                <Box sx={{ flexGrow: 1 }} />
                {navLayout === 'top' && (<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>{topNavLinks.map((item) => { const isParentActive = item.children?.some(child => child.path && pathname.startsWith(child.path)); if (item.children) { return (<Box key={item.text}><Button startIcon={<Box component="span" sx={{ display: 'inline-flex', fontSize: '1.25rem' }}>{item.icon}</Box>} onClick={(e) => handleCategoryMenuOpen(e, item.text)} endIcon={<ArrowDropDownIcon />} sx={{ my: 2, color: isParentActive ? 'primary.main' : 'text.primary', fontWeight: isParentActive ? 'bold' : 'normal', textTransform: 'none', fontSize: '0.9rem' }}>{item.text}</Button><Menu elevation={3} anchorEl={openMenu?.anchor} open={openMenu?.name === item.text} onClose={handleCategoryMenuClose} MenuListProps={{ onMouseLeave: handleCategoryMenuClose }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }} PaperProps={{ sx: { borderRadius: '8px', mt: 1 } }}>{item.children.map((child) => { const isChildActive = !!(child.path && pathname.startsWith(child.path)); return (<MenuItem key={child.path} component={Link} href={child.path!} onClick={handleCategoryMenuClose} selected={isChildActive} sx={{ '&.Mui-selected': { fontWeight: 'bold' } }}><ListItemIcon sx={{ minWidth: 36 }}><Box component="span" sx={{ display: 'inline-flex', fontSize: '1.25rem' }}>{child.icon}</Box></ListItemIcon><ListItemText>{child.text}</ListItemText></MenuItem>); })}</Menu></Box>); } const isActive = item.path && (pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))); return (<Button component={Link} href={item.path!} key={item.path} startIcon={<Box component="span" sx={{ display: 'inline-flex', fontSize: '1.25rem' }}>{item.icon}</Box>} sx={{ my: 2, color: isActive ? 'primary.main' : 'text.primary', fontWeight: isActive ? 'bold' : 'normal', textTransform: 'none', fontSize: '0.9rem' }}>{item.text}</Button>); })}</Box>)}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={`Toggle ${themeMode === 'light' ? 'Dark' : 'Light'} Theme`}><IconButton sx={{ ml: 1 }} onClick={toggleThemeMode} color="inherit">{themeMode === 'dark' ? <LightModeIcon /> : <Brightness4Icon />}</IconButton></Tooltip>
                    <Tooltip title={`Switch to ${navLayout === 'left' ? 'Top' : 'Left'} Navigation`}><IconButton sx={{ ml: 1 }} onClick={toggleNavLayout} color="inherit">{navLayout === 'left' ? <ViewDayIcon /> : <ViewSidebarIcon />}</IconButton></Tooltip>
                    {navLayout === 'top' && (<Box sx={{ display: { xs: 'flex', md: 'none' } }}><IconButton size="large" onClick={handleOpenNavMenu} color="inherit"><MenuIcon /></IconButton><Menu anchorEl={anchorElNav} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}>{topNavLinks.map((item) => { if (!item.children) { return (<MenuItem key={item.text} onClick={() => { router.push(item.path!); handleCloseNavMenu(); }}><ListItemIcon sx={{ minWidth: 36 }}><Box component="span" sx={{ display: 'inline-flex', fontSize: '1.25rem' }}>{item.icon}</Box></ListItemIcon><ListItemText>{item.text}</ListItemText></MenuItem>); } return [<MenuItem key={item.text} disabled sx={{ opacity: '1 !important', mt: 1 }}><Typography variant="overline" sx={{ fontWeight: 'bold' }}>{item.text}</Typography></MenuItem>, ...item.children.map(child => (<MenuItem key={child.path} onClick={() => { router.push(child.path!); handleCloseNavMenu(); }} sx={{ pl: 4 }}><ListItemIcon sx={{ minWidth: 36 }}><Box component="span" sx={{ display: 'inline-flex', fontSize: '1.25rem' }}>{child.icon}</Box></ListItemIcon><ListItemText>{child.text}</ListItemText></MenuItem>))]; })}</Menu></Box>)}
                    {user && (<Box sx={{ flexGrow: 0, ml: 2 }}><Tooltip title="Open settings"><IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}><Avatar alt={user.fullName || 'U'} sx={{ width: 36, height: 36 }}>{(user.fullName || 'U').charAt(0).toUpperCase()}</Avatar></IconButton></Tooltip><Menu sx={{ mt: '45px' }} anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} keepMounted transformOrigin={{ vertical: 'top', horizontal: 'right' }}><MenuItem disabled><Typography fontWeight="bold" sx={{ px: 2 }}>{user.fullName}</Typography></MenuItem><Divider /><MenuItem onClick={handleGoToSettings}><Typography>Profile Settings</Typography></MenuItem><MenuItem onClick={handleLogout}><Typography>Logout</Typography></MenuItem></Menu></Box>)}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
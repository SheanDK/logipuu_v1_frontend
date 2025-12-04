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

// i18n
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { withLng } from '@/utils/withLng';
import { fallbackLng } from '@/i18n/settings';
import { useTranslation } from '@/i18n/useTranslation';

// 1. Fullscreen icons and hook import 
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useFullscreen } from '@/hooks/useFullscreen'; 

// --- Helper Component for the main Top Navigation Menu ---
const TopNavMenu = ({
  navLinks,
  pathname,
  currentLng,
}: {
  navLinks: NavItemConfig[];
  pathname: string;
  currentLng: string;
}) => {
  const { t } = useTranslation(['navbar']);
  const [openMenu, setOpenMenu] =
    useState<{ name: string; anchor: HTMLElement } | null>(null);

  const handleCategoryMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    menuName: string
  ) => setOpenMenu({ name: menuName, anchor: event.currentTarget });
  const handleCategoryMenuClose = () => setOpenMenu(null);

  const labelFor = (item: NavItemConfig) => {
    const key = item.tKey ? `navbar.${item.tKey}` : undefined;
    return key ? t(key, { defaultValue: item.text }) : item.text;
  };

  return (
    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
      {navLinks.map((item) => {
        const label = labelFor(item);
        const itemPathWithLng = item.path ? withLng(currentLng, item.path) : undefined;

        if (item.children) {
          const isParentActive = item.children.some((child) => {
            const childPathWithLng = child.path ? withLng(currentLng, child.path) : undefined;
            return !!(childPathWithLng && pathname.startsWith(childPathWithLng));
          });

          const stableKey = item.tKey ?? item.text ?? item.path ?? 'menu';

          return (
            <Box key={stableKey}>
              <Button
                startIcon={item.icon}
                onClick={(e) => handleCategoryMenuOpen(e, stableKey)}
                endIcon={<ArrowDropDownIcon />}
                sx={{ color: isParentActive ? 'primary.main' : 'inherit', fontWeight: isParentActive ? 'bold' : 'normal' }}
              >
                {label}
              </Button>

              <Menu
                anchorEl={openMenu?.anchor}
                open={openMenu?.name === stableKey}
                onClose={handleCategoryMenuClose}
                MenuListProps={{ onMouseLeave: handleCategoryMenuClose }}
              >
                {item.children.map((child) => {
                  const childLabel = labelFor(child); 
                  const childPathWithLng = child.path ? withLng(currentLng, child.path) : '#';
                  const isChildActive = !!child.path && pathname.startsWith(childPathWithLng);

                  return (
                    <MenuItem
                      key={child.path}
                      component={Link}
                      href={childPathWithLng}
                      onClick={handleCategoryMenuClose}
                      selected={isChildActive}
                      sx={{ '&.Mui-selected': { fontWeight: 'bold' } }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText>{childLabel}</ListItemText>
                    </MenuItem>
                  );
                })}
              </Menu>
            </Box>
          );
        }

        const isActive =
          !!itemPathWithLng &&
          (pathname === itemPathWithLng ||
            (item.path !== '/dashboard' && pathname.startsWith(itemPathWithLng)));

        return (
          <Button
            component={Link}
            href={itemPathWithLng!}
            key={item.path}
            startIcon={item.icon}
            sx={{ color: isActive ? 'primary.main' : 'inherit', fontWeight: isActive ? 'bold' : 'normal' }}
          >
            {label}
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
    const pathname = usePathname();
    const currentLng = (pathname.split('/')[1] || fallbackLng) as string;
    const { t } = useTranslation(['navbar']);
      // 2. Use the fullscreen hook
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    const nextLayout = navLayout === 'left' ? 'top' : 'left';

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);
    const handleLogout = () => { clearVehicle(); logout(); handleCloseUserMenu(); };
    const handleGoToSettings = () => { router.push(withLng(currentLng, '/settings/user')); handleCloseUserMenu(); };
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Driver badge (visible for drivers) */}
            {user?.roles.includes('Kuljettaja') && selectedVehicleRegNo && (
                <Paper
                    variant="outlined"
                    sx={{ mr: 2, p: '2px 8px', borderRadius: 1, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}
                >
                    <Chip icon={<AccountCircleIcon />} label={user.fullName} size="small" />
                    <Divider orientation="vertical" flexItem />
                    <Chip icon={<DirectionsCarIcon />} label={selectedVehicleRegNo} size="small" variant="outlined" />
                </Paper>
            )}

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Theme & layout toggles with localized tooltips */}
            <Tooltip title={t('navbar:tooltips.toggleTheme', { mode: t(`navbar:modes.${nextMode}`) })}>
                <IconButton sx={{ ml: 1 }} onClick={toggleThemeMode} color="inherit">
                    {themeMode === 'dark' ? <LightModeIcon /> : <Brightness4Icon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={t('navbar:tooltips.switchNavLayout', { layout: t(`navbar:layouts.${nextLayout}`) })}>
                <IconButton sx={{ ml: 1 }} onClick={toggleNavLayout} color="inherit">
                    {navLayout === 'left' ? <ViewDayIcon /> : <ViewSidebarIcon />}
                </IconButton>
            </Tooltip>
            {/* Fullscreen toggle with localized tooltip */}
            <Tooltip title={isFullscreen ? t('navbar:tooltips.exitFullscreen') : t('navbar:tooltips.enterFullscreen')}>
                <IconButton sx={{ ml: 1 }} onClick={toggleFullscreen} color="inherit">
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
            </Tooltip>
            
            {user && (
                <Box sx={{ ml: 2 }}>
                    <Tooltip title={t('navbar:tooltips.openSettings')}>
                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                            <Avatar alt={user.fullName || 'U'} sx={{ width: 36, height: 36 }}>
                                {(user.fullName || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu sx={{ mt: '45px' }} anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu}>
                        <MenuItem disabled><Typography fontWeight="bold">{user.fullName}</Typography></MenuItem>
                        <Divider />
                        <MenuItem onClick={handleGoToSettings}><Typography>{t('navbar:menu.profileSettings')}</Typography></MenuItem>
                        <MenuItem onClick={handleLogout}><Typography>{t('navbar:menu.logout')}</Typography></MenuItem>
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
    const currentLng = (pathname.split('/')[1] || fallbackLng) as string;

    // Memoized logic to get the correct navigation items based on user role
    const navItems = useMemo(() => {
        if (!user) return [];
        const isDriver = user.roles.includes('Kuljettaja');
        const items = isDriver ? driverNavigationItems : officeNavigationItems;
        const filterItems = (list: NavItemConfig[]): NavItemConfig[] =>
            list.map(item => {
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
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <Toolbar>
                {navLayout === 'left' && (
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleMobileDrawer} sx={{ mr: 2, display: { md: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                )}
                <Link
                    href={withLng(currentLng, '/dashboard')}
                    passHref
                    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                >
                    <Image src="/images/hkk-logo.png" alt="Logo" width={150} height={40} priority style={{ marginRight: '16px' }} />
                </Link>
                
                <Box sx={{ flexGrow: 1 }} />
                
                {navLayout === 'top' && (
                    <TopNavMenu navLinks={topNavLinks} pathname={pathname} currentLng={currentLng} />
                )}
                
                <UserActions />
            </Toolbar>
        </AppBar>
    );
}

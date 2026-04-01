// frontend/src/components/layout/AppNavbar.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Menu, MenuItem,
    Avatar, Box, Tooltip, Button, Divider, ListItemIcon, ListItemText, Chip, Paper,
    Badge, Popover, List, ListItemButton,
    Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

// Import Icons
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/LightMode';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/FiberManualRecord';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Import Contexts, Services and Hooks
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useDriverSession } from '../../contexts/DriverSessionContext';
import { officeNavigationItems, driverNavigationItems, NavItemConfig } from '../../config/navConfig';
import useSocket from '@/hooks/useSocket';
import chipPlanningService from '@/services/chipPlanningService';
import { useFullscreen } from '@/hooks/useFullscreen';

// i18n
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { withLng } from '@/utils/withLng';
import { fallbackLng } from '@/i18n/settings';
import { useTranslation } from '@/i18n/useTranslation';
import { t } from 'i18next';

// --- Top Navigation Menu Helper ---
const TopNavMenu = ({ navLinks, pathname, currentLng }: { navLinks: NavItemConfig[]; pathname: string; currentLng: string; }) => {
    const { t } = useTranslation(['navbar']);
    const [openMenu, setOpenMenu] = useState<{ name: string; anchor: HTMLElement } | null>(null);

    const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>, menuName: string) => setOpenMenu({ name: menuName, anchor: event.currentTarget });
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
                    const stableKey = item.tKey ?? item.text ?? item.path ?? 'menu';
                    return (
                        <Box key={stableKey}>
                            <Button startIcon={item.icon} onClick={(e) => handleCategoryMenuOpen(e, stableKey)} endIcon={<ArrowDropDownIcon />}>
                                {label}
                            </Button>
                            <Menu anchorEl={openMenu?.anchor} open={openMenu?.name === stableKey} onClose={handleCategoryMenuClose}>
                                {item.children.map((child) => (
                                    <MenuItem key={child.path} component={Link} href={withLng(currentLng, child.path!)} onClick={handleCategoryMenuClose}>
                                        <ListItemIcon>{child.icon}</ListItemIcon>
                                        <ListItemText>{labelFor(child)}</ListItemText>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    );
                }
                return (
                    <Button key={item.path} component={Link} href={itemPathWithLng!} startIcon={item.icon}>
                        {label}
                    </Button>
                );
            })}
        </Box>
    );
};

// --- User Actions Helper (Notifications, Theme, Profile) ---
const UserActions = () => {
    const { user, logout } = useAuth();
    const { themeMode, toggleThemeMode } = useLayout();
    const { selectedVehicleRegNo, selectedVehicleId, clearVehicle } = useDriverSession();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const router = useRouter();
    const pathname = usePathname();
    const currentLng = (pathname.split('/')[1] || fallbackLng) as string;
    const { t } = useTranslation(['navbar', 'notifications', 'chip-management', 'common']);

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedNotif, setSelectedNotif] = useState<any>(null);

    const isDriver = user?.roles.includes('Kuljettaja');
    const recipientUserId = isDriver ? user?.driverNumericId : 0;

    const { socket } = useSocket(recipientUserId);

    useEffect(() => {
        if (recipientUserId === null || recipientUserId === undefined) return;
        chipPlanningService.getNotifications(Number(recipientUserId))
            .then(res => setNotifications(res || []))
            .catch(err => console.error("Initial fetch failed:", err));
    }, [recipientUserId]);

    useEffect(() => {
        if (!socket) return;

        const handleSync = () => {
            if (recipientUserId !== null) {
                chipPlanningService.getNotifications(Number(recipientUserId))
                    .then(res => setNotifications(res || []))
                    .catch(err => console.error(err));
            }
        };

        const handleNewNotif = (notif: any) => {
            if (isDriver && notif.type === 'DRIVER_ACKNOWLEDGED') return; // රියදුරන්ට Office පණිවිඩ එපා
            if (isDriver && notif.type === 'LOAD_COMPLETED') return; // රියදුරන්ට 'LOADE_COMPLETED' එපා
            if (!isDriver && notif.type === 'REASSIGNMENT_REQUEST') return; // Office එකට Request පණිවිඩ එපා

            console.log("🔔 New Real-time Notification Received in Navbar:", notif);
            // Deduplicate if needed or just add
            setNotifications(prev => {
                const exists = prev.some(n => (n.notification_id || n.notificationId) === (notif.notification_id || notif.notificationId));
                if (exists) return prev;
                return [notif, ...prev];
            });
        };

        socket.on('newNotification', handleNewNotif);

        window.addEventListener('refreshNotifications', handleSync);

        return () => {
            socket.off('newNotification', handleNewNotif);
            window.removeEventListener('refreshNotifications', handleSync);
        };
    }, [socket, recipientUserId]);

    const handleMarkAllAsRead = async () => {
        if (recipientUserId === null || recipientUserId === undefined) return;
        try {
            await chipPlanningService.markAllNotificationsAsRead(Number(recipientUserId));

            setNotifications(prev => prev.map(n => {
                if (n.type === 'REASSIGNMENT_REQUEST') return n;
                return { ...n, is_read: true, isRead: true };
            }));
        } catch (error) {
            console.error("Mark all read failed", error);
        }
    };

    const handleClearRead = async () => {
        if (recipientUserId === null || recipientUserId === undefined) return;
        try {
            await chipPlanningService.clearReadNotifications(Number(recipientUserId));
            setNotifications(prev => prev.filter(n => !(n.isRead || n.is_read)));
        } catch (error) {
            console.error("Clear read failed", error);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await chipPlanningService.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => {
                const currentId = n.notification_id || n.notificationId;
                return currentId === id ? { ...n, is_read: true, isRead: true } : n;
            }));
        } catch (error) { console.error(error); }
    };

    const handleTransferResponse = async (notif: any, approve: boolean) => {
        const loadId = notif.related_id || notif.relatedId;
        const notifId = notif.notification_id || notif.notificationId;
        if (!loadId) return;
        try {
            await chipPlanningService.approveTransfer(Number(loadId), approve, notifId ? Number(notifId) : null);
            setNotifications(prev => prev.map(n => ((n.notification_id || n.notificationId) === notifId ? { ...n, is_read: true, isRead: true } : n)));
            if (pathname.includes('/driver/dashboard')) window.location.reload();
        } catch (error) { console.error("Transfer failed:", error); }
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => setNotificationAnchorEl(event.currentTarget);
    const handleLogout = () => { clearVehicle(); logout(); setAnchorElUser(null); };

    const visibleUnreadCount = notifications.filter(n => {
        const isRead = n.isRead || n.is_read;
        const type = n.type || '';
        if (isRead) return false;
        if (isDriver && type === 'DRIVER_ACKNOWLEDGED') return false;
        if (!isDriver && type === 'REASSIGNMENT_REQUEST') return false;
        return true;
    }).length;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isDriver && selectedVehicleRegNo && (
                <Paper variant="outlined" sx={{ mr: 2, p: '2px 8px', borderRadius: 1, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                    <Chip icon={<AccountCircleIcon />} label={user?.fullName} size="small" />
                    <Divider orientation="vertical" flexItem />
                    <Chip icon={<DirectionsCarIcon />} label={selectedVehicleRegNo} size="small" variant="outlined" />
                </Paper>
            )}

            <LanguageSwitcher />

            <Tooltip title={t('navbar:tooltips.toggleTheme')}>
                <IconButton sx={{ ml: 1 }} onClick={toggleThemeMode} color="inherit">
                    {themeMode === 'dark' ? <LightModeIcon /> : <Brightness4Icon />}
                </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? t('navbar:tooltips.exitFullscreen') : t('navbar:tooltips.enterFullscreen')}>
                <IconButton sx={{ ml: 1 }} onClick={toggleFullscreen} color="inherit">
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
            </Tooltip>

            <Tooltip title={t('navbar:tooltips.notifications')}>
                <IconButton sx={{ ml: 1 }} onClick={handleOpenNotifications} color="inherit">
                    <Badge badgeContent={visibleUnreadCount} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={Boolean(notificationAnchorEl)}
                anchorEl={notificationAnchorEl}
                onClose={() => setNotificationAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{ sx: { mt: 1.5, width: 340, maxHeight: 450, borderRadius: 2 } }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#a38f6d', 0.05) }}>
                    <Typography variant="subtitle1" fontWeight="bold">{t('navbar.notifications')}</Typography>
                    <Chip size="small" label={`${visibleUnreadCount} ${t('navbar.new')}`} color="primary" />
                </Box>
                <Divider />
                <List sx={{ p: 0, overflowY: 'auto', maxHeight: 320 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('navbar.noNewNotifications')}
                            </Typography>
                        </Box>
                    ) : (
                        notifications
                            .filter((notif) => {
                                const type = notif.type || '';
                                if (!isDriver && type === 'REASSIGNMENT_REQUEST') return false;
                                if (isDriver && type === 'DRIVER_ACKNOWLEDGED') return false;
                                return true;
                            })
                            .map((notif, idx) => {
                                const isRead = notif.isRead || notif.is_read;
                                const type = notif.type || '';
                                const notifId = notif.notification_id || notif.notificationId;

                                return (
                                    <ListItemButton
                                        key={notifId || idx}
                                        onClick={() => {
                                            setSelectedNotif(notif);
                                            if (!isRead && notifId && type !== 'REASSIGNMENT_REQUEST') {
                                                handleMarkAsRead(notifId);
                                            }
                                        }}
                                        sx={{
                                            py: 1.5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            bgcolor: isRead ? 'transparent' : alpha('#a38f6d', 0.05),
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CircleIcon
                                                    sx={{
                                                        fontSize: 10,
                                                        color:
                                                            type === 'REASSIGNMENT_REQUEST' ? 'warning.main' :
                                                                type.includes('COMPLETED') ? 'success.main' :
                                                                    type.includes('DELETED') ? 'error.main' :
                                                                        'primary.main',
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={isRead ? 400 : 700}>
                                                        {t(`navbar.notifications:${type}.title`, { defaultValue: type.replace(/_/g, ' ') })}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <React.Fragment>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {t(`navbar.notifications:${type}.message`, {
                                                                defaultValue: notif.message,
                                                                loadId: notif.related_id || notif.relatedId,
                                                                vehicle: notif.vehicle_context_id || notif.vehicleContextId
                                                            })}
                                                        </Typography>
                                                        {/* Time Ago Implementation */}
                                                        <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem', opacity: 0.7 }}>
                                                            {dayjs(notif.created_at || notif.createdAt).fromNow()}
                                                        </Typography>
                                                    </React.Fragment>
                                                }
                                            />
                                        </Box>

                                        {isDriver && type === 'REASSIGNMENT_REQUEST' && !isRead && (
                                            <Stack direction="row" spacing={1} sx={{ mt: 1.5, ml: 4, width: '100%' }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    startIcon={<CheckIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTransferResponse(notif, true);
                                                    }}
                                                    sx={{ fontSize: '0.65rem', py: 0.2, px: 1, textTransform: 'none' }}
                                                >
                                                    {t('chip-management.modal.accept')}
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<CloseIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTransferResponse(notif, false);
                                                    }}
                                                    sx={{ fontSize: '0.65rem', py: 0.2, px: 1, textTransform: 'none' }}
                                                >
                                                    {t('chip-management.modal.reject')}
                                                </Button>
                                            </Stack>
                                        )}
                                    </ListItemButton>
                                );
                            })
                    )}
                </List>
                <Divider />
                <Box sx={{ p: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 1, bgcolor: alpha('#a38f6d', 0.02) }}>
                    <Button size="small" onClick={handleMarkAllAsRead}>{t('navbar.markAllAsRead')}</Button>
                    <Button size="small" color="error" onClick={handleClearRead}>{t('navbar.clearRead')}</Button>
                </Box>
            </Popover>

            {user && (
                <Box sx={{ ml: 2 }}>
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#a38f6d' }}>{user.fullName?.charAt(0)}</Avatar>
                    </IconButton>
                    <Menu sx={{ mt: '45px' }} anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={() => setAnchorElUser(null)}>
                        <MenuItem disabled><Typography fontWeight="bold">{user.fullName}</Typography></MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { router.push(withLng(currentLng, '/settings/user')); setAnchorElUser(null); }}>{t('navbar.profileSettings')}</MenuItem>
                        <MenuItem onClick={handleLogout}>{t('navbar.logout')}</MenuItem>
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

    const navItems = useMemo(() => {
        if (!user) return [];
        const items = user.roles.includes('Kuljettaja') ? driverNavigationItems : officeNavigationItems;
        return items.filter(item => !item.permission || user.permissions?.includes(item.permission));
    }, [user]);

    const homeLink = withLng(currentLng, user?.roles.includes('Kuljettaja') ? '/my-loads' : '/dashboard');

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Toolbar>
                {navLayout === 'left' && (
                    <IconButton color="inherit" edge="start" onClick={toggleMobileDrawer} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
                )}
                <Link href={homeLink} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <Image src="/images/hkk-logo.png" alt="Logo" width={140} height={38} priority style={{ marginRight: '16px' }} />
                </Link>
                <Box sx={{ flexGrow: 1 }} />
                {navLayout === 'top' && <TopNavMenu navLinks={navItems.filter(i => i.isTopNav)} pathname={pathname} currentLng={currentLng} />}
                <UserActions />
            </Toolbar>
        </AppBar>
    );
}
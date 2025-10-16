// frontend/src/app/(main)/admin/settings/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    Tabs, Tab, Select, MenuItem, FormControl, InputLabel,
    AlertColor, Card, CardContent, CardHeader, SelectChangeEvent,
    ToggleButtonGroup, ToggleButton, Divider, Stack, Grid, Slider, Tooltip
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ForestIcon from '@mui/icons-material/Forest';
import RoomIcon from '@mui/icons-material/Room';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import PinDropIcon from '@mui/icons-material/PinDrop';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import FactoryIcon from '@mui/icons-material/Factory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessIcon from '@mui/icons-material/Business';

import { useAuth } from '../../../../../contexts/AuthContext';
import { useLayout, PuulaaniIconType, DropoffIconType } from '../../../../../contexts/LayoutContext';
import { countryMapSettings } from '../../../../../config/mapConfig';
import RolesAndPermissionsTab from '../../../../../components/settings/RolesAndPermissionsTab';

import { useTranslation } from '@/i18n/useTranslation';


interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} {...other}>
            {value === index && (<Box sx={{ pt: 3 }}>{children}</Box>)}
        </div>
    );
}

const getPuulaaniIconComponent = (iconName: PuulaaniIconType) => {
    const icons: { [key in PuulaaniIconType]: React.ElementType } = {
        LocationOn: LocationOnIcon, Forest: ForestIcon, Room: RoomIcon,
        FmdGood: FmdGoodIcon, PinDrop: PinDropIcon,
    };
    return icons[iconName] || LocationOnIcon;
};

const getDropoffIconComponent = (iconName: DropoffIconType) => {
    const icons: { [key in DropoffIconType]: React.ElementType } = {
        Warehouse: WarehouseIcon, Factory: FactoryIcon,
        LocalShipping: LocalShippingIcon, Business: BusinessIcon,
    };
    return icons[iconName] || WarehouseIcon;
};

export default function AppSettingsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { t } = useTranslation('settings');
    // --- CORRECTION: Destructure all required state and functions from useLayout ---
    const {
        mapSettings, setMapCountry,
        puulaaniIcon, setPuulaaniIcon,
        puulaaniIconSize, setPuulaaniIconSize,
        dropoffIcon, setDropoffIcon,
        dropoffIconSize, setDropoffIconSize // <<< These were missing
    } = useLayout();

    const [tabIndex, setTabIndex] = useState(0);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);
    const hasAccess = useMemo(() => user?.permissions?.includes('application settings_manage') || user?.roles?.includes('Superuser'), [user]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);

    const handleMapCountryChange = (event: SelectChangeEvent<string>) => {
        setMapCountry(event.target.value);
        setFeedback({ type: 'success', message: t('alerts.defaultMapUpdated') });
    };

    const handlePuulaaniIconChange = (event: React.MouseEvent<HTMLElement>, newIcon: PuulaaniIconType | null) => {
        if (newIcon !== null) {
            setPuulaaniIcon(newIcon);
            setFeedback({ type: 'success', message: t('alerts.puulaaniIconChanged') });
        }
    };

    const handlePuulaaniIconSizeChange = (event: Event, newValue: number | number[]) => {
        setPuulaaniIconSize(newValue as number);
    };

    const handleDropoffIconChange = (event: React.MouseEvent<HTMLElement>, newIcon: DropoffIconType | null) => {
        if (newIcon !== null) {
            setDropoffIcon(newIcon);
            setFeedback({ type: 'success', message: t('alerts.dropoffIconChanged') });
        }
    };

    const handleDropoffIconSizeChange = (event: Event, newValue: number | number[]) => {
        setDropoffIconSize(newValue as number);
    };

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);


    if (isAuthLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!hasAccess) return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('noPermission')}</Alert></Paper>;

    const PuulaaniPreviewIcon = getPuulaaniIconComponent(puulaaniIcon);
    const DropoffPreviewIcon = getDropoffIconComponent(dropoffIcon);

    return (
        <Paper
            sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: 'calc(100vh - 60px)',
                overflowX: 'hidden',
            }}>
            <Typography sx={{ mb: 1.5 }} variant="h4" component="h1" gutterBottom>{t('title')}</Typography>
            {feedback && <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback.message}</Alert>}

            <Box sx={{ mt: 0.5, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="settings tabs">
                    <Tab label={t('tabs.rolesPermissions')} id="settings-tab-0" />
                    <Tab label={t('tabs.mapSettings')} id="settings-tab-1" />
                </Tabs>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', pr: 1 }}>
                <TabPanel value={tabIndex} index={0}>
                    <RolesAndPermissionsTab setFeedback={setFeedback} />
                </TabPanel>


                <TabPanel value={tabIndex} index={1}>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 3,
                            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' },
                        }}
                    >
                        <Box>
                            <Card elevation={2}>
                                <CardHeader title={t('map.defaultView.title')} subheader={t('map.defaultView.subheader')} />
                                <CardContent>
                                    <FormControl fullWidth sx={{ maxWidth: 400 }}>
                                        <InputLabel>{t('map.defaultCountry.label')}</InputLabel>
                                        <Select label={t('map.defaultCountry.label')} value={mapSettings.key} onChange={handleMapCountryChange}>
                                            {countryMapSettings.map((country) => (
                                                <MenuItem key={country.key} value={country.key}>
                                                    {t(`map.countries.${country.key}`, { defaultValue: country.name ?? country.key })}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box>
                            <Card elevation={2}>
                                <CardHeader title={t('puulaani.title')} subheader={t('puulaani.subheader')} />
                                <CardContent>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center">
                                        <Box textAlign="center">
                                            <Typography variant="subtitle2" gutterBottom>{t('puulaani.iconPreview')}</Typography>
                                            <PuulaaniPreviewIcon sx={{ fontSize: `${puulaaniIconSize}px`, color: '#C1A78E' }} />
                                        </Box>
                                        <Divider orientation="vertical" flexItem />
                                        <Box flexGrow={1}>
                                            <Typography variant="subtitle2" gutterBottom>{t('puulaani.selectIcon')}</Typography>
                                            <ToggleButtonGroup value={puulaaniIcon} exclusive onChange={handlePuulaaniIconChange} aria-label={t('puulaani.aria.group')}>
                                                <ToggleButton value="LocationOn" aria-label="location pin"><Tooltip title={t('puulaani.icons.locationOn')}><LocationOnIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="Forest" aria-label="forest"><Tooltip title={t('puulaani.icons.forest')}><ForestIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="Room" aria-label="pin"><Tooltip title={t('puulaani.icons.room')}><RoomIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="FmdGood" aria-label="good pin"><Tooltip title={t('puulaani.icons.fmdGood')}><FmdGoodIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="PinDrop" aria-label="drop pin"><Tooltip title={t('puulaani.icons.pinDrop')}><PinDropIcon /></Tooltip></ToggleButton>
                                            </ToggleButtonGroup>
                                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>{t('puulaani.iconSize')}</Typography>
                                            <Slider
                                                value={puulaaniIconSize}
                                                onChange={handlePuulaaniIconSizeChange}
                                                aria-label={t('puulaani.aria.sizeSlider')}
                                                valueLabelDisplay="auto"
                                                step={2} marks min={30} max={60}
                                            />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box >
                            <Card elevation={2}>
                                <CardHeader title={t('dropoff.title')} subheader={t('dropoff.subheader')} />
                                <CardContent>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center">
                                        <Box textAlign="center">
                                            <Typography variant="subtitle2" gutterBottom>{t('dropoff.iconPreview')}</Typography>
                                            <DropoffPreviewIcon sx={{ fontSize: `${dropoffIconSize}px`, color: 'text.secondary' }} />
                                        </Box>
                                        <Divider orientation="vertical" flexItem />
                                        <Box flexGrow={1}>
                                            <Typography variant="subtitle2" gutterBottom>{t('dropoff.selectIcon')}</Typography>
                                            <ToggleButtonGroup value={dropoffIcon} exclusive onChange={handleDropoffIconChange} aria-label={t('dropoff.aria.group')}>
                                                <ToggleButton value="Warehouse" aria-label="warehouse"><Tooltip title={t('dropoff.icons.warehouse')}><WarehouseIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="Factory" aria-label="factory"><Tooltip title={t('dropoff.icons.factory')}><FactoryIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="LocalShipping" aria-label="shipping truck"><Tooltip title={t('dropoff.icons.localShipping')}><LocalShippingIcon /></Tooltip></ToggleButton>
                                                <ToggleButton value="Business" aria-label="business"><Tooltip title={t('dropoff.icons.business')}><BusinessIcon /></Tooltip></ToggleButton>
                                            </ToggleButtonGroup>
                                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>{t('dropoff.iconSize')}</Typography>
                                            <Slider
                                                value={dropoffIconSize}
                                                onChange={handleDropoffIconSizeChange}
                                                aria-label={t('dropoff.aria.sizeSlider')}
                                                valueLabelDisplay="auto"
                                                step={2} marks min={30} max={50}
                                            />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </TabPanel>
            </Box>
        </Paper>
    );
}
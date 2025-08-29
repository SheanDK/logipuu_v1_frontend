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

import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout, PuulaaniIconType, DropoffIconType } from '../../../../contexts/LayoutContext';
import { countryMapSettings } from '../../../../config/mapConfig';
import RolesAndPermissionsTab from '../../../../components/settings/RolesAndPermissionsTab';

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
    const hasAccess = useMemo(() => user?.permissions?.includes('settings_manage') || user?.roles?.includes('Superuser'), [user]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);
    
    const handleMapCountryChange = (event: SelectChangeEvent<string>) => {
        setMapCountry(event.target.value);
        setFeedback({ type: 'success', message: `Default map view updated.` });
    };
    
    const handlePuulaaniIconChange = (event: React.MouseEvent<HTMLElement>, newIcon: PuulaaniIconType | null) => {
        if (newIcon !== null) {
            setPuulaaniIcon(newIcon);
            setFeedback({ type: 'success', message: `Puulaani marker icon changed.` });
        }
    };

    const handlePuulaaniIconSizeChange = (event: Event, newValue: number | number[]) => {
        setPuulaaniIconSize(newValue as number);
    };
    
    const handleDropoffIconChange = (event: React.MouseEvent<HTMLElement>, newIcon: DropoffIconType | null) => {
        if (newIcon !== null) {
            setDropoffIcon(newIcon);
            setFeedback({ type: 'success', message: `Drop-off marker icon changed.` });
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
    if (!hasAccess) return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">You do not have permission to access this page.</Alert></Paper>;

    const PuulaaniPreviewIcon = getPuulaaniIconComponent(puulaaniIcon);
    const DropoffPreviewIcon = getDropoffIconComponent(dropoffIcon);

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, m: -3, borderRadius: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>Application Settings</Typography>
            {feedback && <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback.message}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="settings tabs">
                    <Tab label="Roles & Permissions" id="settings-tab-0" />
                    <Tab label="Map Settings" id="settings-tab-1" />
                </Tabs>
            </Box>

            <TabPanel value={tabIndex} index={0}>
                <RolesAndPermissionsTab setFeedback={setFeedback} />
            </TabPanel>

            <TabPanel value={tabIndex} index={1}>
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={6}>
                        <Card elevation={2}>
                            <CardHeader title="Default Map View" subheader="Set the default country for the map page." />
                            <CardContent>
                                <FormControl fullWidth sx={{ maxWidth: 400 }}>
                                    <InputLabel>Default Country</InputLabel>
                                    <Select label="Default Country" value={mapSettings.key} onChange={handleMapCountryChange}>
                                        {countryMapSettings.map((country) => (
                                            <MenuItem key={country.key} value={country.key}>{country.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <Card elevation={2}>
                            <CardHeader title="Puulaani Marker Icon" subheader="Select the default icon and size for Timber Stacks." />
                            <CardContent>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center">
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" gutterBottom>Icon Preview</Typography>
                                        <PuulaaniPreviewIcon sx={{ fontSize: `${puulaaniIconSize}px`, color: '#C1A78E' }} />
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle2" gutterBottom>Select Icon</Typography>
                                        <ToggleButtonGroup value={puulaaniIcon} exclusive onChange={handlePuulaaniIconChange} aria-label="puulaani icon selection">
                                            <ToggleButton value="LocationOn" aria-label="location pin"><Tooltip title="Location On"><LocationOnIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="Forest" aria-label="forest"><Tooltip title="Forest"><ForestIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="Room" aria-label="pin"><Tooltip title="Room Pin"><RoomIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="FmdGood" aria-label="good pin"><Tooltip title="Simple Pin"><FmdGoodIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="PinDrop" aria-label="drop pin"><Tooltip title="Drop Pin"><PinDropIcon /></Tooltip></ToggleButton>
                                        </ToggleButtonGroup>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Icon Size</Typography>
                                        <Slider
                                            value={puulaaniIconSize}
                                            onChange={handlePuulaaniIconSizeChange}
                                            aria-labelledby="icon-size-slider"
                                            valueLabelDisplay="auto"
                                            step={2} marks min={30} max={60}
                                        />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <Card elevation={2}>
                            <CardHeader title="Drop-off Marker Icon" subheader="Select the default icon and size for Unloading Sites." />
                            <CardContent>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center">
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" gutterBottom>Icon Preview</Typography>
                                        <DropoffPreviewIcon sx={{ fontSize: `${dropoffIconSize}px`, color: 'text.secondary' }} />
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle2" gutterBottom>Select Icon</Typography>
                                        <ToggleButtonGroup value={dropoffIcon} exclusive onChange={handleDropoffIconChange} aria-label="dropoff icon selection">
                                            <ToggleButton value="Warehouse" aria-label="warehouse"><Tooltip title="Warehouse"><WarehouseIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="Factory" aria-label="factory"><Tooltip title="Factory"><FactoryIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="LocalShipping" aria-label="shipping truck"><Tooltip title="Shipping Truck"><LocalShippingIcon /></Tooltip></ToggleButton>
                                            <ToggleButton value="Business" aria-label="business"><Tooltip title="Business"><BusinessIcon /></Tooltip></ToggleButton>
                                        </ToggleButtonGroup>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Icon Size</Typography>
                                        <Slider
                                            value={dropoffIconSize}
                                            onChange={handleDropoffIconSizeChange}
                                            aria-labelledby="dropoff-icon-size-slider"
                                            valueLabelDisplay="auto"
                                            step={2} marks min={30} max={50}
                                        />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>
        </Paper>
    );
}
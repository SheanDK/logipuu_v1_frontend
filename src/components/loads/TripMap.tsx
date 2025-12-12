// frontend/src/components/loads/TripMap.tsx
'use client';

import React, { useEffect, useMemo} from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import L, { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl, LayerGroup } from 'react-leaflet';
import FlagIcon from '@mui/icons-material/Flag';
import NavigationIcon from '@mui/icons-material/Navigation';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTranslation } from 'react-i18next';
import { useLeafletPopupTheme } from '@/utils/useLeafletPopupTheme';
import { GlobalStyles } from '@mui/material';
import { useLayout } from '@/contexts/LayoutContext';



// --- Leaflet Icon setup ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ 
    iconRetinaUrl: '/images/marker-icon-2x.png', 
    iconUrl: '/images/marker-icon.png', 
    shadowUrl: '/images/marker-shadow.png' 
});

// Specific icon for an active trip's numbered pickup points
const createPickupIcon = (index: number) => L.divIcon({ 
    className: `custom-icon-pickup-${index}`, 
    html: `<div style="background-color: #d32f2f; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold;">${index + 1}</span></div>`, 
    iconSize: [36, 36], 
    iconAnchor: [18, 36], 
    popupAnchor: [0, -36] 
});

// Define the URL as a constant for clarity
const MML_MAASTOKARTTA_URL = 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png?api-key=903ff7d0-9792-4c41-9515-d66f76ccb69f';

// Icon for the driver's live location (red navigation icon)
const driverIcon = L.divIcon({ 
    className: 'custom-icon-driver', 
    html: renderToStaticMarkup(
        <NavigationIcon 
            style={{ 
                fontSize: '38px', 
                color: '#f72b07ff', 
                fill: '#ff5e00ff', 
                transform: 'rotate(-45deg)', 
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))', 
                stroke: 'white', 
                strokeWidth: 2 
            }} 
        />
    ), 
    iconSize: [38, 38], 
    iconAnchor: [19, 19] 
});

const LayerControlEventHandler = ({ onFilterChange }: { onFilterChange: (name: string, added: boolean) => void }) => {
    const map = useMap();
    const { t } = useTranslation('tripMap');

    useEffect(() => {
        const handleOverlayAdd = (e: L.LayersControlEvent) => {
            if (e.name === t('layers.puulaanit', 'Timber Sites')) onFilterChange('showPuulaanit', true);
            if (e.name === t('layers.purkupaikat', 'Drop-off Sites')) onFilterChange('showPurkupaikat', true);
        };
        const handleOverlayRemove = (e: L.LayersControlEvent) => {
            if (e.name === t('layers.puulaanit', 'Timber Sites')) onFilterChange('showPuulaanit', false);
            if (e.name === t('layers.purkupaikat', 'Drop-off Sites')) onFilterChange('showPurkupaikat', false);
        };

        map.on('overlayadd', handleOverlayAdd);
        map.on('overlayremove', handleOverlayRemove);

        return () => {
            map.off('overlayadd', handleOverlayAdd);
            map.off('overlayremove', handleOverlayRemove);
        };
    }, [map, onFilterChange, t]);

    return null;
};



// Icon for Puulaani (Timber Sites / Pickups) with dynamic color
const createDynamicPuulaaniIcon = (color?: string) => {
    const markerColor = color || '#1976D2';
    const html = `
        <div style="
            background-color: ${markerColor};
            width: 20px;
            height: 20px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
        ">
            <div style="
                transform: rotate(45deg);
                width: 8px;
                height: 8px;
                background-color: rgba(255,255,255,0.7);
                border-radius: 50%;
            "></div>
        </div>
    `;
    return L.divIcon({
        className: 'custom-puulaani-pin-icon',
        html: html,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
    });
};

// Highlighted version for focused puulaani (pulsing animation)
const createHighlightedPuulaaniIcon = (color?: string) => {
    const markerColor = color || '#1976D2';
    const html = `
        <div style="
            position: relative;
        ">
            <div style="
                position: absolute;
                background-color: ${markerColor};
                width: 20px;
                height: 20px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid #ffffff;
                box-shadow: 0 0 20px rgba(255,255,255,0.8), 0 4px 10px rgba(0,0,0,0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                animation: pulse 1.5s ease-in-out infinite;
            ">
                <div style="
                    transform: rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background-color: rgba(255,255,255,0.9);
                    border-radius: 50%;
                "></div>
            </div>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% { 
                    transform: rotate(-45deg) scale(1); 
                    opacity: 1; 
                }
                50% { 
                    transform: rotate(-45deg) scale(1.15); 
                    opacity: 0.9; 
                }
            }
        </style>
    `;
    return L.divIcon({
        className: 'custom-puulaani-pin-icon-highlighted',
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

// Icon for Purkupaikka (Drop-off Locations)
const purkupaikkaIcon = L.divIcon({ 
    className: 'custom-icon-purkupaikka', 
    html: renderToStaticMarkup(
        <FlagIcon 
            style={{ 
                fontSize: '20px', 
                color: '#000000ff', 
                filter: 'drop-shadow(0 0.5px 1px rgba(0, 0, 0, 0))', 
                stroke: 'white', 
                strokeWidth: 0.5 
            }} 
        />
    ), 
    iconSize: [24, 24], 
    iconAnchor: [4, 24], 
    popupAnchor: [8, -24] 
});

export interface TripLegForMap {
    kuormaId: number;
    originName: string;
    originCoords: { lat: number; lng: number; };
    destinationName?: string;
    destinationCoords?: { lat: number; lng: number; } | null;
    color?: string;
    customer?: { clientName: string; };
}

export interface TripMapProps {
    legs: TripLegForMap[];
    puulaanit: TripLegForMap[];
    purkupaikat: TripLegForMap[];
    driverLocation: { lat: number; lng: number; } | null;
    focusedTripId?: number | null;
    onFocusCompleteAction: () => void;
    onMarkerClickAction: (tripId: number, event: LeafletMouseEvent) => void;
    markerFilters: { showPuulaanit: boolean; showPurkupaikat: boolean; };
    onFilterChangeAction: (filterName: 'showPuulaanit' | 'showPurkupaikat') => void;
    onManualPanOrZoomAction: () => void; // To disable follow mode
    followUser: boolean; // To enable/disable follow mode
    sidebarWidth?: number;
}

const MapFocusController = ({ focusedTripId, trips, onFocusCompleteAction }: { focusedTripId: number | null | undefined; trips: TripLegForMap[]; onFocusCompleteAction: () => void; }) => {
    const map = useMap();
    useEffect(() => {
        if (typeof focusedTripId === 'number') {
            const selectedTrip = trips.find(t => t.kuormaId === focusedTripId);
            if (selectedTrip?.originCoords) {
                const targetLatLng: L.LatLngTuple = [selectedTrip.originCoords.lat, selectedTrip.originCoords.lng];
              
                // Fly to the location with a smooth animation
                map.flyTo(targetLatLng, 16, { 
                    animate: true,
                    duration: 1.5 
                });
                
                // Open the popup after the flight animation is complete
                const onFlyEnd = () => {
                    L.popup({ offset: [0, -20] })
                     .setLatLng(targetLatLng)
                     .setContent(selectedTrip.originName)
                     .openOn(map);
                    onFocusCompleteAction();
                    map.off('moveend', onFlyEnd); 
                };
                map.on('moveend', onFlyEnd);

            } else {
                onFocusCompleteAction(); 
            }
        }
    }, [focusedTripId, trips, map, onFocusCompleteAction]);
    return null;
};

//Create a new LocationController component ---
const LocationController = ({ driverLocation, followUser, onManualPanOrZoomAction }: { 
    driverLocation: { lat: number; lng: number } | null,
    followUser: boolean,
    onManualPanOrZoomAction: () => void 
}) => {
    const map = useMap();

    // Effect to follow the user
    useEffect(() => {
        if (followUser && driverLocation) {
            map.flyTo([driverLocation.lat, driverLocation.lng], 14, { // Fly to zoom level 14
                animate: true,
                duration: 1.0,
            });
        }
    }, [driverLocation, followUser, map]);

    // Effect to detect manual interaction and disable follow mode
    useEffect(() => {
        const disableFollow = () => {
            console.log("Manual map interaction detected, disabling follow mode.");
            onManualPanOrZoomAction();
        };

        map.on('dragstart', disableFollow);
        map.on('zoomstart', disableFollow);

        return () => {
            map.off('dragstart', disableFollow);
            map.off('zoomstart', disableFollow);
        };
    }, [map, onManualPanOrZoomAction]);

    return null;
};

export default function TripMap({ 
    legs, puulaanit, purkupaikat, driverLocation, 
    focusedTripId, onFocusCompleteAction, onMarkerClickAction,
    markerFilters, onFilterChangeAction,
    onManualPanOrZoomAction, followUser,
    sidebarWidth = 0
}: TripMapProps) {
    
    const { t } = useTranslation('tripMap');
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const { mapSettings } = useLayout(); // Get settings from context
    const isFinland = mapSettings.key === 'finland';

    useLeafletPopupTheme();

    const bounds = useMemo(() => {
        const allCoords: LatLngTuple[] = [];
        
        legs.forEach(leg => {
            if (leg.originCoords) allCoords.push([leg.originCoords.lat, leg.originCoords.lng]);
            if (leg.destinationCoords) allCoords.push([leg.destinationCoords.lat, leg.destinationCoords.lng]);
        });
        
        puulaanit.forEach(trip => { 
            if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]); 
        });
        
        purkupaikat.forEach(trip => { 
            if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]); 
        });
        
        if (driverLocation) allCoords.push([driverLocation.lat, driverLocation.lng]);

        return allCoords.length > 0 ? L.latLngBounds(allCoords) : undefined;
    }, [legs, puulaanit, purkupaikat, driverLocation]);

    if (!bounds) {
        return (
            <Box 
                sx={{ 
                    height: '100%', 
                    width: '100%', 
                    bgcolor: isDarkMode ? 'background.paper' : 'grey.300', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}
            >
                <Typography color="text.secondary">{t('noLocations')}</Typography>
            </Box>
        );
    }

    const handleFilterEvent = (filterName: 'showPuulaanit' | 'showPurkupaikat') => {
    onFilterChangeAction(filterName);
};

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ paddingTopLeft: [280, 20], paddingBottomRight: [20, 20] }}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className={isDarkMode ? 'leaflet-dark' : undefined}
            zoomControl={false}
            minZoom={6}
            maxZoom={20}
        >
            <Box sx={{ position: 'absolute', top: 10, left: 10 + sidebarWidth, zIndex: 1000 }}>
                <Stack spacing={1}>
                    <ZoomControl position="topleft" />
                </Stack>
            </Box>

            {/* <LayerControlEventHandler onFilterChange={handleFilterEvent} /> */}
            
            <LayersControl position="topleft" key={`layers-${theme.palette.mode}`}>
                 {/* new MML Map Layer --- */}
                {isFinland && (
                    <LayersControl.BaseLayer checked name={t('layers.finnishTopographic', 'MML Maastokartta (FI)')}>
                        <TileLayer
                            url={MML_MAASTOKARTTA_URL}
                            maxZoom={18}
                            attribution='&copy; <a href="https://www.maanmittauslaitos.fi/">Maanmittauslaitos</a>'
                        />
                    </LayersControl.BaseLayer>
                )}

                {/* Street / Standard (OSM) */}
                <LayersControl.BaseLayer name={t('layers.street')}>
                    <TileLayer
                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                        attribution='&copy; Google'
                    />
                </LayersControl.BaseLayer>

                {/* Satellite (Google hybrid) */}
                <LayersControl.BaseLayer name={t('layers.satellite')}>
                    <TileLayer
                        url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                        attribution='&copy; Google'
                    />
                </LayersControl.BaseLayer>

                {/* Topographic (OpenTopoMap) - Default */}
                <LayersControl.BaseLayer checked={!isFinland} name={t('layers.topographic')}>
                    <TileLayer
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                        maxNativeZoom={18}
                        attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                    />
                </LayersControl.BaseLayer>

                 {/* --- Overlays --- */}
                <LayersControl.Overlay checked={markerFilters.showPuulaanit} name={t('layers.puulaanit', 'Timber Sites')}>
                            <LayerGroup>
                                {puulaanit.map((trip: any, index) => (
                                    trip.originCoords && (
                                        <Marker
                                            key={`puulaani-layer-${trip.kuormaId || index}`}
                                            position={[trip.originCoords.lat, trip.originCoords.lng]}
                                            icon={
                                                focusedTripId === trip.kuormaId 
                                                    ? createHighlightedPuulaaniIcon(trip.color)
                                                    : createDynamicPuulaaniIcon(trip.color)
                                            }
                                            eventHandlers={{ click: (e) => onMarkerClickAction(trip.kuormaId, e) }}
                                            zIndexOffset={50} // General markers
                                        >
                                            <Popup>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{trip.originName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('popup.clientLabel')}: <strong>{trip.customer?.clientName || 'N/A'}</strong>
                                                    </Typography>
                                                </Box>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>
                
                <LayersControl.Overlay checked={markerFilters.showPurkupaikat} name={t('layers.purkupaikat', 'Drop-off Sites')}>
                    <LayerGroup>
                        {purkupaikat.map((trip) => (
                            trip.originCoords && (
                                <Marker
                                    key={`purkupaikka-${trip.kuormaId}`}
                                    position={[trip.originCoords.lat, trip.originCoords.lng]}
                                    icon={purkupaikkaIcon}
                                >
                                    <Popup>{trip.originName}</Popup>
                                </Marker>
                            )
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>

            {/* Markers for the active trip's route */}
            {legs.map((leg, index) => (
                <React.Fragment key={`leg-${leg.kuormaId}`}>
                    {leg.originCoords && (
                        <Marker 
                            position={[leg.originCoords.lat, leg.originCoords.lng]} 
                            icon={createPickupIcon(index)}
                        >
                            <Popup>
                                <b>{t('pickup', { index: index + 1 })}</b>
                                <br />
                                {leg.originName}
                            </Popup>
                        </Marker>
                    )}
                    {leg.destinationCoords && (
                        <Marker 
                            position={[leg.destinationCoords.lat, leg.destinationCoords.lng]} 
                            icon={purkupaikkaIcon}
                        >
                            <Popup>
                                <b>{t('destination')}</b>
                                <br />
                                {leg.destinationName}
                            </Popup>
                        </Marker>
                    )}
                </React.Fragment>
            ))}

            

            {/* Driver location marker */}
            {driverLocation && (
                <Marker 
                    position={[driverLocation.lat, driverLocation.lng]} 
                    icon={driverIcon}
                >
                    <Popup>{t('yourLocation')}</Popup>
                </Marker>
            )}

            <MapFocusController trips={puulaanit} focusedTripId={focusedTripId} onFocusCompleteAction={onFocusCompleteAction} />
            <LayerControlEventHandler onFilterChange={handleFilterEvent as any} />
            <LocationController 
                driverLocation={driverLocation} 
                followUser={followUser} 
                onManualPanOrZoomAction={onManualPanOrZoomAction} 
            />
            
            {/* Dark mode styling for map controls */}
            <GlobalStyles styles={(theme) => ({
                '.leaflet-dark .leaflet-control-layers': {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: theme.shadows[4],
                },
                '.leaflet-dark .leaflet-control-layers-expanded': {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                },
                '.leaflet-dark .leaflet-control-layers-list label': {
                    color: theme.palette.text.primary,
                },
                '.leaflet-dark .leaflet-control-layers-separator': {
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                },
                '.leaflet-dark .leaflet-control-layers-selector': {
                    accentColor: theme.palette.primary.main,
                },
                '.leaflet-dark .leaflet-control-layers-toggle': {
                    filter: 'invert(1) hue-rotate(180deg) brightness(0.85)',
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: theme.shadows[2],
                },
                '.leaflet-dark .leaflet-bar a, .leaflet-dark .leaflet-bar a:hover': {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                },
                '.leaflet-dark .leaflet-bar a:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.35),
                },
            })} />
        </MapContainer>
    );
}
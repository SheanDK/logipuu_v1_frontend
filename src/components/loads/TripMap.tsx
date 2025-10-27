// frontend/src/components/loads/TripMap.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import L, { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import FlagIcon from '@mui/icons-material/Flag';
import NavigationIcon from '@mui/icons-material/Navigation';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTranslation } from 'react-i18next';
import { useLeafletPopupTheme } from '@/utils/useLeafletPopupTheme';
import { GlobalStyles } from '@mui/material';
import { alpha } from '@mui/material/styles';

// --- Leaflet Icon setup ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '/images/marker-icon-2x.png', iconUrl: '/images/marker-icon.png', shadowUrl: '/images/marker-shadow.png' });

// Specific icon for an active trip's numbered pickup points
const createPickupIcon = (index: number) => L.divIcon({ className: `custom-icon-pickup-${index}`, html: `<div style="background-color: #d32f2f; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"><span style="color: white; font-weight: bold;">${index + 1}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });

// Icon for the driver's live location (changed color to red)
const driverIcon = L.divIcon({ className: 'custom-icon-driver', html: renderToStaticMarkup(<NavigationIcon style={{ fontSize: '38px', color: '#ff0000', fill: '#ff0000d0', transform: 'rotate(-45deg)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))', stroke: 'white', strokeWidth: 0.5 }} />), iconSize: [38, 38], iconAnchor: [19, 19] });
// Icon for Puulaani (Timber Sites / Pickups)
const puulaaniIcon = L.divIcon({ className: 'custom-icon-puulaani', html: `<div style="background-color: #1976D2; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; opacity: 0.9; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });

// Icon for Purkupaikka (Drop-off Locations)
const purkupaikkaIcon = L.divIcon({ className: 'custom-icon-purkupaikka', html: renderToStaticMarkup(<FlagIcon style={{ fontSize: '24px', color: '#000000ff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))', stroke: 'white', strokeWidth: 0.5 }} />), iconSize: [24, 24], iconAnchor: [4, 24], popupAnchor: [8, -24] });


export interface TripLegForMap {
    kuormaId: number;
    originName: string;
    originCoords: { lat: number; lng: number; };
    destinationName?: string;
    destinationCoords?: { lat: number; lng: number; } | null;
}

export interface TripMapProps {
    legs: TripLegForMap[];
    puulaanit: TripLegForMap[];
    purkupaikat: TripLegForMap[];
    driverLocation: { lat: number; lng: number; } | null;
    focusedTripId?: number | null;
    onFocusCompleteAction: () => void;
    onMarkerClickAction: (tripId: number, event: LeafletMouseEvent) => void;
}

const MapFocusController = ({ focusedTripId, trips, onFocusCompleteAction }:
    { focusedTripId: number | null | undefined, trips: TripLegForMap[], onFocusCompleteAction: () => void }) => {
    const map = useMap();
    useEffect(() => {
        if (typeof focusedTripId === 'number') {
            const selectedTrip = trips.find(t => t.kuormaId === focusedTripId);
            if (selectedTrip?.originCoords) {
                map.flyTo([selectedTrip.originCoords.lat, selectedTrip.originCoords.lng], 14);
                onFocusCompleteAction();
            }
        }
    }, [focusedTripId, trips, map, onFocusCompleteAction]);
    return null;
};

export default function TripMap({ legs, puulaanit, purkupaikat, driverLocation, focusedTripId, onFocusCompleteAction, onMarkerClickAction }: TripMapProps) {
    const { t } = useTranslation('tripMap');
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    useLeafletPopupTheme();

    const bounds = useMemo(() => {
        const allCoords: LatLngTuple[] = [];
        legs.forEach(leg => {
            if (leg.originCoords) allCoords.push([leg.originCoords.lat, leg.originCoords.lng]);
            if (leg.destinationCoords) allCoords.push([leg.destinationCoords.lat, leg.destinationCoords.lng]);
        });
        puulaanit.forEach(trip => { if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]); });
        purkupaikat.forEach(trip => { if (trip.originCoords) allCoords.push([trip.originCoords.lat, trip.originCoords.lng]); });
        if (driverLocation) allCoords.push([driverLocation.lat, driverLocation.lng]);

        return allCoords.length > 0 ? L.latLngBounds(allCoords) : undefined;
    }, [legs, puulaanit, purkupaikat, driverLocation]);

    if (!bounds) {
        return (
            <Box sx={{ height: '100%', width: '100%', bgcolor: isDarkMode ? 'background.paper' : 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">{t('noLocations')}</Typography>
            </Box>
        );
    }

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ paddingTopLeft: [280, 20], paddingBottomRight: [20, 20] }}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className={isDarkMode ? 'leaflet-dark' : undefined}
            zoomControl={false}
        >
            <ZoomControl position="bottomleft" />
            <LayersControl position="bottomleft" key={`layers-${theme.palette.mode}`}>
                {/* Street / Standard (OSM) */}
                <LayersControl.BaseLayer checked={!isDarkMode} name={t('layers.street')}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>

                {/* Satellite (Google hybrid)*/}
                <LayersControl.BaseLayer checked={isDarkMode} name={t('layers.satellite')}>
                    <TileLayer
                        url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                        attribution="&copy; Google"
                    />
                </LayersControl.BaseLayer>

                {/* Topographic (OpenTopoMap) */}
                <LayersControl.BaseLayer name={t('layers.topographic')}>
                    <TileLayer
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        maxZoom={17}
                        attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* Markers for the active trip's route */}
            {legs.map((leg, index) => (
                <React.Fragment key={`leg-${leg.kuormaId}`}>
                    {leg.originCoords && <Marker position={[leg.originCoords.lat, leg.originCoords.lng]} icon={createPickupIcon(index)}><Popup><b>{t('pickup', { index: index + 1 })}</b><br />{leg.originName}</Popup></Marker>}
                    {leg.destinationCoords && <Marker position={[leg.originCoords.lat, leg.destinationCoords.lng]} icon={purkupaikkaIcon}><Popup><b>{t('destination')}</b><br />{leg.destinationName}</Popup></Marker>}
                </React.Fragment>
            ))}

           {/* Markers for available Puulaani sites */}
            {puulaanit.map((trip) => (
                trip.originCoords &&
                <Marker
                    // The key is now prefixed with 'puulaani-' to guarantee uniqueness.
                    key={`puulaani-${trip.kuormaId}`}
                    position={[trip.originCoords.lat, trip.originCoords.lng]}
                    icon={puulaaniIcon}
                    eventHandlers={{ click: (e) => onMarkerClickAction(trip.kuormaId, e) }}
                >
                    <Popup>{trip.originName}</Popup>
                </Marker>
            ))}

            {/* Markers for available Purkupaikka sites */}
            {purkupaikat.map((trip) => (
                trip.originCoords &&
                <Marker
                    // The key is now prefixed with 'purkupaikka-' to guarantee uniqueness.
                    // The key will be like 'purkupaikka--3238' which is a valid unique string.
                    key={`purkupaikka-${trip.kuormaId}`}
                    position={[trip.originCoords.lat, trip.originCoords.lng]}
                    icon={purkupaikkaIcon}
                >
                    <Popup>{trip.originName}</Popup>
                </Marker>
            ))}

            {driverLocation && (<Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup>{t('yourLocation')}</Popup></Marker>)}

            <MapFocusController trips={puulaanit} {...{ focusedTripId, onFocusCompleteAction }} />
            
            <GlobalStyles styles={(theme) => ({
                /* LayersControl container and inner box */
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

                /* Radio and checkbox color in dark mode */
                '.leaflet-dark .leaflet-control-layers-selector': {
                    accentColor: theme.palette.primary.main,
                },

                /* The LayersControl toggle button (by default a light PNG) — invert for dark mode */
                '.leaflet-dark .leaflet-control-layers-toggle': {
                    filter: 'invert(1) hue-rotate(180deg) brightness(0.85)',
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: theme.shadows[2],
                },

                /* Other toolbar buttons (zoom, etc.) to match dark mode styling */
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

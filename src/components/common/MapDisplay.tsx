// src/components/common/MapDisplay.tsx
'use client';

import React from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLayout } from '../../contexts/LayoutContext';

// Default Leaflet icon fix for bundlers like Next.js
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
    });
}

/**
 * A utility component to programmatically change the map's view (center and zoom).
 * This is useful when the center or zoom props of MapContainer change after the initial render.
 */
const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

interface MapDisplayProps {
    children?: React.ReactNode; // To render markers, polygons, etc.
}

const MapDisplay: React.FC<MapDisplayProps> = ({ children }) => {
    const { mapSettings } = useLayout();
    
    return (
        <MapContainer 
            center={mapSettings.center} 
            zoom={mapSettings.zoom} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 0 }}
            // Add a key prop. When this key changes, React will unmount the old map
            // and mount a new one, forcing it to re-initialize with the new center/zoom.
            key={JSON.stringify(mapSettings.center)}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Render any child components passed to the map, like markers and event handlers. */}
            {children}
        </MapContainer>
    );
};

export default MapDisplay;
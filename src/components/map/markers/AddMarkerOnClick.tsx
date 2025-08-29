// src/components/map/markers/AddMarkerOnClick.tsx
'use client';

import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface AddMarkerOnClickProps {
  onAddMarkerAction: (latlng: [number, number]) => void;
}

export default function AddMarkerOnClick({ onAddMarkerAction }: AddMarkerOnClickProps) {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            // We call the prop passed from the parent page with the clicked coordinates.
            onAddMarkerAction([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null; // This component does not render anything itself.
}
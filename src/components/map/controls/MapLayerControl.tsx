// frontend/src/components/map/controls/MapLayerControl.tsx
'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Import the tree control library and its CSS
// Ensure you have run: npm install leaflet.control.layers.tree
import 'leaflet.control.layers.tree';
import 'leaflet.control.layers.tree/L.Control.Layers.Tree.css';

// --- Define the structures required by the tree control library ---

// Structure for a single layer entry
interface LayerTreeEntry {
    label: string;
    layer: L.Layer;
}

// Structure for a group of layers (like base maps or overlays)
interface LayerTreeObject {
    label: string; // The main label for the group (e.g., "Base Maps")
    children: LayerTreeEntry[];
}

interface MapLayerControlProps {
    baseLayersTree: LayerTreeObject;
    overlayLayersTree: LayerTreeObject;
}

// Extend the Leaflet Control interface to include the 'tree' method
declare module 'leaflet' {
    namespace control {
        namespace layers {
            function tree(baseTree?: any, overlaysTree?: any, options?: any): any;
        }
    }
}

const MapLayerControl: React.FC<MapLayerControlProps> = ({ baseLayersTree, overlayLayersTree }) => {
    const map = useMap();

    useEffect(() => {
        // --- Create the layer control using the correctly formatted tree objects ---
        const layerControl = L.control.layers.tree(baseLayersTree, overlayLayersTree, {
            collapsed: false, // Start with the control expanded for better UX
            position: 'bottomleft',
            selectorBack: true, // Adds a button to go back up the tree
        });

        layerControl.addTo(map);

        // Cleanup function to remove the control when the component unmounts
        return () => {
            if (layerControl) {
                map.removeControl(layerControl);
            }
        };
    }, [map, baseLayersTree, overlayLayersTree]); // Rerun if the layer structure changes

    return null; // This component does not render any visible JSX itself
};

export default MapLayerControl;
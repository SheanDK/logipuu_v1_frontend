// src/config/mapConfig.ts

export interface MapSettings {
    key: string;
    name: string;
    center: [number, number];
    zoom: number;
}

export const countryMapSettings: MapSettings[] = [
    {
        key: 'finland',
        name: 'Finland',
        center: [62.2426, 25.7473], // Center of Finland (Jyväskylä)
        zoom: 8,
    },
    {
        key: 'sweden',
        name: 'Sweden',
        center: [60.1282, 18.6435], // Center of Sweden
        zoom: 8,
    },
    // Add more countries as needed
];

export const DEFAULT_MAP_SETTING_KEY = 'finland';
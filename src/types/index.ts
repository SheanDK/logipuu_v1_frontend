// frontend/src/types/index.ts

export * from './auth';
export * from './client';
export * from './driver';
export * from './layout';
export * from './drivenInspection';
export * from './permission';
export * from './role';
export * from './user';
export * from './vehicle';
export * from './waybill';

// All map and timber stack related types are in one place
export * from './timberStack'; 
export * from './unloadingSite';
export * from './otherInfo';
export * from './load';
//export * from './woodEntry';

// A common type for real-time vehicle locations
export interface IVehicleLocation {
    id: string | number; // Vehicle identifier (e.g., registration number)
    lat: number;
    lng: number;
    timestamp?: number;
}
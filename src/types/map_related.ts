// ... (other types)

// Filter state for the map page
export interface IMapFilterState {
    showAll: boolean;
    showActive: boolean;
    showCompleted: boolean;
    clientId: string | null;
    timberTypeId: string | null;
    vehicleId: string | null;
}
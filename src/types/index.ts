// frontend/src/types/index.ts
import { Dayjs } from 'dayjs';

// =============================================================================
// SECTION 1: CORE ENTITIES (User, Client, Driver, Vehicle)
// =============================================================================

// --- AUTH, USER, ROLES, PERMISSIONS ---

/**
 * Represents the state of authentication throughout the application.
 */
export interface AuthState {
    isAuthenticated: boolean;
    user: IUser | null;
    token: string | null;
    isLoading: boolean;
}

/**
 * Defines the shape of the authentication context.
 */
export interface AuthContextType extends AuthState {
    login: (apiResponse: LoginApiResponse) => Promise<void>;
    logout: () => void;
    updateUserContext: (updatedProfile: UserProfileResponseDto) => void;
}

/**
 * Defines the structure of the successful /auth/login API response.
 */
export interface LoginApiResponse {
    token: string;
    user: {
        username: string;
        fullName: string;
        roles: string[];
        permissions: string[];
        driverNumericId?: number;
    };
}

/**
 * Type for the credentials object sent during login.
 */
export interface UserLoginCredentials {
    username: string;
    password: string;
}


export interface IBackendUser {
    taso: number;
    tunnus: string;
    nimi: string;
    aktiivinen: boolean;
    kuljId?: number | null;
    roles: string[];
    roleIds?: number[];
}

export interface IUser {
    id: string;
    userId: string;
    username: string;
    fullName: string;
    roles: string[];
    permissions?: string[];
    isActive: boolean;
    roleIds?: number[];
    driverNumericId: number | null;
    driverEmail: string | null;
    userLevel: number;
}

export interface CreateUserPayload {
    username: string;
    fullName: string;
    password?: string;
    roleIds: number[];
    isActive?: boolean;
    kuljId?: number | null; // driver id
}

export interface UpdateUserPayload {
    fullName?: string;
    roleIds?: number[];
    isActive?: boolean;
}

export interface UpdateUserProfilePayload {
    fullName?: string;
    email?: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface UserProfileResponseDto {
    username: string;
    fullName: string;
    roles: string[];
    driverEmail: string | null;
    currentVehicleId?: number | null;
    currentVehicleRegNo?: string | null;
}

export interface IPermission {
    permissionId: number;
    permissionName: string;
    description: string | null;
    category: string;
}

export interface IRole {
    rooliId: number;
    roolinNimi: string;
    permissionIds: number[];
}


// --- CLIENT (CUSTOMER) ---

export enum ClientTypeEnum {
    PUULAANI = 0,
    RAHTIKIRJA = 1,
    BOTH = 2,
}

export interface IBackendClient {
    asiakkaanId: number;
    asiakkaanNimi: string;
    osoite: string | null;
    postiNro: string | null;
    paikkakunta: string | null;
    puhelinNro: string | null;
    ytunnus: string | null;
    kohteenVari: string | null;
    tyyppi: ClientTypeEnum;
    aktiivinen: boolean;
    yhteyshenkilo: string | null;
    sahkoposti: string | null;
    lisatietoja: string | null;
}

export interface IClient {
    id: string;
    clientId: string;
    clientName: string;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    phoneNo: string | null;
    vatId: string | null;
    targetColor: string | null;
    type: ClientTypeEnum;
    isActive: boolean;
    contactPerson: string | null;
    email: string | null;
    additionalInfo: string | null;
}

export type ICreateClientDto = {
    clientName: string;
    vatId?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    phoneNo?: string | null;
    contactPerson?: string | null;
    email?: string | null;
    additionalInfo?: string | null;
    targetColor?: string | null;
    type: ClientTypeEnum;
    isActive?: boolean;
};

export type IUpdateClientDto = Partial<ICreateClientDto>;

export interface IClientFormData {
    clientName: string;
    vatId: string;
    address: string;
    postalCode: string;
    city: string;
    phoneNo: string;
    contactPerson: string;
    email: string;
    additionalInfo: string;
    targetColor: string;
    isPuulaani: boolean;
    isRahtikirja: boolean;
    isActive: boolean;
}

export interface IClientBasicInfo {
    id: string;
    name: string;
    clientId: string;
    clientName: string;
    targetColor: string | null;
}


// --- DRIVER ---

export interface IBackendDriver {
    kuljId: number;
    nimi: string;
    puhelinNro: string;
    email: string;
    halytys: boolean;
}

export interface IDriver {
    driverId: number;
    name: string;
    phoneNo: string;
    email: string;
    hasAlerts: boolean;
    isOnline: boolean;
}

export interface IDriverGridRow extends IDriver {
    id: number;
}

export interface ICreateDriverDto {
    name: string;
    phoneNo: string;
    email: string;
    hasAlerts?: boolean;
}

export type IUpdateDriverDto = Partial<ICreateDriverDto>;

export interface IDriverFormData {
    name: string;
    phoneNo: string;
    email: string;
    hasAlerts: boolean;
}

export interface IDriverBasicInfo {
    id: number;
    name: string;
    driverId: number;
    driverName: string;
}


// --- VEHICLE ---

export interface IVehicleBackendResponse {
    kalustoNro: number;
    rekNro: string;
    edKatsastus: string;
    katsastusAik: string;
    aktiivinen: boolean;
    planning_group?: string | null;
    current_driver_tunnus?: string | null;
    current_driver_name?: string | null;
}

export interface IVehicle {
    vehicleNo: string;
    registrationNo: string;
    previousInspectionDate: string;
    nextInspectionDate: string;
    isActive: boolean;
    planning_group?: string | null;
}

export interface IVehicleGridRow extends IVehicle {
    id: string;
}

export interface ICreateVehicleDto {
    registrationNo: string;
    previousInspectionDate: string;
    nextInspectionDate: string;
    isActive?: boolean;
}

export type IUpdateVehicleDto = Partial<ICreateVehicleDto>;

export interface IVehicleFormData {
    registrationNo: string;
    previousInspectionDate: string;
    nextInspectionDate: string;
    isActive: boolean;
}

export interface IVehicleBasicInfo {
    id: string;
    name: string;
    vehicleNo: string;
    registrationNo: string;
    currentDriverTunnus?: string | null;
    currentDriverName?: string | null;
}

// =============================================================================
// SECTION 2: LOAD, TRIP, WAYBILL, CONSIGNMENT, & INSPECTION TYPES
// =============================================================================

export enum LoadTypeEnum {
    PUULAANI = 0,
    RAHTIKIRJA = 1,
}

export interface ILoad {
    kuormaId: number;
    tyyppi: LoadTypeEnum;
    asiakasId: number | null;
    puulaaniId: number | null;
    puutavaraId: number | null;
    kuljId: number | null;
    pvm: Date | null;
    ajomaaraysNro: string | null;
    vastaanottoNro: string | null;
    kohde: string | null;
    lahto: string | null;
    reitti: string | null;
    m3: number;
    km: number;
    tunnit: number;
    kpl: number;
    lisatiedot: string | null;
    kalustoNro: number | null;
    isActive: boolean;
    status: string;
}

export interface ICreateLoadDto {
    tyyppi: LoadTypeEnum;
    asiakasId: number;
    puulaaniId?: number;
    puutavaraId?: number;
    kalustoNro: number;
    kuljId: number;
    pvm: Date;
    ajomaaraysNro?: string | null;
    kohde?: string | null;
    lahto?: string | null;
    m3?: number | null;
    km?: number | null;
    lisatiedot?: string | null;
    vastaanottoNro?: string | null;
    reitti?: string | null;
    tunnit?: number | null;
    kpl?: number | null;
}

export type IUpdateLoadDto = Partial<ICreateLoadDto>;

export interface ILoadStatusUpdateDto {
    status: string;
}

export interface ICompleteLoadDto {
    actualM3: number;
    actualKm: number;
}

export interface ILoadDetails {
    vastaanottoNro: string;
    reitti: string;
    tunnit: number;
    m3: number;
    km: number;
    kpl: number;
    kuormaId: number;
    pvm: Date;
    ajomaaraysNro: string | null;
    status: string;
    lisatiedot: string | null;
    kuljId: number;
    tyyppi: LoadTypeEnum;
    asiakasId: number;
    puulaaniId: number | null;
    puutavaraId: number | null;
    kalustoNro: number | null;
    asiakkaanNimi: string;
    rekNro: string;
    kuljettajanNimi: string;
    originName: string;
    originAddress: string | null;
    originLat: number | null;
    originLng: number | null;
    originInstructions: string | null;
    taskTimberTypeName: string;
    taskVolume: number;
    taskRemainingVolumeBeforeThisTrip: number;
    destinationName: string;
    destinationAddress: string | null;
    destinationLat: number | null;
    destinationLng: number | null;
}

// Universal list item for various grids (Completed, Inspection, etc.)
export interface ILoadListItem {
    // Core IDs
    kuormaId: number;
    puutavaraId?: number;
    puulaaniId?: number;

    // Date
    pvm: string; // The primary date field from the 'kuorma' table

    // Type & Status
    tyyppi: string; // 'Timber Load' or 'Consignment'
    status?: string;
    valmis?: boolean | 0 | 1 | '0' | '1'; // <-- Added for Timber Management list
    aktiivinen?: boolean | 0 | 1 | '0' | '1'; // <-- Added for Timber Management list

    // Names
    asiakkaanNimi: string;
    kuljettajanNimi?: string;
    autoNro?: string; // Vehicle Reg No
    rekNro?: string; // Vehicle Reg No
    nimi?: string; // Puulaani name <-- Added for Timber Management list

    // Location Names
    lahto: string; // Origin name
    kohde: string; // Destination name

    // Numeric Quantities
    m3?: number;
    km?: number;
    tunnit?: number;
    kpl?: number;
    kok?: number | string;// <-- Added for Timber Management list
    jaljella?: number | string;// <-- Added for Timber Management list

    // Additional Details
    ajomaaraysNro?: string | null;
    vastaanottoNro?: string | null;
    reitti?: string | null;
    lisatiedot?: string | null;

    // --- ALIASES & COMPATIBILITY FIELDS ---
    // These are added to make this interface compatible with ALL list views
    // without needing to change the 'field' names in every DataGrid.
    date?: string; // Alias for 'pvm'
    cubicMeters?: number; // Alias for 'm3'
    freightKm?: number; // Alias for 'km'
    hours?: number; // Alias for 'tunnit'
    pcs?: number; // Alias for 'kpl'
    drivingOrderNo?: string | null; // Alias for 'ajomaaraysNro'
    receptionNo?: string | null; // Alias for 'vastaanottoNro'
    driverName?: string; // Alias for 'kuljettajanNimi'
    customerName?: string; // Alias for 'asiakkaanNimi'
    puulaaniName?: string; // Alias for 'lahto'
    unloadingSiteName?: string; // Alias for 'kohde'
    drivingRoute?: string | null; // Alias for 'reitti'
    additionalInformation?: string | null; // Alias for 'lisatiedot'
    accepted?: boolean;

    // Location Coordinates
    sijaintiLat?: number | null; // <-- Added for Timber Management list
    sijaintiLong?: number | null; // <-- Added for Timber Management list
}

export type ITimberStackListItem = ILoadListItem;

// For Active Trip Panel and Details Modal
export interface ITripLeg {
    kuormaId: number; // Should be number
    status: string;
    pvm: string; // The date string, e.g., "2025-10-10T21:00:00.000Z"

    // Names
    purkupaikkaName: string;
    puulaaniName?: string;
    puutavaralaji?: string;

    // Location Coordinates
    purkupaikkaLat: string | null;
    purkupaikkaLng: string | null;

    // Numeric Quantities (can come as strings from DB)
    m3: string | number;
    km: string | number;
    tunnit: string | number;
    kpl: string | number;

    // Other details
    ajomaaraysNro?: string;
    reitti?: string | null;
    vastaanottoNro?: string | null;
    lisatiedot?: string | null;
    puutavaraId?: number | null;
}

export interface ITripDetails {
    tripId: string | null;
    kuormaId?: number; // Added to handle actual DB record ID
    ajomaaraysNro: string | null;
    asiakasId: number;
    asiakkaanNimi: string;
    rekNro: string;
    kalustoNro: number | null;
    kuljettajanNimi: string;
    legs: ITripLeg[];
}

export interface IActiveTrip {
    ajomaaraysNro: string | null;
    asiakkaanNimi: string;
    rekNro: string;
    legs: ITripLeg[];
}

// For Consignment (Rahtikirja) specific UI
export interface IConsignmentKuormaListItem {
    kuormaId: number;
    pvm: string;
    asiakkaanNimi: string;
    autoNro: string;
    kuljettajanNimi: string;
    rahtikirjaCount: number;
    status: string;
}

export interface IRahtikirjaItem {
    id?: number;
    rahtikirjanNumero?: string;
    reitti: string;
    m3: number | string;
    km: number | string;
    kpl?: number | string;
    jako?: number | string;
    tievero?: number | string;
    lisatiedot?: string;
}

export interface IConsignmentForm {
    asiakasId: number | null | '';
    pvm: string;
    lisatiedot?: string;
    rahtikirjat: IRahtikirjaItem[];
}

// For Driven Inspection Page
export interface IUpdateDrivenInspectionRowDto {
    date?: string | null;
    receptionNo?: string | null;
    drivingRoute?: string | null;
    cubicMeters?: number | null;
    freightKm?: number | null;
    hours?: number | null;
    pcs?: number | null;
    additionalInfo?: string | null;
}

export interface ICreateKuormaFromPtlDto {
    puutavaraId: number;
    receptionNo?: string | null;
    drivingRoute?: string | null;
    cubicMeters?: number | null;
    freightKm?: number | null;
    hours?: number | null;
    pcs?: number | null;
    additionalInfo?: string | null;
}

export interface IDrivenInspectionFilters {
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    customerId?: string | null;
    vehicleId?: string | null;
    timberGradeIds?: (string | number)[];
}

// =============================================================================
// SECTION 3: TIMBER STACK (PUULAANI), WOOD, & RELATED TYPES
// =============================================================================

export interface IMapTimberStack {
    id: number;
    clientId: number;
    clientName: string;
    clientColor: string | null;
    name: string;
    latitude: number;
    longitude: number;
    totalVolume: number;
    remainingVolume: number;
    isActive: boolean;
    isCompleted: boolean;
    date: Date | string;
    dispatchOrderNo?: string | null;
    additionalInfo?: string | null;
    kilometers?: number | null;
    autoNro?: string | null;
}

export interface PuulaaniBasicDetailsFormData {
    name: string;
    clientId: string | null;
    dispatchOrderNo: string;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string;
}

export interface PendingPuulaaniData extends PuulaaniBasicDetailsFormData {
    latitude?: number;
    longitude?: number;
    date?: Dayjs | null;
}

export interface ICreateTimberStackDto {
    name: string;
    clientId: number;
    date: string;
    latitude: number;
    longitude: number;
    dispatchOrderNo: string | null;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string | null;
    totalVolume: number;
    auto_nro: string | null;
    kilometers?: number | null;
    selectedAutoIds?: number[];
    woodEntries?: {
        woodTypeId: number;
        dropoffLocationId: number;
        totalVolume: number;
    }[];
}

export type IUpdateTimberStackDto = Partial<ICreateTimberStackDto>;

export interface IUpdateTimberStackFullDto {
    puulaani: Partial<IBackendPuulaani>;
    autot: number[];
    puutavarat: {
        puutavara_id: number;
        puutavaranro: number;
        purkupaikka_id: number;
        kuutiot: number;
        haettu: number;
    }[];
}

// This is an alias for PuulaaniDetails, used in some older services.
// It's better to unify, but for now, this alias will fix the build.
export type IPuulaaniFullDetails = PuulaaniDetails;

// For multi-step "Add Puulaani" form
export interface PendingPuulaaniData {
    name: string;
    clientId: string | null;
    dispatchOrderNo: string;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string;
    latitude?: number;
    longitude?: number;
    date?: Dayjs | null;
}

// For "Edit Puulaani" details modal
export interface IEditablePuulaani {
    id: number;
    clientId: number;
    clientName: string;
    clientColor: string | null;
    name: string;
    latitude: number;
    longitude: number;
    totalVolume: number;
    remainingVolume: number;
    isActive: boolean;
    isCompleted: boolean;
    date: Date | string;
    dispatchOrderNo: string | null;
    additionalInfo: string | null;
    autot: any[];
    timberEntries: any[];
}

export interface IBackendPuulaani {
    puulaaniId: number;
    asiakasId: number;
    pvm: Date;
    nimi: string;
    autoNro: string | null;
    lisatiedot: string | null;
    kok: number;
    jaljella: number;
    km: number | null;
    aktiivinen: boolean;
    valmis: boolean;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
    ajomaaraysnro: string | null;
    asiakkaanNimi?: string;
    kohteenVari?: string;
}

export interface IWoodEntry {
    km: string;
    puutavaraId: number;
    puulaaniId: number;
    asiakasId: number;
    puutavaraNro: number;
    purkupaikkaId: number;
    kuutiot: string;
    haettu: string;
    jaljella: string;
    valmis: boolean;
    laji: string;
    purkupaikkaName: string;
    purkupaikkaLat?: number | null;
    purkupaikkaLng?: number | null;
    km3?: string;
}

export interface IRelatedLoad {
    kuormaId: number;
    kuljId: number;
    status: string;
    kuljettajanNimi: string;
    puutavaralaji: string | null;
    pvm: string;
    haettu: string;
}

export interface PuulaaniDetails {
    puulaani: {
        puulaaniId: number;
        nimi: string;
        asiakasId: number;
        pvm: string;
        lisatiedot: string | null;
        kok: string;
        jaljella: string;
        aktiivinen: boolean;
        valmis: boolean;
        sijaintiLat: string | null;
        sijaintiLong: string | null;
        km: string | null;
        ajomaaraysnro: string | null;
        autoNro: string | null;
    };
    autot: number[];
    timberEntries: IWoodEntry[];
    relatedLoads: IRelatedLoad[];
}

export interface IPuutavaraItem {
    puutavaraNro: number;
    puutavara: string;
}

export interface ITimberStackListFilters {
    status?: 'all' | 'active' | 'completed';
    clientId?: string | null;
    vehicleId?: string | null;
    timberTypeId?: string | null;
}

export interface IWoodCategoryBackendResponse {
    puutavaraId: number;
    nimi: string;
    lisatiedot?: string | null;
    aktiivinen: boolean;
}

export interface IWoodCategory {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export interface ICreateWoodCategoryDto {
    name: string;
    description?: string;
    isActive?: boolean;
}

export type IUpdateWoodCategoryDto = Partial<ICreateWoodCategoryDto>;

export interface IWoodCategoryFormData {
    name: string;
    description: string;
    isActive: boolean;
}

export interface ITimberStackWoodEntry {
    id: number; // Can be a temporary ID for new entries
    puutavaraId: number; // The actual DB ID, 0 for new entries
    woodTypeId: number;
    dropoffLocationId: number;
    totalVolume: number;
    fetchedVolume: number;
    remainingVolume: number;
    valmis?: boolean;
    isActive?: boolean;
}

export interface IAddTimberStackWoodEntryFormData {
    woodTypeId: number | null;
    dropoffLocationId: number | null;
    volume: number | null;
}

export interface PuulaaniFormData {
    name: string;
    isActive: boolean;
    isCompleted: boolean;
    additionalInfo: string | null;
    selectedAutoIds: number[];
    woodEntries: ITimberStackWoodEntry[];
    clientId?: number | string | null;
    date?: Dayjs | null;
    dispatchOrderNo?: string | null;
    kilometers?: number | null;
    autoNro?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

// =============================================================================
// SECTION 4: LOCATION, MAP & MISC TYPES
// =============================================================================
export type MarkerType = 'Puulaani' | 'Purkupaikka' | 'Muu merkki' | 'Chip transport';
export interface IMapDropoffLocation {
    id: number;
    clientId: number | null;
    clientName: string;
    name: string;
    latitude: number;
    longitude: number;
    isVisibleOnMap: boolean;
}

export interface IMapTrip {
    tripId: number;
    driverName: string;
    vehicleRegNo: string;
    originName: string;
    destinationName: string;
    status: string;
    originCoords: { lat: number, lng: number };
    destinationCoords: { lat: number, lng: number };
}

export interface IBackendMuuMerkki {
    muutietoId: number;
    nimi: string;
    tyyppi: string;
    lisatieto: string | null;
    vari: string;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
}

export interface IBackendPurkupaikka {
    purkupaikkaId: number;
    asiakasId: number | null;
    purkupaikka: string;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
    asiakkaanNimi?: string;
}

export interface IMapOtherMarker {
    id: number;
    name: string;
    iconType: string;
    additionalInfo: string | null;
    color: string;
    latitude: number;
    longitude: number;
}

export interface IVehicleLocation {
    id: string | number; // Vehicle ID (kalusto_nro)
    lat: number;
    lng: number;
    timestamp: string;
}

export type IUpdatePurkupaikkaDto = Partial<ICreatePurkupaikkaDto>;


export interface ICreatePurkupaikkaDto {
    clientId: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
}

export interface OtherMarkerFormData {
    name: string;
    iconType: string | null;
    color: string;
    additionalInfo: string;
}

export interface IUnloadingSite {
    id: string;
    purkupaikkaId: number;
    asiakasId: number;
    purkupaikka: string;
    sijaintiLat: string | null;
    sijaintiLong: string | null;
    clientName?: string | null;
    isVisibleOnMap: boolean;
}

export type ICreateUnloadingSiteDto = {
    clientId: number;
    unloadingSiteName: string;
    latitude?: string | null;
    longitude?: string | null;
};

export type IUpdateUnloadingSiteDto = Partial<ICreateUnloadingSiteDto>;

export interface IUnloadingSiteFormData {
    clientId: number | '';
    unloadingSiteName: string;
    latitude: string;
    longitude: string;
}

export interface TripLegForMap {
    kuormaId: number;
    originName: string;
    originCoords: { lat: number; lng: number; };
    destinationName?: string;
    destinationCoords?: { lat: number; lng: number; } | null;
    color?: string;
}

export interface TripMapProps {
    legs: TripLegForMap[];
    puulaanit: TripLegForMap[];
    purkupaikat: TripLegForMap[];
    driverLocation: { lat: number; lng: number; } | null;
    focusedTripId?: number | null;
    onFocusCompleteAction: () => void;
    onMarkerClickAction: (tripId: number, event: any) => void;
    markerFilters: { showPuulaanit: boolean; showPurkupaikat: boolean; };
    onFilterChangeAction: (filterName: 'showPuulaanit' | 'showPurkupaikat') => void;
}

export interface IMapFilterState {
    status: 'all' | 'active';
    clientId: string | null;
    vehicleId: string | null;
    markerTypes: ('puulaani' | 'purkupaikka' | 'chip-transport')[];
}



export interface ITimberStacksPageFilterState {
    status: 'all' | 'active';
    clientId: string | null;
    vehicleId: string | null;
}

export interface IBackendOtherMarker {
    muutietoId: number;
    nimi: string;
    tyyppi: string;
    vari: string;
    lisatieto: string | null;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
}

export interface IBackendPurkupaikkaResponse {
    purkupaikkaId: number;
    asiakasId: number | null;
    purkupaikka: string;
    sijaintiLat: number | null;
    sijaintiLong: number | null;
    isVisibleOnMap: boolean;
    clientName: string | null;
}

export interface ICreateOtherMarkerDto {
    name: string;
    iconType: string;
    additionalInfo: string | null;
    color: string;
    latitude: number;
    longitude: number;
}
export type IUpdateOtherMarkerDto = Partial<ICreateOtherMarkerDto>;


// =============================================================================
// SECTION 5: LAYOUT & UI TYPES
// =============================================================================

export type ThemeMode = 'light' | 'dark';
export type NavLayout = 'top' | 'left';

export interface LayoutContextType {
    themeMode: ThemeMode;
    navLayout: NavLayout;
    toggleThemeMode: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    toggleNavLayout: () => void;
    setNavLayout: (layout: NavLayout) => void;
    mobileDrawerOpen: boolean;
    toggleMobileDrawer: () => void;
}

// =============================================================================
// SECTION 6: DASHBOARD TYPES
// =============================================================================

// Admin Dashboard 
export interface IAdminDashboardStats {
    activeTimberStacksCount: number;
    loadsCompletedTodayCount: number;
    pendingBillingsCount: number;
    vehiclesNeedingInspectionCount: number;
    activeVehiclesCount: number;
    activeDriversCount: number;
}

// Dispatcher Dashboard 
export interface IDispatchDashboardStats {
    activeLoadsCount: number;
    availableDriversCount: number;
    availableVehiclesCount: number;
    totalRemainingVolume: number;
    upcomingLoadsTodayCount: number;
}

// Driver Dashboard
export interface IDriverDashboardStats {
    driverId: number;
    todayAssignedLoadsCount: number;
    todayCompletedLoadsCount: number;
    weekTotalLoadsCount: number;
    upcomingLoadsCount: number;
}

// For volume chart data
export interface IVolumeByDay {
    date: string;
    volume: number;
}

// For active trips list
export interface IActiveTripListItem {
    ajomaaraysNro: string;
    driverName: string | null;
    vehicleRegNo: string | null;
    status: string;
    progress: number;
}

// =============================================================================
// SECTION 7: CHIP TRANSPORT MANAGEMENT TYPES
// =============================================================================

export interface IChipTitleFormData {
    title_id: string;
    title_number: string,
    customer_id: string;
    loading_point_id: string;
    unloading_point_id: string;
    product_number: string;
    title_name: string;
    abbreviation: string;
    invoicing_basis: string;
    driver_instructions: string;
    req_pcs: boolean;
    req_m3: boolean;
    req_ton: boolean;
    req_hr: boolean;
    req_waiting: boolean;
    req_km: boolean;
    req_details: boolean;
    req_details_info: string;
    is_active: boolean;
    created_at: string;

}

export interface DayLabel {
    key: string;
    name: string;
}
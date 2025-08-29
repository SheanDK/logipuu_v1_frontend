// frontend/src/types/user.ts

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
    id: string; // Same as userId, for DataGrid compatibility
    userId: string;
    username: string;
    fullName: string;
    roles: string[];
    permissions?: string[];
    isActive: boolean;
    roleIds?: number[];
    driverNumericId: number | null;
    driverEmail: string | null; // Added for profile management
    userLevel: number;
}

// --- CORRECTED & SIMPLIFIED PAYLOADS ---

// For ADMIN creating a user
export interface CreateUserPayload {
    username: string;
    fullName: string;
    password?: string;
    roleIds: number[];
    isActive?: boolean;
}

// For ADMIN updating a user
export interface UpdateUserPayload {
    fullName?: string;
    roleIds?: number[];
    isActive?: boolean;
}

// --- NEW PAYLOADS FOR USER'S OWN PROFILE MANAGEMENT ---

// Payload for updating the user's OWN profile
export interface UpdateUserProfilePayload {
    fullName?: string;
    email?: string; // Driver's email
}

// Payload for changing the user's OWN password
export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

// --- NEW RESPONSE DTO ---

// DTO for the response from /users/me/profile endpoint
export interface UserProfileResponseDto {
    username: string;
    fullName: string;
    roles: string[];
    driverEmail: string | null;
}
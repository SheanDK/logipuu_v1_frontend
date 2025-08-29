// frontend/src/types/auth.ts

// --- CORRECTION IS HERE ---
// Import the single source of truth for the User type from user.ts
import { IUser, UserProfileResponseDto } from './user';

/**
 * Represents the state of authentication throughout the application.
 */
export interface AuthState {
    isAuthenticated: boolean;
    user: IUser | null; // Correctly uses the imported IUser type
    token: string | null;
    isLoading: boolean;
}

/**
 * Defines the shape of the authentication context.
 */
export interface AuthContextType extends AuthState {
    login: (apiResponse: LoginApiResponse) => Promise<void>;
    logout: () => void;
    updateUserContext: (updatedProfile: UserProfileResponseDto) => void; // Add the function signature here
}


/**
 * Type for the credentials object sent during login.
 */
export interface UserLoginCredentials {
    username: string;
    password: string;
}

/**
 * Defines the structure of the successful /auth/login API response from the backend.
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
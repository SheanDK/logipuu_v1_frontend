// frontend/src/types/api.ts

// export interface LoginApiResponse { ... } // <<<--- DELETE OR COMMENT OUT THIS LINE

// Keep any other GENERIC API types here. For example:
export interface GenericApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
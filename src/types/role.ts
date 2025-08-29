// frontend/src/types/role.ts

export interface IRole {
    rooliId: number;
    roolinNimi: string;
    permissionIds: number[]; // Backend now sends permission IDs
}
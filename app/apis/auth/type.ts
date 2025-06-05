export interface LoginRequest {
    userId: string
    password: string
}

export interface LoginResponse {
    access_token: string
    refresh_token: string
}

export interface SignupRequest {
    deviceId: string
    memberId: string
    password: string
}

export type SignupResponse = void

// types/shared.ts 파일이 정확한지 확인

export interface Member {
    memberName: string
    lat: number
    lon: number
    distance: number
    danger: number
}

export interface HostLocationData {
    host: {
        lat: number
        lon: number
    }
    distanceInfo: {
        safe: number
        warning: number
        danger: number
    }
    members: Member[]
}

// 추가로 필요한 타입들
export interface SocketEvents {
    locationUpdate: (data: HostLocationData) => void
    memberStatusChanged: () => void
    requestLocationUpdate: () => void
    error: (error: any) => void
}

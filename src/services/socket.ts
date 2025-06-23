import { io, Socket } from "socket.io-client"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "wss://flp24.com"

type UserRole = "host" | "member"

class SocketService {
    private socket: Socket | null = null
    private currentRole: UserRole | null = null
    private isConnecting = false
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000
    private reconnectAttempts = 0

    public baseUrl = BASE_URL

    /**
     * 역할에 따른 엔드포인트 연결
     */
    async connectAsRole(role: UserRole): Promise<Socket> {
        if (this.socket?.connected && this.currentRole === role) {
            console.log(`Socket already connected as ${role}`)
            return this.socket
        }

        // 기존 연결이 있으면 해제
        if (this.socket) {
            this.disconnect()
        }

        this.currentRole = role
        this.isConnecting = true

        try {
            console.log(`🔌 ${role} 소켓 연결을 위한 토큰 조회 중...`)
            const accessToken = await AsyncStorage.getItem("access_token")

            console.log(
                "AsyncStorage에서 가져온 토큰:",
                accessToken ? `${accessToken.substring(0, 20)}...` : "토큰 없음"
            )

            if (!accessToken) {
                throw new Error("No access token found")
            }

            // 🔥 역할에 따른 엔드포인트 설정
            const endpoint =
                role === "host" ? "/host/location" : "/member/location"
            const socketUrl = `${BASE_URL}${endpoint}`

            console.log(`🔌 ${role} 소켓 서버 연결 시도: ${socketUrl}`)

            this.socket = io(socketUrl, {
                query: {
                    Authorization: `Bearer ${accessToken}`,
                },
                transports: ["websocket", "polling"],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                reconnectionDelayMax: 5000,
                forceNew: true,
                autoConnect: true,
            })

            this.setupEventListeners()

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.isConnecting = false
                    reject(new Error("Connection timeout"))
                }, 10000)

                this.socket!.on("connect", () => {
                    clearTimeout(timeout)
                    this.isConnecting = false
                    this.reconnectAttempts = 0
                    console.log(
                        `✅ ${role} 소켓 연결 성공 (${socketUrl}):`,
                        this.socket?.id
                    )
                    resolve(this.socket!)
                })

                this.socket!.on("connect_error", (error) => {
                    clearTimeout(timeout)
                    this.isConnecting = false
                    console.error(`❌ ${role} 소켓 연결 오류:`, error)
                    reject(error)
                })
            })
        } catch (error) {
            this.isConnecting = false
            console.error(`❌ ${role} 소켓 연결 실패:`, error)
            throw error
        }
    }

    /**
     * 호스트로 연결
     */
    async connectAsHost(): Promise<Socket> {
        return this.connectAsRole("host")
    }

    /**
     * 멤버로 연결
     */
    async connectAsMember(): Promise<Socket> {
        return this.connectAsRole("member")
    }

    /**
     * 기본 연결 (하위 호환성)
     */
    async connect(): Promise<Socket> {
        return this.connectAsHost()
    }

    private setupEventListeners() {
        if (!this.socket) return

        this.socket.on("connect", () => {
            console.log(`✅ ${this.currentRole} Socket connected`)
        })

        this.socket.on("disconnect", () => {
            console.log(`❌ ${this.currentRole} Socket disconnected`)
        })

        this.socket.on("connect_error", (error) => {
            console.error(
                `❌ ${this.currentRole} Socket connection error:`,
                error
            )
        })
    }

    /**
     * 🔥 실시간 위치 데이터 리스너 (서버에서 자동으로 전송)
     */
    onLocationData(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on("locationData", (data: any) => {
                console.log(`📍 ${this.currentRole} 위치 데이터 수신:`, data)
                callback(data)
            })
            console.log(`📍 ${this.currentRole} 위치 데이터 리스너 등록됨`)
        }
    }

    /**
     * 에러 리스너
     */
    onError(callback: (error: any) => void): void {
        if (this.socket) {
            this.socket.on("error", callback)
            this.socket.on("connect_error", callback)
            console.log("❌ 에러 리스너 등록됨")
        }
    }

    /**
     * 연결 상태 모니터링
     */
    startConnectionMonitoring(callback: (connected: boolean) => void): void {
        if (this.socket) {
            this.socket.on("connect", () => callback(true))
            this.socket.on("disconnect", () => callback(false))
            this.socket.on("connect_error", () => callback(false))
        }
    }

    /**
     * 현재 역할 반환
     */
    getCurrentRole(): UserRole | null {
        return this.currentRole
    }

    /**
     * 연결 상태 확인
     */
    isConnected(): boolean {
        return this.socket?.connected || false
    }

    /**
     * 리스너 정리
     */
    removeAllListeners(): void {
        if (this.socket) {
            this.socket.removeAllListeners()
            console.log("🧹 모든 소켓 리스너 정리됨")
        }
    }

    /**
     * 소켓 연결 해제
     */
    disconnect(): void {
        if (this.socket) {
            console.log(`🔌 ${this.currentRole} 소켓 연결 해제`)
            this.socket.removeAllListeners()
            this.socket.disconnect()
            this.socket = null
            this.currentRole = null
        }
        this.isConnecting = false
    }
}

export const socketService = new SocketService()

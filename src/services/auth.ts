// services/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "./api"

export interface LoginData {
    userId: string
    password: string
}

export interface SignupData {
    deviceId: string
    userId: string
    password: string
}

export interface AuthResponse {
    success: boolean
    message: string
    accessToken?: string
    refreshToken?: string
    userType?: "member" | "host"
}

export interface AutoLoginResult {
    success: boolean
    userType?: "member" | "host"
}

class AuthService {
    private readonly ACCESS_TOKEN_KEY = "access_token"
    private readonly REFRESH_TOKEN_KEY = "refresh_token"
    private readonly USER_TYPE_KEY = "user_type"

    private isRefreshing = false
    private failedQueue: Array<{
        resolve: (token: string) => void
        reject: (error: any) => void
    }> = []

    private logoutCallbacks: (() => void)[] = []

    onLogout(callback: () => void): () => void {
        this.logoutCallbacks.push(callback)

        return () => {
            const index = this.logoutCallbacks.indexOf(callback)
            if (index > -1) {
                this.logoutCallbacks.splice(index, 1)
            }
        }
    }

    private triggerLogoutEvent() {
        console.log("🔔 로그아웃 이벤트 발생")
        this.logoutCallbacks.forEach((callback) => {
            try {
                callback()
            } catch (error) {
                console.error("로그아웃 콜백 실행 중 오류:", error)
            }
        })
    }

    setupInterceptors() {
        api.interceptors.request.use(async (config) => {
            const token = await this.getStoredAccessToken()
            if (token) config.headers.Authorization = `Bearer ${token}`
            return config
        })

        api.interceptors.response.use(
            (res) => res,
            async (error) => {
                const originalRequest = error.config

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject })
                        })
                            .then((token) => {
                                originalRequest.headers.Authorization = `Bearer ${token}`
                                return api(originalRequest)
                            })
                            .catch((err) => {
                                return Promise.reject(err)
                            })
                    }

                    originalRequest._retry = true
                    this.isRefreshing = true

                    try {
                        const refreshResult = await this.refreshToken()
                        if (
                            refreshResult.success &&
                            refreshResult.accessToken
                        ) {
                            this.processQueue(null, refreshResult.accessToken)

                            originalRequest.headers.Authorization = `Bearer ${refreshResult.accessToken}`
                            return api(originalRequest)
                        } else {
                            this.processQueue(new Error("토큰 갱신 실패"), null)
                            await this.logout()
                            return Promise.reject(error)
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError, null)
                        await this.logout()
                        return Promise.reject(error)
                    } finally {
                        this.isRefreshing = false
                    }
                }
                return Promise.reject(error)
            }
        )
    }

    private processQueue(error: any, token: string | null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error)
            } else {
                resolve(token!)
            }
        })

        this.failedQueue = []
    }

    async signup(
        userType: "member" | "host",
        deviceId: string,
        userId: string,
        password: string
    ): Promise<AuthResponse> {
        const endpoint =
            userType === "member" ? "/member/signup" : "/host/signup"
        const data =
            userType === "member"
                ? { deviceId, memberId: userId, password }
                : { deviceId, hostId: userId, password }

        const response = await api.post(endpoint, data)
        return response.data
    }

    async login(
        userType: "member" | "host",
        userId: string,
        password: string
    ): Promise<AuthResponse> {
        console.log("로그인 시도:", { userType, userId })

        const endpoint = userType === "member" ? "/member/login" : "/host/login"
        const data =
            userType === "member"
                ? { memberId: userId, password }
                : { hostId: userId, password }

        try {
            const response = await api.post(endpoint, data)
            console.log("서버 응답 원본:", response.data)
            console.log("로그인 응답:", {
                success: response.data.success,
                hasAccessToken: !!response.data.accessToken,
                hasRefreshToken: !!response.data.refreshToken,
            })

            if (response.data.accessToken) {
                console.log("✅ 토큰 저장 시도 중...")

                try {
                    await this.saveTokens(
                        response.data.accessToken,
                        response.data.refreshToken || "",
                        userType
                    )
                    console.log("✅ 토큰 저장 완료")

                    const savedToken = await this.getStoredAccessToken()
                    console.log(
                        "✅ 저장된 토큰 확인:",
                        savedToken ? "성공" : "실패"
                    )
                } catch (saveError) {
                    console.error("❌ 토큰 저장 실패:", saveError)
                }
            } else {
                console.log("❌ accessToken이 없어서 저장하지 않음")
            }

            const success =
                response.data.success !== undefined
                    ? response.data.success
                    : !!response.data.accessToken

            return {
                success,
                message: response.data.message || "로그인 처리됨",
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                userType: response.data.userType || userType,
            }
        } catch (error) {
            console.error("로그인 API 호출 실패:", error)
            throw error
        }
    }

    async checkAutoLogin(): Promise<AutoLoginResult> {
        try {
            const accessToken = await AsyncStorage.getItem(
                this.ACCESS_TOKEN_KEY
            )
            const userType = (await AsyncStorage.getItem(
                this.USER_TYPE_KEY
            )) as "member" | "host" | null

            if (accessToken && userType) {
                api.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${accessToken}`
                console.log("✅ 클라이언트 자동 로그인 OK:", userType)
                return { success: true, userType }
            } else {
                console.log(
                    "🔒 클라이언트 자동 로그인 실패: 토큰 또는 타입 없음"
                )
                return { success: false }
            }
        } catch (e) {
            console.error("❌ 클라이언트 자동 로그인 도중 오류:", e)
            return { success: false }
        }
    }

    async refreshToken(): Promise<{ success: boolean; accessToken?: string }> {
        const refreshToken = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY)
        const userType = await AsyncStorage.getItem(this.USER_TYPE_KEY)
        if (!refreshToken || !userType) return { success: false }

        try {
            const response = await api.post("/auth/refresh", { refreshToken })

            if (response.data.success && response.data.accessToken) {
                await this.saveTokens(
                    response.data.accessToken,
                    response.data.refreshToken || refreshToken,
                    userType as "member" | "host"
                )
                return { success: true, accessToken: response.data.accessToken }
            }

            return { success: false }
        } catch (error) {
            console.error("토큰 갱신 실패:", error)
            return { success: false }
        }
    }

    async saveTokens(
        accessToken: string,
        refreshToken: string,
        userType: "member" | "host"
    ) {
        console.log("🔄 토큰 저장 시작:", {
            accessTokenLength: accessToken?.length,
            refreshTokenLength: refreshToken?.length,
            userType,
            accessTokenPreview: accessToken
                ? accessToken.substring(0, 30) + "..."
                : "없음",
        })

        try {
            await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
            console.log("✅ ACCESS_TOKEN 저장 완료")

            await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
            console.log("✅ REFRESH_TOKEN 저장 완료")

            await AsyncStorage.setItem(this.USER_TYPE_KEY, userType)
            console.log("✅ USER_TYPE 저장 완료")

            const savedAccessToken = await AsyncStorage.getItem(
                this.ACCESS_TOKEN_KEY
            )
            const savedRefreshToken = await AsyncStorage.getItem(
                this.REFRESH_TOKEN_KEY
            )
            const savedUserType = await AsyncStorage.getItem(this.USER_TYPE_KEY)

            console.log("🔍 저장 확인:", {
                accessToken: savedAccessToken ? "✅ 저장됨" : "❌ 저장 안됨",
                refreshToken: savedRefreshToken ? "✅ 저장됨" : "❌ 저장 안됨",
                userType: savedUserType ? "✅ 저장됨" : "❌ 저장 안됨",
            })

            api.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${accessToken}`
            console.log("✅ API 헤더 설정 완료")
        } catch (error) {
            console.error("❌ 토큰 저장 중 오류:", error)
            throw error
        }
    }

    async logout() {
        console.log("🚪 로그아웃 시작")

        await this.clearAuthData()
        console.log("✅ 로그아웃 완료")

        this.triggerLogoutEvent()
    }

    async clearTokens() {
        await AsyncStorage.multiRemove([
            this.ACCESS_TOKEN_KEY,
            this.REFRESH_TOKEN_KEY,
            this.USER_TYPE_KEY,
        ])
    }

    private async clearAuthData() {
        try {
            await AsyncStorage.multiRemove([
                this.ACCESS_TOKEN_KEY,
                this.REFRESH_TOKEN_KEY,
                this.USER_TYPE_KEY,
            ])
            delete api.defaults.headers.common["Authorization"]
            console.log("✅ 인증 데이터 정리 완료")
        } catch (error) {
            console.error("❌ 인증 데이터 정리 실패:", error)
        }
    }

    async getStoredAccessToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY)
            console.log(
                "저장된 토큰 조회:",
                token ? `토큰 있음 (${token.substring(0, 20)}...)` : "토큰 없음"
            )
            return token
        } catch (error) {
            console.error("토큰 조회 실패:", error)
            return null
        }
    }
}

export const authService = new AuthService()
authService.setupInterceptors()

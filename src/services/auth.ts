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
  // 일관된 키 이름 사용
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
    // Request interceptor
    api.interceptors.request.use(async (config) => {
      try {
        const token = await this.getStoredAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error("토큰 조회 실패:", error)
      }
      return config
    })

    // Response interceptor (단일 정의)
    api.interceptors.response.use(
      (response) => response,
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
            if (refreshResult.success && refreshResult.accessToken) {
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
      },
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

  async signup(userType: "member" | "host", deviceId: string, userId: string, password: string): Promise<AuthResponse> {
    try {
      const endpoint = userType === "member" ? "/member/signup" : "/host/signup"
      const data =
        userType === "member" ? { deviceId, memberId: userId, password } : { deviceId, hostId: userId, password }

      const response = await api.post(endpoint, data)
      return response.data
    } catch (error) {
      console.error("회원가입 오류:", error)
      throw error
    }
  }

  async login(userType: "member" | "host", userId: string, password: string): Promise<AuthResponse> {
    console.log("로그인 시도:", { userType, userId })

    try {
      const endpoint = userType === "member" ? "/member/login" : "/host/login"
      const data = userType === "member" ? { memberId: userId, password } : { hostId: userId, password }

      const response = await api.post(endpoint, data)
      console.log("서버 응답:", response.data)

      if (response.data.accessToken) {
        console.log("✅ 토큰 저장 시도 중...")

        await this.saveTokens(response.data.accessToken, response.data.refreshToken || "", userType)
        console.log("✅ 토큰 저장 완료")
      }

      const success = response.data.success !== undefined ? response.data.success : !!response.data.accessToken

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
      // AsyncStorage 안정성을 위한 지연
      await new Promise((resolve) => setTimeout(resolve, 100))

      const [accessToken, userType] = await Promise.all([
        AsyncStorage.getItem(this.ACCESS_TOKEN_KEY).catch(() => null),
        AsyncStorage.getItem(this.USER_TYPE_KEY).catch(() => null),
      ])

      if (accessToken && userType && (userType === "member" || userType === "host")) {
        // API 헤더 설정
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
        console.log("✅ 자동 로그인 성공:", userType)
        return { success: true, userType: userType as "member" | "host" }
      } else {
        console.log("🔒 자동 로그인 실패: 토큰 또는 타입 없음")
        return { success: false }
      }
    } catch (error) {
      console.error("❌ checkAutoLogin 예외 발생:", error)
      return { success: false }
    }
  }

  async refreshToken(): Promise<{ success: boolean; accessToken?: string }> {
    try {
      const [refreshToken, userType] = await Promise.all([
        AsyncStorage.getItem(this.REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(this.USER_TYPE_KEY),
      ])

      if (!refreshToken || !userType) {
        return { success: false }
      }

      const response = await api.post("/auth/refresh", { refreshToken })

      if (response.data.success && response.data.accessToken) {
        await this.saveTokens(
          response.data.accessToken,
          response.data.refreshToken || refreshToken,
          userType as "member" | "host",
        )
        return { success: true, accessToken: response.data.accessToken }
      }

      return { success: false }
    } catch (error) {
      console.error("토큰 갱신 실패:", error)
      return { success: false }
    }
  }

  async saveTokens(accessToken: string, refreshToken: string, userType: "member" | "host") {
    console.log("🔄 토큰 저장 시작:", {
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      userType,
    })

    try {
      await Promise.all([
        AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken),
        AsyncStorage.setItem(this.USER_TYPE_KEY, userType),
      ])

      console.log("✅ 모든 토큰 저장 완료")

      // API 헤더 설정
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
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
    await AsyncStorage.multiRemove([this.ACCESS_TOKEN_KEY, this.REFRESH_TOKEN_KEY, this.USER_TYPE_KEY])
  }

  private async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([this.ACCESS_TOKEN_KEY, this.REFRESH_TOKEN_KEY, this.USER_TYPE_KEY])
      delete api.defaults.headers.common["Authorization"]
      console.log("✅ 인증 데이터 정리 완료")
    } catch (error) {
      console.error("❌ 인증 데이터 정리 실패:", error)
    }
  }

  async getStoredAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY)
      return token
    } catch (error) {
      console.error("토큰 조회 실패:", error)
      return null
    }
  }
}

export const authService = new AuthService()
// 인터셉터 설정
authService.setupInterceptors()

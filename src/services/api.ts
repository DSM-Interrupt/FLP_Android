import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import { authService } from "./auth"

const BASE_URL = Constants.expoConfig?.extra?.baseUrl ?? "https://flp24.com"

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
})

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("accessToken")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // accessToken 만료로 인한 401 → 슬라이딩 세션 갱신 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshResult = await authService.refreshToken()
            if (refreshResult.success && refreshResult.accessToken) {
                api.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${refreshResult.accessToken}`
                originalRequest.headers[
                    "Authorization"
                ] = `Bearer ${refreshResult.accessToken}`
                return api(originalRequest)
            } else {
                console.warn("🔒 자동 토큰 갱신 실패, 로그인 필요")
                await authService.clearTokens() // 선택 사항
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = await AsyncStorage.getItem("refreshToken")
                if (refreshToken) {
                    const response = await axios.post(
                        `${BASE_URL}/auth/refresh`,
                        {
                            refreshToken,
                        }
                    )

                    const { accessToken } = response.data
                    await AsyncStorage.setItem("accessToken", accessToken)

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                    return api(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                await AsyncStorage.multiRemove([
                    "accessToken",
                    "refreshToken",
                    "userType",
                ])
                // Navigate to login screen
            }
        }

        return Promise.reject(error)
    }
)

export default api

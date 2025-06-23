import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"

const BASE_URL = "https://flp24.com"

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
})

// Request interceptor to add auth token
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

import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { getItem, bulkSetItem } from "../utils/storage"
import { captureException } from "@sentry/react-native"
import { BASE_URL } from "@env"

export const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 1000 * 30,
})

instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalConfig = error.config as AxiosRequestConfig & {
            _retry?: boolean
        }

        if (
            error.response?.status === 401 &&
            originalConfig &&
            !originalConfig._retry &&
            originalConfig.url !== "/user/login" &&
            originalConfig.url !== "/user/refresh"
        ) {
            originalConfig._retry = true

            const refreshToken = await getItem("refresh_token")
            if (!refreshToken) return Promise.reject(error)

            try {
                const { data } = await instance.put("/user/refresh", null, {
                    headers: { "X-Refresh-Token": refreshToken },
                })

                await bulkSetItem([
                    ["access_token", data.access_token],
                    ["refresh_token", data.refresh_token],
                ])

                return instance(originalConfig)
            } catch (refreshError) {
                captureException(refreshError)
                return Promise.reject(refreshError)
            }
        }

        captureException(error)
        return Promise.reject(error)
    }
)

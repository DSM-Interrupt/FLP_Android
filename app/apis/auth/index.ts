import { useMutation, UseMutationResult } from "@tanstack/react-query"
import { instance } from ".."
import {
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
} from "./type"
import { cookie } from "../../utils/cookie"
import { useState } from "react"

export const useLogin = (
    router: string
): {
    mutate: UseMutationResult<LoginResponse, Error, LoginRequest>["mutate"]
    isPending: boolean
    isError: boolean
    error: Error | null
    accessToken: string | null
    refreshToken: string | null
} => {
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [refreshToken, setRefreshToken] = useState<string | null>(null)

    const loginMutationFn = async (
        loginData: LoginRequest
    ): Promise<LoginResponse> => {
        const response = await instance.post<LoginResponse>(
            `/${router}/login`,
            loginData
        )
        const data = response.data

        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)

        cookie.set("access_token", data.access_token)
        cookie.set("refresh_token", data.refresh_token)

        return data
    }

    const mutation: UseMutationResult<LoginResponse, Error, LoginRequest> =
        useMutation({
            mutationFn: loginMutationFn,
            onError: (error) => {
                cookie.remove("access_token")
                cookie.remove("refresh_token")
                console.error("로그인 에러:", error)
            },
        })

    const { mutate, isPending, isError, error } = mutation

    return {
        mutate,
        isPending,
        isError,
        error: error ?? null,
        accessToken,
        refreshToken,
    }
}

export const useSignup = (
    router: string
): {
    mutate: UseMutationResult<SignupResponse, Error, SignupRequest>["mutate"]
    isPending: boolean
    isError: boolean
    error: Error | null
    data: SignupResponse | null
} => {
    const mutation = useMutation<SignupResponse, Error, SignupRequest>({
        mutationFn: async (signupData) => {
            const response = await instance.post<SignupResponse>(
                `/${router}/signup`,
                signupData
            )
            return response.data
        },
        onError: (error) => {
            console.error("회원가입 에러:", error)
        },
    })

    const { mutate, isPending, isError, error, data } = mutation

    return {
        mutate,
        isPending,
        isError,
        error: error ?? null,
        data: data ?? null,
    }
}

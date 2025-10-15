"use client"

import { useEffect, useState } from "react"
import { View, ActivityIndicator, Text, LogBox, StatusBar } from "react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext"
import { AuthScreen } from "./src/screens/AuthScreen"
import { HostMainScreen } from "./src/screens/HostMainScreen"
import { MemberMainScreen } from "./src/screens/MemberMainScreen"
import { authService, type AutoLoginResult } from "./src/services/auth"
import { getThemeColors } from "./src/styles/colorTable"

// React Query 클라이언트 생성
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000, // 5분
        },
    },
})

// 불필요한 경고 숨기기
LogBox.ignoreLogs([
    "Warning: componentWillReceiveProps",
    "Warning: componentWillUpdate",
    "Module RCTImageLoader",
])

function AppContent() {
    const { isDark } = useTheme()
    const themeColors = getThemeColors(isDark)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userType, setUserType] = useState<"host" | "member" | null>(null)

    useEffect(() => {
        const init = async () => {
            try {
                // Native 모듈 준비 시간 확보
                await new Promise((resolve) => setTimeout(resolve, 200))

                const result: AutoLoginResult = await authService
                    .checkAutoLogin()
                    .catch((err) => {
                        console.error("자동 로그인 실패:", err)
                        return { success: false } as AutoLoginResult
                    })

                if (result.success && result.userType) {
                    setUserType(result.userType)
                    setIsAuthenticated(true)
                } else {
                    setUserType(null)
                    setIsAuthenticated(false)
                }
            } catch (err) {
                console.error("초기화 오류:", err)
                setUserType(null)
                setIsAuthenticated(false)
            } finally {
                setCheckingAuth(false)
            }
        }

        init()
    }, [])

    const handleAuthSuccess = (type: "host" | "member") => {
        setUserType(type)
        setIsAuthenticated(true)
    }

    const handleLogout = () => {
        setUserType(null)
        setIsAuthenticated(false)
    }

    if (checkingAuth) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: themeColors.background,
                }}
            >
                <StatusBar
                    barStyle={isDark ? "light-content" : "dark-content"}
                    backgroundColor={themeColors.background}
                />
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text
                    style={{ marginTop: 10, color: themeColors.textSecondary }}
                >
                    로그인 상태 확인 중...
                </Text>
            </View>
        )
    }

    if (!isAuthenticated || !userType) {
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />
    }

    return userType === "host" ? (
        <HostMainScreen onLogout={handleLogout} />
    ) : (
        <MemberMainScreen onLogout={handleLogout} />
    )
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </QueryClientProvider>
    )
}

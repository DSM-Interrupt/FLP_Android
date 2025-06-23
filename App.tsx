import React, { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./src/contexts/ThemeContext"
import { AuthScreen } from "./src/screens/AuthScreen"
import { MemberMainScreen } from "./src/screens/MemberMainScreen"
import { HostMainScreen } from "./src/screens/HostMainScreen"
import { LoadingScreen } from "./src/screens/LoadingScreen"
import { authService } from "./src/services/auth"

const Stack = createStackNavigator()
const queryClient = new QueryClient()

export default function App() {
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userType, setUserType] = useState<"member" | "host" | null>(null)

    useEffect(() => {
        const tryAutoLogin = async () => {
            const result = await authService.checkAutoLogin()
            if (!result.success) {
                setIsAuthenticated(false)
            } else {
                setIsAuthenticated(true)
            }
        }

        tryAutoLogin()
    }, [])

    const handleAuthSuccess = (newUserType: "member" | "host") => {
        console.log("🎉 인증 성공:", newUserType)
        setIsAuthenticated(true)
        setUserType(newUserType)
    }

    if (isLoading) {
        return <LoadingScreen />
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <NavigationContainer>
                    <Stack.Navigator
                        screenOptions={{ headerShown: false }}
                        key={
                            isAuthenticated
                                ? `authenticated-${userType}`
                                : "unauthenticated"
                        }
                    >
                        {!isAuthenticated ? (
                            <Stack.Screen name="Auth">
                                {(props) => (
                                    <AuthScreen
                                        {...props}
                                        onAuthSuccess={handleAuthSuccess}
                                    />
                                )}
                            </Stack.Screen>
                        ) : userType === "member" ? (
                            <Stack.Screen
                                name="MemberMain"
                                component={MemberMainScreen}
                            />
                        ) : (
                            <Stack.Screen
                                name="HostMain"
                                component={HostMainScreen}
                            />
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </ThemeProvider>
        </QueryClientProvider>
    )
}

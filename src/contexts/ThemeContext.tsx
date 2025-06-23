import React, { createContext, useContext, useState, useEffect } from "react"
import { Appearance, ColorSchemeName } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    isDark: boolean
    systemTheme: ColorSchemeName
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [theme, setTheme] = useState<Theme>("light")
    const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(
        Appearance.getColorScheme()
    )
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        initializeTheme()

        // 시스템 테마 변경 감지
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            console.log("System theme changed to:", colorScheme)
            setSystemTheme(colorScheme)

            // 시스템 테마에 따라 앱 테마 자동 변경
            const newTheme = colorScheme === "dark" ? "dark" : "light"
            setTheme(newTheme)
            saveThemeToStorage(newTheme)
        })

        return () => subscription?.remove()
    }, [])

    const initializeTheme = async () => {
        try {
            console.log("Initializing theme...")

            // 저장된 테마 확인
            const savedTheme = await AsyncStorage.getItem("theme")
            const currentSystemTheme = Appearance.getColorScheme()

            console.log("Saved theme:", savedTheme)
            console.log("Current system theme:", currentSystemTheme)

            setSystemTheme(currentSystemTheme)

            // 저장된 테마가 있으면 사용, 없으면 시스템 테마 따름
            let initialTheme: Theme
            if (savedTheme === "light" || savedTheme === "dark") {
                initialTheme = savedTheme
            } else {
                initialTheme = currentSystemTheme === "dark" ? "dark" : "light"
                await saveThemeToStorage(initialTheme)
            }

            setTheme(initialTheme)
            console.log("Theme initialized:", initialTheme)
        } catch (error) {
            console.error("Failed to initialize theme:", error)
            // 오류 발생 시 시스템 테마 따름
            const fallbackTheme = systemTheme === "dark" ? "dark" : "light"
            setTheme(fallbackTheme)
        } finally {
            setIsLoading(false)
        }
    }

    const saveThemeToStorage = async (themeToSave: Theme) => {
        try {
            await AsyncStorage.setItem("theme", themeToSave)
            console.log("Theme saved to storage:", themeToSave)
        } catch (error) {
            console.error("Failed to save theme:", error)
        }
    }

    // 로딩 중일 때는 시스템 테마로 렌더링
    const currentTheme = isLoading
        ? systemTheme === "dark"
            ? "dark"
            : "light"
        : theme
    const isDark = currentTheme === "dark"

    console.log(
        "ThemeProvider - Current theme:",
        currentTheme,
        "isDark:",
        isDark,
        "systemTheme:",
        systemTheme
    )

    return (
        <ThemeContext.Provider
            value={{
                theme: currentTheme,
                isDark,
                systemTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}

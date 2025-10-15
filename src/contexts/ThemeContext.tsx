import { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme, type ColorSchemeName } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
    theme: Theme
    isDark: boolean
    systemTheme: ColorSchemeName
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [theme, setThemeState] = useState<Theme>("system")
    const systemTheme = useColorScheme() // "light" | "dark" | null | undefined

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem("theme")
                if (
                    savedTheme &&
                    ["light", "dark", "system"].includes(savedTheme)
                ) {
                    setThemeState(savedTheme as Theme)
                }
            } catch (error) {
                console.error("테마 로드 실패:", error)
            }
        }
        loadTheme()
    }, [])

    const setTheme = async (newTheme: Theme) => {
        try {
            setThemeState(newTheme)
            await AsyncStorage.setItem("theme", newTheme)
        } catch (error) {
            console.error("테마 저장 실패:", error)
        }
    }

    const isDark =
        theme === "system" ? systemTheme === "dark" : theme === "dark"

    return (
        <ThemeContext.Provider value={{ theme, isDark, systemTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context)
        throw new Error("useTheme must be used within a ThemeProvider")
    return context
}

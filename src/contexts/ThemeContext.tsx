"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { Appearance, type ColorSchemeName } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  systemTheme: ColorSchemeName
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("system")
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme())

  useEffect(() => {
    // 저장된 테마 불러오기
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
          setThemeState(savedTheme as Theme)
        }
      } catch (error) {
        console.error("테마 로드 실패:", error)
      }
    }

    loadTheme()

    // 시스템 테마 변경 감지
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme)
    })

    return () => subscription?.remove()
  }, [])

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme)
      await AsyncStorage.setItem("theme", newTheme)
    } catch (error) {
      console.error("테마 저장 실패:", error)
    }
  }

  const isDark = theme === "system" ? systemTheme === "dark" : theme === "dark"

  return <ThemeContext.Provider value={{ theme, isDark, systemTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

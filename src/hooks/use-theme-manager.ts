"use client"

import React from "react"
import { useTheme } from "@/hooks/use-theme"
import { baseColors } from "@/config/theme-customizer-constants"
import { colorThemes } from "@/config/theme-data"
import type { ThemePreset, ImportedTheme } from "@/types/theme-customizer"

// Storage keys for different customization types
const THEME_STORAGE_KEYS = {
  SELECTED_THEME: "selected-theme",
  SELECTED_TWEAKCN_THEME: "selected-tweakcn-theme",
  IMPORTED_THEME: "imported-theme",
  CUSTOM_RADIUS: "custom-radius",
  BRAND_COLORS: "brand-colors",
  CSS_VARIABLES: "css-variables",
}

export function useThemeManager() {
  const { theme, setTheme } = useTheme()
  const [brandColorsValues, setBrandColorsValues] = React.useState<
    Record<string, string>
  >({})

  // Simple, reliable theme detection - just follow the theme provider
  const isDarkMode = React.useMemo(() => {
    if (theme === "dark") return true
    if (theme === "light") return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  }, [theme])

  // Load persisted state on initialization
  React.useEffect(() => {
    loadPersistedTheme()
  }, [])

  // Save current CSS variables to localStorage
  const saveCSSVariables = React.useCallback(() => {
    const cssVariables: Record<string, string> = {}

    localStorage.setItem(
      THEME_STORAGE_KEYS.CSS_VARIABLES,
      JSON.stringify(cssVariables)
    )
  }, [])

  // Load and apply persisted theme settings
  const loadPersistedTheme = React.useCallback(() => {
    try {
      // Load CSS variables
      const savedVariables = localStorage.getItem(
        THEME_STORAGE_KEYS.CSS_VARIABLES
      )
      if (savedVariables) {
        const cssVariables = JSON.parse(savedVariables)
        const root = document.documentElement

        Object.entries(cssVariables).forEach(([property, value]) => {
          if (typeof value === "string") {
            root.style.setProperty(property, value)
          }
        })
      }

      // Load brand colors
      const savedBrandColors = localStorage.getItem(
        THEME_STORAGE_KEYS.BRAND_COLORS
      )
      if (savedBrandColors) {
        setBrandColorsValues(JSON.parse(savedBrandColors))
      }
    } catch (error) {
      console.error("Error loading persisted theme:", error)
    }
  }, [])

  const saveToLocalStorage = React.useCallback((key: string, value: any) => {
    try {
      if (value === null || value === undefined || value === "") {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }, [])

  const resetTheme = React.useCallback(() => {
    // Comprehensive reset of ALL possible CSS variables that could be set by themes
    const root = document.documentElement
    const allPossibleVars = [
      // Standard codexa/ui variables
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "destructive",
      "destructive-foreground",
      "border",
      "input",
      "ring",
      "radius",

      // Chart variables
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",

      // Sidebar variables
      "sidebar",
      "sidebar-background",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",

      // Font variables that might be in imported themes
      "font-sans",
      "font-serif",
      "font-mono",

      // Shadow variables from imported themes
      "shadow-2xs",
      "shadow-xs",
      "shadow-sm",
      "shadow",
      "shadow-md",
      "shadow-lg",
      "shadow-xl",
      "shadow-2xl",

      // Spacing variables
      "spacing",
      "tracking-normal",

      // Additional variables that might be set by advanced themes
      "card-header",
      "card-content",
      "card-footer",
      "muted-background",
      "accent-background",
      "destructive-background",
      "warning",
      "warning-foreground",
      "success",
      "success-foreground",
      "info",
      "info-foreground",
    ]

    // Remove all possible CSS variables
    allPossibleVars.forEach((varName) => {
      root.style.removeProperty(`--${varName}`)
    })

    // Also remove any inline styles that might have been set (comprehensive cleanup)
    const inlineStyles = root.style
    for (let i = inlineStyles.length - 1; i >= 0; i--) {
      const property = inlineStyles[i]
      if (property.startsWith("--")) {
        root.style.removeProperty(property)
      }
    }

    // Clear all persisted theme data
    Object.values(THEME_STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })

    // Reset state
    setBrandColorsValues({})
  }, [])

  const updateBrandColorsFromTheme = React.useCallback(
    (styles: Record<string, string>) => {
      const newValues: Record<string, string> = {}
      baseColors.forEach((color) => {
        const cssVar = color.cssVar.replace("--", "")
        if (styles[cssVar]) {
          newValues[color.cssVar] = styles[cssVar]
        }
      })
      setBrandColorsValues(newValues)
      // Persist brand colors
      saveToLocalStorage(THEME_STORAGE_KEYS.BRAND_COLORS, newValues)
    },
    [saveToLocalStorage]
  )

  const applyTheme = React.useCallback(
    (themeValue: string, darkMode: boolean) => {
      const theme = colorThemes.find((t) => t.value === themeValue)
      if (!theme) return

      // Reset and apply theme variables
      resetTheme()
      const styles = darkMode
        ? theme.preset.styles.dark
        : theme.preset.styles.light
      const root = document.documentElement

      Object.entries(styles).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })

      // Update brand colors values when theme changes
      updateBrandColorsFromTheme(styles)

      // Persist theme selection and CSS variables
      saveToLocalStorage(THEME_STORAGE_KEYS.SELECTED_THEME, themeValue)
      saveToLocalStorage(THEME_STORAGE_KEYS.SELECTED_TWEAKCN_THEME, "") // Clear tweakcn theme
      saveToLocalStorage(THEME_STORAGE_KEYS.IMPORTED_THEME, null) // Clear imported theme
      saveCSSVariables()
    },
    [
      resetTheme,
      updateBrandColorsFromTheme,
      saveToLocalStorage,
      saveCSSVariables,
    ]
  )

  const applyTweakcnTheme = React.useCallback(
    (themePreset: ThemePreset, darkMode: boolean) => {
      // Reset and apply theme variables
      resetTheme()
      const styles = darkMode
        ? themePreset.styles.dark
        : themePreset.styles.light
      const root = document.documentElement

      Object.entries(styles).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })

      // Update brand colors values when theme changes
      updateBrandColorsFromTheme(styles)

      // Persist tweakcn theme selection and CSS variables
      saveToLocalStorage(THEME_STORAGE_KEYS.SELECTED_TWEAKCN_THEME, themePreset)
      saveToLocalStorage(THEME_STORAGE_KEYS.SELECTED_THEME, "") // Clear regular theme
      saveToLocalStorage(THEME_STORAGE_KEYS.IMPORTED_THEME, null) // Clear imported theme
      saveCSSVariables()
    },
    [
      resetTheme,
      updateBrandColorsFromTheme,
      saveToLocalStorage,
      saveCSSVariables,
    ]
  )

  const applyImportedTheme = React.useCallback(
    (themeData: ImportedTheme, darkMode: boolean) => {
      const root = document.documentElement
      const themeVars = darkMode ? themeData.dark : themeData.light

      // Apply all variables from the theme
      Object.entries(themeVars).forEach(([variable, value]) => {
        root.style.setProperty(`--${variable}`, value)
      })

      // Update brand colors values for the customizer UI
      const newBrandColors: Record<string, string> = {}
      baseColors.forEach((color) => {
        const varName = color.cssVar.replace("--", "")
        if (themeVars[varName]) {
          newBrandColors[color.cssVar] = themeVars[varName]
        }
      })
      setBrandColorsValues(newBrandColors)

      // Persist imported theme and related data
      saveToLocalStorage(THEME_STORAGE_KEYS.IMPORTED_THEME, themeData)
      saveToLocalStorage(THEME_STORAGE_KEYS.SELECTED_THEME, "") // Clear regular theme
      saveToLocalStorage(THEME_STORAGE_KEYS.SELECTED_TWEAKCN_THEME, "") // Clear tweakcn theme
      saveToLocalStorage(THEME_STORAGE_KEYS.BRAND_COLORS, newBrandColors)
      saveCSSVariables()
    },
    [saveToLocalStorage, saveCSSVariables]
  )

  const applyRadius = React.useCallback(
    (radius: string) => {
      document.documentElement.style.setProperty("--radius", radius)
      saveToLocalStorage(THEME_STORAGE_KEYS.CUSTOM_RADIUS, radius)
      saveCSSVariables()
    },
    [saveToLocalStorage, saveCSSVariables]
  )

  const handleColorChange = React.useCallback(
    (cssVar: string, value: string) => {
      document.documentElement.style.setProperty(cssVar, value)

      // Update brand colors state
      setBrandColorsValues((prev) => {
        const updated = { ...prev, [cssVar]: value }
        saveToLocalStorage(THEME_STORAGE_KEYS.BRAND_COLORS, updated)
        return updated
      })

      saveCSSVariables()
    },
    [saveToLocalStorage, saveCSSVariables]
  )

  // Helper functions to get persisted data
  const getPersistedThemeData = React.useCallback(() => {
    try {
      return {
        selectedTheme: localStorage.getItem(THEME_STORAGE_KEYS.SELECTED_THEME)
          ? JSON.parse(localStorage.getItem(THEME_STORAGE_KEYS.SELECTED_THEME)!)
          : "",
        selectedTweakcnTheme: localStorage.getItem(
          THEME_STORAGE_KEYS.SELECTED_TWEAKCN_THEME
        )
          ? JSON.parse(
              localStorage.getItem(THEME_STORAGE_KEYS.SELECTED_TWEAKCN_THEME)!
            )
          : "",
        importedTheme: localStorage.getItem(THEME_STORAGE_KEYS.IMPORTED_THEME)
          ? JSON.parse(localStorage.getItem(THEME_STORAGE_KEYS.IMPORTED_THEME)!)
          : null,
        customRadius: localStorage.getItem(THEME_STORAGE_KEYS.CUSTOM_RADIUS)
          ? JSON.parse(localStorage.getItem(THEME_STORAGE_KEYS.CUSTOM_RADIUS)!)
          : "0.5rem",
      }
    } catch {
      return {
        selectedTheme: "",
        selectedTweakcnTheme: "",
        importedTheme: null,
        customRadius: "0.5rem",
      }
    }
  }, [])

  return {
    theme,
    setTheme,
    isDarkMode,
    brandColorsValues,
    setBrandColorsValues,
    resetTheme,
    applyTheme,
    applyTweakcnTheme,
    applyImportedTheme,
    applyRadius,
    handleColorChange,
    updateBrandColorsFromTheme,
    getPersistedThemeData,
    loadPersistedTheme,
  }
}

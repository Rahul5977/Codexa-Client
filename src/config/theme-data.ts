import { codexaThemePresets } from "@/utils/shadcn-ui-theme-presets"
import { tweakcnPresets } from "@/utils/tweakcn-theme-presets"
import type { ColorTheme } from "@/types/theme-customizer"

// Tweakcn theme presets for the dropdown - convert from tweakcnPresets
export const tweakcnThemes: ColorTheme[] = Object.entries(tweakcnPresets).map(
  ([key, preset]) => ({
    name: preset.label || key,
    value: key,
    preset: preset,
  })
)

// Codexa theme presets for the dropdown - convert from codexaThemePresets
export const colorThemes: ColorTheme[] = Object.entries(codexaThemePresets).map(
  ([key, preset]) => ({
    name: preset.label || key,
    value: key,
    preset: preset,
  })
)

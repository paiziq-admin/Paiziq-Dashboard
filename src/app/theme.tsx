import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

type ThemeMode = "light" | "dark";

type AppThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const THEME_STORAGE_KEY = "paiziq-theme";

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyDocumentTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

const paletteByMode = {
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    surfaceSelected: "#eff6ff",
    border: "#e2e8f0",
    text: "#0f172a",
    textMuted: "#64748b",
    primary: "#2563eb",
  },
  dark: {
    background: "#0b1120",
    surface: "#111827",
    surfaceAlt: "#1f2937",
    surfaceSelected: "#172554",
    border: "#334155",
    text: "#f8fafc",
    textMuted: "#cbd5e1",
    primary: "#60a5fa",
  },
} as const;

function buildTheme(mode: ThemeMode) {
  const tokens = paletteByMode[mode];
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      background: {
        default: tokens.background,
        paper: tokens.surface,
      },
      primary: {
        main: tokens.primary,
      },
      success: {
        main: isDark ? "#34d399" : "#10b981",
        contrastText: isDark ? "#052e1a" : "#ffffff",
      },
      warning: {
        main: isDark ? "#fbbf24" : "#f59e0b",
        contrastText: "#1f2937",
      },
      error: {
        main: isDark ? "#f87171" : "#ef4444",
      },
      info: {
        main: isDark ? "#38bdf8" : "#3b82f6",
      },
      text: {
        primary: tokens.text,
        secondary: tokens.textMuted,
      },
      divider: tokens.border,
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background,
            color: tokens.text,
          },
          "a": {
            color: tokens.primary,
          },
          ".recharts-cartesian-grid line": {
            stroke: `${isDark ? "#334155" : "#e2e8f0"} !important`,
          },
          ".recharts-cartesian-axis-tick text": {
            fill: `${tokens.textMuted} !important`,
          },
          ".recharts-legend-item-text": {
            color: `${tokens.textMuted} !important`,
          },
          ".recharts-default-tooltip": {
            backgroundColor: `${tokens.surface} !important`,
            borderColor: `${tokens.border} !important`,
            color: `${tokens.text} !important`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderColor: tokens.border,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: `${tokens.surface} !important`,
            color: `${tokens.text} !important`,
            borderColor: `${tokens.border} !important`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.surface,
            color: tokens.text,
            borderColor: tokens.border,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: tokens.border,
          },
          head: {
            backgroundColor: `${tokens.surfaceAlt} !important`,
            color: `${tokens.text} !important`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&.MuiTableRow-hover:hover": {
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: tokens.border,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: tokens.textMuted,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            backgroundColor: "transparent",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            border: `1px solid ${tokens.border}`,
          },
        },
      },
    },
  });
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useLayoutEffect(() => {
    applyDocumentTheme(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((current) => (current === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}

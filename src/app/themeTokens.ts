import type { Theme } from "@mui/material";

export const appColors = (theme: Theme) => {
  const isDark = theme.palette.mode === "dark";

  return {
    surfaceAlt: isDark ? "#1f2937" : "#f8fafc",
    surfaceHover: isDark ? "#1e293b" : "#f1f5f9",
    surfaceSelected: isDark ? "#172554" : "#eff6ff",
    border: theme.palette.divider,
    mutedText: theme.palette.text.secondary,
    link: theme.palette.primary.main,
    chartGrid: isDark ? "#334155" : "#e2e8f0",
    chartAxis: theme.palette.text.secondary,
    chartTooltipBg: theme.palette.background.paper,
    chartTooltipBorder: theme.palette.divider,
  };
};

export const statusColors = (theme: Theme) => {
  const isDark = theme.palette.mode === "dark";

  return {
    approved: {
      bg: isDark ? "#064e3b" : "#dcfce7",
      color: isDark ? "#bbf7d0" : "#166534",
      icon: isDark ? "#34d399" : "#10b981",
    },
    healthy: {
      bg: isDark ? "#064e3b" : "#dcfce7",
      color: isDark ? "#bbf7d0" : "#166534",
      icon: isDark ? "#34d399" : "#10b981",
    },
    blocked: {
      bg: isDark ? "#7f1d1d" : "#fee2e2",
      color: isDark ? "#fecaca" : "#991b1b",
      icon: isDark ? "#f87171" : "#ef4444",
    },
    error: {
      bg: isDark ? "#7f1d1d" : "#fee2e2",
      color: isDark ? "#fecaca" : "#991b1b",
      icon: isDark ? "#f87171" : "#ef4444",
    },
    warning: {
      bg: isDark ? "#78350f" : "#fef3c7",
      color: isDark ? "#fde68a" : "#92400e",
      icon: isDark ? "#fbbf24" : "#f59e0b",
    },
    info: {
      bg: isDark ? "#1e3a8a" : "#e0e7ff",
      color: isDark ? "#bfdbfe" : "#3730a3",
      icon: isDark ? "#60a5fa" : "#3b82f6",
    },
    neutral: {
      bg: isDark ? "#334155" : "#f3f4f6",
      color: isDark ? "#e2e8f0" : "#374151",
      icon: isDark ? "#cbd5e1" : "#64748b",
    },
  };
};

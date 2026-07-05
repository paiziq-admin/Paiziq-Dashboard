import { Outlet, Link, useLocation } from "react-router";
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Badge,
  MenuItem,
  Select,
  InputAdornment,
  TextField,
  Avatar,
  Typography,
} from "@mui/material";
import {
  LayoutDashboard,
  CreditCard,
  ClipboardCheck,
  Shield,
  Activity,
  FileText,
  Bell,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useAppTheme } from "../theme";
import { appColors } from "../themeTokens";

const drawerWidth = 240;

const navItems = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Payment Feed", path: "/payments", icon: CreditCard },
  { label: "Human Reviews", path: "/reviews", icon: ClipboardCheck },
  { label: "Risk Policies", path: "/policies", icon: Shield },
  { label: "Agents & SDK", path: "/agents", icon: Activity },
  { label: "Audit Log", path: "/audit", icon: FileText },
];

export function RootLayout() {
  const location = useLocation();
  const { mode, toggleMode } = useAppTheme();

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          },
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
            Payment Agent
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Audit Layer
          </Typography>
        </Box>
        <List sx={{ px: 1, py: 2 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 1,
                    "&:hover": { bgcolor: (theme) => appColors(theme).surfaceHover },
                    ...(isActive && {
                      bgcolor: (theme) => appColors(theme).surfaceSelected,
                      color: "primary.main",
                      "&:hover": { bgcolor: (theme) => appColors(theme).surfaceSelected },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isActive ? "primary.main" : "text.secondary" }}>
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 500 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            color: "text.primary",
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Select
              value="production"
              size="small"
              sx={{
                minWidth: 140,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
              }}
            >
              <MenuItem value="production">Production</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="development">Development</MenuItem>
            </Select>

            <TextField
              placeholder="Search payments, users, agents..."
              size="small"
              sx={{
                flexGrow: 1,
                maxWidth: 500,
                "& .MuiOutlinedInput-root": {
                  bgcolor: (theme) => appColors(theme).surfaceAlt,
                  "& fieldset": { border: "none" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <IconButton
              onClick={toggleMode}
              aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
              sx={{ width: 40, height: 40 }}
            >
              {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>

            <IconButton sx={{ width: 40, height: 40 }}>
              <Badge badgeContent={3} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>

            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>SC</Avatar>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: "auto",
            bgcolor: "background.default",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

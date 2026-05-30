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
  Search,
} from "lucide-react";

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

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f8f9fa" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e5e7eb",
            bgcolor: "#ffffff",
          },
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: "1px solid #e5e7eb" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#0f172a" }}>
            Payment Agent
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
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
                    "&:hover": { bgcolor: "#f1f5f9" },
                    ...(isActive && {
                      bgcolor: "#eff6ff",
                      color: "#2563eb",
                      "&:hover": { bgcolor: "#dbeafe" },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isActive ? "#2563eb" : "#64748b" }}>
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
            bgcolor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            color: "#0f172a",
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Select
              value="production"
              size="small"
              sx={{
                minWidth: 140,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
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
                  bgcolor: "#f8f9fa",
                  "& fieldset": { border: "none" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#64748b" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <IconButton>
              <Badge badgeContent={3} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>

            <Avatar sx={{ width: 32, height: 32, bgcolor: "#3b82f6", fontSize: 14 }}>SC</Avatar>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: "auto",
            bgcolor: "#f8f9fa",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Button,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CheckCircle, AlertTriangle, XCircle, Copy, Eye, EyeOff } from "lucide-react";
import { agents } from "../data/mockData";
import { statusColors } from "../themeTokens";

export function AgentMonitoring() {
  const theme = useTheme();
  const statuses = statusColors(theme);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle size={18} color={statuses.healthy.icon} />;
      case "warning": return <AlertTriangle size={18} color={statuses.warning.icon} />;
      case "error": return <XCircle size={18} color={statuses.error.icon} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return { bgcolor: statuses.healthy.bg, color: statuses.healthy.color };
      case "warning": return { bgcolor: statuses.warning.bg, color: statuses.warning.color };
      case "error": return { bgcolor: statuses.error.bg, color: statuses.error.color };
      default: return { bgcolor: statuses.neutral.bg, color: statuses.neutral.color };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Agent & SDK Monitoring</Typography>

      {/* Integration Health Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
              Total Agents
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>12</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
              Healthy Agents
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle size={20} color={statuses.healthy.icon} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>9</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
              Avg Decision Latency
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>152ms</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
              Webhook Success Rate
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: statuses.healthy.icon }}>99.4%</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Agents Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Registered Agents</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Agent Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Environment</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SDK Version</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Event</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Error Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Decision Latency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Webhook Success</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent) => {
                const statusStyle = getStatusColor(agent.status);
                return (
                  <TableRow key={agent.name} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 500 }}>{agent.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={agent.environment}
                        size="small"
                        sx={{
                          bgcolor: agent.environment === "production" ? statuses.info.bg : statuses.neutral.bg,
                          color: agent.environment === "production" ? statuses.info.color : statuses.neutral.color,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{agent.sdkVersion}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{agent.lastEventReceived}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{agent.errorRate}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{agent.decisionLatency}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{agent.webhookSuccessRate}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {getStatusIcon(agent.status)}
                        <Chip
                          label={agent.status}
                          size="small"
                          sx={statusStyle}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Recent Errors */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Recent SDK Errors</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Error Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: 13 }}>2026-05-30 13:45:22</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>checkout-service-staging</TableCell>
                    <TableCell>
                      <Chip label="Timeout" size="small" color="error" />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                      Decision endpoint timeout after 5000ms
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: 13 }}>2026-05-30 12:18:45</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>mobile-app-v3</TableCell>
                    <TableCell>
                      <Chip label="Validation" size="small" sx={{ bgcolor: statuses.warning.bg, color: statuses.warning.color }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                      Invalid currency code: XYZ
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: 13 }}>2026-05-30 11:32:11</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>web-checkout-v2</TableCell>
                    <TableCell>
                      <Chip label="Auth" size="small" color="error" />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                      Invalid API key format
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>API Key Management</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
              Create and manage API keys for agent authentication
            </Typography>

            <Button variant="contained" fullWidth sx={{ mb: 3 }}>
              Create New API Key
            </Button>

            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              Active Keys
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Production Key</Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small">
                      <Eye size={14} />
                    </IconButton>
                    <IconButton size="small">
                      <Copy size={14} />
                    </IconButton>
                  </Box>
                </Box>
                <TextField
                  size="small"
                  fullWidth
                  value="sk_prod_••••••••••••8472"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: "monospace", fontSize: 12 },
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                  Created: 2026-05-10
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Staging Key</Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small">
                      <Eye size={14} />
                    </IconButton>
                    <IconButton size="small">
                      <Copy size={14} />
                    </IconButton>
                  </Box>
                </Box>
                <TextField
                  size="small"
                  fullWidth
                  value="sk_test_••••••••••••2910"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: "monospace", fontSize: 12 },
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                  Created: 2026-04-28
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

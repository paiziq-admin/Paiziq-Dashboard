import { Box, Paper, Typography, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { mockPayments } from "../data/mockData";
import { appColors, statusColors } from "../themeTokens";

const metricCards = [
  { label: "Total Payment Attempts", value: "2,847", change: "+12.3%", trend: "up" },
  { label: "Approved", value: "2,234", change: "+8.5%", trend: "up" },
  { label: "Blocked", value: "156", change: "-15.2%", trend: "down" },
  { label: "Pending Human Review", value: "457", change: "+22.1%", trend: "up" },
  { label: "Total Payment Volume", value: "$8.2M", change: "+18.7%", trend: "up" },
  { label: "Average Risk Score", value: "28.4", change: "-3.2%", trend: "down" },
];

const volumeData = [
  { time: "00:00", volume: 120 },
  { time: "04:00", volume: 85 },
  { time: "08:00", volume: 245 },
  { time: "12:00", volume: 380 },
  { time: "16:00", volume: 420 },
  { time: "20:00", volume: 290 },
];

const riskDistributionData = [
  { range: "0-20", count: 1580 },
  { range: "21-40", count: 720 },
  { range: "41-60", count: 380 },
  { range: "61-80", count: 130 },
  { range: "81-100", count: 37 },
];

export function OverviewDashboard() {
  const theme = useTheme();
  const colors = appColors(theme);
  const statuses = statusColors(theme);
  const highRiskPayments = mockPayments.filter(p => p.riskScore >= 60).slice(0, 5);
  const decisionData = [
    { name: "Approved", value: 2234, color: statuses.approved.icon },
    { name: "Blocked", value: 156, color: statuses.blocked.icon },
    { name: "Review Required", value: 457, color: statuses.warning.icon },
  ];
  const tooltipStyle = {
    backgroundColor: colors.chartTooltipBg,
    borderColor: colors.chartTooltipBorder,
    color: theme.palette.text.primary,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Overview Dashboard</Typography>

      {/* Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metricCards.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={metric.label}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                {metric.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {metric.value}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {metric.trend === "up" ? (
                  <TrendingUp size={14} color={metric.label.includes("Blocked") || metric.label.includes("Review") ? statuses.error.icon : statuses.healthy.icon} />
                ) : (
                  <TrendingDown size={14} color={metric.label.includes("Risk") ? statuses.healthy.icon : statuses.error.icon} />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: metric.trend === "up" && !metric.label.includes("Blocked") ? statuses.healthy.icon : "text.secondary" }}
                >
                  {metric.change}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Payment Volume Over Time (24h)</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                <XAxis dataKey="time" stroke={colors.chartAxis} fontSize={12} />
                <YAxis stroke={colors.chartAxis} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                <Line type="monotone" dataKey="volume" stroke={theme.palette.primary.main} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Decision Distribution</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={decisionData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {decisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Risk Score Distribution</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                <XAxis dataKey="range" stroke={colors.chartAxis} fontSize={12} />
                <YAxis stroke={colors.chartAxis} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: theme.palette.text.primary }} />
                <Bar dataKey="count" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Recent High-Risk Payments</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Payment ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Risk Score</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Decision</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Signals</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highRiskPayments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{payment.id}</TableCell>
                      <TableCell>{payment.amount.toLocaleString()} {payment.currency}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.riskScore}
                          size="small"
                          sx={{
                            color: payment.riskScore >= 70 ? statuses.error.color : statuses.warning.color,
                            backgroundColor: payment.riskScore >= 70 ? statuses.error.bg : statuses.warning.bg,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.decision === 'blocked' ? 'Blocked' : 'Review Required'}
                          size="small"
                          sx={{
                            color: payment.decision === 'blocked' ? statuses.blocked.color : statuses.warning.color,
                            backgroundColor: payment.decision === 'blocked' ? statuses.blocked.bg : statuses.warning.bg,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                        {payment.triggeredSignals.slice(0, 2).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>System Health</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <CheckCircle size={18} color={statuses.healthy.icon} />
              <Typography variant="body2">SDK Ingestion: Healthy</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle size={18} color={statuses.healthy.icon} />
              <Typography variant="body2">Webhook Delivery: 99.7%</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Top Flagged Agents</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>checkout-service-prod</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>42 flagged transactions</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>mobile-app-v3</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>28 flagged transactions</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>web-checkout-v2</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>15 flagged transactions</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

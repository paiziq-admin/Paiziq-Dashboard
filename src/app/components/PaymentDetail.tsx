import { useParams } from "react-router";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Divider,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { mockPayments, riskSignals, timelineEvents } from "../data/mockData";
import { statusColors } from "../themeTokens";

export function PaymentDetail() {
  const theme = useTheme();
  const statuses = statusColors(theme);
  const { id } = useParams();
  const payment = mockPayments.find(p => p.id === id) || mockPayments[1];

  const getDecisionIcon = () => {
    switch (payment.decision) {
      case "approved": return <CheckCircle color={statuses.approved.icon} size={24} />;
      case "blocked": return <XCircle color={statuses.blocked.icon} size={24} />;
      case "review_required": return <AlertCircle color={statuses.warning.icon} size={24} />;
      default: return <Info color={statuses.info.icon} size={24} />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "approved": return { bgcolor: statuses.approved.bg, color: statuses.approved.color };
      case "blocked": return { bgcolor: statuses.blocked.bg, color: statuses.blocked.color };
      case "review_required": return { bgcolor: statuses.warning.bg, color: statuses.warning.color };
      default: return { bgcolor: statuses.info.bg, color: statuses.info.color };
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 40) return { bgcolor: statuses.approved.bg, color: statuses.approved.color };
    if (score < 70) return { bgcolor: statuses.warning.bg, color: statuses.warning.color };
    return { bgcolor: statuses.error.bg, color: statuses.error.color };
  };

  const agentTrace = {
    request: {
      user_id: payment.user,
      amount: payment.amount,
      currency: payment.currency,
      recipient: payment.recipient,
      timestamp: payment.timestamp,
    },
    context: {
      ip_address: "192.168.1.142",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)",
      device_fingerprint: "fp_8472abc",
      session_id: "sess_29347",
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              {getDecisionIcon()}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {payment.id}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Chip
                label={payment.decision.replace("_", " ").toUpperCase()}
                sx={{ ...getDecisionColor(payment.decision), fontWeight: 600 }}
              />
              <Chip
                label={`Risk Score: ${payment.riskScore}`}
                sx={{ ...getRiskScoreColor(payment.riskScore), fontWeight: 600 }}
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {new Date(payment.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {payment.amount.toLocaleString()} {payment.currency}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {payment.agent}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Timeline */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600 }}>Event Timeline</Typography>
            <Box sx={{ position: "relative", pl: 3 }}>
              {/* Timeline line */}
              <Box
                sx={{
                  position: "absolute",
                  left: 7,
                  top: 10,
                  bottom: 10,
                  width: 2,
                  bgcolor: "divider",
                }}
              />

              {timelineEvents.map((event, index) => (
                <Box key={index} sx={{ position: "relative", mb: 3, "&:last-child": { mb: 0 } }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: -20,
                      top: 4,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      border: (theme) => `2px solid ${theme.palette.background.paper}`,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                      {event.event}
                    </Typography>
                    {event.details && (
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                        {event.details}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontFamily: "monospace" }}>
                      {new Date(event.timestamp).toLocaleTimeString()}.{event.timestamp.split('.')[1]?.substring(0, 3)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Agent Trace */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Agent Trace</Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: "#0f172a",
                color: "#e2e8f0",
                p: 2,
                borderRadius: 1,
                fontSize: 13,
                fontFamily: "monospace",
                overflow: "auto",
              }}
            >
              {JSON.stringify(agentTrace, null, 2)}
            </Box>
          </Paper>

          {/* Webhook Delivery */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Webhook Delivery Logs</Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>Attempt 1</TableCell>
                  <TableCell>
                    <Chip label="Success" size="small" sx={{ bgcolor: statuses.approved.bg, color: statuses.approved.color }} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>200 OK</TableCell>
                  <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>145ms</TableCell>
                  <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                    {new Date(payment.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Risk Score Breakdown */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Risk Score Breakdown</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {riskSignals.map((signal) => (
                <Box key={signal.name} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>
                      {signal.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
                      {signal.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={signal.value > 0 ? `+${signal.value}` : signal.value}
                    size="small"
                    sx={{
                      bgcolor: signal.value > 0 ? statuses.error.bg : statuses.approved.bg,
                      color: signal.value > 0 ? statuses.error.color : statuses.approved.color,
                      fontWeight: 600,
                      minWidth: 50,
                    }}
                  />
                </Box>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Final Score</Typography>
                <Chip
                  label={payment.riskScore}
                  sx={{
                    ...getRiskScoreColor(payment.riskScore),
                    fontWeight: 700,
                    fontSize: 15,
                    minWidth: 50,
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Policy Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Policy Information</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Policy Version</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 500 }}>
                v2.3.1
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              Thresholds
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">0-39</Typography>
                <Chip label="Allow" size="small" sx={{ bgcolor: statuses.approved.bg, color: statuses.approved.color }} />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">40-69</Typography>
                <Chip label="Human Review" size="small" sx={{ bgcolor: statuses.warning.bg, color: statuses.warning.color }} />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">70+</Typography>
                <Chip label="Block" size="small" sx={{ bgcolor: statuses.blocked.bg, color: statuses.blocked.color }} />
              </Box>
            </Box>
          </Paper>

          {/* Review Actions */}
          {payment.decision === "review_required" && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Review Actions</Typography>
              <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
                This payment requires human review before processing.
              </Alert>
              <TextField
                label="Reviewer Notes"
                multiline
                rows={3}
                fullWidth
                placeholder="Enter your review notes..."
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button variant="contained" sx={{ bgcolor: statuses.approved.icon, "&:hover": { bgcolor: theme.palette.success.dark } }}>
                  Approve Payment
                </Button>
                <Button variant="contained" color="error">
                  Reject Payment
                </Button>
                <Button variant="outlined">Request More Info</Button>
                <Button variant="outlined">Escalate</Button>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

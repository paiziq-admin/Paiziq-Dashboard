import { useState } from "react";
import { Link } from "react-router";
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Drawer,
} from "@mui/material";
import { mockPayments } from "../data/mockData";

export function PaymentFeed() {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPayments = statusFilter === "all"
    ? mockPayments
    : mockPayments.filter(p => p.decision === statusFilter);

  const selectedPaymentData = mockPayments.find(p => p.id === selectedPayment);

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "approved": return { bg: "#dcfce7", color: "#166534" };
      case "blocked": return { bg: "#fee2e2", color: "#991b1b" };
      case "review_required": return { bg: "#fef3c7", color: "#92400e" };
      default: return { bg: "#e0e7ff", color: "#3730a3" };
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 40) return { bg: "#dcfce7", color: "#166534" };
    if (score < 70) return { bg: "#fef3c7", color: "#92400e" };
    return { bg: "#fee2e2", color: "#991b1b" };
  };

  return (
    <Box sx={{ p: 3, height: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Live Payment Feed</Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Date Range" size="small" fullWidth defaultValue="Last 24 hours" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Decision Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Decision Status">
                <MenuItem value="all">All Decisions</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
                <MenuItem value="review_required">Review Required</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Risk Score Range" size="small" fullWidth placeholder="0-100" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Amount Range" size="small" fullWidth placeholder="Min - Max" />
          </Grid>
        </Grid>
      </Paper>

      {/* Payment Table */}
      <Paper sx={{ height: "calc(100vh - 320px)" }}>
        <TableContainer sx={{ height: "100%" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Payment ID</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Agent</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Recipient</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Risk Score</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Decision</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Signals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => {
                const decisionStyle = getDecisionColor(payment.decision);
                const riskStyle = getRiskScoreColor(payment.riskScore);

                return (
                  <TableRow
                    key={payment.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      bgcolor: selectedPayment === payment.id ? "#f0f9ff" : "inherit",
                    }}
                    onClick={() => setSelectedPayment(payment.id)}
                  >
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                      <Link to={`/payments/${payment.id}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                        {payment.id}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {new Date(payment.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{payment.agent}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontFamily: "monospace" }}>{payment.user}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                      {payment.amount.toLocaleString()} {payment.currency}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontFamily: "monospace" }}>{payment.recipient}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.riskScore}
                        size="small"
                        sx={{ bgcolor: riskStyle.bg, color: riskStyle.color, fontWeight: 600, minWidth: 45 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.decision.replace("_", " ")}
                        size="small"
                        sx={{ bgcolor: decisionStyle.bg, color: decisionStyle.color }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "#64748b", maxWidth: 200 }}>
                      {payment.triggeredSignals.slice(0, 2).join(", ")}
                      {payment.triggeredSignals.length > 2 && ` +${payment.triggeredSignals.length - 2}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Quick Preview Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        variant="temporary"
        sx={{ "& .MuiDrawer-paper": { width: 400, p: 3 } }}
      >
        {selectedPaymentData && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Payment Preview</Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: "#64748b" }}>Payment ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 1.5 }}>{selectedPaymentData.id}</Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Amount</Typography>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {selectedPaymentData.amount.toLocaleString()} {selectedPaymentData.currency}
              </Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Risk Score</Typography>
              <Box sx={{ mb: 1.5 }}>
                <Chip
                  label={selectedPaymentData.riskScore}
                  sx={{
                    ...getRiskScoreColor(selectedPaymentData.riskScore),
                    fontWeight: 600,
                    fontSize: 16,
                    height: 32,
                  }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Decision</Typography>
              <Box sx={{ mb: 1.5 }}>
                <Chip
                  label={selectedPaymentData.decision.replace("_", " ")}
                  sx={getDecisionColor(selectedPaymentData.decision)}
                />
              </Box>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Triggered Signals</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                {selectedPaymentData.triggeredSignals.map((signal) => (
                  <Chip key={signal} label={signal} size="small" />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

import { useState } from "react";
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
  Button,
  Divider,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Clock, AlertTriangle } from "lucide-react";
import { mockPayments } from "../data/mockData";
import { appColors, statusColors } from "../themeTokens";

export function HumanReviewQueue() {
  const theme = useTheme();
  const colors = appColors(theme);
  const statuses = statusColors(theme);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  const reviewQueue = mockPayments.filter(p => p.decision === "review_required");
  const selectedPayment = reviewQueue.find(p => p.id === selectedReview) || reviewQueue[0];

  const getSLAColor = (hours: number) => {
    if (hours < 2) return statuses.healthy.icon;
    if (hours < 4) return statuses.warning.icon;
    return statuses.error.icon;
  };

  return (
    <Box sx={{ p: 3, display: "flex", gap: 3, height: "calc(100vh - 120px)" }}>
      {/* Queue Table */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Review Queue</Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>SLA</InputLabel>
                <Select defaultValue="all" label="SLA">
                  <MenuItem value="all">All SLAs</MenuItem>
                  <MenuItem value="urgent">Urgent (&lt; 1h)</MenuItem>
                  <MenuItem value="warning">Warning (1-4h)</MenuItem>
                  <MenuItem value="normal">Normal (&gt; 4h)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select defaultValue="all" label="Assignee">
                  <MenuItem value="all">All Assignees</MenuItem>
                  <MenuItem value="me">Assigned to Me</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField label="Risk Score" size="small" fullWidth placeholder="Min - Max" />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField label="Amount Range" size="small" fullWidth placeholder="Min - Max" />
            </Grid>
          </Grid>
        </Paper>

        {/* Queue Table */}
        <Paper sx={{ flex: 1, overflow: "hidden" }}>
          <TableContainer sx={{ height: "100%" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Risk Score</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Top Risk Reasons</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SLA Deadline</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assignee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviewQueue.map((payment, index) => {
                  const slaHours = index % 3 === 0 ? 0.5 : index % 2 === 0 ? 3 : 6;
                  const isSelected = selectedReview === payment.id;

                  return (
                    <TableRow
                      key={payment.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor: isSelected ? colors.surfaceSelected : "inherit",
                      }}
                      onClick={() => setSelectedReview(payment.id)}
                    >
                      <TableCell>
                        <AlertTriangle size={18} color={getSLAColor(slaHours)} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                        {payment.id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {payment.amount.toLocaleString()} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.riskScore}
                          size="small"
                          sx={{
                            color: payment.riskScore >= 60 ? statuses.error.color : statuses.warning.color,
                            backgroundColor: payment.riskScore >= 60 ? statuses.error.bg : statuses.warning.bg,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary", maxWidth: 200 }}>
                        {payment.triggeredSignals.slice(0, 2).join(", ")}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Clock size={14} color={getSLAColor(slaHours)} />
                          <Typography variant="caption" sx={{ color: getSLAColor(slaHours) }}>
                            {slaHours}h remaining
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {index % 2 === 0 ? "Sarah Chen" : "Unassigned"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Review Detail Panel */}
      <Paper sx={{ width: 450, p: 3, overflow: "auto" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Review Details</Typography>

        <Alert severity="warning" sx={{ mb: 3, fontSize: 13 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Clock size={16} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              SLA: 3h remaining
            </Typography>
          </Box>
        </Alert>

        {/* Payment Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Payment Summary</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Payment ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 13 }}>
                {selectedPayment.id}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Amount</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>User</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 13 }}>
                {selectedPayment.user}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Recipient</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 13 }}>
                {selectedPayment.recipient}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Risk Signals */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Top Risk Signals</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {selectedPayment.triggeredSignals.map((signal) => (
              <Box key={signal} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AlertTriangle size={14} color={statuses.warning.icon} />
                <Typography variant="body2" sx={{ fontSize: 13 }}>{signal}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* User History */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>User Payment History</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>47</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Total Payments</Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: statuses.healthy.icon }}>45</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Successful</Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: statuses.blocked.icon }}>2</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Blocked</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Recipient History */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Recipient History</Typography>
          <Alert severity="info" sx={{ fontSize: 12 }}>
            This is a new recipient for this user. No previous transaction history available.
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Reviewer Notes */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Reviewer Notes</Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Enter your review notes here. This field is required before final approval or rejection."
            required
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{ bgcolor: statuses.approved.icon, "&:hover": { bgcolor: theme.palette.success.dark } }}
          >
            Approve Payment
          </Button>
          <Button variant="contained" color="error" fullWidth>
            Reject Payment
          </Button>
          <Button variant="outlined" fullWidth>
            Escalate to Senior Reviewer
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

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
  Drawer,
  Divider,
} from "@mui/material";
import { auditLogEntries } from "../data/mockData";

export function AuditLog() {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const selectedAuditEntry = auditLogEntries.find((_, i) => i.toString() === selectedEntry) || auditLogEntries[0];

  const getActionColor = (action: string) => {
    if (action.includes("Approved")) return { bg: "#dcfce7", color: "#166534" };
    if (action.includes("Rejected") || action.includes("Blocked")) return { bg: "#fee2e2", color: "#991b1b" };
    if (action.includes("Updated") || action.includes("Created")) return { bg: "#e0e7ff", color: "#3730a3" };
    return { bg: "#f3f4f6", color: "#374151" };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Audit Log</Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Date Range" size="small" fullWidth defaultValue="Last 7 days" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select defaultValue="all" label="Event Type">
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="payment">Payment Actions</MenuItem>
                <MenuItem value="policy">Policy Changes</MenuItem>
                <MenuItem value="api">API Key Events</MenuItem>
                <MenuItem value="user">User Management</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Actor" size="small" fullWidth placeholder="Email or user ID" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Entity ID" size="small" fullWidth placeholder="Payment ID, Agent ID, etc." />
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Log Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: "calc(100vh - 340px)" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Actor</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Change</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "#f8f9fa" }}>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogEntries.map((entry, index) => {
                const actionStyle = getActionColor(entry.action);
                return (
                  <TableRow
                    key={index}
                    hover
                    sx={{
                      cursor: "pointer",
                      bgcolor: selectedEntry === index.toString() ? "#f0f9ff" : "inherit",
                    }}
                    onClick={() => setSelectedEntry(index.toString())}
                  >
                    <TableCell sx={{ fontSize: 13, fontFamily: "monospace" }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{entry.actor}</TableCell>
                    <TableCell>
                      <Chip label={entry.action} size="small" sx={actionStyle} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{entry.entity}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {entry.previousValue && entry.newValue && (
                        <Box>
                          <Typography variant="caption" sx={{ color: "#ef4444" }}>
                            {entry.previousValue}
                          </Typography>
                          <Typography variant="caption" sx={{ mx: 0.5 }}>→</Typography>
                          <Typography variant="caption" sx={{ color: "#10b981" }}>
                            {entry.newValue}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
                      {entry.ipAddress}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "#64748b", maxWidth: 250 }}>
                      {entry.reason || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        variant="temporary"
        sx={{ "& .MuiDrawer-paper": { width: 450, p: 3 } }}
      >
        {selectedAuditEntry && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Audit Event Details</Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "#64748b" }}>Timestamp</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 2 }}>
                {new Date(selectedAuditEntry.timestamp).toLocaleString()}
              </Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Actor</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{selectedAuditEntry.actor}</Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Action</Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={selectedAuditEntry.action}
                  sx={getActionColor(selectedAuditEntry.action)}
                />
              </Box>

              <Typography variant="caption" sx={{ color: "#64748b" }}>Entity</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 2 }}>
                {selectedAuditEntry.entity}
              </Typography>

              <Typography variant="caption" sx={{ color: "#64748b" }}>IP Address</Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 2 }}>
                {selectedAuditEntry.ipAddress}
              </Typography>
            </Box>

            {selectedAuditEntry.previousValue && selectedAuditEntry.newValue && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Previous Value</Typography>
                  <Paper sx={{ p: 1.5, bgcolor: "#fef2f2", mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 13, color: "#991b1b" }}>
                      {selectedAuditEntry.previousValue}
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>New Value</Typography>
                  <Paper sx={{ p: 1.5, bgcolor: "#f0fdf4", mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 13, color: "#166534" }}>
                      {selectedAuditEntry.newValue}
                    </Typography>
                  </Paper>
                </Box>
              </>
            )}

            {selectedAuditEntry.reason && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Reason</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedAuditEntry.reason}
                  </Typography>
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                Full Event Metadata
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: "#0f172a",
                  color: "#e2e8f0",
                  p: 2,
                  borderRadius: 1,
                  fontSize: 12,
                  fontFamily: "monospace",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(selectedAuditEntry, null, 2)}
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

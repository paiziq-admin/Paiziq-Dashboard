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
  Switch,
  TextField,
  Button,
  Grid,
  Slider,
  Chip,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { Save, PlayCircle, Upload } from "lucide-react";
import { riskRules } from "../data/mockData";

export function RiskPolicies() {
  const [activeTab, setActiveTab] = useState(0);
  const [allowThreshold, setAllowThreshold] = useState(39);
  const [reviewThreshold, setReviewThreshold] = useState(69);

  const [simulateAmount, setSimulateAmount] = useState(500);
  const [simulateScore, setSimulateScore] = useState(45);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Risk Policy & Threshold Management</Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Policy Configuration" />
        <Tab label="Rule Weights" />
        <Tab label="Allow/Block Lists" />
        <Tab label="Policy Simulator" />
      </Tabs>

      {/* Policy Configuration Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Active Policy</Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Policy Version</Typography>
                  <Typography variant="h6" sx={{ fontFamily: "monospace" }}>v2.3.1</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Status</Typography>
                  <Box>
                    <Chip label="Active" size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", mt: 0.5 }} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Last Updated</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>2026-05-20 14:32 UTC</Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Changes to thresholds will take effect immediately after publishing.
              </Alert>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Decision Thresholds</Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Allow Threshold (0 - {allowThreshold})</Typography>
                    <Chip
                      label={`0-${allowThreshold}`}
                      size="small"
                      sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 600 }}
                    />
                  </Box>
                  <Slider
                    value={allowThreshold}
                    onChange={(_, v) => setAllowThreshold(v as number)}
                    min={0}
                    max={100}
                    sx={{ color: "#10b981" }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">
                      Human Review Threshold ({allowThreshold + 1} - {reviewThreshold})
                    </Typography>
                    <Chip
                      label={`${allowThreshold + 1}-${reviewThreshold}`}
                      size="small"
                      sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }}
                    />
                  </Box>
                  <Slider
                    value={reviewThreshold}
                    onChange={(_, v) => setReviewThreshold(v as number)}
                    min={0}
                    max={100}
                    sx={{ color: "#f59e0b" }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Block Threshold ({reviewThreshold + 1}+)</Typography>
                    <Chip
                      label={`${reviewThreshold + 1}+`}
                      size="small"
                      sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 600 }}
                    />
                  </Box>
                  <Slider value={reviewThreshold} min={0} max={100} disabled sx={{ color: "#ef4444" }} />
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Policy Versions</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontFamily: "monospace" }}>v2.3.1</TableCell>
                    <TableCell>
                      <Chip label="Active" size="small" sx={{ bgcolor: "#dcfce7", color: "#166534" }} />
                    </TableCell>
                    <TableCell>2026-05-20 14:32</TableCell>
                    <TableCell>admin@company.com</TableCell>
                    <TableCell>
                      <Button size="small">View</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontFamily: "monospace" }}>v2.3.0</TableCell>
                    <TableCell>
                      <Chip label="Inactive" size="small" />
                    </TableCell>
                    <TableCell>2026-05-15 09:12</TableCell>
                    <TableCell>admin@company.com</TableCell>
                    <TableCell>
                      <Button size="small">Rollback</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontFamily: "monospace" }}>v2.2.8</TableCell>
                    <TableCell>
                      <Chip label="Inactive" size="small" />
                    </TableCell>
                    <TableCell>2026-05-10 16:45</TableCell>
                    <TableCell>sarah.chen@company.com</TableCell>
                    <TableCell>
                      <Button size="small">Rollback</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Actions</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button variant="outlined" startIcon={<Save />} fullWidth>
                  Save Draft
                </Button>
                <Button variant="outlined" startIcon={<PlayCircle />} fullWidth>
                  Test Policy
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  fullWidth
                  sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}
                >
                  Publish Policy
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Impact Preview</Typography>
              <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
                Based on last 24 hours of data
              </Alert>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Payments Affected</Typography>
                  <Typography variant="h6">+142 to review queue</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>Estimated Review Load</Typography>
                  <Typography variant="h6">+15% workload</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Rule Weights Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Rule Weight Configuration</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Rule Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Enabled</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskRules.map((rule) => (
                  <TableRow key={rule.name} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{rule.name}</TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>{rule.description}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        defaultValue={rule.weight}
                        sx={{ width: 80 }}
                        inputProps={{ style: { textAlign: "center" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch defaultChecked={rule.enabled} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: "#64748b" }}>{rule.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Allow/Block Lists Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Allow List</Typography>
              <Alert severity="success" sx={{ mb: 2, fontSize: 13 }}>
                Entities on this list automatically bypass risk checks
              </Alert>
              <TextField
                fullWidth
                placeholder="Enter user ID, merchant ID, or IP address"
                size="small"
                sx={{ mb: 2 }}
              />
              <Button variant="outlined" fullWidth>Add to Allow List</Button>
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                  Current Entries (3)
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Chip label="merchant_5501" onDelete={() => {}} />
                  <Chip label="user_9201" onDelete={() => {}} />
                  <Chip label="192.168.1.100" onDelete={() => {}} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Block List</Typography>
              <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
                Entities on this list are automatically blocked
              </Alert>
              <TextField
                fullWidth
                placeholder="Enter user ID, merchant ID, or IP address"
                size="small"
                sx={{ mb: 2 }}
              />
              <Button variant="outlined" color="error" fullWidth>Add to Block List</Button>
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                  Current Entries (2)
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Chip label="merchant_9982" color="error" onDelete={() => {}} />
                  <Chip label="45.123.45.67" color="error" onDelete={() => {}} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Policy Simulator Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Policy Simulator</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Test how a payment would be evaluated under the current policy configuration.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField label="Payment Amount" type="number" fullWidth value={simulateAmount} onChange={(e) => setSimulateAmount(Number(e.target.value))} />
                <TextField label="Currency" fullWidth defaultValue="USD" />
                <TextField label="Recipient Age (days)" type="number" fullWidth defaultValue="0" />
                <TextField label="User Payment History" type="number" fullWidth defaultValue="5" />
                <TextField label="Region" fullWidth defaultValue="US" />
                <TextField label="Device Fingerprint Status" fullWidth defaultValue="New device" />
                <Button variant="contained" size="large" sx={{ mt: 2 }}>
                  Simulate Decision
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, bgcolor: "#f8f9fa" }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Simulated Result</Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                    Predicted Risk Score
                  </Typography>
                  <Chip
                    label={simulateScore}
                    sx={{
                      bgcolor: simulateScore >= 70 ? "#fee2e2" : simulateScore >= 40 ? "#fef3c7" : "#dcfce7",
                      color: simulateScore >= 70 ? "#991b1b" : simulateScore >= 40 ? "#92400e" : "#166534",
                      fontSize: 24,
                      fontWeight: 700,
                      height: 48,
                      px: 2,
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                    Predicted Decision
                  </Typography>
                  <Chip
                    label="Review Required"
                    sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                    Contributing Factors
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">High amount</Typography>
                      <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 600 }}>+20</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">New recipient</Typography>
                      <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 600 }}>+15</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">New device</Typography>
                      <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 600 }}>+12</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">User history</Typography>
                      <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 600 }}>-2</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

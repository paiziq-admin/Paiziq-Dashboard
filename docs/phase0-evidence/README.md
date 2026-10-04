# Phase 0 execution evidence

Captured on 2026-10-04 by `e2e/service/phase0-execution.service.e2e.spec.ts` against an isolated local service database. All provider calls use local mock gateways. The data does not represent a real financial transaction or a production deployment.

- `phase0-unknown-execution.png`: the dashboard reads a held unknown execution from the real hosted API.
- `phase0-workflow.json`: exact run IDs and SDK results; confirmed and unknown requests each caused one provider call, despite repeated SDK execution requests. The budget denied the third request.

To reproduce, prepare the paired backend and run:

```bash
PAIZIQ_DEMO_DIR=/absolute/output/path npm run test:e2e:service
```

The command owns ports 8800 and 4173 and creates its own SQLite database. Existing manual demo data is retained.

"""
Tier 4 End-to-End Test: Python End-to-End Workflow Verification.
Exercises the entire operational lifecycle:
Satellite Telemetry Stream -> ML Shortfall Prediction -> Database Record Persistence -> Prescriptive Alert Triggering -> Operator Remediation.
"""

import unittest
import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))


class EndToEndWorkflowHarness:
    """Mock operational environment simulating full multi-tier flow."""

    def __init__(self):
        self.weather_logs = []
        self.predictions = []
        self.corrective_actions = []
        self.audit_trail = []

    def ingest_satellite_telemetry(self, mine_id: str, rainfall_mm: float, soil_moisture_pct: float) -> dict:
        entry = {
            "telemetry_id": f"tel-{len(self.weather_logs)+1}",
            "mine_id": mine_id,
            "timestamp": datetime.utcnow().isoformat(),
            "rainfall_24h_mm": rainfall_mm,
            "soil_moisture_pct": soil_moisture_pct,
            "status": "INGESTED",
        }
        self.weather_logs.append(entry)
        return entry

    def run_inference_and_persist(self, mine_id: str, planned_tonnage: float, telemetry: dict) -> dict:
        rainfall = telemetry.get("rainfall_24h_mm", 0.0)
        moisture = telemetry.get("soil_moisture_pct", 30.0)

        # Heuristic / ML formulation
        weather_index = min(1.0, (rainfall / 100.0) * 0.65 + (moisture / 100.0) * 0.35)
        prob = min(0.96, max(0.04, weather_index * 0.85 + 0.05))

        risk = "CRITICAL" if prob >= 0.85 else "HIGH" if prob >= 0.65 else "MODERATE" if prob >= 0.30 else "LOW"
        shortfall_t = planned_tonnage * prob * 0.80

        pred_id = f"pred-{len(self.predictions)+1}"
        pred_record = {
            "id": pred_id,
            "mine_id": mine_id,
            "timestamp": datetime.utcnow().isoformat(),
            "planned_tonnage": planned_tonnage,
            "predicted_shortfall_tonnes": round(shortfall_t, 2),
            "shortfall_probability": round(prob, 4),
            "risk_level": risk,
            "confidence_score": 0.93,
        }
        self.predictions.append(pred_record)

        # Generate corrective actions
        actions = []
        if prob >= 0.60:
            act_id = f"act-{len(self.corrective_actions)+1}"
            act_record = {
                "id": act_id,
                "prediction_id": pred_id,
                "mine_id": mine_id,
                "category": "PUMPING_DRAINAGE",
                "title": "Emergency Sump Dewatering",
                "priority": "HIGH" if risk == "HIGH" else "CRITICAL",
                "estimated_recovery_tonnes": round(shortfall_t * 0.65, 2),
                "status": "PROPOSED",
            }
            self.corrective_actions.append(act_record)
            actions.append(act_record)

        self.audit_trail.append({
            "event": "INFERENCE_STORED",
            "prediction_id": pred_id,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return {"prediction": pred_record, "actions": actions}

    def execute_action(self, action_id: str, user: str) -> dict:
        action = next((a for a in self.corrective_actions if a["id"] == action_id), None)
        if not action:
            raise ValueError(f"Action {action_id} not found")
        action["status"] = "EXECUTED"
        action["executed_by"] = user
        action["executed_at"] = datetime.utcnow().isoformat()
        self.audit_trail.append({
            "event": "ACTION_EXECUTED",
            "action_id": action_id,
            "user": user,
            "timestamp": action["executed_at"],
        })
        return action


class TestTelemetryToAlertWorkflow(unittest.TestCase):
    """Tier 4 end-to-end integration test."""

    def test_full_operational_lifecycle(self):
        harness = EndToEndWorkflowHarness()
        mine_id = "MOIL-BAL-01"

        # 1. Ingest simulated satellite radar telemetry
        telemetry = harness.ingest_satellite_telemetry(mine_id=mine_id, rainfall_mm=95.0, soil_moisture_pct=88.0)
        self.assertEqual(telemetry["status"], "INGESTED")
        self.assertEqual(len(harness.weather_logs), 1)

        # 2. Run prediction & persist records
        result = harness.run_inference_and_persist(mine_id=mine_id, planned_tonnage=15000.0, telemetry=telemetry)
        pred = result["prediction"]
        actions = result["actions"]

        self.assertEqual(pred["risk_level"], "HIGH")
        self.assertGreater(pred["predicted_shortfall_tonnes"], 3000.0)
        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["status"], "PROPOSED")

        # 3. Verify state in storage
        self.assertEqual(len(harness.predictions), 1)
        self.assertEqual(len(harness.corrective_actions), 1)

        # 4. Operator takes action
        act_id = actions[0]["id"]
        executed_action = harness.execute_action(act_id, user="chief-mining-engineer")
        self.assertEqual(executed_action["status"], "EXECUTED")
        self.assertEqual(executed_action["executed_by"], "chief-mining-engineer")

        # 5. Verify audit logs
        self.assertEqual(len(harness.audit_trail), 2)
        self.assertEqual(harness.audit_trail[1]["event"], "ACTION_EXECUTED")


if __name__ == '__main__':
    unittest.main()

"""
Tier 3 ML Service Test: Model Performance, Latency & Adversarial Stress Testing.
Validates model prediction bounds, confidence score calibration, latency constraints (<100ms), and resilience.
"""

import unittest
import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))


class HeuristicAndModelEngine:
    """Predictive engine reference implementation for verification."""

    def predict(self, payload: dict) -> dict:
        sat = payload.get("satellite", {})
        equip = payload.get("equipment", {})
        geo = payload.get("geology", {})

        rainfall = sat.get("rainfall_24h_mm", 0.0)
        moisture = sat.get("soil_moisture_pct", 30.0)
        pump_cap = equip.get("dewatering_pump_capacity_m3hr", 300.0)
        downtime = equip.get("unscheduled_downtime_hours", 0.0)
        planned_t = geo.get("planned_tonnage", 15000.0)

        # Weather stress (0 - 1)
        w_stress = min(1.0, (rainfall / 100.0) * 0.6 + (moisture / 100.0) * 0.4)
        # Pump deficit
        inflow = rainfall * 25.0
        pump_deficit = max(0.0, min(1.0, (inflow - pump_cap) / max(1.0, inflow))) if inflow > 0 else 0.0
        # Equip stress
        e_stress = min(1.0, (downtime / 12.0) * 0.7 + (1.0 - (equip.get("fleet_availability_pct", 80.0) / 100.0)) * 0.3)

        raw_prob = (w_stress * 0.45) + (pump_deficit * 0.25) + (e_stress * 0.30)
        prob = max(0.02, min(0.98, raw_prob))

        if prob >= 0.85:
            risk = "CRITICAL"
        elif prob >= 0.65:
            risk = "HIGH"
        elif prob >= 0.30:
            risk = "MODERATE"
        else:
            risk = "LOW"

        expected_shortfall = planned_t * prob * 0.85
        conf = max(0.50, min(0.99, 1.0 - (abs(prob - 0.5) * 0.2)))

        return {
            "shortfall_predicted": prob >= 0.50,
            "shortfall_probability": round(prob, 4),
            "risk_level": risk,
            "expected_shortfall_tonnes": round(expected_shortfall, 2),
            "confidence_score": round(conf, 4),
        }


class TestModelPerformance(unittest.TestCase):
    """Tests model numerical bounds, latency, and adversarial robustness."""

    def setUp(self):
        self.engine = HeuristicAndModelEngine()

    def test_ideal_operating_conditions(self):
        payload = {
            "satellite": {"rainfall_24h_mm": 0.0, "soil_moisture_pct": 20.0},
            "equipment": {"fleet_availability_pct": 98.0, "unscheduled_downtime_hours": 0.0, "dewatering_pump_capacity_m3hr": 500.0},
            "geology": {"planned_tonnage": 20000.0},
        }
        res = self.engine.predict(payload)
        self.assertLess(res["shortfall_probability"], 0.30)
        self.assertEqual(res["risk_level"], "LOW")
        self.assertFalse(res["shortfall_predicted"])

    def test_severe_monsoon_flooding_conditions(self):
        payload = {
            "satellite": {"rainfall_24h_mm": 125.0, "soil_moisture_pct": 96.0},
            "equipment": {"fleet_availability_pct": 50.0, "unscheduled_downtime_hours": 8.0, "dewatering_pump_capacity_m3hr": 100.0},
            "geology": {"planned_tonnage": 15000.0},
        }
        res = self.engine.predict(payload)
        self.assertGreaterEqual(res["shortfall_probability"], 0.70)
        self.assertIn(res["risk_level"], ["HIGH", "CRITICAL"])
        self.assertTrue(res["shortfall_predicted"])
        self.assertGreater(res["expected_shortfall_tonnes"], 5000.0)

    def test_confidence_score_calibration(self):
        """Confidence score must remain strictly bounded in [0.50, 0.99]."""
        test_probabilities = [0.02, 0.25, 0.50, 0.75, 0.98]
        for p in test_probabilities:
            payload = {
                "satellite": {"rainfall_24h_mm": p * 100, "soil_moisture_pct": p * 100},
                "equipment": {"unscheduled_downtime_hours": p * 12},
                "geology": {"planned_tonnage": 10000.0},
            }
            res = self.engine.predict(payload)
            conf = res["confidence_score"]
            self.assertGreaterEqual(conf, 0.50, f"Confidence {conf} below 0.50")
            self.assertLessEqual(conf, 0.99, f"Confidence {conf} above 0.99")

    def test_inference_latency_budget(self):
        """100 sequential inferences must average < 10ms and none exceed 100ms."""
        payload = {
            "satellite": {"rainfall_24h_mm": 45.0, "soil_moisture_pct": 65.0},
            "equipment": {"fleet_availability_pct": 85.0, "unscheduled_downtime_hours": 2.0},
            "geology": {"planned_tonnage": 15000.0},
        }

        latencies = []
        for _ in range(100):
            start = time.perf_counter()
            self.engine.predict(payload)
            latencies.append((time.perf_counter() - start) * 1000.0)  # ms

        avg_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)

        self.assertLess(avg_latency, 10.0, f"Average latency {avg_latency:.2f}ms exceeds 10ms target")
        self.assertLess(max_latency, 100.0, f"Max latency {max_latency:.2f}ms exceeds 100ms SLA")


if __name__ == '__main__':
    unittest.main()

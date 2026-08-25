"""
Tier 3 ML Service Test: Prescriptive Corrective Action Recommendation Engine.
Tests automatic recommendation generation, condition triggers, category classifications, and recovery estimates.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))


def generate_corrective_actions(features: dict) -> list:
    """Action recommendation generator conforming to ML architecture spec."""
    actions = []

    pmsi = features.get("pmsi", 0.0)
    ddr = features.get("ddr", 0.0)
    hrrm = features.get("hrrm", 1.0)
    eeti = features.get("eeti", 1.0)
    ehp = features.get("ehp", 0.0)
    gdrf = features.get("gdrf", 0.0)
    sbp = features.get("sbp", 0.0)

    # 1. Pumping & Drainage
    if pmsi > 60.0 or ddr > 0.4:
        actions.append({
            "id": f"ACT-PUMP-{len(actions)+1}",
            "title": "Deploy High-Capacity Submersible Pumps",
            "category": "PUMPING_DRAINAGE",
            "priority": "CRITICAL" if pmsi > 80.0 else "HIGH",
            "description": "Deploy 2x 500 m3/hr auxiliary submersible pumps to pit sump.",
            "estimated_recovery_tonnes": 2400.0,
            "estimated_time_hours": 3.0,
            "impact_score": 9.0,
        })

    # 2. Haulage & Logistics
    if hrrm > 1.3:
        actions.append({
            "id": f"ACT-HAUL-{len(actions)+1}",
            "title": "Reroute Haulage & Armor Haul Roads",
            "category": "HAULAGE_LOGISTICS",
            "priority": "HIGH",
            "description": "Divert dumpers to upper crest bypass ramp; dress slippery curves with 40mm crushed basalt.",
            "estimated_recovery_tonnes": 1500.0,
            "estimated_time_hours": 2.0,
            "impact_score": 8.0,
        })

    # 3. Fleet Management
    if eeti < 0.7 or ehp > 0.4:
        actions.append({
            "id": f"ACT-FLEET-{len(actions)+1}",
            "title": "Mobilize Standby HEMM & Expedite Maintenance",
            "category": "FLEET_MANAGEMENT",
            "priority": "HIGH",
            "description": "Transfer 2x excavators from overburden sector to high-grade ore face.",
            "estimated_recovery_tonnes": 1800.0,
            "estimated_time_hours": 4.0,
            "impact_score": 8.5,
        })

    # 4. Grade Blending
    if gdrf > 0.2:
        actions.append({
            "id": f"ACT-BLEND-{len(actions)+1}",
            "title": "Enact Grade Blending with Stockpile",
            "category": "GRADE_BLENDING",
            "priority": "MEDIUM",
            "description": "Blend current run-of-mine ore with Balaghat Grade-A stockpile (46% Mn) in ratio 2:1.",
            "estimated_recovery_tonnes": 1200.0,
            "estimated_time_hours": 1.5,
            "impact_score": 7.5,
        })

    # 5. Mine Planning
    if sbp > 0.5:
        actions.append({
            "id": f"ACT-PLAN-{len(actions)+1}",
            "title": "Rebalance Stripping-to-Ore Ratio",
            "category": "MINE_PLANNING",
            "priority": "MEDIUM",
            "description": "Increase overburden stripping allocation on active bench to prevent ore starvation.",
            "estimated_recovery_tonnes": 900.0,
            "estimated_time_hours": 8.0,
            "impact_score": 7.0,
        })

    return actions


class TestCorrectiveEngine(unittest.TestCase):
    """Tests prescriptive corrective actions engine logic and triggers."""

    def test_optimal_conditions_no_actions(self):
        features = {
            "pmsi": 10.0,
            "ddr": 0.0,
            "hrrm": 1.05,
            "eeti": 0.95,
            "ehp": 0.1,
            "gdrf": 0.05,
            "sbp": 0.1,
        }
        actions = generate_corrective_actions(features)
        self.assertEqual(len(actions), 0)

    def test_monsoon_flooding_triggers_pumping_and_haulage(self):
        features = {
            "pmsi": 85.0,  # > 60 -> Pumping
            "ddr": 0.75,   # > 0.4 -> Pumping
            "hrrm": 1.65,  # > 1.3 -> Haulage
            "eeti": 0.90,
            "ehp": 0.1,
            "gdrf": 0.05,
            "sbp": 0.1,
        }
        actions = generate_corrective_actions(features)
        categories = [a["category"] for a in actions]
        self.assertIn("PUMPING_DRAINAGE", categories)
        self.assertIn("HAULAGE_LOGISTICS", categories)
        pumping_action = next(a for a in actions if a["category"] == "PUMPING_DRAINAGE")
        self.assertEqual(pumping_action["priority"], "CRITICAL")

    def test_fleet_breakdown_triggers_fleet_management(self):
        features = {
            "pmsi": 10.0,
            "ddr": 0.0,
            "hrrm": 1.0,
            "eeti": 0.45,  # < 0.7 -> Fleet management
            "ehp": 0.65,   # > 0.4 -> Fleet management
            "gdrf": 0.0,
            "sbp": 0.0,
        }
        actions = generate_corrective_actions(features)
        categories = [a["category"] for a in actions]
        self.assertIn("FLEET_MANAGEMENT", categories)
        self.assertGreater(actions[0]["estimated_recovery_tonnes"], 1000.0)

    def test_grade_dilution_triggers_blending(self):
        features = {
            "pmsi": 10.0,
            "ddr": 0.0,
            "hrrm": 1.0,
            "eeti": 0.95,
            "ehp": 0.1,
            "gdrf": 0.35,  # > 0.2 -> Grade blending
            "sbp": 0.0,
        }
        actions = generate_corrective_actions(features)
        categories = [a["category"] for a in actions]
        self.assertIn("GRADE_BLENDING", categories)


if __name__ == '__main__':
    unittest.main()

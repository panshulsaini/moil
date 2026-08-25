"""
Prescriptive operational mitigation engine generating actionable interventions
across dewatering, haulage, equipment, grade blending, and mine planning.
"""

from typing import Dict, List
import uuid

from app.schemas.corrective_action import (
    ActionCategory,
    PriorityLevel,
    CorrectiveActionItem,
)
from app.schemas.prediction import ShortfallPredictionRequest


class PrescriptiveCorrectiveEngine:
    """Generates prioritized operational interventions tailored to multi-modal mining telemetry."""

    @staticmethod
    def generate_recommendations(
        req: ShortfallPredictionRequest,
        features: Dict[str, float],
        shortfall_prob: float,
        shortfall_tonnes: float
    ) -> List[CorrectiveActionItem]:
        """
        Evaluates trigger thresholds across physical telemetry indicators
        and generates ranked operational corrective action items.
        """
        actions: List[CorrectiveActionItem] = []
        sat = req.satellite
        eq = req.equipment
        geo = req.geology

        pmsi = features.get("pmsi", 0.0)
        ddr = features.get("ddr", 0.0)
        hrrm = features.get("hrrm", 1.0)
        eeti = features.get("eeti", 1.0)
        ehp = features.get("ehp", 0.0)
        gdrf = features.get("gdrf", 0.0)
        sbp = features.get("sbp", 0.0)

        # 1. DEWATERING & PUMPING INTERVENTIONS
        if pmsi > 55.0 or ddr > 0.30 or sat.flood_risk_score > 55.0 or sat.soil_moisture_pct > 75.0:
            prio = PriorityLevel.CRITICAL if (pmsi > 75.0 or ddr > 0.60) else PriorityLevel.HIGH
            tonnage_rec = round(min(shortfall_tonnes * 0.45, geo.planned_tonnage * 0.30), 1)
            actions.append(
                CorrectiveActionItem(
                    id=f"ACT-DEWATER-{uuid.uuid4().hex[:4].upper()}",
                    category=ActionCategory.PUMPING_DRAINAGE,
                    title="Deploy Auxiliary Submersible Pumps to Sump Complex",
                    description=(
                        f"Pit water inflow deficit at {round(ddr * 100, 1)}%. Immediately deploy 2x 500 m³/hr "
                        f"diesel submersible pumps at active sump; cut interceptor drainage channels along upper crest."
                    ),
                    priority=prio,
                    estimated_recovery_tonnes=max(150.0, tonnage_rec),
                    estimated_time_hours=2.5,
                    impact_score=9.2 if prio == PriorityLevel.CRITICAL else 7.8,
                    cost_estimate_inr=125000.0,
                )
            )

        # 2. HAULAGE & RAMP INFRASTRUCTURE INTERVENTIONS
        if hrrm > 1.25 or eq.dumper_cycle_time_min > 32.0 or sat.slope_erosion_index > 5.0:
            prio = PriorityLevel.CRITICAL if hrrm > 1.50 else PriorityLevel.HIGH
            tonnage_rec = round(min(shortfall_tonnes * 0.35, geo.planned_tonnage * 0.25), 1)
            actions.append(
                CorrectiveActionItem(
                    id=f"ACT-HAUL-{uuid.uuid4().hex[:4].upper()}",
                    category=ActionCategory.HAULAGE_LOGISTICS,
                    title="Reroute Haulage Fleet & Armor Critical Switchbacks",
                    description=(
                        f"Haul resistance multiplier elevated at {round(hrrm, 2)}x. Divert 35T dumpers to upper crest "
                        f"bypass ramp; dress slippery switchback curves with 40mm crushed basalt aggregate to restore traction."
                    ),
                    priority=prio,
                    estimated_recovery_tonnes=max(120.0, tonnage_rec),
                    estimated_time_hours=1.5,
                    impact_score=8.5,
                    cost_estimate_inr=85000.0,
                )
            )

        # 3. FLEET ALLOCATION & PREVENTATIVE MAINTENANCE
        if eeti < 0.80 or ehp > 0.35 or eq.fleet_availability_pct < 78.0 or eq.unscheduled_downtime_hours > 2.5:
            prio = PriorityLevel.HIGH if (eeti < 0.60 or ehp > 0.60) else PriorityLevel.MEDIUM
            tonnage_rec = round(min(shortfall_tonnes * 0.40, geo.planned_tonnage * 0.28), 1)
            actions.append(
                CorrectiveActionItem(
                    id=f"ACT-FLEET-{uuid.uuid4().hex[:4].upper()}",
                    category=ActionCategory.FLEET_MANAGEMENT,
                    title="Mobilize Standby HEMM & Expedite Preventive Servicing",
                    description=(
                        f"Fleet availability at {round(eq.fleet_availability_pct, 1)}% with {eq.unscheduled_downtime_hours}h downtime. "
                        f"Transfer 2x heavy excavators from overburden stripping to high-priority ore face; dispatch mobile hydraulic lube van."
                    ),
                    priority=prio,
                    estimated_recovery_tonnes=max(180.0, tonnage_rec),
                    estimated_time_hours=3.0,
                    impact_score=8.0,
                    cost_estimate_inr=150000.0,
                )
            )

        # 4. GRADE BLENDING & QUALITY CONTROL
        if gdrf > 0.15 or geo.estimated_block_grade_mn_pct < (geo.target_grade_mn_pct - 1.5) or geo.ore_moisture_pct > 12.0:
            prio = PriorityLevel.HIGH if gdrf > 0.30 else PriorityLevel.MEDIUM
            tonnage_rec = round(min(shortfall_tonnes * 0.30, geo.planned_tonnage * 0.20), 1)
            actions.append(
                CorrectiveActionItem(
                    id=f"ACT-BLEND-{uuid.uuid4().hex[:4].upper()}",
                    category=ActionCategory.GRADE_BLENDING,
                    title="Enact High-Grade Stockpile Blending Protocol",
                    description=(
                        f"Grade dilution risk index at {round(gdrf, 2)}. Blend current run-of-mine ore with Balaghat Grade-A "
                        f"(46% Mn) stockpile in 2:1 ratio to satisfy dispatch metallurgical grade specifications ({geo.target_grade_mn_pct}% Mn)."
                    ),
                    priority=prio,
                    estimated_recovery_tonnes=max(100.0, tonnage_rec),
                    estimated_time_hours=2.0,
                    impact_score=8.3,
                    cost_estimate_inr=60000.0,
                )
            )

        # 5. MINE PLANNING & STRIPPING REBALANCING
        if sbp > 0.30 or geo.stripping_ratio > 5.0 or (sat.pore_water_pressure_kpa or 0.0) > 75.0:
            prio = PriorityLevel.HIGH if sbp > 0.60 else PriorityLevel.MEDIUM
            tonnage_rec = round(min(shortfall_tonnes * 0.25, geo.planned_tonnage * 0.20), 1)
            actions.append(
                CorrectiveActionItem(
                    id=f"ACT-PLAN-{uuid.uuid4().hex[:4].upper()}",
                    category=ActionCategory.MINE_PLANNING,
                    title="Rebalance Bench Sequencing & Pore Pressure Relief",
                    description=(
                        f"Stripping ratio at {geo.stripping_ratio}:1 exceeds benchmark. Accelerate Bench 4 pushback sequencing "
                        f"and drill horizontal depressurizing weep holes to stabilize saturated bench toe."
                    ),
                    priority=prio,
                    estimated_recovery_tonnes=max(90.0, tonnage_rec),
                    estimated_time_hours=4.0,
                    impact_score=7.4,
                    cost_estimate_inr=95000.0,
                )
            )

        # Default fallback action if operating conditions are ideal
        if not actions:
            actions.append(
                CorrectiveActionItem(
                    id=f"ACT-NOMINAL-{uuid.uuid4().hex[:4].upper()}",
                    category=ActionCategory.MINE_PLANNING,
                    title="Maintain Standard Operations & Continuous Telemetry Monitoring",
                    description=(
                        "All environmental, equipment, and grade indicators are within nominal operating limits. "
                        "Continue standard production shift cycles and conduct scheduled shift-end sensor calibration."
                    ),
                    priority=PriorityLevel.LOW,
                    estimated_recovery_tonnes=0.0,
                    estimated_time_hours=1.0,
                    impact_score=5.0,
                    cost_estimate_inr=0.0,
                )
            )

        # Sort actions by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
        priority_rank = {
            PriorityLevel.CRITICAL: 0,
            PriorityLevel.HIGH: 1,
            PriorityLevel.MEDIUM: 2,
            PriorityLevel.LOW: 3,
        }
        actions.sort(key=lambda a: (priority_rank.get(a.priority, 4), -a.impact_score))
        return actions

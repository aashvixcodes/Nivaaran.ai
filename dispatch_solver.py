import json
import math

DIVERSION_ROUTES = {
    "Silk Board":          ["Hosur Road inner lane", "BTM Layout diversion", "Bannerghatta Road bypass"],
    "Hebbal Flyover":      ["Bellary Road service road", "Thanisandra Road", "Nagawara junction loop"],
    "MG Road":             ["Brigade Road parallel", "Residency Road", "Richmond Road"],
    "Mysore Road":         ["Chord Road via Rajajinagar", "Outer Ring Road southern loop"],
    "Bellary Road":        ["Thanisandra Main Road", "Hennur Main Road"],
    "default":             ["Inner parallel road", "Alternate corridor bypass"],
}

def get_diversion_routes(location_name: str):
    for key, routes in DIVERSION_ROUTES.items():
        if key.lower() in location_name.lower():
            return routes
    return DIVERSION_ROUTES["default"]

def solve_dispatch(predicted_surge_pct: float,
                   location_name: str = "Unknown Location",
                   cause: str = "Unknown",
                   resolution_delay_ratio: float = 1.0,
                   is_near_intersection: int = 0,
                   corridor_tier: int = 1,
                   is_rush_hour: int = 0):
    surge = float(predicted_surge_pct)
    diverts = get_diversion_routes(location_name)

    if surge > 65.0:
        severity = "CRITICAL"
        base_off = int(round(0.55 * surge))
        supervisors = 2
        barricade = "Tier 3 - Heavy Perimeter Interceptor Barricades"
        cone_est = 100 + int(corridor_tier * 10)
        directives = [
            "Immediately clear central artery connectors.",
            "Deploy Tier-3 heavy perimeter interceptor barricades at all entry nodes.",
            "Activate digital route-diversion message boards.",
            "Assign radio-coordinated traffic officers for manual flow management.",
            "Alert nearest traffic police HQ and dispatch supervisor pair.",
        ]
        vms = f"CRITICAL CONGESTION - {location_name.upper()} | SURGE {surge:.0f}% | AVOID & USE DIVERSIONS"

    elif surge >= 35.0:
        severity = "WARNING"
        base_off = int(round(0.35 * surge))
        supervisors = 0
        barricade = "Variable Guidance Cones + Lane Dividers"
        cone_est = int(1.2 * surge)
        directives = [
            "Enforce single-lane flow restriction.",
            "Divert all heavy commercial vehicles to alternate corridors.",
            "Deploy variable guidance cones to balance lane loads.",
            "Activate VMS advisory message on approach roads.",
        ]
        vms = f"CONGESTION WARNING - {location_name.upper()} | SURGE {surge:.0f}% | SLOW DOWN"

    else:
        severity = "NORMAL"
        base_off = 0
        supervisors = 0
        barricade = "Zero-barricade standby (CCTV active)"
        cone_est = 0
        directives = [
            "Maintain automated CCTV surveillance sweeps.",
            "Standby patrol unit loop - no physical deployment required.",
        ]
        vms = "TRAFFIC FLOW NORMAL - MAINTAIN SPEED LIMIT"

    extra_officers = 0
    modifier_notes = []

    if resolution_delay_ratio > 1.5:
        extra_officers += max(1, int(base_off * 0.10))
        modifier_notes.append(f"[!] Chronic slow road (resolution ratio {resolution_delay_ratio:.1f}x) - +{extra_officers} officers added.")

    if is_near_intersection == 1:
        extra_officers += 2
        modifier_notes.append("[!] Incident within 50 m of critical junction - +2 intersection officers.")

    if corridor_tier == 3 and severity != "CRITICAL":
        modifier_notes.append("[!] Strategic corridor (Tier 3) - consider escalation if surge increases.")

    if is_rush_hour == 1 and severity == "CRITICAL":
        modifier_notes.append("[!] Rush-hour overlay active - Priority Rush-Hour Protocol engaged.")
        directives.append("Deploy rush-hour rapid-response team to junction approach roads.")

    total_officers = base_off + extra_officers

    payload = {
        "system": "Nivaaran.ai Dispatch Engine v2",
        "status": severity,
        "analytics": {
            "congestion_surge_index_pct": round(surge, 2),
            "estimated_impact_scale": round(min(10.0, max(1.0, surge / 10.0)), 1),
            "resolution_delay_ratio": round(resolution_delay_ratio, 2),
            "corridor_vulnerability_tier": corridor_tier,
            "is_rush_hour": bool(is_rush_hour),
            "is_near_intersection": bool(is_near_intersection),
        },
        "dispatch_plan": {
            "severity_level": severity,
            "manpower": {
                "traffic_officers": total_officers,
                "supervisors": supervisors,
                "base_officers": base_off,
                "modifier_officers": extra_officers,
            },
            "barricading": {
                "blueprint_tier": barricade,
                "cones_required": cone_est,
            },
            "diversion_matrix": diverts,
            "operational_directives": directives,
            "modifier_notes": modifier_notes,
            "vms_broadcast": vms,
        }
    }
    return payload

def format_dispatch_json(payload):
    return json.dumps(payload, indent=4)

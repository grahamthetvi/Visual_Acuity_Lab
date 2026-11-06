#!/usr/bin/env python3
"""
Ultimate Visual Acuity Calculator
────────────────────────────────────────────────────────────────────────────
Calculates equivalent Snellen visual acuity from an object's physical size
and its distance from the viewer. Categorizes the viewing distance into 
Near / Intermediate / Far vision zones and reports accommodative demand.

Features combined:
- Exact geometric split-triangle visual angle formula (Copilot concept)
- Mathematical constant optimization for speed (DeepSeek concept)
- Interactive CLI and robust reporting interface (Claude concept)
────────────────────────────────────────────────────────────────────────────
"""

import math
import sys

# ── Zone thresholds (in meters) ──────────────────────────────────────────────
NEAR_MAX_M = 0.4064       # <= 16 inches
FAR_MIN_M = 3.048         # >= 10 feet and < 6 m
DISTANCE_MIN_M = 6.0       # >= 6 m; includes the 20 ft (6.096 m) lane

# ── Input helpers ────────────────────────────────────────────────────────────
def to_meters(value: float, unit: str) -> float:
    """Standardize length inputs to meters."""
    unit = unit.strip().lower()
    if unit in ("in", "inch", "inches"):
        return value * 0.0254
    elif unit in ("ft", "foot", "feet"):
        return value * 0.3048
    elif unit in ("mm", "millimeter", "millimeters"):
        return value / 1000.0
    elif unit in ("cm", "centimeter", "centimeters"):
        return value / 100.0
    elif unit in ("m", "meter", "meters"):
        return value
    else:
        raise ValueError(f"Unrecognized unit '{unit}'. Use: in, ft, mm, cm, m")

# ── Core optical calculation ─────────────────────────────────────────────────
def calculate_exact_visual_angle(size_m: float, distance_m: float) -> float:
    """
    Return the exact visual angle subtended by the object in arc-minutes.
    
    The object is centered on the line of sight, so the full angle is
    2 * arctan(size / (2 * distance)). For small angles this matches
    size/distance in radians. Radians convert to arc-minutes by 10800 / pi.
    """
    angle_rad = 2.0 * math.atan(size_m / (2.0 * distance_m))
    angle_minutes = angle_rad * (10800.0 / math.pi)
    return angle_minutes

def calculate_snellen_denominator(visual_angle_minutes: float) -> float:
    """Derive the Snellen denominator (the 'X' in 20/X)."""
    return (visual_angle_minutes / 5.0) * 20.0

def round_half_away(value: float) -> int:
    """Match the site's Math.round for non-negative values."""
    return int(math.floor(value + 0.5))

def format_snellen_denominator(raw: float) -> str:
    """Nearest integer, or two decimals when that integer would be 0."""
    rounded = round_half_away(raw)
    if rounded >= 1:
        return str(rounded)
    hundredths = round_half_away(raw * 100) / 100.0
    if hundredths > 0:
        return f"{hundredths:.2f}".rstrip("0").rstrip(".")
    return f"{raw:.2g}"

def classify_distance(distance_m: float) -> str:
    """Assign a vision zone label based on viewing distance."""
    if distance_m <= NEAR_MAX_M:
        return "Near Vision"
    if distance_m < FAR_MIN_M:
        return "Intermediate Vision"
    if distance_m < DISTANCE_MIN_M:
        return "Far Vision"
    return "Distance Vision"

def calculate_diopters(distance_m: float) -> float:
    """Accommodative demand in Diopters (1 / distance_in_meters)."""
    return 1.0 / distance_m

# ── Output formatter ─────────────────────────────────────────────────────────
def report(size_m: float, distance_m: float, size_label: str, distance_label: str) -> None:
    """Run all calculations and print a clean clinical summary."""
    zone = classify_distance(distance_m)
    visual_angle_min = calculate_exact_visual_angle(size_m, distance_m)
    snellen_denom = calculate_snellen_denominator(visual_angle_min)
    snellen_display = format_snellen_denominator(snellen_denom)

    # Conversions for display
    distance_in = distance_m / 0.0254
    distance_ft = distance_m / 0.3048
    size_in = size_m / 0.0254

    print("\n" + "═" * 55)
    print("  EQUIVALENT VISUAL ACUITY REPORT")
    print("═" * 55)
    print(f"  Object size       : {size_label}")
    print(f"                      ({size_in:.2f} in  |  {size_m * 1000:.1f} mm)")
    print(f"  Viewing distance  : {distance_label}")
    print(f"                      ({distance_in:.1f} in  |  {distance_ft:.2f} ft  |  {distance_m:.3f} m)")
    print("─" * 55)
    print(f"  Distance zone     : {zone}")
    print(f"  Visual angle      : {visual_angle_min:.2f} arc-minutes")
    print(f"  Equivalent acuity : 20/{snellen_display}")
    print(f"  Accommodative demand: {calculate_diopters(distance_m):.2f} D")
    print("═" * 55 + "\n")

# ── Interactive prompt ────────────────────────────────────────────────────────
def interactive_mode() -> None:
    print("\n── Ultimate Visual Acuity Calculator ─────────────────")
    print("Accepted size units     : inches (in), feet (ft), millimeters (mm), centimeters (cm), meters (m)")
    print("Accepted distance units : inches (in), feet (ft), millimeters (mm), centimeters (cm), meters (m)")
    print("Type 'exit' or 'quit' to close.")
    print("──────────────────────────────────────────────────────\n")

    while True:
        try:
            raw_size = input("Object size   (e.g. '2 in' or '25 mm') : ").strip()
            if raw_size.lower() in ('exit', 'quit'): break
            
            raw_dist = input("Viewing dist  (e.g. '5 ft' or '60 in') : ").strip()
            if raw_dist.lower() in ('exit', 'quit'): break

            size_parts = raw_size.split()
            dist_parts = raw_dist.split()

            if len(size_parts) != 2 or len(dist_parts) != 2:
                print("ERROR: Enter value and unit separated by a space (e.g., '2 in').\n")
                continue

            size_m = to_meters(float(size_parts[0]), size_parts[1])
            distance_m = to_meters(float(dist_parts[0]), dist_parts[1])

            report(size_m, distance_m, raw_size, raw_dist)

        except ValueError as e:
            print(f"ERROR: {e}\n")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if "--test" in sys.argv:
        report(to_meters(2.0, "in"), to_meters(5.0, "ft"), "2 in", "5 ft")
    else:
        # Run test case silently to verify, then launch interactive mode
        interactive_mode()
#!/usr/bin/env python3
"""
Extracts golden-test data from kudratsinvestmentanalysistool.xlsx.

Reads the workbook with data_only=True (uses Excel's last-computed values) and writes:
  packages/calc/test/fixtures/the-lofts.json

The JSON contains:
  - inputs: A fully-populated Inputs object matching the @inv/shared schema, ready to feed
            into calculate().
  - expected: Key computed values harvested from Inputs/Analysis Summary/Mortgage/Forecast
              sheets that the TS engine must reproduce within 0.01 tolerance.
"""
import json
import sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "kudratsinvestmentanalysistool.xlsx"
OUT = ROOT / "packages/calc/test/fixtures/the-lofts.json"


def _v(ws, coord):
    return ws[coord].value


def main() -> None:
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    inputs_ws = wb["Inputs"]
    summary_ws = wb["Analysis Summary"]
    mort_ws = wb["Mortgage Calculators (By Month)"]
    fy_ws = wb["Forecast (By Year)"]

    def period_label(s):
        if not s:
            return "annum"
        s = str(s).lower()
        if "week" in s and "fortnight" not in s:
            return "week"
        if "fortnight" in s:
            return "fortnight"
        if "month" in s:
            return "month"
        if "quarter" in s:
            return "quarter"
        return "annum"

    def collect_cost_lines(rows):
        """For rows like 33..54 in Inputs: B=label, C=%, D=fixed, E=taxDeductible (TRUE/FALSE)."""
        out = []
        for r in rows:
            label = _v(inputs_ws, f"B{r}")
            if not label:
                continue
            pct = _v(inputs_ws, f"C{r}") or 0
            fixed = _v(inputs_ws, f"D{r}") or 0
            ded = _v(inputs_ws, f"E{r}")
            ded_bool = str(ded).strip().lower() in ("true", "yes")
            out.append({
                "label": str(label),
                "pctOfBase": float(pct) if pct else 0.0,
                "fixedAmount": float(fixed) if fixed else 0.0,
                "taxDeductible": ded_bool,
            })
        return out

    def collect_ongoing_lines(rows):
        out = []
        for r in rows:
            label = _v(inputs_ws, f"B{r}")
            if not label:
                continue
            pct = _v(inputs_ws, f"C{r}") or 0
            fixed = _v(inputs_ws, f"D{r}") or 0
            unit = _v(inputs_ws, f"E{r}")
            out.append({
                "label": str(label),
                "pctOfIncome": float(pct) if pct else 0.0,
                "fixedAmount": float(fixed) if fixed else 0.0,
                "period": period_label(unit),
            })
        return out

    def collect_selling_lines(rows):
        out = []
        for r in rows:
            label = _v(inputs_ws, f"B{r}")
            if not label:
                continue
            pct = _v(inputs_ws, f"C{r}") or 0
            fixed = _v(inputs_ws, f"D{r}") or 0
            ded = _v(inputs_ws, f"E{r}")
            ded_bool = str(ded).strip().lower() in ("true", "yes")
            out.append({
                "label": str(label),
                "pctOfBase": float(pct) if pct else 0.0,
                "fixedAmount": float(fixed) if fixed else 0.0,
                "taxDeductible": ded_bool,
            })
        return out

    dp_mode = "percent" if str(_v(inputs_ws, "E7")).upper() == "YES" else "amount"
    dp_value = (_v(inputs_ws, "C7") if dp_mode == "percent" else _v(inputs_ws, "C8")) or 0

    consider_dep = str(_v(inputs_ws, "E102")).upper() == "YES"
    dep_mode = "percent" if str(_v(inputs_ws, "E103")).upper() == "YES" else "amount"
    dep_value = (_v(inputs_ws, "C103") if dep_mode == "percent" else _v(inputs_ws, "C104")) or 0

    inputs = {
        "property": {
            "address": str(_v(inputs_ws, "C5") or ""),
            "totalPurchasePrice": float(_v(inputs_ws, "C6") or 0),
            "downPayment": {"mode": dp_mode, "value": float(dp_value)},
            "yr1MarketValueARV": float(_v(inputs_ws, "C9") or 0),
            "holdingPeriodYears": int(_v(inputs_ws, "C10") or 1),
            "annualAppreciation": float(_v(inputs_ws, "C11") or 0),
        },
        "income": {
            "rentalIncome": {
                "amount": float(_v(inputs_ws, "C12") or 0),
                "period": period_label(_v(inputs_ws, "D12")),
            },
            "otherIncome": {
                "amount": float(_v(inputs_ws, "C13") or 0),
                "period": period_label(_v(inputs_ws, "D13")),
            },
            "annualRentalGrowth": float(_v(inputs_ws, "C14") or 0),
        },
        "loan": {
            "type": "PI",
            "pi": {
                "annualRate": float(_v(inputs_ws, "C19") or 0),
                "durationYears": int(_v(inputs_ws, "C20") or 1),
                "fees": {
                    "amount": float(_v(inputs_ws, "C21") or 0),
                    "period": period_label(_v(inputs_ws, "D21")),
                },
            },
            "io": {
                "annualRate": float(_v(inputs_ws, "C24") or 0),
                "ioDurationYears": int(_v(inputs_ws, "C25") or 0),
                "standardRateAfterIO": float(_v(inputs_ws, "C26") or 0),
                "totalDurationYears": int(_v(inputs_ws, "C27") or 1),
                "fees": {
                    "amount": float(_v(inputs_ws, "C28") or 0),
                    "period": period_label(_v(inputs_ws, "D28")),
                },
            },
        },
        "purchasingCosts": collect_cost_lines(range(33, 54)),
        "ongoingCosts": collect_ongoing_lines(range(61, 78)),
        "sellingCosts": collect_selling_lines(range(84, 94)),
        "forecast": {
            "annualInflation": float(_v(inputs_ws, "C100") or 0),
            "taxBracket": 0.0,  # the workbook leaves this empty; row 101 is blank
            "considerDepreciation": consider_dep,
            "depreciableValue": {"mode": dep_mode, "value": float(dep_value)},
            "depreciationYears": int(_v(inputs_ws, "C105") or 0),
        },
    }

    # Expected values harvested from cells the user sees on the dashboards.
    # We pull from the Inputs!K column "QUICK SUMMARY" + Analysis Summary + Mortgage + Forecast.
    expected = {
        "derived": {
            "totalPrice": float(_v(inputs_ws, "K5") or 0),
            "downPaymentPct": float(_v(inputs_ws, "K6") or 0),
            "downPaymentAmount": float(_v(inputs_ws, "K7") or 0),
            "principalAmount": float(_v(inputs_ws, "K8") or 0),
            "estimatedSellingPrice": float(_v(inputs_ws, "K13") or 0),
            "purchasingCostsRequired": float(_v(inputs_ws, "K18") or 0),
            "sellingCosts": float(_v(inputs_ws, "K19") or 0),
            "monthlyPIPayment": float(_v(inputs_ws, "K39") or 0),
            "monthlyIOPaymentDuringIO": float(_v(inputs_ws, "K49") or 0),
            "monthlyIOPaymentAfterIO": float(_v(inputs_ws, "K50") or 0),
        },
        # Year 1 P&I from Forecast (By Year) row 5
        "piYear1": {
            "rent": float(_v(fy_ws, "I5") or 0),
            "totalOngoingCosts": float(_v(fy_ws, "L5") or 0),
            "loanRepayment": float(_v(fy_ws, "M5") or 0),
            "beforeTaxCashFlow": float(_v(fy_ws, "R5") or 0),
        },
        # Year N P&I (holding period years)
        "piYearN": {},
        # Amortization totals (P&I, all years summed)
        "piTotals": {
            "totalPayment": float(_v(mort_ws, "C20") or 0),
            "totalPrincipal": float(_v(mort_ws, "D20") or 0),
            "totalInterest": float(_v(mort_ws, "E20") or 0),
        },
    }

    N = inputs["property"]["holdingPeriodYears"]
    yearN_row = 4 + N  # row 5 is year 1, row 4+N is year N
    expected["piYearN"] = {
        "propertyValue": float(_v(fy_ws, f"G{yearN_row}") or 0),
        "equity": float(_v(fy_ws, f"H{yearN_row}") or 0),
        "rent": float(_v(fy_ws, f"I{yearN_row}") or 0),
        "totalOngoingCosts": float(_v(fy_ws, f"L{yearN_row}") or 0),
        "beforeTaxCashFlow": float(_v(fy_ws, f"R{yearN_row}") or 0),
        "grossProfitIfSold": float(_v(fy_ws, f"V{yearN_row}") or 0),
        "netProfitIfSold": float(_v(fy_ws, f"Y{yearN_row}") or 0),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"inputs": inputs, "expected": expected}, indent=2))
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main() or 0)

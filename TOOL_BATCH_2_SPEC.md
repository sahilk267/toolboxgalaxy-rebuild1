# Daily Tools Batch 2 — Local Calculation Contract

Batch 2 adds three **non-duplicate** browser-local calculations to the 29-module foundry: Split Bill & Tip, Loan / EMI Estimate, and Work Shift Duration. These are not variants of Basic Calculator, Percentage Calculator, Date Difference, or Business Days Calculator. They derive output only from the visible fields in the open browser tab and never store a bill, financial estimate, work schedule, or person-level information.

| Module | Distinct contract | Inputs | Primary reading | Explicit exclusions |
| --- | --- | --- | --- | --- |
| Split Bill & Tip | Shares a tax-inclusive group bill and chosen gratuity, not a generic percentage operation. | Subtotal, tip percentage, people, display currency | Per-person share | Payment, receipts, tax calculation, saved group data |
| Loan / EMI Estimate | Computes a fixed-rate amortized monthly-payment estimate, not a loan quote or a financial recommendation. | Principal, annual rate, term, display currency | Estimated monthly payment | Lender data, eligibility, fees, insurance, tax, rate changes, payments |
| Work Shift Duration | Measures a same-day or overnight time window after an unpaid break, not a business-day count or payroll tool. | Start time, end time, unpaid break | Paid duration | Timeclock, payroll, overtime, regional employment rules, saved schedules |

## Formula and input boundary

For a principal `P`, monthly rate `r = annual rate / 1200`, and term `n` months, the estimate uses `P × r × (1 + r)^n / ((1 + r)^n − 1)`. A zero rate uses `P / n`, avoiding division by zero. The output is intentionally labelled an estimate because a real lender can apply fees, insurance, changing rates, compounding conventions, prepayment rules, and other terms not represented here. It is **not financial advice**.

Split Bill accepts a chosen 0–100% tip and whole-person count; the display currency only formats the current number and never fetches rates. Work Shift adds one calendar day when the end time is earlier than the start time, then subtracts a shorter whole-minute unpaid break. It never treats an equal start/end time as a 24-hour shift and never determines compliance, overtime, or paid-break entitlement.

The visual workspaces use one shared graphite console grammar but expose distinct allocation, payment-projection, and time-ledger signals with one dominant primary reading. `scripts/verify-daily-tools.ts` checks formula values, validation, and 32-module slug/name/runner-kind uniqueness. `scripts/playtest-daily-tools.ts` runs real Chromium direct-route, keyboard, pointer, native-time control, reset, copy, and visible error checks.

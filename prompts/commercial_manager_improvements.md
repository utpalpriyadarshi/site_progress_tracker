Commercial Manager Improvements
Please review in line with our project and see feasibility and suggest.

1. Client Billing – Key Date (KD) Completion Prompt

Prompt:

Review contract value ₹[X].
Total KDs: [Number].
KD achieved: [KD Name].
KD weightage: [%].
Previous billing: ₹[X].
Mobilization advance outstanding: ₹[X].
Advance recovery % applicable: [%].
Retention applicable: 5%.

Generate:

Gross billing amount

Advance recovery deduction

Retention deduction

Net receivable

Updated advance balance

Cumulative billing status

Balance contract value

🔹 2. Milestone Readiness Commercial Check Prompt

Check whether KD “[KD Name]” is commercially billable based on:

Engineer certification status

Measurement book entry

BOQ mapping

Variation approval status

LD exposure

Hindrance register impact

Confirm if safe to raise IPC (Interim Payment Certificate).

🔹 3. Advance Recovery Tracker Prompt

Contract Value: ₹[X]
Mobilization Advance Paid: ₹[X]
Recovery Start KD: [KD No.]
Recovery % per bill: [%]

Calculate:

Total recovered till date

Balance advance outstanding

Expected full recovery milestone

Impact on next 3 cash inflows

🔹 4. Retention Management Prompt

Total Billing Till Date: ₹[X]
Retention @5% deducted till date: ₹[X]
DLP period: [Months]
Section completion date: [Date]

Provide:

Retention accumulated

Eligible retention for release

BG required in lieu of retention

Retention aging analysis

🔹 5. Contractor Back-to-Back Payment Prompt

Client KD billed: [KD Name]
Client payment received: ₹[X]
Linked subcontractor BOQs: [Details]
Subcontractor RA bill submitted: ₹[X]
Retention applicable to subcontractor: [%]
Advance recovery applicable: [%]

Generate:

Contractor gross payable

Retention deduction

Advance recovery

Net payable

Cash flow impact

Payment recommendation (Full / Partial / Hold)

🔹 6. Cash Flow Forecast Prompt

Contract Value: ₹[X]
KDs completed: [List]
KDs pending: [List]
Expected completion dates

Generate:

Next 6 months inflow projection

Contractor outflow projection

Net cash position

Funding gap alert

Working capital requirement

🔹 7. Variation / Extra Item Commercial Impact Prompt

Variation Order No: [VO No.]
Value: ₹[X]
Approval Status: [Approved / Pending]
Execution Status: [% Complete]

Provide:

Billable amount

Revenue at risk

Margin impact

Whether to include in next IPC

🔹 8. LD (Liquidated Damages) Risk Prompt

Contract completion date: [Date]
Revised completion date: [Date]
Current progress: [%]
LD rate: [% per week]
LD cap: [%]

Calculate:

LD exposure

EOT claim position

Revenue at risk

Recommended commercial action

🔹 9. KPI Dashboard Prompt for Commercial Manager

Generate dashboard with:

Total Contract Value

% Work Completed

% Revenue Billed

Advance Outstanding

Retention Held

Certified but Unpaid Amount

Overdue Receivables

Subcontractor Payable Aging

Cash Flow Gap

🔹 10. IPC Submission Readiness Prompt

Before submitting IPC No. [X], verify:

KD certificate attached

Measurement sheets signed

Test reports enclosed

BOQ reconciliation done

GST compliance

Previous payment received

Provide submission checklist.

🔹 11. DLP & Final Bill Closure Prompt

Section completion date: [Date]
DLP expiry date: [Date]
Retention held: ₹[X]
Pending claims: ₹[X]

Generate:

Final bill value

Retention release amount

BG release status

Commercial closure checklist

🔹 12. Commercial Risk Early Warning Prompt

Analyze project financial health based on:

Billing lag vs progress

Advance recovery pressure

High retention accumulation

Pending variations

Slow-paying client trend

Highlight top 5 commercial risks with mitigation plan.

🔹 Additional Smart Features You Can Add to Your App

From Indian Metro project practices:

✅ KD-wise revenue curve (S-curve)


Alternatively also review below also.

Based on the specific payment mechanism you described—Key Dates (KDs) with weightages, advance recovery, and retention—I have designed a comprehensive set of prompts. These are tailored for a commercial manager in Indian metro electrification projects and are structured to guide the development of your construction tracker app.

## 🎯 Core App Prompts for a Commercial Manager

### 1. Customer Billing on Key Dates (KDs)
This module helps the manager track milestone completion and generate invoices to the client.

- **Prompt 1:** "Generate a 'KD Milestone Tracker' view showing all contractual Key Dates for Project [X]. Display columns for: **KD Number**, **Description**, **Weightage (%)**, **Scheduled Date**, **Actual Completion Date**, **Status** (Upcoming/Achieved/Overdue), **Invoice Amount**, and **Invoice Submission Date**. Color-code overdue milestones in red."
- **Prompt 2:** "Create a 'Milestone Billing Dashboard' that summarizes total contract value, total value of KDs achieved to date, total value invoiced to client, and total payments received. Show this as a progress bar with percentage."
- **Prompt 3:** "When a user marks a KD as 'Achieved', automatically generate a draft invoice template pre-filled with project details, KD description, and calculated amount based on the KD's weightage. Include a field to upload the supporting completion certificate."

### 2. Vendor/Contractor Payment Management
This section tracks payments to downstream vendors and links them to project progress.

- **Prompt 4:** "Design a 'Vendor Payment Tracker' view that lists all active vendors/subcontractors. For each, show: **Contract Value**, **Work Completed (%)**, **Eligible Payment**, **Advance Outstanding**, **TDS/Other Deductions**, **Net Payable**, and **Payment Due Date**. Include a filter for 'Due This Week'."
- **Prompt 5:** "Create a functionality to link a vendor's invoice to a specific project KD or work package. When a vendor submits a bill, allow the manager to select the related KD and automatically calculate the payment after deducting applicable recoveries."

### 3. Advance Recovery Mechanism
This handles the critical function of recovering advances given to contractors from their running bills.

- **Prompt 6:** "Implement an 'Advance Recovery Scheduler'. When a new advance is issued to a contractor, prompt the user to input: **Advance Amount**, **Recovery Start Date**, **Recovery End Date**, and **Recovery Percentage per Bill**. The system should automatically calculate and deduct the scheduled recovery amount from each subsequent payment certificate until fully recovered."
- **Prompt 7:** "In the 'Vendor Payment Tracker', add a column for **Cumulative Advance Recovered** and **Balance Advance Outstanding**. Auto-calculate the net payment after applying the scheduled recovery for the current bill."

### 4. Retention Money Tracking
This manages the 5% retention held back from each bill and its eventual release.

- **Prompt 8:** "Build a 'Retention Money Monitor' that tracks retention deducted from each of your bills to the client. For each KD invoice, show: **Invoice Amount**, **Retention Deducted (5%)**, and **Cumulative Retention**.
- **Prompt 9:** "Create a separate 'Retention Release Tracker' for both client and vendor retention. Key fields: **Party Name**, **Total Retention Amount**, **Defect Liability Period End Date**, **Release Eligibility Status**, **Release Application Date**, and **Amount Realized**."

### 5. Integrated Commercial Dashboard
A high-level view combining all commercial aspects.

- **Prompt 10:** "Generate a comprehensive 'Project Financial Health' dashboard with three sections:
    - **Client Summary:** Total Billed, Retention with Client, Payments Received.
    - **Vendor Summary:** Total Payable, Retention with You, Advances Given, Net Cash Outflow.
    - **Net Position:** Calculate Net Cash Flow (Client Payments Received - Vendor Payments Made)."

I hope these prompts provide a clear roadmap for developing the commercial management features of your app. Would you like me to elaborate on the data structure for any of these specific modules, such as the advance recovery scheduler or the retention monitor?

Your final suggestion will be created in a markdown for our implementation.
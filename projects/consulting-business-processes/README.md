---
type: project
title: Consulting Business Processes
status: active
target: 2026-12-31
---

# Consulting Business Processes

Build the operational backbone of James's AI consulting firm — SOPs, client forms, onboarding flows, proposals, and reporting templates.

**Status:** Active — core templates built and validated against a fictional practice client (2026-07-21). Untested against a real client yet.

## Description
Before scaling, the business needs repeatable processes. This project covers everything needed to deliver a consistent, professional service: intake forms, discovery call templates, proposal format, project delivery process, and client reporting.

## Key Deliverables
- [x] Client intake form / discovery call template — [templates/client-intake-form-template.md](../../templates/client-intake-form-template.md) (discovery call itself is covered separately by `cold-call-script.md` and `ai-audit-template.md`)
- [x] Proposal template — [templates/proposal-template.md](../../templates/proposal-template.md)
- [x] Onboarding checklist — [templates/onboarding-checklist-template.md](../../templates/onboarding-checklist-template.md)
- [x] Project delivery process — [delivery-process-sop.md](delivery-process-sop.md)
- [x] Client reporting template — [templates/client-reporting-template.md](../../templates/client-reporting-template.md)
- [x] Offboarding / handover process — [templates/delivery-handover-template.md](../../templates/delivery-handover-template.md)

Bonus, not originally listed but needed to actually sign a client:
- [x] Services agreement / contract template — [templates/services-agreement-template.md](../../templates/services-agreement-template.md)
- [x] Invoice template — [templates/invoice-template.md](../../templates/invoice-template.md)

All of the above were built and validated by running a full fictional practice client
(Sorensen Plumbing & Gas) through every stage end to end — see
[practice-client-sorensen-plumbing/](practice-client-sorensen-plumbing/README.md) for the
complete worked example, including a real working trigger.dev + Claude demo build at
`projects/lead-response-demo/`.

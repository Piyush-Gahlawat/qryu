# Shiryu Kit — Governance Documentation

This folder contains the operational, compliance, and architectural documentation for [Shiryu Kit](https://shiryu-kit.shiryu.workers.dev).

## Purpose

Shiryu Kit is a personal project. These documents exist for two reasons:

1. **Operational discipline** — running a live deployment requires the same artefacts as an enterprise one, just at smaller scale: requirements specifications, threat models, runbooks, incident reviews, decision logs, processing inventories, and control inventories.
2. **Applied practice** — this is where governance frameworks (GDPR, incident response, change management) move from theory to application.

## Documents

| Document | Purpose |
| :--- | :--- |
| [Software Requirements Specification (SRS)](./srs.md) | Defines the system — architecture, functional requirements, data flows, deployment |
| [Threat Model](./threat-model.md) | STRIDE analysis of 8 threats with mitigations and residual risk |
| [Post-Incident Review — .git Exposure](./post-incident-review-git-exposure.md) | Formal review of a real security exposure and its remediation |
| [Records of Processing Activities (ROPA)](./ropa.md) | GDPR Article 30 processing inventory + DPDP lawful basis |
| [Deployment Runbook](./runbook.md) | Pre-deploy, deploy, verification, and rollback procedures |
| [Decision Log](./decisions.md) | Architectural and operational decisions with alternatives considered |
| [Security Controls Inventory](./security-controls.md) | Implemented controls mapped to the risks they mitigate |

## Context

- **Live URL:** https://shiryu-kit.shiryu.workers.dev
- **Stack:** Cloudflare Workers (static assets), vanilla HTML/CSS/ES Modules
- **Scale:** Solo-operated, no user accounts, no database, no server-side processing of user data
- **Cost:** ₹0 (free tier throughout)

## Honest framing

These are **practitioner documents**, not enterprise documents. They demonstrate the process and the judgment behind it. They do not claim to be audited, certified, or reviewed by legal counsel.

## What's published vs. what's private

These documents are published as portfolio artifacts — evidence that governance work was actually done, not just claimed. Some operational specifics are intentionally generalized:

| Document | What's public | What's private |
| :--- | :--- | :--- |
| Software Requirements Specification | Full architecture, functional requirements, data flows, deployment topology | Exact dependency versions (referenced by commit instead) |
| Threat Model | All 8 STRIDE threats, attack scenarios, controls, residual risk | None — published in full; documenting what is already defended does not create new attack surface, and publishing it demonstrates the analytical rigor |
| Post-Incident Review | Full narrative, timeline, root cause, four-attempt remediation, lessons | Author email in git metadata (redacted) |
| ROPA | Full processing inventory, legal basis, sub-processors, rights procedures | Exact security header values (generalized) |
| Runbook | Structure, verification approach, rollback principles, common failures | Exact commit SHAs, complete `.assetsignore` blocklist |
| Decision Log | All 11 decisions with alternatives and reasoning | Exact configuration values (referenced by commit instead) |
| Security Controls | Control categories, threat mapping, verification approach, known gaps | Exact header values, complete blocklist paths |

The reasoning: publishing the *process* demonstrates competence; publishing the *exact operational values* would help an attacker without helping the reader. The Threat Model is the exception — publishing it in full strengthens rather than weakens the publication, because a threat model describes what is already defended, not what remains vulnerable.

**📌 Portfolio note:** This README is the index for a published governance artifact set. The documents it links to are accurate and complete in their reasoning; operational specifics are generalized where disclosure would help an attacker more than a reader.

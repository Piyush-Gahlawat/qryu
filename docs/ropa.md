# Records of Processing Activities (ROPA)

**Document version:** 1.3
**Date:** 9 November 2026
**Author:** Piyush Gahlawat

**GDPR Article 30 + DPDP Act 2023 — Record of Processing Activities**

| Field | Detail |
| :--- | :--- |
| **Controller / Data Fiduciary** | Piyush Gahlawat (operating as "Shiryu Kit") |
| **Contact** | shiryukit.privacy@gmail.com |
| **Location** | India |
| **EU representative** | Not required — Article 27 exemption applies (see Section 7) |
| **Significant Data Fiduciary (DPDP)** | Not classified — Section 10 thresholds not met (see Section 4) |
| **Last updated** | 8 November 2026 |
| **Next review** | 8 November 2027 |

**📌 Portfolio note:** This ROPA is published as a portfolio artifact — a real Article 30 record and DPDP processing inventory produced for a live service. Processing purposes, legal bases, retention periods, and sub-processors are stated in full because a ROPA without that content is useless. Exact security header values are generalized; the operational configuration is maintained privately.

---

## 1. Processing Activity: Website Hosting and Delivery

| Field | Detail |
| :--- | :--- |
| **Purpose** | Serve the Shiryu Kit website (8 static pages) to visitors |
| **Data categories** | IP address, HTTP user-agent, requested URL |
| **Data subjects** | All website visitors |
| **Legal basis (GDPR)** | Article 6(1)(f) — legitimate interests (operating a functional, secure website) |
| **Legal basis (DPDP)** | Section 7(a) — voluntary provision (see Section 4) |
| **Recipients** | Cloudflare, Inc. (hosting and CDN) |
| **International transfers** | Yes — Cloudflare global network; SCCs and DPA in place via Cloudflare's standard terms |
| **Retention** | Not retained by controller; transient only at Cloudflare edge |
| **Security measures** | HTTPS with HSTS; nine security header families applied (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, X-XSS-Protection, Cache-Control); SRI on third-party scripts; sensitive paths blocked at the Worker layer |

**Legitimate Interests Assessment summary (GDPR):** The processing of IP addresses and request metadata is inherent to serving any HTTP response. The controller has a legitimate interest in operating a functional, secure website. The impact on data subjects is minimal — data is transient, not stored, not correlated, and not used for profiling. No less-intrusive means of serving a website exists. See [decisions.md#d004](./decisions.md) for the reasoning behind the no-analytics posture.

**DPDP basis:** See Section 4 for the full analysis.

---

## 2. Processing Activity: CDN Library Delivery

| Field | Detail |
| :--- | :--- |
| **Purpose** | Deliver open-source JavaScript libraries to the browser |
| **Data categories** | IP address, HTTP user-agent |
| **Data subjects** | Visitors who use the QR generator or ATS resume cleaner |
| **Legal basis (GDPR)** | Article 6(1)(f) — legitimate interests (efficient, reliable delivery of website functionality) |
| **Legal basis (DPDP)** | Section 7(a) — voluntary provision (see Section 4) |
| **Recipients** | jsDelivr; cdnjs (Cloudflare) — separate providers, listed separately in the Sub-Processor Register (Section 6) |
| **International transfers** | Yes — CDN global networks; providers operate under their standard DPA terms |
| **Retention** | Not retained by controller; transient at CDN edge |
| **Security measures** | Subresource Integrity (SHA-384 hashes) on every external script — see commit `6f83e53` |

**Note:** SRI ensures that if a CDN is compromised and serves a malicious payload, the browser rejects it. See [decision D008](./decisions.md) for the reasoning behind SRI adoption.

---

## 3. Processing Activity: Privacy Correspondence

| Field | Detail |
| :--- | :--- |
| **Purpose** | Receive and respond to privacy-related emails and data subject requests |
| **Data categories** | Sender email address, email content, any personal data voluntarily included in correspondence |
| **Data subjects** | Individuals exercising GDPR or DPDP rights, or contacting the controller about privacy |
| **Legal basis (GDPR)** | Article 6(1)(c) — compliance with a legal obligation (GDPR); Article 6(1)(f) — legitimate interests (responding to correspondence) |
| **Legal basis (DPDP)** | Section 7(a) — voluntary provision (see Section 4) |
| **Recipients** | Google LLC (Gmail — email hosting) |
| **International transfers** | Yes — Google's global infrastructure; SCCs in place via Google's standard terms |
| **Retention** | Retained only for as long as necessary to handle the request, then deleted within 30 days of resolution |
| **Security measures** | 2FA on Gmail account with authenticator app; strong unique password; recovery email configured; Gmail filter flags "Privacy" and "Grievance" in subject line |

**Note:** The dedicated email address was set up at commit `6ffbad7` following the reasoning in [decision D010](./decisions.md).

---

## 4. Lawful Basis under the DPDP Act, 2023

The tables above record the GDPR legal basis for each processing activity. Because the controller is located in India, the DPDP Act 2023 is the primary law, and a separate basis analysis is required. The DPDP Act does not contain a legitimate-interests equivalent to GDPR Article 6(1)(f). Processing is lawful only with consent (Section 6) or under one of the legitimate uses listed in Section 7, which is a closed list.

| Processing activity | DPDP basis | Reasoning |
| :--- | :--- | :--- |
| Website hosting and delivery | **Section 7(a)** — voluntary provision | The visitor voluntarily accesses the site; the IP address and request metadata are provided as an inherent consequence of that voluntary act; processing is limited to what is technically necessary to serve the response |
| CDN library delivery | **Section 7(a)** — voluntary provision | Same reasoning — the CDN request is a necessary consequence of the page load the visitor initiated |
| Privacy correspondence | **Section 7(a)** — voluntary provision | The sender voluntarily initiates the email; processing is limited to reading and responding |

**Interpretive position and caveat.** The Section 7(a) reliance is a reasoned position, not a settled one. The phrase "specified purpose for which the Data Principal has voluntarily provided her personal data" is capable of being read narrowly (as requiring an affirmative provision of data for a stated purpose) or broadly (as covering data necessarily transmitted in the course of a voluntary interaction). We adopt the broad reading because it is consistent with the technical reality that an HTTP request cannot be served without an IP address. If the Data Protection Board of India issues guidance that narrows this reading, the controller would need to either introduce a consent mechanism or establish that the processing falls within another Section 7 limb. That decision will be recorded in the Decision Log at the time.

**No consent mechanism is implemented.** The site does not present a consent banner, does not use cookies for tracking or analytics, and does not collect any data beyond the transient request metadata described in Sections 1–3. This is a deliberate design choice documented in [D004](./decisions.md) and [D007](./decisions.md).

**No Significant Data Fiduciary classification.** The controller does not meet the thresholds in Section 10 of the DPDP Act and is not required to appoint a Data Protection Officer. A Grievance Officer has been designated under Section 13 and Rule 14(3), with contact details published in the privacy policy. This assessment will be revisited if the processing activities, data categories, or scale change materially.

**Breach notification.** The DPDP Act's breach notification obligation (Section 8(6) and Rule 7) runs in parallel with GDPR Article 33. The procedure is documented in [Runbook Section 7a](./runbook.md), and a worked assessment is documented in [PIR INC-2026-001](./post-incident-review-git-exposure.md).

---

## 5. Processing Activities NOT Carried Out

This section exists for accountability. Data that is **not** processed is as important as data that is.

| Activity | Status | Why |
| :--- | :--- | :--- |
| User accounts / authentication | **Not carried out** | No signup or login required — see [decision D007](./decisions.md) |
| User file storage | **Not carried out** | Resume files and JSON are processed entirely in browser memory; never transmitted |
| User text storage | **Not carried out** | Password generation, word counts, JSON input all happen client-side |
| Analytics | **Not carried out** | No Google Analytics, no Cloudflare Web Analytics, no Plausible — see [decision D004](./decisions.md) |
| Advertising | **Not carried out** | No ad networks, no ad pixels, no ad cookies |
| Profiling | **Not carried out** | No individual behaviour tracked or analysed |
| Cookies (tracking) | **Not carried out** | Zero tracking cookies. Cloudflare may set strictly necessary security cookies (`__cf_bm`, `cf_clearance`) — exempt from consent, no tracking |
| Payment processing | **Not carried out** | No paid features, no donations |
| Marketing communication | **Not carried out** | No newsletter, no mailing list |

This section demonstrates that the controller has considered the full range of potential processing activities and confirmed they are not in use — not merely that they were not mentioned.

---

## 6. Sub-Processor Register

| Sub-processor | Service | Purpose | DPA status | Location |
| :--- | :--- | :--- | :--- | :--- |
| Cloudflare, Inc. | Hosting and CDN | Serves all HTML/CSS/JS; processes request metadata | Standard DPA accepted via Cloudflare terms | United States (global network) |
| jsDelivr | CDN | Serves open-source JavaScript libraries | Open-source project; no personal data processing beyond request IP | Global network |
| cdnjs (Cloudflare) | CDN | Serves open-source JavaScript libraries | Standard Cloudflare terms | United States (global network) |
| Google LLC | Email hosting | Receives emails sent to the privacy contact address | Standard Data Processing Terms accepted via Gmail use | United States (global network) |

---

## 7. Article 27 — EU Representative Assessment

**Article 27 requires** a controller outside the EU to designate a representative in the EU, unless the processing is occasional, does not include large-scale processing of special categories, and is unlikely to result in a risk to the rights and freedoms of data subjects.

**Assessment for Shiryu Kit:**

| Criterion | Assessment |
| :--- | :--- |
| Is the processing occasional? | Yes — visitors access static pages on demand; no continuous or systemic data collection |
| Is there large-scale processing of special categories? | No — no special category data is processed at all |
| Is there likely a risk to rights and freedoms? | No — the only personal data processed is transient IP addresses, not stored, not correlated, not used for profiling |

**Conclusion:** The controller meets all three conditions for the Article 27 exemption. No EU representative is required.

This assessment will be re-evaluated if:
- Analytics are added
- User accounts are introduced
- Any server-side processing of user data begins
- Traffic reaches a scale that could be considered "large-scale" (the threshold is not defined in the Regulation, but supervisory authority guidance suggests approaching 10 million EU data subjects would clearly cross it)

---

## 8. Data Subject Rights Procedures

| Right | Procedure | Response time |
| :--- | :--- | :--- |
| **Access (GDPR Art. 15 / DPDP S. 11)** | Email the Grievance Officer with the subject "Privacy" or "Grievance". Controller acknowledges within 5 working days, responds within 30 days (GDPR) or within 90 days (DPDP). | 30 / 90 days |
| **Correction (GDPR Art. 16 / DPDP S. 12)** | Same channel. Since no persistent data is held, response will be: "No personal data is retained beyond transient IP addresses, which are not stored." | 30 / 90 days |
| **Erasure (GDPR Art. 17 / DPDP S. 12)** | Same channel. Response will confirm no retention. | 30 / 90 days |
| **Restriction (GDPR Art. 18)** | Same channel. | 30 days |
| **Data portability (GDPR Art. 20)** | Not applicable — no data is retained to port. | N/A |
| **Object (GDPR Art. 21)** | Same channel. For legitimate interests processing (IP addresses), objection cannot prevent HTTP delivery, but will be acknowledged. | 30 days |
| **Nomination (DPDP S. 14)** | Same channel. Nomination recorded with contact details of the nominee; exercised on death or incapacity of the Data Principal. | 30 days |
| **Grievance redressal (DPDP S. 13)** | Same channel with subject "Grievance". Acknowledged within 5 working days, resolved within 90 days per Rule 14(3). | 90 days |
| **Complaint to supervisory authority / Data Protection Board of India** | Right acknowledged in privacy policy. | N/A |

**Identity verification:** For requests, identity is verified by reply-to-address matching the original request. Since no persistent data is held, the substantive response is the same regardless of identity — no risk of disclosure to impersonators.

---

## 9. Breach Response

See [Post-Incident Review INC-2026-001](./post-incident-review-git-exposure.md) for a worked example of the breach assessment process applied to a real (minor) incident that occurred on 6–7 November 2026.

**Standard breach assessment process:**

1. **Detect** — via monitoring, user report, or proactive audit
2. **Assess** — what personal data is involved? Who is affected? Is there risk?
3. **Classify under GDPR** — reportable under Article 33? (72-hour deadline)
4. **Classify under DPDP** — reportable under Section 8(6) and Rule 7? (Board + Data Principal notification; 72-hour detailed report)
5. **Notify** — supervisory authority and/or Data Protection Board of India if reportable; data subjects and/or Data Principals if high risk
6. **Document** — regardless of reportability, document the incident for Article 5(2) GDPR accountability and DPDP Section 8(6) recordkeeping

The GDPR assessment and the DPDP assessment run in parallel; neither replaces the other. The full DPDP procedure is documented in [Runbook Section 7a](./runbook.md).

The INC-2026-001 review documents the full reasoning for a "not reportable" conclusion — a worked example of an assessment under both regimes.

---

## 10. Review Schedule

This ROPA is reviewed:

- **Annually** (next review: November 2027)
- **On any material change** to processing (new tool, new sub-processor, new data category)
- **After any security incident** that involves personal data
- **On any material change in applicable law** (e.g. DPDP Rules notification, DPB guidance)

---

## 11. Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 November 2026 | Piyush Gahlawat | Initial ROPA |
| 1.1 | 7 November 2026 | Piyush Gahlawat | Sanitization pass for public portfolio |
| 1.2 | 8 November 2026 | Piyush Gahlawat | Added Section 4 — DPDP Act 2023 lawful-basis analysis, including interpretive position and caveat; added DPDP columns to Sections 1–3; added nomination and grievance rights to Section 8; added DPDP classification and dual-regime procedure to Section 9; renumbered subsequent sections |
| 1.3 | 9 November 2026 | Piyush Gahlawat | Cross-references updated to include SRS, Threat Model, and Runbook |

**Related documents:** [Privacy Policy](../privacy.html) · [SRS](./srs.md) · [Threat Model](./threat-model.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md)
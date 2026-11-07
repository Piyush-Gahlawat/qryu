# Records of Processing Activities (ROPA)

**GDPR Article 30 — Record of Processing Activities**

| Field | Detail |
| :--- | :--- |
| **Controller** | Piyush Gahlawat (operating as "Shiryu Kit") |
| **Contact** | shiryukit.privacy@gmail.com |
| **Location** | India |
| **EU representative** | Not required — Article 27 exemption applies (see Section 6) |
| **Last updated** | 7 November 2026 |
| **Next review** | 7 November 2027 |

**📌 Portfolio note:** This ROPA is published as a portfolio artifact — a real Article 30 record produced for a live service. Processing purposes, legal bases, retention periods, and sub-processors are stated in full because a ROPA without that content is useless. Exact security header values are generalized; the operational configuration is maintained privately.

---

## 1. Processing Activity: Website Hosting and Delivery

| Field | Detail |
| :--- | :--- |
| **Purpose** | Serve the Shiryu Kit website (8 static pages) to visitors |
| **Data categories** | IP address, HTTP user-agent, requested URL |
| **Data subjects** | All website visitors |
| **Legal basis** | Article 6(1)(f) — legitimate interests (operating a functional, secure website) |
| **Recipients** | Cloudflare, Inc. (hosting and CDN) |
| **International transfers** | Yes — Cloudflare global network; SCCs and DPA in place via Cloudflare's standard terms |
| **Retention** | Not retained by controller; transient only at Cloudflare edge |
| **Security measures** | HTTPS with HSTS; standard security headers applied (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy); SRI on third-party scripts; sensitive paths blocked at the Worker layer |

**Legitimate Interests Assessment summary:** The processing of IP addresses and request metadata is inherent to serving any HTTP response. The controller has a legitimate interest in operating a functional, secure website. The impact on data subjects is minimal — data is transient, not stored, not correlated, and not used for profiling. No less-intrusive means of serving a website exists. See [decisions.md#d004](./decisions.md) for the reasoning behind the no-analytics posture.

---

## 2. Processing Activity: CDN Library Delivery

| Field | Detail |
| :--- | :--- |
| **Purpose** | Deliver open-source JavaScript libraries to the browser |
| **Data categories** | IP address, HTTP user-agent |
| **Data subjects** | Visitors who use the QR generator or ATS resume cleaner |
| **Legal basis** | Article 6(1)(f) — legitimate interests (efficient, reliable delivery of website functionality) |
| **Recipients** | jsDelivr, cdnjs (Cloudflare) |
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
| **Data subjects** | Individuals exercising GDPR rights or contacting the controller about privacy |
| **Legal basis** | Article 6(1)(c) — compliance with a legal obligation (GDPR); Article 6(1)(f) — legitimate interests (responding to correspondence) |
| **Recipients** | Google LLC (Gmail — email hosting) |
| **International transfers** | Yes — Google's global infrastructure; SCCs in place via Google's standard terms |
| **Retention** | Retained only for as long as necessary to handle the request, then deleted within 30 days of resolution |
| **Security measures** | 2FA on Gmail account with authenticator app; strong unique password; recovery email configured; Gmail filter flags "Privacy" in subject line |

**Note:** The dedicated email address was set up at commit `6ffbad7` following the reasoning in [decision D010](./decisions.md).

---

## 4. Processing Activities NOT Carried Out

This section exists for accountability. Data that is **not** processed is as important as data that is.

| Activity | Status | Why |
| :--- | :--- | :--- |
| User accounts / authentication | **Not carried out** | No signup or login required — see [decision D007](./decisions.md) |
| User file storage | **Not carried out** | Resume files and JSON are processed entirely in browser memory; never transmitted |
| User text storage | **Not carried out** | Password generation, word counts, JSON input all happen client-side |
| Analytics | **Not carried out** | No Google Analytics, no Cloudflare Web Analytics, no Plausible — see [decision D004](./decisions.md) |
| Advertising | **Not carried out** | No ad networks, no ad pixels, no ad cookies |
| Profiling | **Not carried out** | No individual behaviour tracked or analysed |
| Cookies (any) | **Not carried out** | Zero cookies set by the controller |
| Payment processing | **Not carried out** | No paid features, no donations |
| Marketing communication | **Not carried out** | No newsletter, no mailing list |

This section demonstrates that the controller has considered the full range of potential processing activities and confirmed they are not in use — not merely that they were not mentioned.

---

## 5. Sub-Processor Register

| Sub-processor | Service | Purpose | DPA status | Location |
| :--- | :--- | :--- | :--- | :--- |
| Cloudflare, Inc. | Hosting and CDN | Serves all HTML/CSS/JS; processes request metadata | Standard DPA accepted via Cloudflare terms | United States (global network) |
| jsDelivr | CDN | Serves open-source JavaScript libraries | Open-source project; no personal data processing beyond request IP | Global network |
| cdnjs (Cloudflare) | CDN | Serves open-source JavaScript libraries | Standard Cloudflare terms | United States (global network) |
| Google LLC | Email hosting | Receives emails sent to the privacy contact address | Standard Data Processing Terms accepted via Gmail use | United States (global network) |

---

## 6. Article 27 — EU Representative Assessment

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

## 7. Data Subject Rights Procedures

| Right | Procedure | Response time |
| :--- | :--- | :--- |
| **Access (Art. 15)** | Email the privacy contact with "Privacy" in subject. Controller acknowledges within 5 days, responds within 30. | 30 days |
| **Rectification (Art. 16)** | Same channel. Since no persistent data is held, response will be: "No personal data is retained beyond transient IP addresses, which are not stored." | 30 days |
| **Erasure (Art. 17)** | Same channel. Response will confirm no retention. | 30 days |
| **Restriction (Art. 18)** | Same channel. | 30 days |
| **Data portability (Art. 20)** | Not applicable — no data is retained to port. | N/A |
| **Object (Art. 21)** | Same channel. For legitimate interests processing (IP addresses), objection cannot prevent HTTP delivery, but will be acknowledged. | 30 days |
| **Complaint to supervisory authority** | Right acknowledged in privacy policy. | N/A |

**Identity verification:** For requests, identity is verified by reply-to-address matching the original request. Since no persistent data is held, the response is the same regardless of identity — no risk of disclosure to impersonators.

---

## 8. Breach Response

See [Post-Incident Review INC-2026-001](./post-incident-review-git-exposure.md) for a worked example of the breach assessment process applied to a real (minor) incident that occurred on 6–7 November 2026.

**Standard breach assessment process:**

1. **Detect** — via monitoring, user report, or proactive audit
2. **Assess** — what personal data is involved? Who is affected? Is there risk?
3. **Classify** — reportable under Article 33? (72-hour deadline)
4. **Notify** — supervisory authority if reportable; data subjects if high risk
5. **Document** — regardless of reportability, document the incident for Article 5(2) accountability

The INC-2026-001 review documents the full reasoning for a "not reportable" conclusion — a worked example of Article 33 assessment.

---

## 9. Review Schedule

This ROPA is reviewed:

- **Annually** (next review: November 2027)
- **On any material change** to processing (new tool, new sub-processor, new data category)
- **After any security incident** that involves personal data

---

## 10. Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 November 2026 | Piyush Gahlawat | Initial ROPA |
| 1.1 | 7 November 2026 | Piyush Gahlawat | Sanitization pass for public portfolio: added portfolio note; generalized exact security header values in Section 1; removed specific library names from Sections 2 and 5 where they added no informational value beyond "open-source JavaScript libraries" |

**Related documents:** [Privacy Policy](../privacy.html) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md)
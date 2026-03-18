# Master Service Agreement (MSA)

## Between Lyriosa Platform Ltd. and [CONSERVATORIUM NAME]

---

**Agreement Number:** [MSA-YYYY-NNN]
**Effective Date:** [DATE]
**Prepared By:** [LEGAL COUNSEL NAME]

> **IMPORTANT:** This is a template skeleton. All sections marked with `[PLACEHOLDER]` must be completed by qualified Israeli legal counsel before execution. This template does not constitute legal advice.

---

## 1. Definitions

**"Agreement"** means this Master Service Agreement, including all Exhibits attached hereto.

**"Authorized Users"** means the Customer's employees, contractors, students, parents/guardians, and other individuals authorized by the Customer to access the Platform.

**"Confidential Information"** means all non-public information disclosed by either Party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.

**"Customer"** means the conservatorium identified in the signature block below.

**"Customer Data"** means all data uploaded, submitted, or created by or on behalf of the Customer and its Authorized Users through the Platform, including but not limited to: student records, parent/guardian information, teacher profiles, lesson records, payment records, form submissions, practice recordings, signatures, and custom registration terms.

**"Data Processing Agreement" or "DPA"** means the data processing terms set forth in Exhibit B, incorporated by reference.

**"Lyriosa" or "Provider"** means Lyriosa Platform Ltd., a company organized under the laws of the State of Israel, registration number [PLACEHOLDER].

**"Platform"** means the Lyriosa web-based software-as-a-service platform accessible at [PLACEHOLDER URL], including all features, updates, and modifications provided during the Term.

**"Service Level Agreement" or "SLA"** means the service level commitments set forth in Exhibit A.

**"Subscription Fee"** means the fee payable by the Customer for access to the Platform, as set forth in Section 7.

**"Term"** means the duration of this Agreement as set forth in Section 10.

---

## 2. Service Description

### 2.1 Platform Services

Lyriosa provides the Customer with access to a cloud-based platform for managing conservatorium operations, including but not limited to:

- Student enrollment and registration management
- Lesson scheduling, booking, and attendance tracking
- Teacher assignment, availability, and payroll export
- Parent/guardian communication and family management
- Payment processing and billing (via Cardcom integration)
- SMS and WhatsApp notifications (via Twilio integration)
- Ministry of Education form distribution, collection, and digital signatures
- AI-assisted progress reports and teacher-student matching
- Instrument rental and inventory tracking
- Event management (performances, open days, masterclasses)
- Scholarship and financial aid administration
- Multi-locale support (Hebrew, English, Arabic, Russian)
- Accessibility compliance (IS 5568 / WCAG 2.1 AA)

### 2.2 Hosting and Infrastructure

The Platform is hosted on Google Cloud Platform (Firebase App Hosting) in the **europe-west1** (Belgium) region, or such other region as may be agreed in writing by the Parties. [If me-central1 (Israel) becomes available and is preferred, specify here.]

### 2.3 Support

Lyriosa shall provide technical support to the Customer during the following hours:

- **Standard Support:** [PLACEHOLDER — e.g., Sunday through Thursday, 09:00-17:00 Israel Time]
- **Emergency Support:** [PLACEHOLDER — e.g., 24/7 for Critical severity issues]
- **Support Channels:** [PLACEHOLDER — e.g., Email, in-platform messaging, phone]

---

## 3. Service Level Agreement (SLA)

### 3.1 Availability Target

Lyriosa commits to a monthly uptime of **99.5%**, measured as:

```
Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) * 100
```

**Exclusions from Downtime:**
- Scheduled maintenance (with at least 48 hours' prior notice, performed during off-peak hours)
- Force Majeure events (as defined in Section 12)
- Downtime caused by third-party services (Firebase, Cardcom, Twilio) beyond Lyriosa's control
- Downtime caused by the Customer's systems, network, or actions

### 3.2 Service Credits

If monthly uptime falls below the target:

| Monthly Uptime | Service Credit |
|----------------|---------------|
| 99.0% - 99.4% | [PLACEHOLDER]% of monthly Subscription Fee |
| 95.0% - 98.9% | [PLACEHOLDER]% of monthly Subscription Fee |
| Below 95.0% | [PLACEHOLDER]% of monthly Subscription Fee |

Service credits are the Customer's sole and exclusive remedy for failure to meet the SLA. Service credits may not exceed [PLACEHOLDER]% of the monthly Subscription Fee.

### 3.3 Incident Response Times

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|---------------|-------------------|
| Critical | Platform entirely unavailable; data loss risk | [PLACEHOLDER — e.g., 1 hour] | [PLACEHOLDER — e.g., 4 hours] |
| High | Major feature unavailable; workaround exists | [PLACEHOLDER — e.g., 4 hours] | [PLACEHOLDER — e.g., 1 business day] |
| Medium | Minor feature issue; no data impact | [PLACEHOLDER — e.g., 1 business day] | [PLACEHOLDER — e.g., 5 business days] |
| Low | Cosmetic or enhancement request | [PLACEHOLDER — e.g., 3 business days] | [PLACEHOLDER — e.g., next release cycle] |

---

## 4. Data Processing Agreement (DPA)

### 4.1 Roles

- **Data Controller:** The Customer (conservatorium)
- **Data Processor:** Lyriosa Platform Ltd.

The Customer determines the purposes and means of processing personal data of its Authorized Users. Lyriosa processes such data solely on behalf of and as instructed by the Customer.

### 4.2 Data Types Processed

| Category | Data Elements |
|----------|--------------|
| Identity | Full name, Israeli ID number (ת"ז), date of birth, gender |
| Contact | Email address, phone number(s), physical address |
| Educational | Instrument(s) studied, lesson history, attendance records, exam results, teacher notes, progress reports |
| Financial | Invoice amounts, payment method (tokenized), payment history, scholarship amounts |
| Media | Practice audio/video recordings, digital signature images, profile photos |
| Technical | IP address, user agent, login timestamps, notification preferences |

### 4.3 Processing Purposes

Personal data is processed solely for the following purposes:
1. Platform operation (user authentication, scheduling, communication)
2. Billing and payment processing (via Cardcom)
3. Notification delivery (via Twilio SMS/WhatsApp, email)
4. AI-assisted educational reporting (progress reports, teacher matching)
5. Ministry of Education form submission and compliance
6. Analytics and reporting (aggregated, anonymized where possible)

### 4.4 Sub-Processors

Lyriosa engages the following sub-processors:

| Sub-Processor | Purpose | Data Location |
|---------------|---------|---------------|
| Google Cloud Platform (Firebase) | Hosting, database, authentication, storage, serverless functions | europe-west1 (Belgium) |
| Cardcom Solutions Ltd. | Payment processing | Israel |
| Twilio Inc. | SMS and WhatsApp notification delivery | [PLACEHOLDER — US/EU] |
| SendGrid (Twilio) | Email delivery | [PLACEHOLDER — US/EU] |
| Google AI (Gemini) | AI-assisted reports | [PLACEHOLDER — US/EU] |

Lyriosa shall notify the Customer at least **30 days** before engaging a new sub-processor. The Customer may object in writing within 15 days; if the objection cannot be resolved, the Customer may terminate this Agreement per Section 10.

### 4.5 Security Measures

Lyriosa implements the following security measures:
- Encryption at rest (Firestore default encryption, AES-256)
- Encryption in transit (TLS 1.2+)
- Role-Based Access Control (RBAC) with tenant isolation per conservatorium
- Firebase session cookies with cryptographic verification
- Zod schema validation on all Server Action inputs
- HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
- Compliance audit logging for all PII access and modifications
- Signed URLs for all sensitive storage objects (no public URLs for PII)

### 4.6 Data Breach Notification

In the event of a personal data breach:
1. Lyriosa shall notify the Customer within **24 hours** of becoming aware of the breach
2. The notification shall include: nature of the breach, categories of data affected, estimated number of individuals affected, likely consequences, measures taken to mitigate
3. The Customer (as Controller) is responsible for notifying the Registrar of Databases within **72 hours** and affected data subjects as required by law

### 4.7 Data Return and Deletion

Upon termination of this Agreement:
1. Lyriosa shall provide a complete export of all Customer Data in JSON and/or CSV format within **14 days** of the termination effective date
2. Upon written confirmation of successful export by the Customer, Lyriosa shall delete all Customer Data from its systems within **30 days**
3. Lyriosa shall provide written certification of deletion
4. Exceptions: data required to be retained by law (e.g., financial records for 7 years per Israeli tax law) shall be retained in an archived, access-restricted state

### 4.8 Audit Rights

The Customer may audit Lyriosa's compliance with this DPA:
- **Frequency:** Once per calendar year
- **Notice:** At least 30 days' written notice
- **Scope:** Security measures, access controls, sub-processor compliance, data handling procedures
- **Cost:** Each party bears its own costs, unless the audit reveals a material breach by Lyriosa

---

## 5. Intellectual Property

### 5.1 Platform IP

Lyriosa retains all intellectual property rights in and to the Platform, including all software, algorithms, user interface designs, documentation, and any improvements or modifications thereto. This Agreement does not transfer any IP rights from Lyriosa to the Customer.

### 5.2 Customer Data Ownership

The Customer retains all rights, title, and interest in and to Customer Data. Lyriosa acquires no ownership interest in Customer Data by virtue of this Agreement.

### 5.3 License Grant

Each Party grants the other a limited, non-exclusive, non-transferable license to use its intellectual property solely to the extent necessary to perform and receive the services under this Agreement.

### 5.4 Aggregated Analytics

Lyriosa may collect and use **aggregated, anonymized** data derived from the Platform usage for the purposes of improving the Platform, generating industry benchmarks, and conducting research. Such aggregated data shall not identify the Customer or any individual Authorized User.

### 5.5 Custom Registration Terms

Custom registration terms (`customRegistrationTerms`) created by the Customer are the Customer's intellectual property. Lyriosa stores and displays these terms solely for the purpose of presenting them to Authorized Users during registration.

---

## 6. Confidentiality

### 6.1 Obligations

Each Party shall:
- Protect the other Party's Confidential Information using at least the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care
- Not disclose Confidential Information to any third party without prior written consent
- Limit access to Confidential Information to employees and contractors who have a need to know and are bound by confidentiality obligations

### 6.2 Exceptions

Confidential Information does not include information that:
- Is or becomes publicly available without breach of this Agreement
- Was known to the receiving Party prior to disclosure
- Is independently developed by the receiving Party without use of Confidential Information
- Is disclosed pursuant to a legal requirement, provided the disclosing Party is given reasonable notice

### 6.3 Duration

Confidentiality obligations survive termination of this Agreement for a period of **3 years**.

---

## 7. Payment Terms

### 7.1 Subscription Fee

The Customer shall pay Lyriosa a Subscription Fee as follows:

**Pricing Model:** [PLACEHOLDER — Choose one or combine:]
- [ ] **Per-Conservatorium Flat Fee:** NIS [PLACEHOLDER] per month
- [ ] **Per-Student Fee:** NIS [PLACEHOLDER] per active student per month
- [ ] **Revenue Share:** [PLACEHOLDER]% of payment volume processed through the Platform
- [ ] **Tiered Pricing:** [PLACEHOLDER — define tiers based on student count or feature set]

All prices are **inclusive of VAT** (17% as of the Effective Date). If the VAT rate changes, prices shall be adjusted accordingly.

### 7.2 Payment Schedule

- Invoices issued on the [PLACEHOLDER — e.g., 1st] of each month
- Payment due within [PLACEHOLDER — e.g., 30] days of invoice date
- Payment method: [PLACEHOLDER — bank transfer, credit card, direct debit]

### 7.3 Late Payment

Late payments shall bear interest at the rate of [PLACEHOLDER — e.g., Prime + 2%] per annum, calculated from the due date until payment is received. If payment is more than [PLACEHOLDER — e.g., 60] days overdue, Lyriosa may suspend access to the Platform upon [PLACEHOLDER — e.g., 14] days' written notice.

---

## 8. Liability

### 8.1 Liability Cap

**Lyriosa's total aggregate liability** under this Agreement, whether in contract, tort (including negligence), or otherwise, shall not exceed an amount equal to **the Subscription Fees paid by the Customer in the 3-month period immediately preceding the event giving rise to the claim**.

### 8.2 Exclusion of Consequential Damages

Neither Party shall be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of revenue, loss of profits, loss of data, or interruption of business, regardless of the theory of liability, even if advised of the possibility of such damages.

### 8.3 Exceptions to Limitations

The limitations in Sections 8.1 and 8.2 shall not apply to:
- Breaches of confidentiality obligations (Section 6)
- Breaches of data protection obligations (Section 4)
- Fraud or wilful misconduct
- Indemnification obligations (Section 9)

---

## 9. Indemnification

### 9.1 Lyriosa Indemnification

Lyriosa shall indemnify and hold harmless the Customer from any third-party claims arising from:
- Lyriosa's breach of the DPA or data protection obligations
- Infringement of third-party intellectual property rights by the Platform itself (excluding Customer Data)
- Lyriosa's gross negligence or wilful misconduct

### 9.2 Customer Indemnification

The Customer shall indemnify and hold harmless Lyriosa from any third-party claims arising from:
- Customer Data that infringes third-party rights (including uploaded sheet music)
- Customer's breach of its obligations to obtain necessary consents from Authorized Users
- Customer's use of the Platform in violation of applicable law

---

## 10. Term and Termination

### 10.1 Initial Term

This Agreement commences on the Effective Date and continues for an initial term of **[PLACEHOLDER — e.g., 12 months]** ("Initial Term").

### 10.2 Renewal

After the Initial Term, this Agreement shall automatically renew for successive **[PLACEHOLDER — e.g., 12-month]** periods ("Renewal Terms"), unless either Party provides written notice of non-renewal at least **[PLACEHOLDER — e.g., 60]** days before the end of the then-current term.

### 10.3 Termination for Convenience

Either Party may terminate this Agreement for any reason upon **30 days' written notice** to the other Party.

### 10.4 Termination for Cause

Either Party may terminate this Agreement immediately upon written notice if:
- The other Party materially breaches this Agreement and fails to cure within **30 days** of written notice specifying the breach
- The other Party becomes insolvent, files for bankruptcy, or has a receiver appointed

### 10.5 Effect of Termination

Upon termination:
1. The Customer's access to the Platform shall cease on the termination effective date
2. Lyriosa shall provide Customer Data export per Section 4.7
3. All outstanding Subscription Fees through the termination effective date are immediately due
4. Sections 5 (IP), 6 (Confidentiality), 8 (Liability), 9 (Indemnification), and 11 (Governing Law) survive termination

---

## 11. Governing Law and Dispute Resolution

### 11.1 Governing Law

This Agreement shall be governed by and construed in accordance with the **laws of the State of Israel**, without regard to its conflict of laws principles.

### 11.2 Jurisdiction

Any dispute arising out of or in connection with this Agreement that cannot be resolved through good-faith negotiation within **30 days** shall be submitted to the **exclusive jurisdiction of the competent courts located in Tel Aviv-Jaffa, Israel**.

### 11.3 Mediation (Optional)

[PLACEHOLDER — Consider: Before initiating litigation, the Parties shall attempt mediation through [specified mediation service] for a period not exceeding 60 days.]

---

## 12. Force Majeure

Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement to the extent that such failure or delay is caused by events beyond its reasonable control, including but not limited to: natural disasters, war, terrorism, cyber attacks, pandemic, government orders, strikes, or failure of third-party infrastructure (Google Cloud, internet backbone providers).

The affected Party shall:
1. Notify the other Party promptly of the force majeure event
2. Use reasonable efforts to mitigate its effects
3. Resume performance as soon as reasonably practicable

If a force majeure event continues for more than **[PLACEHOLDER — e.g., 90]** days, either Party may terminate this Agreement upon written notice.

---

## 13. General Provisions

### 13.1 Entire Agreement

This Agreement, including all Exhibits, constitutes the entire agreement between the Parties and supersedes all prior agreements, understandings, and representations with respect to the subject matter hereof.

### 13.2 Amendments

This Agreement may only be amended by a written instrument signed by both Parties.

### 13.3 Assignment

Neither Party may assign this Agreement without the prior written consent of the other Party, except in connection with a merger, acquisition, or sale of substantially all assets.

### 13.4 Severability

If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

### 13.5 Notices

All notices under this Agreement shall be in writing and sent to:

**Lyriosa:**
[PLACEHOLDER — Address, email]

**Customer:**
[PLACEHOLDER — Address, email]

### 13.6 Language

This Agreement is executed in the **Hebrew** language. In the event of a translation into any other language, the Hebrew version shall prevail.

---

## Exhibit A: Service Level Agreement (SLA)

[See Section 3 above — to be extracted into a standalone exhibit if preferred by counsel]

## Exhibit B: Data Processing Agreement (DPA)

[See Section 4 above — to be extracted into a standalone exhibit if preferred by counsel]

## Exhibit C: Pricing Schedule

[PLACEHOLDER — Detailed pricing table to be agreed between the Parties]

## Exhibit D: Acceptable Use Policy

[PLACEHOLDER — Defines prohibited activities on the Platform]

---

## Signatures

**Lyriosa Platform Ltd.**

| | |
|---|---|
| Name: | [PLACEHOLDER] |
| Title: | [PLACEHOLDER] |
| Signature: | _________________________ |
| Date: | _________________________ |

**[CONSERVATORIUM NAME]**

| | |
|---|---|
| Name: | [PLACEHOLDER] |
| Title: | [PLACEHOLDER] |
| Signature: | _________________________ |
| Date: | _________________________ |

---

*This template was prepared as a starting point for legal review. It must be reviewed, modified, and approved by qualified Israeli legal counsel before use. Lyriosa Platform Ltd. assumes no liability for the use of this template without proper legal review.*

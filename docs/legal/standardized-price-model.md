# Standardized Price Model for Harmonia

**Produced:** 2026-03-08
**Based on:** Analysis of 13 PDF documents from Israeli conservatoriums (תשפ"ד–תשפ"ו)
**Status:** DRAFT — requires validation against current CPI and municipal subsidy schedules

---

## 1. Recommended Standard Price Ranges

The following ranges are derived from actual pricing found in the PDF corpus. All prices are quoted **inclusive of VAT (17%)** as required by the Consumer Protection Law. The "standard" column represents a market midpoint suitable for the Harmonia default price guide.

```json
{
  "individual_30min_monthly": "₪310–₪380",
  "individual_45min_monthly": "₪460–₪662",
  "individual_60min_monthly": "₪495–₪800",
  "group_lesson_monthly": "₪120–₪280",
  "pre_instrument_early_childhood_monthly": "₪120–₪280",
  "adults_programme_monthly": "₪280–₪722",
  "orchestra_ensemble_addon_monthly": "₪20–₪50 (or free for enrolled students)",
  "theory_class_monthly": "₪120–₪200 (or free for enrolled students)",
  "instrument_rental_monthly": "₪50–₪85 (tiered by year)",
  "annual_enrollment_registration_fee": "₪50–₪300",
  "trial_lesson_single": "₪150–₪280 (pro-rata or fixed)",
  "early_registration_discount_pct": "5–8%",
  "preferred_rare_instrument_discount_pct": "20%",
  "sibling_discount_pct": "5–10% per additional child",
  "scholarship_reduction_pct_range": "10–100% (income-based committee decision)",
  "cancellation_notice_days": "10–20 (by the 10th or 20th of the month)",
  "max_installments": "10 (Sep–Jun monthly equal payments)",
  "max_makeup_lessons_per_year": "2–4",
  "min_advance_notice_for_makeup_hours": "24"
}
```

---

## 2. Recommended Harmonia Platform Defaults

These are the suggested defaults for Harmonia's configuration system (`conservatorium.pricingConfig`). They represent reasonable midpoints that most municipal conservatoriums can adjust up or down.

| Field | Recommended Default | Rationale |
|-------|-------------------|-----------|
| `monthly_30min` | ₪360 | Beer Sheva standard rate |
| `monthly_45min` | ₪490 | Midpoint of ₪460 (Beer Sheva) and ₪540 (community centre) |
| `monthly_60min` | ₪560 | Midpoint of ₪495 (Herzliya) and ₪600 (Herzliya high) |
| `instrument_rental_monthly_yr1` | ₪65 | Weighted average of ₪50–₪70 across corpus |
| `instrument_rental_monthly_yr2` | ₪70 | |
| `instrument_rental_monthly_yr3plus` | ₪85 | Beer Sheva year 3+ rate |
| `enrollment_fee` | ₪250 | Standard rate; ₪300 without early registration |
| `enrollment_fee_early` | ₪200 | Early registration incentive |
| `early_registration_discount_pct` | 5 | Market standard |
| `sibling_discount_pct` | 10 | Second child discount |
| `cancellation_notice_cutoff_day` | 15 | Most common: 10th or 15th; use 15 as default |
| `last_cancellation_month` | March | All conservatoriums prohibit exit from ~March onward |
| `max_installments` | 10 | Universal standard across corpus |
| `max_makeup_lessons_per_year` | 2 | Conservative default; some offer 3–4 |
| `makeup_advance_notice_hours` | 24 | Universal standard |
| `scholarship_available` | true | All conservatoriums offer some scholarship path |
| `vat_rate` | 17 | Current Israeli VAT rate |
| `prices_include_vat` | true | Consumer Protection Law requirement |

---

## 3. Conservatoriums with Significantly Different Pricing

The following conservatoriums have pricing that **deviates materially from the default model** and should therefore store their rates in `customRegistrationTerms` (or a dedicated `pricingOverrides` field):

### 3.1 Givat'ayim Conservatorium (Omri Rava)
**Above-market by 35–55%.** Source: 1752095643, 1753645834, 1752403765.pdf

| Track | Givat'ayim Price | Market Midpoint | Premium |
|-------|-----------------|----------------|---------|
| 45 min individual | ₪662 | ₪490 | +35% |
| 60 min individual | ₪798 | ₪560 | +43% |
| Adults | ₪722 | ₪490 | +47% |
| 90 min (hour and a half) | ₪1,197 | — | N/A (unique product) |
| Double lesson | ₪1,596 | — | N/A (unique product) |
| Conducting / 30 min | ₪439 | ₪360 | +22% |

**Recommendation:** Store in `customRegistrationTerms.priceSchedule` as a Givat'ayim-specific addendum. The conservatorium clearly operates as a premium private-style institution.

### 3.2 Community Centre with Recording Studio (מידע לנרשם.pdf)
**Unique product offerings not in standard model:**
- Recording studio: ₪200/hour
- Eastern music / maqam track: ₪490–₪540/month (same as standard private, but distinct curriculum)
- "Hallelujah Junior" cantor choir: ₪200/month for external students; free for enrolled

**Recommendation:** Add optional `specialTracks` field to `Conservatorium` type for conservatoriums offering non-standard programmes (Eastern music, adult cantor, recording studio access).

### 3.3 Muzichli (Menashe Region)
**Unique refund structure:**
- 75% refund after 1 lesson (departing student)
- 25% refund after 2 lessons
- 0% after that

This is more consumer-friendly than the market norm and is closest to complying with the Consumer Protection Law's cooling-off spirit (though not explicitly named as such).

**Recommendation:** This refund ladder is a good practice model. Harmonia's standard agreement should codify a similar graduated refund — see Document 3 (standard-registration-agreement-draft.md).

### 3.4 Ashdod Akadema
**Unique structure:** Operates as an NGO (עמותה) rather than a municipal conservatorium. This means:
- VAT registration may be different (עמותה may be VAT-exempt or partially exempt)
- The commitment form is more contractually explicit than typical conservatoriums
- SMS/email consent is explicitly scoped to service-only (not advertising) — best practice

**Recommendation:** For NGO-operated conservatoriums in Harmonia, add an `operatorType` field (`municipal` | `ngo` | `private`). NGO operators may need different VAT handling and DPA structure.

### 3.5 Beer Sheva Preferred Instrument Track
**Below-market by 30–40% for rare instruments:**
- Oboe, Trumpet, Trombone, French Horn, Baritone, Tuba, Viola, Double Bass, Bass Guitar
- 45 min: ₪310 vs. ₪490 market midpoint (−37%)
- 60 min: ₪370 vs. ₪560 market midpoint (−34%)

This subsidy policy promotes rare instrument uptake. Municipal funding explains the lower rate.

**Recommendation:** Harmonia should support a `preferredInstrumentList` configuration per conservatorium, with an associated `preferredInstrumentDiscountPct`. Beer Sheva uses 20% discount (from the standard rate) on their preferred list — this aligns with Givat'ayim's preferred instrument discount of 20%.

### 3.6 Arava Community Centre
**Activity-based pricing (not instrument-based):**
- 30 weeks of activity (not 10 months)
- Music lessons specifically committed to 30 lessons September–June
- Cancelled lesson: no replacement if student is absent without notice
- Meals programme: ₪30/meal (unique)

**Recommendation:** Arava-style community centres mixing sports, arts, and music require a different `activityType` model. The Harmonia booking wizard should support non-conservatorium "community centre" mode.

---

## 4. VAT Note

**CRITICAL:** All prices in all source PDFs are stated without VAT. This creates legal ambiguity — it is unclear whether these are VAT-inclusive or VAT-exclusive prices. For Harmonia's platform:

1. All prices displayed to end users (parents/students) **must be VAT-inclusive** per Section 2 of the Consumer Protection Law
2. Invoices must break out the VAT amount separately (₪ amount at 17%)
3. If a conservatorium is VAT-exempt (e.g., an NGO with exempt turnover), this must be flagged per conservatorium with `vatExempt: boolean` in the Conservatorium type
4. The existing `Invoice` type in `types.ts` already has `vatRate` and `vatAmount` fields — these need to be populated and displayed in the UI

---

## 5. Instrument Rental Pricing Structure

Across the corpus, three rental models appear:

| Model | Example | Structure |
|-------|---------|-----------|
| Annual flat fee | Eshkol: ₪360/year | Single annual charge; covers normal wear |
| Monthly tiered | Beer Sheva: ₪50→₪65→₪85 (years 1/2/3+) | Increases by year of rental |
| Monthly flat | Givat'ayim, Givatayim Musikal: ₪70/month | Simple monthly charge |

**Recommended standard:** Monthly tiered model (Beer Sheva) — fairest to new students, and incentivizes purchase after 3 years. Year 1: ₪55, Year 2: ₪70, Year 3+: ₪85.

**Abnormal damage:** All conservatoriums distinguish between normal wear and damage caused by negligent student behaviour. Eshkol (Eshkol bylaws) most clearly states that repeat damage or serial instrument replacement is charged to the student. This should be codified in the standard agreement.

---

## 6. Recommended Harmonia `PackageType` Mapping

Based on the pricing corpus, the following lesson duration types should be supported:

| `PackageType` (existing) | Duration | Monthly Range | Notes |
|--------------------------|----------|--------------|-------|
| `PACK_30_MIN` (add) | 30 min/week | ₪310–₪380 | For young beginners and preferred instruments |
| `PACK_45_MIN` | 45 min/week | ₪460–₪662 | Standard individual lesson |
| `PACK_60_MIN` | 60 min/week | ₪495–₪800 | Advanced / maturity track |
| `PACK_90_MIN` (add) | 90 min/week | ₪1,197 | Givat'ayim only; intensive preparation |
| `PACK_5_PREMIUM` | — | — | Premium teacher surcharge |
| `PACK_10_PREMIUM` | — | — | Premium teacher surcharge |
| `PACK_DUET` | — | — | Duo pricing (₪380–₪420/student) |

---

*This price model is derived from real market data (2023–2026) and is intended as a starting point for Harmonia's pricing configuration system. All prices should be reviewed annually against Ministry of Education subsidy guidelines and municipal funding levels.*

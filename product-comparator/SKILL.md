---
name: product-comparator
description: Find the best deal on a product across retailers. Use when the user wants to compare prices, find the cheapest option, or decide where to buy something. Searches multiple stores, normalizes prices per unit, checks seller reputation, and recommends the best option.
compatibility: Created for Zo Computer
metadata:
  author: j-alicia-long
---

# Product Comparator

Compare a product across retailers and recommend the best deal.

## When to use

- "Find the best price for X"
- "Where should I buy X?"
- "Compare prices on X"
- "What's the best deal on X?"
- Any purchase decision where the user wants options ranked

## Workflow

### 1. Parse the request

Extract from the user's message:

- **Product**: exact name, brand, model/variant, size/quantity
- **Criteria** (ask if unclear): what matters most — price, price-per-unit, authorized seller, bundle value, shipping, availability
- **Constraints**: size preference, quantity, must-haves (e.g. "liter size only", "must be authentic")

If the product has multiple sizes or bundles available, ask which the user wants — or default to comparing the same size across sellers.

### 2. Search retailers

Run **3 parallel web searches** with different query angles:

1. `"[product] buy"` — general shopping results
2. `"[product] price"` with `include_domains` targeting major retailers (amazon.com, walmart.com, target.com, brand's own site)
3. `"[product] deal bundle"` — catches combo packs and promotions

Then for each promising result, use `read_webpage` or `web_research` to get the actual current price, seller info, and any promotions.

**Retailer priority order** (search these first, then expand):
1. Brand's official website
2. Amazon
3. Target
4. Walmart
5. Costco
6. Category-specific retailers (Sephora/Ulta for beauty, Best Buy for electronics, etc.)
7. Third-party/discount sellers

### 3. Collect data for each option

For every viable option found, record:

| Field | Example |
|-------|---------|
| Retailer | Amazon |
| Product listing | Olaplex No.4+5 Wash & Shine Kit |
| Price | $64.60 |
| Quantity/Size | 8.5 oz each (2 bottles) |
| Price per unit | $3.80/oz |
| Seller type | Sold by Amazon (authorized) |
| Shipping | Free with Prime |
| Promotions | Subscribe & Save, cancel after first delivery |
| In stock | Yes |
| URL | (include for reference) |

### 4. Normalize and rank

Use the formulas in `references/pricing-guide.md` to:

- Calculate price-per-unit (per oz, per count, per serving — whatever fits the product)
- Apply the seller trust score
- Factor in effective price (after promos, shipping, bundles)
- Flag any deal-breakers (out of stock, suspicious seller, etc.)

**Rank by**: effective price-per-unit first, then seller trust, then convenience.

### 5. Present results

Use the template in `assets/comparison-template.md` to output:

1. A **comparison table** — all options side by side
2. A **recommendation** — the best overall pick with reasoning
3. A **runner-up** — in case the top pick has a caveat
4. Any **alerts** — things worth knowing (price drops, limited stock, authenticity concerns)

Keep the recommendation opinionated. Don't hedge — pick a winner and say why.

### 6. Offer to save

Ask if the user wants to save the comparison to their workspace (e.g., `personal-os/03-resources/product-comparisons/[product]-[date].md`). This makes it easy to re-check prices later or reference the decision.

## Important notes

- Always include the brand's own website. Direct-from-brand is sometimes cheapest and always authentic.
- "Sold by Amazon" ≠ "Sold on Amazon." Third-party marketplace sellers on Amazon/Walmart can be unauthorized resellers.
- When a product comes in multiple sizes, compare the same size OR normalize to price-per-unit. Never compare a 3 oz bottle to a 33 oz bottle by sticker price.
- If a bundle includes products the user didn't ask for, break out the cost of just the requested items.
- Subscribe & Save, auto-ship, and membership prices are valid deals but must be flagged as requiring a subscription.
- Check if the user has any relevant memberships (Prime, Costco, Target Circle, etc.) that affect pricing.

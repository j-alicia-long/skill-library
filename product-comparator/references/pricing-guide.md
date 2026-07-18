# Pricing & Seller Trust Reference

## Price normalization formulas

### Price per unit

Choose the unit that fits the product category:

| Category | Unit | Formula |
|----------|------|---------|
| Liquids (shampoo, soap, drinks) | per oz | total price ÷ total oz |
| Capsules, tablets, gummies | per count | total price ÷ count |
| Food by weight | per oz or per lb | total price ÷ weight |
| Subscription boxes | per item | total price ÷ items in box |
| Multi-packs | per single unit | total price ÷ number of units |
| Powder (protein, supplements) | per serving | total price ÷ servings |

### Effective price

When promos or shipping change the real cost:

```
effective_price = listed_price - discounts + shipping_cost
effective_per_unit = effective_price ÷ total_units
```

For bundles that include items the user didn't ask for:
```
estimated_target_cost = effective_price × (target_item_retail ÷ bundle_total_retail)
```

This estimates the cost of just the desired items proportional to their retail value within the bundle.

### Subscription-adjusted price

If a deal requires a subscription:
```
true_cost = subscription_price + cancellation_hassle_factor
```

Cancellation hassle factor (qualitative, note in output):
- Cancel anytime online, no penalty → no adjustment needed, flag as "easy cancel"
- Must call to cancel or minimum commitment → flag clearly as a caveat
- Auto-renews at higher price → calculate the risk if user forgets

## Seller trust scoring

Rate each seller on a 3-tier scale:

### Tier 1 — High trust
- Brand's own website or official store
- Amazon "Sold by [Brand]" or "Sold by Amazon.com"
- Major retailer's own inventory (Target, Walmart first-party, Costco, Sephora, Ulta)
- Characteristics: official return policy, guaranteed authentic, responsive customer service

### Tier 2 — Moderate trust
- Well-known third-party sellers on Amazon/Walmart with 95%+ rating and 1000+ reviews
- Authorized reseller networks (check brand's website for an authorized dealer list)
- Characteristics: usually legitimate but no brand guarantee on authenticity

### Tier 3 — Use caution
- Unknown third-party sellers with few reviews
- Discount/grey-market sellers (prices significantly below retail)
- Sites with no clear return policy or contact info
- Characteristics: higher counterfeit risk, harder to get support

**When to flag authenticity risk**: If the product is commonly counterfeited (beauty, supplements, electronics, luxury goods) AND the seller is Tier 3, explicitly warn the user.

## Product categories — what to watch for

### Beauty & personal care
- Authorized seller matters (counterfeits are common)
- Check for "sold by" vs "fulfilled by" distinction
- Salon/professional sizes may have restricted distribution
- Watch for near-expiry products at discount sellers

### Electronics
- Check warranty coverage (grey market may void manufacturer warranty)
- Refurbished vs new — always specify
- Bundle pricing often inflates accessories to look like a deal

### Supplements & food
- Expiration dates matter — deep discounts may mean short shelf life
- Third-party testing certifications add trust
- Per-serving is more useful than per-container

### Household & cleaning
- Concentrate vs ready-to-use — normalize to effective quantity
- Subscribe & Save is often genuinely the best deal
- Generic/store brand alternatives are worth mentioning if >30% cheaper

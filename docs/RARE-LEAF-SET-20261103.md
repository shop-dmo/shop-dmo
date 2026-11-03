# Combined rare one-leaf set — local candidate

Owner explicitly selected one combined set, not two independent sets:
**เซ็ตซีล เบสยาก + ซูซา ตัวละ 1 ใบ**. A new generated Digimon-themed poster is
included without an embedded price or a claim that every depicted character is
a member. This is local work only; no deploy, push or live data edit.

## Budget tool

- NORMAL/basic seals only, packSize1000, one pack per product.
- Order by current pack price ascending, then stable ID for ties. Stop before
  the next unaffordable pack; do not spend remaining budget on partial leaves.
- Include only ACTIVE stock checked explicitly in the last24h and sufficient
  for the full pack. Offline, missing/future/stale checks remain excluded.
- Maximum250 distinct products (previous arbitrary20 limit removed).
- Does not execute purchases, reserve stock or send messages automatically.

## Combined set recipe and price

- `readPublic` derives `rareLeafSet` from its public seal products server-side.
- Include BASE_HARD and SUSA entries sold by leaf. Keep out-of-stock/check-stock
  entries in the recipe and flag availability; do not silently shrink the set.
  Hidden/inactive entries are not advertised.
- Pack-only members are listed as excluded, not divided into fractional packs.
  This preserves Starmon/Gotsumon's existing1,000-leaf pack-only rules without
  reopening individual sales or changing their prices, stocks or old sets.
- Each included species contributes exactly its public per-leaf price once.
  Accumulate integer millionths of a baht; ceil the combined sum to one whole
  baht. Round the combined set once, NOT each member or category separately.
- Missing/invalid prices withhold the quote instead of treating them as zero.
- Counts and quote change with the current public catalog; no live total is
  hardcoded. Public reads during this task found20 BASE_HARD +38 leaf-sale SUSA;
  76.10baht ->77baht. That is an observation, not a frozen sales price.
- Only public names, IDs, sections, prices and derived availability are used.
  No private field, reserved-stock value or credentials enter the new object.

## Customer flow (deliberately quote-only)

The new card appears in Seal Sets under All lines. Its button requests this set
**separately from the ordinary cart**, rather than pretending a rounded bundle
charge equals unrounded component cart totals. Existing cart/order/stock
operations, starter/full sets and settings schemas remain unchanged.

Customer chooses1–999 sets and copies a request containing all member names,
leaf quantities, pre-round total, rounded per-set price and multiplied total.
Before copying the client rereads the public API. A changed recipe/price shows
the new data and requires review/click again; offline/failure does not copy an
old quote. Quantity and button are locked during the request; detached UI is
ignored. Clipboard refusal shows selectable manual text. Nothing is sent,
saved as an order, purchased or reserved by this flow. Shop confirmation is due.
The rounded amount is before discounts/promotions; the shop confirms any deal.

## Asset/build

`public-product-images/shop-artwork.json` references the SHA256-named PNG.
The existing checksum-validated public-asset pipeline bundles it as
`product-85eef86025894feefb5500319ec3adeef39597cf0e6e54c290d09ac2cb9e2a12.png`.
No official affiliation is implied. The poster is decorative generated fan art,
not an in-game screenshot or a substitute for the text member list.

## Checks and limits

`npm run test:shop-improvements` covers source/minified price ordering, rare
exclusion, caps, one-leaf recipe, private-field stripping, immutable source,
exact-whole rounding, unknown/out-of-stock behavior, HTML escaping, quantity
math, fresh-price review, in-flight locks, stale/offline handling and clipboard
fallback. Run existing catalog, cap, set-security, service, inquiry, minified,
site-security, full npm tests, site build and candidate privacy checks too.

Loopback preview uses synthetic products/prices only and invokes the actual
backend recipe helper in a VM. It does not call production. Live Apps Script
and deployment/cache/PWA validation remain unperformed. An eventual authorized
release needs backend and frontend together (older backend omits this card).
No migrations or live product writes are needed for the new derived set.

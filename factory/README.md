# Offline product factory

Python 3.11+ standard library only. These commands validate and prepare local files. They do not publish, send messages, create accounts, change prices, move money, or promise sales.

Run from the repository root:

```sh
python factory/product_factory.py validate
python factory/product_factory.py render-catalog
python -m unittest discover -s factory/tests -v
python factory/product_factory.py package --source ../release-source --allowlist ../release-allowlist.json --out ../release.zip
```

The catalog is `public/products.json`, the same file the product UI consumes. Do not create a second catalog. Monetary input accepts exact decimal strings or JSON numbers; supported currencies are USD, EUR, GBP, KZT, each with two decimal places. No exchange conversion is performed.

`render-catalog` generates `public/products/index.html` from that single catalog for readers and crawlers without JavaScript. It escapes product content, hides drafts, validates HTTPS external links, and only renders purchase links for available items. The canonical URL is the portfolio's `/products/` page. Pending products are labelled awaiting approval, with a planned price rather than an available offer.

## Approval-dependent local update

Save genuine moderation evidence privately in an object containing `reference` and timezone-aware `observed_at`. Verify the actual public item and purchase link before marking it available. The CLI validates the evidence structure, not its truth or the live purchase URL.

```sh
python factory/product_factory.py catalog-update --id dentara --status available --purchase-url https://example.com/VERIFIED-ITEM --updated-at 2026-10-27 --approval-evidence ../private-approval.json
# Inspect the dry-run result. Add --apply only for an intended local catalog change.
```

The URL above is a placeholder, never a real product link. `--apply` writes the local catalog and does not push or publish. Products outside `available` must have a null purchase URL; only mark actual purchasable items available.

When availability changes, review status-dependent limitations too. Pass `--limitations-json ../reviewed-limitations.json` with a reviewed JSON string array to remove stale moderation wording while preserving real product limitations. Then run `validate`, `render-catalog`, tests and the build before any separately authorized publication.

## Deterministic distribution archives

An allowlist is `{"schema_version":1,"files":["index.html","assets/style.css","documentation/index.html"]}`. Paths are explicit files relative to the release source; no globs. Hidden paths, Git metadata, development directories, likely private filenames, symlinks, junctions, unsupported file types, and recognizable credential patterns are blocked. Review every selected asset and its license before packaging: a pattern scanner cannot prove that arbitrary text or images contain no sensitive information.

Archives use sorted paths, fixed timestamps and permissions, and uncompressed ZIP entries for reproducibility independent of compression versions. `MANIFEST.sha256` lists every payload file. The command prints the archive SHA-256; it refuses to overwrite existing archives. This strict customer-package command intentionally does not package this application's development tree.

## Private financial ledger

Real records and reports MUST remain outside this repository and outside public site roots. The CLI rejects ledger/report paths inside this repository. Never upload a report as a CI artifact. CI runs synthetic tests only and has no ledger input.

```sh
python factory/product_factory.py report --ledger ../private-finances/ledger.json --out ../private-finances/report.json
```

Create the private ledger from `templates/ledger-empty.json`, replacing its placeholder product ID, account and historical period with the actual product, account and reporting period. Empty data yields null in every monetary metric, not invented zero sales. Record one product, currency and marketplace/account per ledger. Pass `--catalog public/products.json` to include that product's current lifecycle status, independently of revenue. Every event has a unique `id`, `type`, exact nonnegative `amount`, `currency`, timezone-aware `occurred_at`, and `evidence: {reference, observed_at}`. Sale, refund, fee and payout events additionally require a stable source `transaction_id`; duplicate IDs and same-type source transactions are rejected. Reference private statements by a stable local reference, not passwords, tokens or account credentials.

Types: `forecast` (explicit assumption), `sale` (gross accrued sale), `refund`, `fee`, `balance` (observed available snapshot), `payout` (cash actually received, not merely requested). These are separate measures: never add sale and payout together. The latest balance snapshot wins; snapshots are never summed. Complete sale/refund/fee coverage is required before computing accrued net. Add coverage only when a statement or other evidence establishes the complete reporting period, including explicit zero activity:

`confirmed_sale_count` counts recorded sale transactions, never payouts or forecasts. Without full coverage it is only an observed subtotal. A pooled marketplace balance or payout must not be attributed to one product without allocation evidence; keep product cash/balance unknown when the provider does not supply that breakdown.

```json
{"sale":{"complete":true,"evidence":{"reference":"SYNTHETIC EXAMPLE: complete statement","observed_at":"2020-02-01T00:00:00Z"}}}
```

Place that mapping under `coverage`. Without completeness evidence, sums are observed subtotals and unknown categories remain null. A report cannot verify whether evidence is genuine or a pending payout actually settled; the operator must record truthful observed facts. It does not produce accounting/tax advice or infer a cash balance by mixing forecasts, sales and payouts.

Optional `observations` records contain `id`, `metric` (`views` or `purchase_clicks`), integer `value`, `period: {start, end}`, `observed_at` and `evidence`. They preserve the measurement window and evidence reference. The latest snapshot per metric is selected, never summed with overlapping windows. Unobserved metrics remain null; views and clicks do not establish purchase attribution. Record only product-specific balances and payouts when the source supports that allocation; an account-wide balance spanning several products must not be copied into each product ledger.

## Bounded workflow

Use `templates/product-cycle.json` for a single product. Research evidence precedes a specification; develop, test, document, verify the demo, and package before requesting publication approval. Publication remains a separate explicit action. Analytics records unknown values as null. Run one variable experiment with a fixed end date; review results once, record whether reach was sufficient, then stop or deliberately start another experiment. Do not schedule speculative production or large background workloads.

The GitHub workflow runs validation, Python tests, existing Node physics tests, a build, and Chromium product/orbital tests on pull requests or manual dispatch. It uses read-only repository permission, installs no publisher credentials, has no cron schedule, has a 20-minute job timeout, and deploys nothing. It does not claim coverage for Safari, Firefox or physical phones.

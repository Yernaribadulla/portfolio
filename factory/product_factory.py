"""Offline product factory. Python standard library only; never publishes or pays."""
from __future__ import annotations

import argparse
import copy
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
from html import escape
import json
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import urlsplit
import zipfile

REPO = Path(__file__).resolve().parents[1]
ID = re.compile(r"^[a-z0-9][a-z0-9_-]{0,79}$")
KINDS = {"forecast", "sale", "refund", "fee", "balance", "payout"}
CURRENCIES = {"USD": 2, "EUR": 2, "GBP": 2, "KZT": 2}
DENIED_PARTS = {".git", ".github", "node_modules", "__pycache__", ".venv", "venv", "tests", "test-results", "playwright-report", "review", "modeling", "factory"}
DENIED_NAMES = {"package-lock.json", "pnpm-lock.yaml", "yarn.lock", "tsconfig.json", ".ds_store", "manifest.sha256", "id_rsa", "id_ed25519"}
ALLOWED_EXTENSIONS = {".html", ".css", ".js", ".mjs", ".json", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".txt", ".md", ".pdf", ".py", ".toml"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def no_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"duplicate JSON key: {key}")
        result[key] = value
    return result


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"), parse_float=Decimal,
                      object_pairs_hook=no_duplicate_keys,
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError(f"invalid number: {value}")))


def emit(value):
    # Preserve exact JSON decimals without converting to binary floats or strings.
    def render(item, depth=0):
        if isinstance(item, Decimal):
            require(item.is_finite(), "cannot serialize nonfinite decimal")
            return format(item, "f")
        if isinstance(item, dict):
            lines = ["  " * (depth + 1) + json.dumps(key, ensure_ascii=False) + ": " + render(val, depth + 1) for key, val in item.items()]
            return "{\n" + ",\n".join(lines) + "\n" + "  " * depth + "}" if lines else "{}"
        if isinstance(item, list):
            lines = ["  " * (depth + 1) + render(val, depth + 1) for val in item]
            return "[\n" + ",\n".join(lines) + "\n" + "  " * depth + "]" if lines else "[]"
        return json.dumps(item, ensure_ascii=False, allow_nan=False)
    return render(value) + "\n"


def money(value, currency):
    require(currency in CURRENCIES, f"unsupported currency: {currency}; no implicit FX conversion")
    require(isinstance(value, (str, int, Decimal)) and not isinstance(value, bool), "money must be a decimal string or JSON number")
    require(not isinstance(value, str) or bool(re.fullmatch(r"\d+(?:\.\d+)?", value)), "money must be nonnegative plain decimal")
    try:
        result = Decimal(value)
        require(result.is_finite() and result >= 0, "money must be finite and nonnegative")
        unit = Decimal(1).scaleb(-CURRENCIES[currency])
        require(result <= Decimal("999999999999.99"), "money exceeds supported range")
        require(result == result.quantize(unit), "money has excessive decimal precision")
        return result.quantize(unit)
    except InvalidOperation as exc:
        raise ValueError("invalid monetary amount") from exc


def timestamp(value):
    require(isinstance(value, str), "timestamp must be ISO 8601 text")
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("invalid ISO 8601 timestamp") from exc
    require(result.tzinfo is not None, "timestamp requires a timezone")
    return result.astimezone(timezone.utc)


def evidence(value):
    require(isinstance(value, dict), "evidence object required")
    require(isinstance(value.get("reference"), str) and bool(value["reference"].strip()), "evidence reference required")
    observed = timestamp(value.get("observed_at"))
    require(observed <= datetime.now(timezone.utc), "evidence timestamp cannot be in the future")
    return observed


def web_url(value, nullable=False):
    if nullable and value is None:
        return
    require(isinstance(value, str), "URL must be text")
    require(not any(character.isspace() or ord(character) < 32 for character in value), "URL contains whitespace or control characters")
    parsed = urlsplit(value)
    require(parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password, "public URL must use HTTPS without credentials")


def relative_path(value):
    require(isinstance(value, str) and value and "\\" not in value and ":" not in value, "use a relative POSIX path")
    require(not value.startswith("/") and all(part not in {"", ".", ".."} for part in value.split("/")), "unsafe relative path")
    require(not any(ord(char) < 32 for char in value), "control character in path")
    return PurePosixPath(value)


def validate_catalog(data):
    require(isinstance(data, dict) and data.get("schema_version") == 1, "catalog schema_version must be 1")
    require(isinstance(data.get("products"), list), "products must be an array")
    seen = set()
    for product in data["products"]:
        require(isinstance(product, dict), "product must be an object")
        product_id = product.get("id", "")
        require(isinstance(product_id, str) and len(product_id) <= 80 and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", product_id), "invalid product slug")
        require(product_id not in seen, f"duplicate product id: {product_id}")
        seen.add(product_id)
        for key in ("name", "summary", "description", "version"):
            require(isinstance(product.get(key), str) and product[key].strip(), f"{product_id}: {key} required")
        require(product.get("category") in {"web_template", "developer_tool"}, "invalid category")
        require(product.get("status") in {"draft", "in_review", "available", "paused"}, "invalid status")
        require(isinstance(product.get("price"), dict), "price object required")
        require(isinstance(product["price"].get("amount"), (int, Decimal)) and not isinstance(product["price"].get("amount"), bool), "catalog price amount must be a JSON number")
        money(product["price"].get("amount"), product["price"].get("currency"))
        for key in ("demo_url", "product_url", "purchase_url"):
            require(key in product, f"{key} required (null is allowed)")
            web_url(product[key], nullable=True)
        require(product["status"] != "available" or product["purchase_url"] is not None, "available product requires a purchase URL")
        require(product["status"] == "available" or product["purchase_url"] is None, "purchase URL must be null until available")
        relative_path(product.get("image_url"))
        require(bool(re.fullmatch(r"products/[a-zA-Z0-9_./-]+", product["image_url"])), "catalog image must be a path under products/")
        for key in ("features", "requirements", "limitations"):
            require(isinstance(product.get(key), list) and all(isinstance(item, str) and item.strip() for item in product[key]), f"{key} must contain nonempty strings")
        require(isinstance(product.get("updated_at"), str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", product["updated_at"]), "updated_at requires YYYY-MM-DD")
        date.fromisoformat(product["updated_at"])
    return data


def update_catalog(data, product_id, status, purchase_url, updated_at, approval_evidence=None, limitations=None):
    result = copy.deepcopy(validate_catalog(data))
    matches = [product for product in result["products"] if product["id"] == product_id]
    require(len(matches) == 1, "product not found")
    if status == "available":
        evidence(approval_evidence)
    product = matches[0]
    product.update(status=status, purchase_url=purchase_url, updated_at=updated_at)
    if limitations is not None:
        product["limitations"] = limitations
    return validate_catalog(result)


def render_catalog(data):
    """Search-readable static view of the same catalog; no new product data."""
    validate_catalog(data)
    cards = []
    labels = {"in_review": "Awaiting marketplace approval", "available": "Available", "paused": "Sales paused"}
    for product in data["products"]:
        if product["status"] == "draft":
            continue
        esc = lambda value: escape(str(value), quote=True)
        lists = ""
        for field, title in [("features", "Included"), ("requirements", "Requirements"), ("limitations", "Limitations")]:
            if product[field]:
                lists += "<h3>" + title + "</h3><ul>" + "".join("<li>" + esc(item) + "</li>" for item in product[field]) + "</ul>"
        links = [f'<a href="../#products/{esc(product["id"])}">Open in portfolio</a>']
        for key, label in [("demo_url", "View demo"), ("product_url", "Product information")]:
            if product[key]:
                links.append(f'<a href="{esc(product[key])}">{label}</a>')
        if product["status"] == "available" and product["purchase_url"]:
            links.append(f'<a href="{esc(product["purchase_url"])}">Buy on marketplace</a>')
        price = format(money(product["price"]["amount"], product["price"]["currency"]), ".2f")
        price_prefix = "Base price" if product["status"] == "available" else "Planned base price"
        cards.append(f'''<article id="{esc(product["id"])}">
<img src="../{esc(product["image_url"])}" alt="{esc(product["name"])} preview" loading="lazy" width="1200" height="750">
<p class="status">{labels[product["status"]]}</p><h2>{esc(product["name"])}</h2>
<p class="summary">{esc(product["summary"])}</p><p>{esc(product["description"])}</p>
<p>{price_prefix}: {price} {esc(product["price"]["currency"])}. Marketplace charges may apply.</p>
{lists}<nav aria-label="{esc(product["name"])} links">{" ".join(links)}</nav>
<p class="version">Version {esc(product["version"])} · Updated {esc(product["updated_at"])}</p></article>''')
    return '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digital products by Yernar Ibadulla</title>
<meta name="description" content="Explore digital products by Yernar Ibadulla: live demos, included files, requirements, limitations and verified availability.">
<link rel="canonical" href="https://yernaribadulla.github.io/portfolio/products/">
<style>body{margin:0;background:#f5f4ef;color:#20252a;font:17px/1.65 system-ui,sans-serif}main{max-width:920px;margin:auto;padding:32px 20px}h1,h2,h3{line-height:1.2}h1{font-size:clamp(2rem,5vw,3rem)}article{padding:28px;margin:28px 0;background:#fff;border:1px solid #d8ddd8;border-radius:16px}img{width:100%;height:auto;border-radius:8px}a{color:#14553c;text-underline-offset:3px}nav{display:flex;gap:18px;flex-wrap:wrap}.status,.version{font-size:.9rem;color:#4b6255}.summary{font-weight:600}li{margin:7px 0}footer{margin-top:32px;font-size:.9rem}</style>
</head><body><main><a href="../">← Portfolio</a><h1>Digital products</h1>
<p>Explore the demos, check requirements and see each product’s current availability. Purchase links appear only when an item is available.</p>
''' + "\n".join(cards) + '''
<footer>This page is generated from the same product catalog as the interactive portfolio. No JavaScript is required.</footer>
</main></body></html>\n'''


def finance_report(ledger, catalog=None):
    require(isinstance(ledger, dict) and ledger.get("schema_version") == 1, "ledger schema_version must be 1")
    currency = ledger.get("currency")
    money("0", currency)
    product_id = ledger.get("product_id")
    require(isinstance(product_id, str) and ID.fullmatch(product_id), "ledger product_id required")
    product_status = None
    if catalog is not None:
        matches = [product for product in validate_catalog(catalog)["products"] if product["id"] == product_id]
        require(len(matches) == 1, "ledger product_id missing from catalog")
        product_status = matches[0]["status"]
    require(isinstance(ledger.get("account"), str) and ledger["account"].strip(), "one ledger account required")
    period = ledger.get("period", {})
    start, end = timestamp(period.get("start")), timestamp(period.get("end"))
    require(start <= end, "invalid ledger period")
    require(isinstance(ledger.get("events"), list), "ledger events array required")
    events, ids, transactions, balance_times = [], set(), set(), set()
    for event in ledger["events"]:
        require(isinstance(event, dict), "event object required")
        event_id = event.get("id", "")
        require(isinstance(event_id, str) and ID.fullmatch(event_id) and event_id not in ids, "invalid or duplicate event id")
        ids.add(event_id)
        kind = event.get("type")
        require(kind in KINDS, "invalid event type")
        require(event.get("currency") == currency, "mixed currency ledger; create a separate ledger")
        amount = money(event.get("amount"), currency)
        occurred = timestamp(event.get("occurred_at"))
        observed = evidence(event.get("evidence"))
        require(start <= occurred <= end and occurred <= observed, "event timestamp outside period or after observation")
        if kind in {"sale", "refund", "fee", "payout"}:
            reference = event.get("transaction_id")
            require(isinstance(reference, str) and reference.strip(), "transaction_id required")
            key = (kind, reference)
            require(key not in transactions, "duplicate transaction under a different event id")
            transactions.add(key)
        if kind == "balance":
            require(occurred not in balance_times, "ambiguous duplicate balance timestamp")
            balance_times.add(occurred)
        events.append((event, amount, occurred))
    coverage = ledger.get("coverage", {})
    require(isinstance(coverage, dict) and set(coverage) <= KINDS - {"forecast", "balance"}, "invalid coverage keys")
    for kind, item in coverage.items():
        require(isinstance(item, dict) and item.get("complete") is True, "coverage entries must explicitly attest completeness")
        require(evidence(item.get("evidence")) >= end, "complete-period evidence predates period end")
    observations = ledger.get("observations", [])
    require(isinstance(observations, list), "observations must be an array")
    observed_metrics = {"views": None, "purchase_clicks": None}
    observed_times = {}
    for observation in observations:
        require(isinstance(observation, dict), "observation object required")
        observation_id = observation.get("id", "")
        require(isinstance(observation_id, str) and ID.fullmatch(observation_id) and observation_id not in ids, "invalid or duplicate observation id")
        ids.add(observation_id)
        metric = observation.get("metric")
        require(metric in observed_metrics, "unsupported observation metric")
        count = observation.get("value")
        require(isinstance(count, int) and not isinstance(count, bool) and count >= 0, "observation value must be a nonnegative integer")
        window = observation.get("period", {})
        window_start, window_end = timestamp(window.get("start")), timestamp(window.get("end"))
        observed = timestamp(observation.get("observed_at"))
        require(start <= window_start <= window_end <= end and window_end <= observed <= evidence(observation.get("evidence")), "invalid observation period or evidence timestamp")
        require((metric, observed) not in observed_times, "ambiguous observation snapshot timestamp")
        observed_times[(metric, observed)] = True
        previous = observed_metrics[metric]
        if previous is None or observed > timestamp(previous["observed_at"]):
            observed_metrics[metric] = copy.deepcopy(observation)
    totals = {}
    for kind in KINDS - {"balance"}:
        values = [amount for event, amount, _ in events if event["type"] == kind]
        totals[kind] = sum(values, Decimal("0.00")) if values or kind in coverage else None
    balances = sorted((occurred, amount) for event, amount, occurred in events if event["type"] == "balance")
    net = totals["sale"] - totals["refund"] - totals["fee"] if {"sale", "refund", "fee"} <= set(coverage) else None
    encode = lambda value: format(value, ".2f") if value is not None else None
    return {"schema_version": 1, "product_id": product_id, "product_status_from_catalog": product_status,
            "account": ledger["account"], "currency": currency, "observations": observed_metrics,
            "period": period, "forecast": encode(totals["forecast"]),
            "accrued_sales": encode(totals["sale"]), "refunds": encode(totals["refund"]),
            "fees": encode(totals["fee"]), "accrued_net": encode(net),
            "available_balance": encode(balances[-1][1]) if balances else None,
            "balance_as_of": balances[-1][0].isoformat() if balances else None,
            "cash_received": encode(totals["payout"]),
            "confirmed_sale_count": sum(event["type"] == "sale" for event, _, _ in events) if totals["sale"] is not None else None,
            "complete_categories": sorted(coverage),
            "event_count": len(events),
            "notes": ["Amounts without completeness evidence are observed subtotals, not full-period totals.",
                      "Forecasts are assumptions, not revenue. Sales and payouts must never be added together.",
                      "Balance is the latest observed snapshot, not a computed sale-minus-payout balance.",
                      "Evidence references are supplied by the operator; this tool cannot independently authenticate them."]}


def make_package(source, allowlist, destination):
    root = Path(source).resolve(strict=True)
    require(root.is_dir(), "package source must be a directory")
    require(isinstance(allowlist, dict) and allowlist.get("schema_version") == 1, "allowlist schema_version must be 1")
    files = allowlist.get("files")
    require(isinstance(files, list) and len(files) > 0, "explicit nonempty files allowlist required; globs are not supported")
    selected, seen = [], set()
    for name in files:
        path = relative_path(name)
        require(name.casefold() not in seen, "duplicate or case-colliding package path")
        seen.add(name.casefold())
        parts = [part.lower() for part in path.parts]
        require(not any(part in DENIED_PARTS or part.startswith(".") for part in parts), "development/hidden directory forbidden")
        require(path.name.lower() not in DENIED_NAMES and path.suffix.lower() in ALLOWED_EXTENSIONS, "file type or development file forbidden")
        require(not re.search(r"(?:secret|credential|token|ledger|finance|private|\.env|vite\.config|playwright\.config)", name, re.I), "sensitive/development filename forbidden")
        candidate = root
        for part in path.parts:
            candidate = candidate / part
            require(not candidate.is_symlink() and not (hasattr(candidate, "is_junction") and candidate.is_junction()), "symlinks/junctions forbidden")
        resolved = candidate.resolve(strict=True)
        require(resolved.is_relative_to(root) and resolved.is_file(), "allowlist path escapes source or is not a file")
        data = resolved.read_bytes()
        require(not re.search(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}", data), "possible credential found; package blocked")
        selected.append((name, data))
    selected.sort(key=lambda item: item[0])
    target = Path(destination).resolve()
    require(target.suffix.lower() == ".zip", "destination must be .zip")
    require(not target.exists(), "refusing to overwrite an existing archive")
    manifest = "".join(f"{hashlib.sha256(data).hexdigest()}  {name}\n" for name, data in selected).encode("utf-8")
    target.parent.mkdir(parents=True, exist_ok=True)
    # ZIP_STORED avoids compressor-version differences; fixed metadata yields identical bytes.
    with zipfile.ZipFile(target, "x", compression=zipfile.ZIP_STORED) as archive:
        for name, data in selected + [("MANIFEST.sha256", manifest)]:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    return {"archive": str(target), "sha256": hashlib.sha256(target.read_bytes()).hexdigest(), "files": len(selected), "manifest": "MANIFEST.sha256"}


def outside_repo(path):
    result = Path(path).resolve()
    require(not result.is_relative_to(REPO), "private financial files must be outside this repository")
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate")
    validate.add_argument("--catalog", default=str(REPO / "public/products.json"))
    render = commands.add_parser("render-catalog")
    render.add_argument("--catalog", default=str(REPO / "public/products.json"))
    render.add_argument("--out", default=str(REPO / "public/products/index.html"))
    package = commands.add_parser("package")
    package.add_argument("--source", required=True)
    package.add_argument("--allowlist", required=True)
    package.add_argument("--out", required=True)
    report = commands.add_parser("report")
    report.add_argument("--ledger", required=True)
    report.add_argument("--out", required=True, help="private output outside repository; no financial values printed")
    report.add_argument("--catalog", help="optional public catalog for product lifecycle status only")
    update = commands.add_parser("catalog-update")
    update.add_argument("--catalog", default=str(REPO / "public/products.json"))
    update.add_argument("--id", required=True)
    update.add_argument("--status", choices=["draft", "in_review", "available", "paused"], required=True)
    update.add_argument("--purchase-url", default=None)
    update.add_argument("--updated-at", required=True)
    update.add_argument("--approval-evidence", help="local JSON evidence object; required for available")
    update.add_argument("--limitations-json", help="reviewed JSON string array; update stale moderation wording when status changes")
    update.add_argument("--apply", action="store_true", help="write local catalog only; never publish")
    args = parser.parse_args(argv)
    try:
        if args.command == "validate":
            data = validate_catalog(read_json(args.catalog))
            print(emit({"valid": True, "products": len(data["products"])}), end="")
        elif args.command == "render-catalog":
            result = render_catalog(read_json(args.catalog))
            output = Path(args.out)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(result, encoding="utf-8")
            print("Static product catalog rendered from the single catalog source.")
        elif args.command == "package":
            print(emit(make_package(args.source, read_json(args.allowlist), args.out)), end="")
        elif args.command == "report":
            ledger_path, output = outside_repo(args.ledger), outside_repo(args.out)
            require(ledger_path != output, "report cannot overwrite ledger")
            result = finance_report(read_json(ledger_path), read_json(args.catalog) if args.catalog else None)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(emit(result), encoding="utf-8")
            print("Private report written outside repository; no financial values logged.")
        else:
            approval = read_json(args.approval_evidence) if args.approval_evidence else None
            limitations = read_json(args.limitations_json) if args.limitations_json else None
            result = update_catalog(read_json(args.catalog), args.id, args.status, args.purchase_url, args.updated_at, approval, limitations)
            if args.apply:
                Path(args.catalog).write_text(emit(result), encoding="utf-8")
            print(emit({"applied_locally": args.apply, "published": False, "catalog": result}), end="")
        return 0
    except (ValueError, OSError, KeyError, TypeError) as exc:
        # Never include financial content or evidence paths in CI/stdout.
        print(f"Validation failed: {exc}" if args.command != "report" else "Private ledger validation failed; inspect the source privately.", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

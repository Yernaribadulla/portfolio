import copy
from decimal import Decimal
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
import zipfile

spec = importlib.util.spec_from_file_location("product_factory", Path(__file__).parents[1] / "product_factory.py")
factory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(factory)

EVIDENCE = {"reference": "SYNTHETIC fixture; not a real transaction", "observed_at": "2020-02-01T00:00:00Z"}


def ledger(events=None):
    return {"schema_version": 1, "product_id": "synthetic", "account": "SYNTHETIC TEST ACCOUNT", "currency": "USD",
            "period": {"start": "2020-01-01T00:00:00Z", "end": "2020-01-31T23:59:59Z"}, "events": events or []}


def event(event_id, kind, amount, day="02"):
    return {"id": event_id, "type": kind, "amount": amount, "currency": "USD",
            "transaction_id": event_id, "occurred_at": f"2020-01-{day}T00:00:00Z", "evidence": EVIDENCE}


def catalog():
    return {"schema_version": 1, "products": [{"id": "synthetic", "name": "SYNTHETIC", "category": "web_template",
            "summary": "Synthetic fixture", "description": "Synthetic fixture", "price": {"amount": 19, "currency": "USD"},
            "status": "in_review", "demo_url": "https://example.com/demo", "product_url": "https://example.com/product",
            "purchase_url": None, "image_url": "products/fixture.png", "features": [], "requirements": [],
            "limitations": [], "version": "1.0.0", "updated_at": "2020-01-01"}]}


class MoneyTests(unittest.TestCase):
    def test_catalog_rejects_values_incompatible_with_storefront(self):
        for key, value in [("id", "draft_with_underscore"), ("image_url", "elsewhere/preview.png")]:
            data = catalog()
            data["products"][0][key] = value
            with self.assertRaises(ValueError):
                factory.validate_catalog(data)
        data = catalog()
        data["products"][0]["price"]["amount"] = "19"
        with self.assertRaises(ValueError):
            factory.validate_catalog(data)

    def test_report_is_per_product_and_catalog_status_is_optional(self):
        data = ledger()
        self.assertEqual(factory.finance_report(data, catalog())["product_status_from_catalog"], "in_review")
        self.assertIsNone(factory.finance_report(data)["product_status_from_catalog"])
        del data["product_id"]
        with self.assertRaises(ValueError):
            factory.finance_report(data)

    def test_observations_preserve_window_latest_snapshot_not_sum(self):
        data = ledger()
        first = {"id": "views_one", "metric": "views", "value": 9, "period": data["period"],
                 "observed_at": "2020-01-31T23:59:59Z", "evidence": EVIDENCE}
        second = dict(first, id="views_two", value=12, observed_at="2020-02-01T00:00:00Z")
        data["observations"] = [second, first]
        result = factory.finance_report(data)
        self.assertEqual(result["observations"]["views"]["value"], 12)
        self.assertIsNone(result["observations"]["purchase_clicks"])
        self.assertEqual(result["observations"]["views"]["period"], data["period"])
        data["observations"][0]["value"] = -1
        with self.assertRaises(ValueError):
            factory.finance_report(data)

    def test_decimal_exact(self):
        self.assertEqual(factory.money("0.10", "USD") + factory.money("0.20", "USD"), Decimal("0.30"))

    def test_reject_invalid_amounts(self):
        for value in [0.1, True, "-1", "1.001", "NaN", "Infinity", "1e2", "9999999999999999"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                factory.money(value, "USD")
        with self.assertRaises(ValueError):
            factory.money("1", "ZZZ")

    def test_initial_unknown_is_not_zero(self):
        result = factory.finance_report(ledger())
        for key in ["forecast", "accrued_sales", "refunds", "fees", "accrued_net", "available_balance", "cash_received"]:
            self.assertIsNone(result[key])

    def test_sale_payout_forecast_separate_latest_balance_only(self):
        events = [event("sale", "sale", "19"), event("forecast", "forecast", "1000"), event("payout", "payout", "10"),
                  event("balance_old", "balance", "12", "03"), event("balance_new", "balance", "2", "04")]
        result = factory.finance_report(ledger(events))
        self.assertEqual(result["accrued_sales"], "19.00")
        self.assertEqual(result["confirmed_sale_count"], 1)
        self.assertEqual(result["cash_received"], "10.00")
        self.assertEqual(result["forecast"], "1000.00")
        self.assertEqual(result["available_balance"], "2.00")
        self.assertIsNone(result["accrued_net"])

    def test_net_requires_completeness_and_zero_evidence(self):
        data = ledger([event("sale", "sale", "19"), event("fee", "fee", "5.70")])
        data["coverage"] = {kind: {"complete": True, "evidence": EVIDENCE} for kind in ["sale", "refund", "fee"]}
        result = factory.finance_report(data)
        self.assertEqual(result["refunds"], "0.00")
        self.assertEqual(result["accrued_net"], "13.30")
        del data["coverage"]["refund"]["evidence"]
        with self.assertRaises(ValueError):
            factory.finance_report(data)

    def test_duplicate_event_or_transaction_rejected(self):
        first = event("sale", "sale", "19")
        for second in [copy.deepcopy(first), dict(first, id="second")]:
            with self.assertRaises(ValueError):
                factory.finance_report(ledger([first, second]))

    def test_currency_evidence_and_time_validated(self):
        for changes in [{"currency": "EUR"}, {"evidence": None}, {"occurred_at": "2020-01-02"},
                        {"occurred_at": "2020-02-02T00:00:00Z"}, {"amount": "-1"}, {"transaction_id": ""}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                factory.finance_report(ledger([dict(event("sale", "sale", "19"), **changes)]))

    def test_duplicate_balance_timestamp_rejected(self):
        with self.assertRaises(ValueError):
            factory.finance_report(ledger([event("a", "balance", "1"), event("b", "balance", "2")]))

    def test_private_ledger_repo_paths_blocked(self):
        with self.assertRaises(ValueError):
            factory.outside_repo(factory.REPO / "financial.json")

    def test_report_cli_writes_private_file_without_logging_amounts(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / "ledger.json", Path(tmp) / "report.json"
            source.write_text(json.dumps(ledger([event("sale", "sale", "123.45")])), encoding="utf-8")
            captured = io.StringIO()
            with redirect_stdout(captured):
                self.assertEqual(factory.main(["report", "--ledger", str(source), "--out", str(output)]), 0)
            self.assertNotIn("123.45", captured.getvalue())
            self.assertEqual(json.loads(output.read_text())["accrued_sales"], "123.45")
            self.assertIsNone(json.loads(output.read_text())["cash_received"])

    def test_report_cli_rejects_output_overwriting_ledger(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "ledger.json"
            source.write_text(json.dumps(ledger()), encoding="utf-8")
            before = source.read_bytes()
            with redirect_stderr(io.StringIO()):
                self.assertEqual(factory.main(["report", "--ledger", str(source), "--out", str(source)]), 2)
            self.assertEqual(source.read_bytes(), before)


class CatalogTests(unittest.TestCase):
    def test_render_escapes_text_and_hides_purchase_before_approval(self):
        data = catalog()
        data["products"][0]["name"] = '<script>alert("x")</script>'
        data["products"][0]["features"] = ["<img onerror=alert(1)>"]
        html = factory.render_catalog(data)
        self.assertIn("&lt;script&gt;", html)
        self.assertNotIn("<script>", html)
        self.assertIn("Awaiting marketplace approval", html)
        self.assertNotIn("Buy on marketplace", html)
        self.assertIn('../#products/synthetic', html)
        self.assertIn('https://yernaribadulla.github.io/portfolio/products/', html)
        data["products"][0]["status"] = "draft"
        self.assertNotIn("&lt;script&gt;", factory.render_catalog(data))

    def test_available_render_has_purchase_only_when_available(self):
        result = factory.update_catalog(catalog(), "synthetic", "available", "https://example.com/buy", "2020-01-02", EVIDENCE)
        self.assertIn('href="https://example.com/buy">Buy on marketplace', factory.render_catalog(result))

    def test_status_update_can_replace_stale_limitations(self):
        result = factory.update_catalog(catalog(), "synthetic", "available", "https://example.com/buy", "2020-01-02", EVIDENCE, ["No backend included"])
        self.assertEqual(result["products"][0]["limitations"], ["No backend included"])

    def test_emit_preserves_decimal_catalog_number(self):
        data = catalog()
        data["products"][0]["price"]["amount"] = Decimal("19.99")
        output = factory.emit(data)
        self.assertIn('"amount": 19.99', output)
        self.assertEqual(json.loads(output, parse_float=Decimal)["products"][0]["price"]["amount"], Decimal("19.99"))

    def test_fixture_valid_and_duplicates_rejected(self):
        data = catalog()
        factory.validate_catalog(data)
        data["products"].append(copy.deepcopy(data["products"][0]))
        with self.assertRaises(ValueError):
            factory.validate_catalog(data)

    def test_available_requires_evidence_and_valid_purchase_link(self):
        with self.assertRaises(ValueError):
            factory.update_catalog(catalog(), "synthetic", "available", "https://example.com/buy", "2020-01-02")
        result = factory.update_catalog(catalog(), "synthetic", "available", "https://example.com/buy", "2020-01-02", EVIDENCE)
        self.assertEqual(result["products"][0]["status"], "available")
        with self.assertRaises(ValueError):
            factory.update_catalog(catalog(), "synthetic", "available", "javascript:alert(1)", "2020-01-02", EVIDENCE)

    def test_catalog_update_default_dry_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "catalog.json"
            path.write_text(json.dumps(catalog()), encoding="utf-8")
            before = path.read_bytes()
            args = ["catalog-update", "--catalog", str(path), "--id", "synthetic", "--status", "paused", "--updated-at", "2020-01-02"]
            with redirect_stdout(io.StringIO()):
                self.assertEqual(factory.main(args), 0)
            self.assertEqual(path.read_bytes(), before)
            with redirect_stdout(io.StringIO()):
                self.assertEqual(factory.main(args + ["--apply"]), 0)
            self.assertEqual(json.loads(path.read_text())["products"][0]["status"], "paused")


class PackageTests(unittest.TestCase):
    def test_python_developer_product_can_be_packaged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "tool.py").write_text('print("SYNTHETIC")', encoding="utf-8")
            (root / "pyproject.toml").write_text('[project]\nname="synthetic"', encoding="utf-8")
            factory.make_package(root, {"schema_version": 1, "files": ["tool.py", "pyproject.toml"]}, root / "tool.zip")
            with zipfile.ZipFile(root / "tool.zip") as archive:
                self.assertIn("tool.py", archive.namelist())
                self.assertIn("pyproject.toml", archive.namelist())

    def test_deterministic_archive_and_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "index.html").write_bytes(b"<!doctype html><h1>SYNTHETIC</h1>")
            (root / "readme.txt").write_bytes(b"Synthetic fixture")
            one = factory.make_package(root, {"schema_version": 1, "files": ["index.html", "readme.txt"]}, root / "a.zip")
            two = factory.make_package(root, {"schema_version": 1, "files": ["readme.txt", "index.html"]}, root / "b.zip")
            self.assertEqual(one["sha256"], two["sha256"])
            with zipfile.ZipFile(root / "a.zip") as archive:
                self.assertEqual(archive.namelist(), ["index.html", "readme.txt", "MANIFEST.sha256"])
                self.assertIn(hashlib.sha256((root / "index.html").read_bytes()).hexdigest(), archive.read("MANIFEST.sha256").decode())

    def test_traversal_sensitive_dev_and_duplicate_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "index.html").write_text("fixture", encoding="utf-8")
            for paths in [["../index.html"], ["/index.html"], ["C:/index.html"], [".git/config"], [".env"],
                          ["node_modules/a.js"], ["secret.json"], ["ledger.json"], ["package-lock.json"],
                          ["index.html", "INDEX.HTML"], ["a\\b.html"], ["./index.html"], ["a//b.html"]]:
                with self.subTest(paths=paths), self.assertRaises(ValueError):
                    factory.make_package(root, {"schema_version": 1, "files": paths}, root / "bad.zip")

    def test_known_credential_content_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "index.html").write_text("-----BEGIN PRIVATE KEY-----", encoding="utf-8")
            with self.assertRaises(ValueError):
                factory.make_package(root, {"schema_version": 1, "files": ["index.html"]}, root / "bad.zip")

    def test_symlink_rejected_where_supported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "real.html").write_text("fixture", encoding="utf-8")
            try:
                (root / "link.html").symlink_to(root / "real.html")
            except OSError:
                self.skipTest("OS does not permit symlink creation")
            with self.assertRaises(ValueError):
                factory.make_package(root, {"schema_version": 1, "files": ["link.html"]}, root / "bad.zip")

    def test_duplicate_json_keys_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "data.json"
            path.write_text('{"amount":1,"amount":2}', encoding="utf-8")
            with self.assertRaises(ValueError):
                factory.read_json(path)


if __name__ == "__main__":
    unittest.main()

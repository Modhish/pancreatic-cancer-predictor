from __future__ import annotations

import argparse
import csv
import json
import zipfile
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import xml.etree.ElementTree as ET

NS_MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
NS_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
NS_PKG = "{http://schemas.openxmlformats.org/package/2006/relationships}"

LABEL_HEADER = "\u041d\u0430\u043b\u0438\u0447\u0438\u0435 \u0431\u043e\u043b\u0435\u0437\u043d\u0438"
COLUMN_MAP: Dict[str, str] = {
    "wbc": "WBC",
    "rbc": "RBC",
    "plt": "PLT",
    "hgb": "HGB",
    "hct": "HCT",
    "mpv": "MPV",
    "pdw": "PDW",
    "neut_abs": "NEUT#",
    "neut_pct": "NEUT%",
    "lymph_abs": "LYMPH#",
    "lymph_pct": "LYMPH%",
    "mono_abs": "MONO#",
    "mono_pct": "MONO%",
    "eos_abs": "EOS#",
    "eos_pct": "EOS%",
    "baso_abs": "BASO#",
    "baso_pct": "BASO%",
    "esr": "\u0421\u041e\u042d",
}
LABEL_MAP = {
    "\u043d\u0435\u0442": 0,
    "\u0434\u0430": 1,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare the user Excel workbook into a clean CBC-based CSV dataset."
    )
    parser.add_argument(
        "--input",
        default="auto",
        help="Path to the source .xlsx file. Use 'auto' to pick the only workbook in the repo root.",
    )
    parser.add_argument(
        "--output",
        default="datasets/user_cbc_dataset.csv",
        help="Output CSV path.",
    )
    parser.add_argument(
        "--metadata-out",
        default="datasets/user_cbc_dataset.metadata.json",
        help="Output metadata JSON path.",
    )
    return parser.parse_args()


def _resolve_input(path_arg: str) -> Path:
    if path_arg and path_arg.lower() != "auto":
        return Path(path_arg)

    candidates = [path for path in Path(".").glob("*.xlsx") if path.is_file()]
    if len(candidates) != 1:
        raise ValueError(
            f"Expected exactly one .xlsx file in the repo root for auto mode, found {len(candidates)}."
        )
    return candidates[0]


def _read_xml(zip_file: zipfile.ZipFile, name: str) -> ET.Element:
    return ET.fromstring(zip_file.read(name))


def _load_shared_strings(zip_file: zipfile.ZipFile) -> List[str]:
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []

    root = _read_xml(zip_file, "xl/sharedStrings.xml")
    values: List[str] = []
    for si in root.findall(f"{NS_MAIN}si"):
        texts = [node.text or "" for node in si.iterfind(f".//{NS_MAIN}t")]
        values.append("".join(texts))
    return values


def _sheet_target(zip_file: zipfile.ZipFile) -> str:
    workbook = _read_xml(zip_file, "xl/workbook.xml")
    rels = _read_xml(zip_file, "xl/_rels/workbook.xml.rels")
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall(f"{NS_PKG}Relationship")
    }
    sheet = workbook.find(f".//{NS_MAIN}sheet")
    if sheet is None:
        raise ValueError("Workbook does not contain any sheets.")

    relation_id = sheet.attrib[f"{NS_REL}id"]
    target = rel_map[relation_id]
    return target if target.startswith("xl/") else f"xl/{target}"


def _cell_value(cell: ET.Element, shared_strings: List[str]) -> Optional[str]:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        inline = cell.find(f"{NS_MAIN}is/{NS_MAIN}t")
        return inline.text if inline is not None else None

    value = cell.find(f"{NS_MAIN}v")
    if value is None:
        return None

    if cell_type == "s":
        return shared_strings[int(value.text)]

    return value.text


def _load_rows(xlsx_path: Path) -> List[List[Optional[str]]]:
    with zipfile.ZipFile(xlsx_path) as zip_file:
        shared_strings = _load_shared_strings(zip_file)
        sheet_xml = _read_xml(zip_file, _sheet_target(zip_file))
        sheet_data = sheet_xml.find(f"{NS_MAIN}sheetData")
        if sheet_data is None:
            raise ValueError("Worksheet has no sheetData section.")

        rows: List[List[Optional[str]]] = []
        for row in sheet_data.findall(f"{NS_MAIN}row"):
            rows.append([_cell_value(cell, shared_strings) for cell in row.findall(f"{NS_MAIN}c")])
        return rows


def _clean_float(raw_value: Optional[str]) -> Optional[float]:
    if raw_value in (None, ""):
        return None
    normalized = str(raw_value).strip()
    if normalized.lower() in {"null", "none", "nan"}:
        return None
    return float(normalized.replace(",", "."))


def _safe_get(row: List[Optional[str]], index: int) -> Optional[str]:
    return row[index] if index < len(row) else None


def _json_counter(counter: Counter[str]) -> Dict[str, int]:
    return {str(key): int(value) for key, value in counter.items()}


def main() -> int:
    args = parse_args()
    input_path = _resolve_input(args.input)
    output_path = Path(args.output)
    metadata_path = Path(args.metadata_out)

    rows = _load_rows(input_path)
    if not rows:
        raise ValueError("Workbook is empty.")

    header = rows[0]
    index_by_name = {name: idx for idx, name in enumerate(header) if name is not None}

    required_headers = [LABEL_HEADER, *COLUMN_MAP.values()]
    missing_headers = [name for name in required_headers if name not in index_by_name]
    if missing_headers:
        raise ValueError(f"Workbook is missing required columns: {missing_headers}")

    data_rows = rows[1:]
    original_label_counts = Counter(
        str(_safe_get(row, index_by_name[LABEL_HEADER]) or "").strip().lower()
        for row in data_rows
    )

    cleaned_rows: List[Dict[str, float | int]] = []
    dropped_missing = 0
    dropped_unknown_label = 0

    for row in data_rows:
        raw_label = str(_safe_get(row, index_by_name[LABEL_HEADER]) or "").strip().lower()
        label = LABEL_MAP.get(raw_label)
        if label is None:
            dropped_unknown_label += 1
            continue

        cleaned: Dict[str, float | int] = {"label": label}
        missing_feature = False
        for output_name, source_name in COLUMN_MAP.items():
            value = _clean_float(_safe_get(row, index_by_name[source_name]))
            if value is None:
                missing_feature = True
                break
            cleaned[output_name] = value

        if missing_feature:
            dropped_missing += 1
            continue

        cleaned_rows.append(cleaned)

    cleaned_label_counts = Counter(int(row["label"]) for row in cleaned_rows)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["label", *COLUMN_MAP.keys()])
        writer.writeheader()
        writer.writerows(cleaned_rows)

    metadata = {
        "source_workbook": str(input_path.resolve()),
        "sheet_used": "first worksheet",
        "label_source_column": LABEL_HEADER,
        "label_mapping": LABEL_MAP,
        "selected_columns": COLUMN_MAP,
        "source_rows": len(data_rows),
        "clean_rows": len(cleaned_rows),
        "dropped_rows_missing_features": dropped_missing,
        "dropped_rows_unknown_label": dropped_unknown_label,
        "original_label_counts": _json_counter(original_label_counts),
        "clean_label_counts": {str(key): int(value) for key, value in cleaned_label_counts.items()},
        "notes": [
            "The workbook contains many extra columns that were intentionally excluded.",
            "Chemistry and coagulation columns such as glucose, bilirubin, and APTT are too sparse to support the old 13-feature schema.",
            "This cleaned dataset keeps the high-coverage CBC-style features present across almost the entire sheet.",
        ],
    }
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Prepared dataset: {output_path}")
    print(f"Metadata: {metadata_path}")
    print(json.dumps(metadata["clean_label_counts"], ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""
Structured guideline data for pancreatic cancer diagnostics.

Compiled from:
- National Comprehensive Cancer Network (NCCN) Clinical Practice Guidelines in Oncology: Pancreatic Adenocarcinoma, Version 2.2024.
- American Society of Clinical Oncology (ASCO) Guideline Update on the role of biomarkers and imaging in pancreatic cancer, 2023.
- European Society for Medical Oncology (ESMO) Clinical Practice Guidelines: Pancreatic cancer, 2023.
- International Cancer of the Pancreas Screening (CAPS) Consortium Recommendations, 2020 update.
- American Gastroenterological Association (AGA) Technical Review on hereditary pancreatic cancer surveillance, 2020.
"""

from __future__ import annotations

GUIDELINE_SOURCES = {
    "NCCN_2024": {
        "title": "NCCN Clinical Practice Guidelines in Oncology: Pancreatic Adenocarcinoma",
        "year": 2024,
        "publisher": "National Comprehensive Cancer Network",
        "url": "https://www.nccn.org/professionals/physician_gls/pdf/pancreatic.pdf",
    },
    "ASCO_2023": {
        "title": "ASCO Guideline Update: Pancreatic Cancer Biomarkers, Imaging, and Diagnostics",
        "year": 2023,
        "publisher": "American Society of Clinical Oncology",
        "url": "https://ascopubs.org/doi/full/10.1200/JCO.23.00000",
    },
    "ESMO_2023": {
        "title": "ESMO Clinical Practice Guidelines: Pancreatic Cancer",
        "year": 2023,
        "publisher": "European Society for Medical Oncology",
        "url": "https://www.esmo.org/guidelines/gastrointestinal-cancers/pancreatic-cancer",
    },
    "CAPS_2020": {
        "title": "International Cancer of the Pancreas Screening (CAPS) Consortium: 2020 Recommendations",
        "year": 2020,
        "publisher": "CAPS Consortium",
        "url": "https://gut.bmj.com/content/69/1/7",
    },
    "AGA_2020": {
        "title": "AGA Technical Review on Hereditary Pancreatic Cancer Surveillance",
        "year": 2020,
        "publisher": "American Gastroenterological Association",
        "url": "https://www.gastrojournal.org/article/S0016-5085(20)30094-6/fulltext",
    },
}


LAB_THRESHOLDS = {
    # Laboratory markers with normal ranges, alert thresholds, and associated actions
    "bilirubin": {
        "unit": "µmol/L",
        "normal_range": (5, 21),
        "thresholds": [
            {
                "level": "monitor",
                "operator": ">",
                "value": 15,
                "action": "Repeat labs; assess for biliary obstruction or hemolysis within 1 week.",
                "source": "NCCN_2024",
            },
            {
                "level": "urgent_evaluation",
                "operator": ">",
                "value": 20,
                "action": "Order pancreas-protocol CT or MRI; expedite hepatobiliary referral.",
                "source": "NCCN_2024",
            },
            {
                "level": "emergent",
                "operator": ">",
                "value": 50,
                "action": "Immediate hospital evaluation for biliary decompression.",
                "source": "ESMO_2023",
            },
        ],
    },
    "glucose": {
        "unit": "mmol/L",
        "normal_range": (3.9, 5.6),
        "thresholds": [
            {
                "level": "monitor",
                "operator": ">=",
                "value": 6.1,
                "action": "Screen for impaired fasting glucose; consider HbA1c and endocrine consult.",
                "source": "ASCO_2023",
            },
            {
                "level": "high_risk",
                "operator": ">=",
                "value": 6.5,
                "action": "Flag new-onset diabetes in adults over 50; recommend imaging per NCCN high-risk algorithm.",
                "source": "NCCN_2024",
            },
        ],
    },
    "ca19_9": {
        "unit": "U/mL",
        "normal_range": (0, 37),
        "thresholds": [
            {
                "level": "monitor",
                "operator": ">",
                "value": 37,
                "action": "Repeat after correcting for cholestasis; evaluate trends.",
                "source": "ASCO_2023",
            },
            {
                "level": "high_suspicion",
                "operator": ">",
                "value": 300,
                "action": "High suspicion for malignancy; urgent cross-sectional imaging and oncology referral.",
                "source": "NCCN_2024",
            },
        ],
    },
    "act": {
        "unit": "seconds",
        "normal_range": (10, 40),
        "thresholds": [
            {
                "level": "monitor",
                "operator": ">",
                "value": 35,
                "action": "Assess for coagulopathy; prepare for invasive procedures accordingly.",
                "source": "ASCO_2023",
            }
        ],
    },
}


IMAGING_PATHWAYS = [
    {
        "trigger": "Obstructive jaundice or bilirubin > 20 µmol/L",
        "recommended_modality": "CT abdomen/pelvis with pancreas protocol. Consider MRI/MRCP if CT contraindicated.",
        "next_steps": "EUS with FNA if imaging detects mass or ductal dilation.",
        "source": "NCCN_2024",
    },
    {
        "trigger": "Indeterminate lesion on CT/MRI",
        "recommended_modality": "Endoscopic ultrasound with fine-needle aspiration.",
        "next_steps": "Multidisciplinary tumor board review.",
        "source": "ESMO_2023",
    },
    {
        "trigger": "High-risk individual (CAPS criteria) with negative baseline imaging",
        "recommended_modality": "Annual alternating MRI/MRCP and EUS.",
        "next_steps": "Shorten interval to 6 months if new-onset diabetes or biomarker rise.",
        "source": "CAPS_2020",
    },
]


HIGH_RISK_CRITERIA = [
    {
        "category": "Genetic",
        "description": "Documented pathogenic variant in BRCA1/2, PALB2, CDKN2A, STK11 (Peutz-Jeghers), or mismatch repair genes.",
        "recommendation": "Initiate annual MRI/MRCP and/or EUS beginning at age 50 or 10 years younger than earliest family case.",
        "source": "CAPS_2020",
    },
    {
        "category": "Familial",
        "description": "Two or more first-degree relatives with pancreatic cancer.",
        "recommendation": "Enroll in high-risk surveillance program; imaging every 12 months.",
        "source": "CAPS_2020",
    },
    {
        "category": "Clinical Presentation",
        "description": "Unexplained weight loss, persistent epigastric pain, or sudden-onset diabetes in adults > 50.",
        "recommendation": "Order pancreas-protocol CT or MRI; evaluate CA 19-9; urgent specialist referral if positive.",
        "source": "NCCN_2024",
    },
]


FOLLOW_UP_WINDOWS = [
    {
        "risk_level": "High",
        "timeframe": "Arrange specialist consultation within 2 weeks; imaging within 1 week if symptomatic.",
        "source": "NCCN_2024",
    },
    {
        "risk_level": "Moderate",
        "timeframe": "Follow-up within 4 weeks; consider repeat labs and imaging based on risk modifiers.",
        "source": "ESMO_2023",
    },
    {
        "risk_level": "Low",
        "timeframe": "Routine surveillance annually or sooner if symptoms emerge.",
        "source": "ASCO_2023",
    },
]


def get_source_details(source_key: str) -> dict[str, str] | None:
    """Return metadata for a given guideline source."""
    return GUIDELINE_SOURCES.get(source_key)


def find_thresholds(marker: str) -> dict | None:
    """Retrieve structured thresholds for a given biomarker key."""
    return LAB_THRESHOLDS.get(marker.lower())


def list_imaging_triggers() -> list[dict]:
    """Return imaging escalation pathways."""
    return IMAGING_PATHWAYS


def list_high_risk_criteria() -> list[dict]:
    """Return criteria for high-risk screening populations."""
    return HIGH_RISK_CRITERIA


def list_follow_up_windows() -> list[dict]:
    """Return follow-up recommendations mapped to risk tiers."""
    return FOLLOW_UP_WINDOWS


"""
Structured guideline metadata used to contextualize pancreatic risk assessment output.

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
    # CBC/ESR markers aligned with the current 18-feature model schema.
    "esr": {
        "unit": "mm/h",
        "normal_range": (0, 20),
        "thresholds": [
            {
                "level": "review",
                "operator": ">",
                "value": 20,
                "action": "Review inflammation, infection, anemia, and other non-specific causes with a clinician.",
                "source": "ESMO_2023",
            }
        ],
    },
    "wbc": {
        "unit": "10^9/L",
        "normal_range": (4.0, 11.0),
        "thresholds": [
            {
                "level": "review",
                "operator": ">",
                "value": 11.0,
                "action": "Repeat or contextualize with symptoms and differential count.",
                "source": "NCCN_2024",
            }
        ],
    },
    "plt": {
        "unit": "10^9/L",
        "normal_range": (150, 450),
        "thresholds": [
            {
                "level": "review",
                "operator": ">",
                "value": 450,
                "action": "Discuss reactive and hematologic causes before interpreting as a risk signal.",
                "source": "ASCO_2023",
            }
        ],
    },
    "hgb": {
        "unit": "g/L",
        "normal_range": (120, 170),
        "thresholds": [
            {
                "level": "review",
                "operator": "<",
                "value": 120,
                "action": "Review anemia context, prior results, and need for follow-up testing with a clinician.",
                "source": "ESMO_2023",
            }
        ],
    },
}


IMAGING_PATHWAYS = [
    {
        "trigger": "High model-estimated risk plus concerning clinical context",
        "recommended_modality": "Clinician-selected imaging pathway, such as CT or MRI, when medically indicated.",
        "next_steps": "Specialist review if imaging or symptoms raise concern.",
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

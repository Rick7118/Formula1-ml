"""
F1-ML Web Data Builder
======================

Builds the JSON datasets used by the F1-ML portfolio website.

Project structure:

D:\\projects\\F1story\\
├── Formula1-ML.ipynb
├── web_data_builder.py
├── f1_full_data.csv
├── f1_xgb_model.pkl
├── f1_cache\\
├── data\\
│   └── web\\
└── frontend\\
    └── public\\
        └── data\\

The script writes every JSON file to BOTH:

    data/web/
    frontend/public/data/

The first is the canonical data location.
The second is the location Next.js can serve publicly.
"""

from __future__ import annotations

import json
from pathlib import Path

import fastf1
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


# ============================================================================
# PATHS
# ============================================================================

ROOT = Path(__file__).resolve().parent

DATA_FILE = ROOT / "f1_full_data.csv"
MODEL_FILE = ROOT / "f1_xgb_model.pkl"
CACHE_DIR = ROOT / "f1_cache"

WEB_DIR = ROOT / "data" / "web"
PUBLIC_DATA_DIR = ROOT / "frontend" / "public" / "data"


# ============================================================================
# HELPERS
# ============================================================================

def ensure_output_directories() -> None:
    """Create both web-data directories."""

    WEB_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    PUBLIC_DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )


def check_required_files() -> None:
    """Make sure the existing ML outputs are available."""

    missing = []

    if not DATA_FILE.exists():
        missing.append(DATA_FILE)

    if not MODEL_FILE.exists():
        missing.append(MODEL_FILE)

    if missing:
        print()
        print("ERROR: Required project files are missing:")

        for path in missing:
            print(f"  - {path}")

        print()
        raise FileNotFoundError(
            "Required ML output files were not found."
        )


def clean_json_value(value):
    """
    Convert pandas / NumPy values into strict JSON-safe values.
    """

    if isinstance(value, dict):
        return {
            str(key): clean_json_value(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            clean_json_value(item)
            for item in value
        ]

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        if not np.isfinite(value):
            return None

        return float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    return value


def write_json(
    filename: str,
    data,
) -> None:
    """
    Write one JSON file to both destinations.
    """

    ensure_output_directories()

    cleaned_data = clean_json_value(data)

    json_text = json.dumps(
        cleaned_data,
        indent=2,
        ensure_ascii=False,
        allow_nan=False,
    )

    canonical_path = WEB_DIR / filename
    frontend_path = PUBLIC_DATA_DIR / filename

    canonical_path.write_text(
        json_text,
        encoding="utf-8",
    )

    frontend_path.write_text(
        json_text,
        encoding="utf-8",
    )

    print()
    print(f"  [OK] {canonical_path}")
    print(f"  [OK] {frontend_path}")


def add_sector_seconds(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert FastF1 sector Timedelta columns into seconds.
    """

    df = df.copy()

    mappings = {
        "Sector1Time": "S1",
        "Sector2Time": "S2",
        "Sector3Time": "S3",
    }

    for source, target in mappings.items():

        if source in df.columns:

            df[target] = (
                df[source]
                .dt
                .total_seconds()
            )

    return df


def encode_columns(
    df: pd.DataFrame,
    include_session: bool = False,
):
    """
    Encode categorical ML columns.
    """

    df = df.copy()

    encoders = {}

    columns = [
        "Driver",
        "Team",
        "Compound",
    ]

    if include_session:
        columns.append("SessionType")

    for column in columns:

        if column not in df.columns:
            continue

        encoder = LabelEncoder()

        df[column] = encoder.fit_transform(
            df[column].astype(str)
        )

        encoders[column] = encoder

    if "FreshTyre" in df.columns:
        df["FreshTyre"] = (
            df["FreshTyre"]
            .astype(int)
        )

    return df, encoders


# ============================================================================
# FASTF1
# ============================================================================

def load_session(
    year: int,
    event: str,
    session_name: str,
) -> pd.DataFrame:

    print(
        f"  Loading {year} {event} {session_name}..."
    )

    session = fastf1.get_session(
        year,
        event,
        session_name,
    )

    session.load()

    laps = (
        session
        .laps
        .pick_accurate()
        .copy()
    )

    laps["LapTimeSeconds"] = (
        laps["LapTime"]
        .dt
        .total_seconds()
    )

    laps = add_sector_seconds(
        laps
    )

    return laps


# ============================================================================
# CIRCUITS
# ============================================================================

def build_circuits() -> None:

    circuits = [
        {
            "id": "bahrain",
            "name": "Bahrain",
            "year": 2024,
            "sessions": [
                "Q",
                "R",
            ],
        },
        {
            "id": "monaco",
            "name": "Monaco",
            "year": 2024,
            "sessions": [
                "Q",
                "R",
            ],
        },
        {
            "id": "monza",
            "name": "Monza",
            "year": 2024,
            "sessions": [
                "Q",
                "R",
            ],
        },
        {
            "id": "silverstone",
            "name": "Silverstone",
            "year": 2024,
            "sessions": [
                "Q",
                "R",
            ],
        },
    ]

    write_json(
        "circuits.json",
        circuits,
    )


# ============================================================================
# BAHRAIN QUALIFYING
# ============================================================================

def build_bahrain_visual_data(
    laps: pd.DataFrame,
) -> None:

    columns = [
        "Driver",
        "Team",
        "Compound",
        "TyreLife",
        "FreshTyre",
        "S1",
        "S2",
        "S3",
        "SpeedI1",
        "SpeedI2",
        "SpeedFL",
        "SpeedST",
        "LapTimeSeconds",
    ]

    available_columns = [
        column
        for column in columns
        if column in laps.columns
    ]

    clean = (
        laps[
            available_columns
        ]
        .dropna(
            subset=[
                "LapTimeSeconds"
            ]
        )
        .copy()
    )

    # ------------------------------------------------------------------------
    # ALL LAPS
    # ------------------------------------------------------------------------

    lap_records = (
        clean
        .rename(
            columns={
                "Driver": "driver",
                "Team": "team",
                "Compound": "compound",
                "TyreLife": "tyreLife",
                "FreshTyre": "freshTyre",
                "S1": "s1",
                "S2": "s2",
                "S3": "s3",
                "SpeedI1": "speedI1",
                "SpeedI2": "speedI2",
                "SpeedFL": "speedFL",
                "SpeedST": "speedST",
                "LapTimeSeconds": "lapTime",
            }
        )
        .to_dict(
            "records"
        )
    )

    write_json(
        "lap-performance.json",
        lap_records,
    )

    # ------------------------------------------------------------------------
    # BEST LAP PER DRIVER
    # ------------------------------------------------------------------------

    best_laps = (
        clean.loc[
            clean
            .groupby("Driver")[
                "LapTimeSeconds"
            ]
            .idxmin()
        ]
        .copy()
    )

    best_columns = [
        "Driver",
        "Team",
        "Compound",
        "TyreLife",
        "S1",
        "S2",
        "S3",
        "SpeedI1",
        "SpeedI2",
        "SpeedFL",
        "SpeedST",
        "LapTimeSeconds",
    ]

    best_available = [
        column
        for column in best_columns
        if column in best_laps.columns
    ]

    best_records = (
        best_laps[
            best_available
        ]
        .rename(
            columns={
                "Driver": "driver",
                "Team": "team",
                "Compound": "compound",
                "TyreLife": "tyreLife",
                "S1": "s1",
                "S2": "s2",
                "S3": "s3",
                "SpeedI1": "speedI1",
                "SpeedI2": "speedI2",
                "SpeedFL": "speedFL",
                "SpeedST": "speedST",
                "LapTimeSeconds": "lapTime",
            }
        )
        .to_dict(
            "records"
        )
    )

    write_json(
        "best-laps.json",
        best_records,
    )

    # ------------------------------------------------------------------------
    # SPEED
    # ------------------------------------------------------------------------

    speed_columns = [
        "Driver",
        "SpeedI1",
        "SpeedI2",
        "SpeedFL",
        "SpeedST",
        "LapTimeSeconds",
    ]

    speed_available = [
        column
        for column in speed_columns
        if column in best_laps.columns
    ]

    speed_records = (
        best_laps[
            speed_available
        ]
        .rename(
            columns={
                "Driver": "driver",
                "SpeedI1": "speedI1",
                "SpeedI2": "speedI2",
                "SpeedFL": "speedFL",
                "SpeedST": "speedST",
                "LapTimeSeconds": "lapTime",
            }
        )
        .to_dict(
            "records"
        )
    )

    write_json(
        "speed.json",
        speed_records,
    )


# ============================================================================
# MACHINE LEARNING
# ============================================================================

def build_ml_data(
    qualifying: pd.DataFrame,
    full_data: pd.DataFrame,
) -> None:

    model_columns = [
        "Driver",
        "Team",
        "Compound",
        "TyreLife",
        "FreshTyre",
        "S1",
        "S2",
        "S3",
        "SpeedI1",
        "SpeedI2",
        "SpeedFL",
        "SpeedST",
        "LapTimeSeconds",
    ]

    available = [
        column
        for column in model_columns
        if column in qualifying.columns
    ]

    qualifying_model = (
        qualifying[
            available
        ]
        .dropna()
        .copy()
    )

    encoded, _ = encode_columns(
        qualifying_model
    )

    X = encoded.drop(
        columns=[
            "LapTimeSeconds"
        ]
    )

    y = encoded[
        "LapTimeSeconds"
    ]

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
        )
    )

    model_with_sectors = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
    )

    model_with_sectors.fit(
        X_train,
        y_train,
    )

    prediction_with_sectors = (
        model_with_sectors.predict(
            X_test
        )
    )

    # ------------------------------------------------------------------------
    # WITHOUT SECTOR FEATURES
    # ------------------------------------------------------------------------

    X_without_sectors = (
        encoded
        .drop(
            columns=[
                "LapTimeSeconds",
                "S1",
                "S2",
                "S3",
            ],
            errors="ignore",
        )
    )

    (
        X_train_no,
        X_test_no,
        y_train_no,
        y_test_no,
    ) = train_test_split(
        X_without_sectors,
        y,
        test_size=0.2,
        random_state=42,
    )

    model_without_sectors = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
    )

    model_without_sectors.fit(
        X_train_no,
        y_train_no,
    )

    prediction_without_sectors = (
        model_without_sectors.predict(
            X_test_no
        )
    )

    # ------------------------------------------------------------------------
    # METRICS
    # ------------------------------------------------------------------------

    metrics = {
        "bahrain_qualifying_with_sectors": {
            "model": "XGBoost",
            "mae": mean_absolute_error(
                y_test,
                prediction_with_sectors,
            ),
            "r2": r2_score(
                y_test,
                prediction_with_sectors,
            ),
            "features": list(
                X.columns
            ),
        },
        "bahrain_qualifying_without_sectors": {
            "model": "XGBoost",
            "mae": mean_absolute_error(
                y_test_no,
                prediction_without_sectors,
            ),
            "r2": r2_score(
                y_test_no,
                prediction_without_sectors,
            ),
            "features": list(
                X_without_sectors.columns
            ),
        },
    }

    # ------------------------------------------------------------------------
    # PREDICTIONS
    # ------------------------------------------------------------------------

    predictions = []

    for actual, predicted in zip(
        y_test,
        prediction_with_sectors,
    ):
        predictions.append(
            {
                "model": "with_sectors",
                "actual": actual,
                "predicted": predicted,
            }
        )

    for actual, predicted in zip(
        y_test_no,
        prediction_without_sectors,
    ):
        predictions.append(
            {
                "model": "without_sectors",
                "actual": actual,
                "predicted": predicted,
            }
        )

    # ------------------------------------------------------------------------
    # FEATURE IMPORTANCE
    # ------------------------------------------------------------------------

    feature_importance = [
        {
            "model": "bahrain_with_sectors",
            "features": [
                {
                    "name": name,
                    "importance": importance,
                }
                for name, importance in zip(
                    X.columns,
                    model_with_sectors.feature_importances_,
                )
            ],
        },
        {
            "model": "bahrain_without_sectors",
            "features": [
                {
                    "name": name,
                    "importance": importance,
                }
                for name, importance in zip(
                    X_without_sectors.columns,
                    model_without_sectors.feature_importances_,
                )
            ],
        },
    ]

    # ------------------------------------------------------------------------
    # BAHRAIN QUALIFYING + RACE
    # ------------------------------------------------------------------------

    race = load_session(
        2024,
        "Bahrain",
        "R",
    )

    qualifying_combined = qualifying.copy()
    qualifying_combined[
        "SessionType"
    ] = "Q"

    race_combined = race.copy()
    race_combined[
        "SessionType"
    ] = "R"

    combined_columns = [
        "Driver",
        "Team",
        "Compound",
        "TyreLife",
        "FreshTyre",
        "S1",
        "S2",
        "S3",
        "SpeedI1",
        "SpeedI2",
        "SpeedFL",
        "SpeedST",
        "LapTimeSeconds",
        "SessionType",
    ]

    q_available = [
        column
        for column in combined_columns
        if column in qualifying_combined.columns
    ]

    r_available = [
        column
        for column in combined_columns
        if column in race_combined.columns
    ]

    combined = pd.concat(
        [
            qualifying_combined[
                q_available
            ],
            race_combined[
                r_available
            ],
        ],
        ignore_index=True,
    )

    combined = combined.dropna()

    combined_encoded, _ = encode_columns(
        combined,
        include_session=True,
    )

    X_combined = combined_encoded.drop(
        columns=[
            "LapTimeSeconds"
        ]
    )

    y_combined = combined_encoded[
        "LapTimeSeconds"
    ]

    (
        X_train_combined,
        X_test_combined,
        y_train_combined,
        y_test_combined,
    ) = train_test_split(
        X_combined,
        y_combined,
        test_size=0.2,
        random_state=42,
    )

    combined_model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
    )

    combined_model.fit(
        X_train_combined,
        y_train_combined,
    )

    prediction_combined = (
        combined_model.predict(
            X_test_combined
        )
    )

    metrics[
        "bahrain_combined"
    ] = {
        "model": "XGBoost",
        "mae": mean_absolute_error(
            y_test_combined,
            prediction_combined,
        ),
        "r2": r2_score(
            y_test_combined,
            prediction_combined,
        ),
        "features": list(
            X_combined.columns
        ),
    }

    feature_importance.append(
        {
            "model": "bahrain_combined",
            "features": [
                {
                    "name": name,
                    "importance": importance,
                }
                for name, importance in zip(
                    X_combined.columns,
                    combined_model.feature_importances_,
                )
            ],
        }
    )

    # ------------------------------------------------------------------------
    # FINAL FOUR-CIRCUIT MODEL
    # ------------------------------------------------------------------------

    final_model = joblib.load(
        MODEL_FILE
    )

    full = full_data.copy()

    encoded_full, _ = encode_columns(
        full,
        include_session=True,
    )

    X_full = encoded_full.drop(
        columns=[
            "LapTimeSeconds"
        ]
    )

    y_full = encoded_full[
        "LapTimeSeconds"
    ]

    (
        _,
        X_test_full,
        _,
        y_test_full,
    ) = train_test_split(
        X_full,
        y_full,
        test_size=0.2,
        random_state=42,
    )

    prediction_full = (
        final_model.predict(
            X_test_full
        )
    )

    metrics[
        "four_circuit"
    ] = {
        "model": "XGBoost",
        "mae": mean_absolute_error(
            y_test_full,
            prediction_full,
        ),
        "r2": r2_score(
            y_test_full,
            prediction_full,
        ),
        "features": list(
            X_full.columns
        ),
    }

    feature_importance.append(
        {
            "model": "four_circuit",
            "features": [
                {
                    "name": name,
                    "importance": importance,
                }
                for name, importance in zip(
                    X_full.columns,
                    final_model.feature_importances_,
                )
            ],
        }
    )

    # Sort importance.
    for model_data in feature_importance:

        model_data[
            "features"
        ] = sorted(
            model_data[
                "features"
            ],
            key=lambda item: item[
                "importance"
            ],
            reverse=True,
        )

    write_json(
        "model-metrics.json",
        metrics,
    )

    write_json(
        "predictions.json",
        predictions,
    )

    write_json(
        "feature-importance.json",
        feature_importance,
    )


# ============================================================================
# RACE ANALYSIS
# ============================================================================

def build_race_analysis(
    race_data: pd.DataFrame,
) -> None:

    data = race_data.copy()

    # Only normal dry compounds.
    data = data[
        data[
            "Compound"
        ].isin(
            [
                "SOFT",
                "MEDIUM",
                "HARD",
            ]
        )
    ].copy()

    # Remove unusually slow laps.
    data[
        "MedianLap"
    ] = data.groupby(
        [
            "Driver",
            "Circuit",
        ]
    )[
        "LapTimeSeconds"
    ].transform(
        "median"
    )

    data = data[
        data[
            "LapTimeSeconds"
        ]
        <= data[
            "MedianLap"
        ] * 1.07
    ].copy()

    data = data.dropna(
        subset=[
            "LapTimeSeconds",
            "TyreLife",
            "Compound",
        ]
    )

    # ------------------------------------------------------------------------
    # TRACK EVOLUTION
    # ------------------------------------------------------------------------

    data[
        "LapNumber"
    ] = (
        data.groupby(
            [
                "Circuit",
                "Driver",
            ]
        )
        .cumcount()
        + 1
    )

    track_median = (
        data.groupby(
            [
                "Circuit",
                "LapNumber",
            ]
        )[
            "LapTimeSeconds"
        ]
        .median()
        .reset_index(
            name="TrackMedian"
        )
    )

    data = data.merge(
        track_median,
        on=[
            "Circuit",
            "LapNumber",
        ],
        how="left",
    )

    data[
        "NormalizedLapTime"
    ] = (
        data[
            "LapTimeSeconds"
        ]
        - data[
            "TrackMedian"
        ]
    )

    track_records = (
        data[
            [
                "Circuit",
                "LapNumber",
                "LapTimeSeconds",
                "TrackMedian",
                "NormalizedLapTime",
            ]
        ]
        .drop_duplicates()
        .rename(
            columns={
                "Circuit": "circuit",
                "LapNumber": "lapNumber",
                "LapTimeSeconds": "lapTime",
                "TrackMedian": "trackMedian",
                "NormalizedLapTime": "normalizedLapTime",
            }
        )
        .to_dict(
            "records"
        )
    )

    write_json(
        "track-evolution.json",
        track_records,
    )

    # ------------------------------------------------------------------------
    # TYRE DEGRADATION
    # ------------------------------------------------------------------------

    tyre_points = (
        data[
            [
                "Circuit",
                "Driver",
                "Compound",
                "TyreLife",
                "LapTimeSeconds",
                "NormalizedLapTime",
            ]
        ]
        .rename(
            columns={
                "Circuit": "circuit",
                "Driver": "driver",
                "Compound": "compound",
                "TyreLife": "tyreLife",
                "LapTimeSeconds": "lapTime",
                "NormalizedLapTime": "normalizedLapTime",
            }
        )
        .to_dict(
            "records"
        )
    )

    degradation_trends = []

    for (
        circuit,
        compound,
    ), group in data.groupby(
        [
            "Circuit",
            "Compound",
        ]
    ):

        group = group.dropna(
            subset=[
                "TyreLife",
                "LapTimeSeconds",
            ]
        )

        if (
            len(group) >= 2
            and group[
                "TyreLife"
            ].nunique() >= 2
        ):

            slope, intercept = np.polyfit(
                group[
                    "TyreLife"
                ],
                group[
                    "LapTimeSeconds"
                ],
                1,
            )

            degradation_trends.append(
                {
                    "circuit": circuit,
                    "compound": compound,
                    "slopeSecondsPerLap": slope,
                    "intercept": intercept,
                    "points": len(group),
                }
            )

    write_json(
        "tyre-degradation.json",
        {
            "points": tyre_points,
            "trends": degradation_trends,
        },
    )

    # ------------------------------------------------------------------------
    # CONSISTENCY
    # ------------------------------------------------------------------------

    consistency = (
        data.groupby(
            [
                "Driver",
                "Circuit",
            ]
        )
        .agg(
            AvgLapTime=(
                "LapTimeSeconds",
                "mean",
            ),
            StdLapTime=(
                "LapTimeSeconds",
                "std",
            ),
            LapCount=(
                "LapTimeSeconds",
                "count",
            ),
        )
        .reset_index()
    )

    consistency[
        "CV"
    ] = (
        consistency[
            "StdLapTime"
        ]
        / consistency[
            "AvgLapTime"
        ]
    ) * 100

    consistency = consistency[
        consistency[
            "LapCount"
        ] >= 10
    ].copy()

    consistency_records = (
        consistency
        .rename(
            columns={
                "Driver": "driver",
                "Circuit": "circuit",
                "AvgLapTime": "avgLapTime",
                "StdLapTime": "stdLapTime",
                "LapCount": "lapCount",
                "CV": "cv",
            }
        )
        .to_dict(
            "records"
        )
    )

    write_json(
        "consistency.json",
        consistency_records,
    )

    # ------------------------------------------------------------------------
    # OVERALL CONSISTENCY
    # ------------------------------------------------------------------------

    overall = (
        consistency.groupby(
            "Driver"
        )[
            "CV"
        ]
        .mean()
        .sort_values()
    )

    overall_records = [
        {
            "driver": driver,
            "averageCV": value,
        }
        for driver, value in overall.items()
    ]

    write_json(
        "overall-consistency.json",
        overall_records,
    )


# ============================================================================
# VERIFICATION
# ============================================================================

EXPECTED_FILES = [
    "circuits.json",
    "lap-performance.json",
    "best-laps.json",
    "speed.json",
    "model-metrics.json",
    "predictions.json",
    "feature-importance.json",
    "tyre-degradation.json",
    "track-evolution.json",
    "consistency.json",
    "overall-consistency.json",
]


def verify_outputs() -> None:

    print()
    print("=" * 72)
    print("VERIFYING WEB DATA")
    print("=" * 72)

    missing = []

    for filename in EXPECTED_FILES:

        canonical = (
            WEB_DIR / filename
        )

        frontend = (
            PUBLIC_DATA_DIR / filename
        )

        if canonical.exists():
            print(
                f"[OK] canonical : {filename}"
            )
        else:
            print(
                f"[FAIL] canonical: {filename}"
            )
            missing.append(
                f"data/web/{filename}"
            )

        if frontend.exists():
            print(
                f"[OK] frontend  : {filename}"
            )
        else:
            print(
                f"[FAIL] frontend : {filename}"
            )
            missing.append(
                f"frontend/public/data/{filename}"
            )

    if missing:

        print()
        print(
            "ERROR: Some output files are missing:"
        )

        for item in missing:
            print(
                f"  - {item}"
            )

        raise RuntimeError(
            "Web-data verification failed."
        )

    print()
    print(
        "ALL WEB DATA FILES VERIFIED."
    )


# ============================================================================
# MAIN
# ============================================================================

def main() -> None:

    print()
    print("=" * 72)
    print("F1-ML WEB DATA BUILDER")
    print("=" * 72)

    print()
    print(
        f"Project root:    {ROOT}"
    )

    print(
        f"Canonical data:  {WEB_DIR}"
    )

    print(
        f"Frontend data:   {PUBLIC_DATA_DIR}"
    )

    # Create folders BEFORE doing anything else.
    ensure_output_directories()

    check_required_files()

    # FastF1 cache.
    if CACHE_DIR.exists():

        fastf1.Cache.enable_cache(
            str(CACHE_DIR)
        )

    else:

        print()
        print(
            "[WARNING] f1_cache was not found."
        )

        print(
            "FastF1 may need to download session data again."
        )

    # ------------------------------------------------------------------------
    # LOAD CANONICAL ML DATA
    # ------------------------------------------------------------------------

    print()
    print(
        "[1/5] Loading f1_full_data.csv..."
    )

    full_data = pd.read_csv(
        DATA_FILE
    )

    print(
        f"      Rows: {len(full_data):,}"
    )

    # ------------------------------------------------------------------------
    # CIRCUITS
    # ------------------------------------------------------------------------

    print()
    print(
        "[2/5] Building circuit metadata..."
    )

    build_circuits()

    # ------------------------------------------------------------------------
    # BAHRAIN QUALIFYING
    # ------------------------------------------------------------------------

    print()
    print(
        "[3/5] Building Bahrain qualifying data..."
    )

    qualifying = load_session(
        2024,
        "Bahrain",
        "Q",
    )

    build_bahrain_visual_data(
        qualifying
    )

    # ------------------------------------------------------------------------
    # ML
    # ------------------------------------------------------------------------

    print()
    print(
        "[4/5] Building ML data..."
    )

    build_ml_data(
        qualifying,
        full_data,
    )

    # ------------------------------------------------------------------------
    # FOUR CIRCUIT RACE DATA
    # ------------------------------------------------------------------------

    print()
    print(
        "[5/5] Building race-analysis data..."
    )

    race_chunks = []

    for event in [
        "Bahrain",
        "Monaco",
        "Monza",
        "Silverstone",
    ]:

        laps = load_session(
            2024,
            event,
            "R",
        )

        laps[
            "Circuit"
        ] = event

        laps[
            "SessionType"
        ] = "R"

        race_chunks.append(
            laps
        )

    race_data = pd.concat(
        race_chunks,
        ignore_index=True,
    )

    build_race_analysis(
        race_data
    )

    # ------------------------------------------------------------------------
    # VERIFY
    # ------------------------------------------------------------------------

    verify_outputs()

    print()
    print("=" * 72)
    print("BUILD COMPLETE")
    print("=" * 72)

    print()
    print(
        "Website data is available at:"
    )

    print(
        f"  {PUBLIC_DATA_DIR}"
    )

    print()
    print(
        "Next.js can fetch the files using:"
    )

    print(
        "  /data/lap-performance.json"
    )

    print()


if __name__ == "__main__":
    main()
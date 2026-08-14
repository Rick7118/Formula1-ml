# Formula1-ML

Formula1-ML is a Formula 1 data analysis and machine learning project that explores race performance through telemetry, lap times, sector performance, tyre degradation, speed, and race pace.

The project combines a Python-based machine learning workflow with an interactive Next.js application for exploring the resulting analysis.

---

## Overview

Formula 1 lap performance is influenced by multiple factors, including:

- Driver performance
- Tyre compound and tyre life
- Sector performance
- Speed
- Circuit characteristics
- Stint progression

Formula1-ML analyzes these factors and uses them to build a regression model capable of predicting lap time.

The project consists of two primary parts:

1. **Machine Learning Pipeline** — data processing, analysis, feature engineering, and model training.
2. **Interactive Web Application** — visualization and exploration of the generated results.

---

## Project Structure

```text
Formula1-ML/
│
├── data/
│   └── web/
│       ├── best-laps.json
│       ├── circuits.json
│       ├── consistency.json
│       ├── feature-importance.json
│       ├── lap-performance.json
│       ├── model-metrics.json
│       ├── overall-consistency.json
│       ├── predictions.json
│       ├── speed.json
│       ├── track-evolution.json
│       └── tyre-degradation.json
│
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── sections/
│   │       ├── LapSection.tsx
│   │       ├── ModelSection.tsx
│   │       ├── RacePaceSection.tsx
│   │       ├── SectorsSection.tsx
│   │       ├── SpeedSection.tsx
│   │       ├── TyreSection.tsx
│   │       └── VerdictSection.tsx
│   │
│   ├── public/
│   │   └── data/
│   │       └── *.json
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── Formula1-ML_fixed.ipynb
├── web_data_builder.py
├── f1_full_data.csv
├── f1_xgb_model.pkl
├── .gitignore
└── README.md
```

---

# Machine Learning

## Objective

The machine learning component treats Formula 1 lap time prediction as a regression problem.

The objective is to determine whether telemetry and race-performance features can be used to predict a driver's lap time.

The primary model used in the project is **XGBoost Regression**.

---

## Machine Learning Pipeline

The pipeline follows these stages:

```text
Raw Formula 1 Data
        │
        ▼
Data Cleaning
        │
        ▼
Feature Engineering
        │
        ▼
Exploratory Data Analysis
        │
        ▼
Feature Selection
        │
        ▼
XGBoost Regression
        │
        ├── Model Metrics
        ├── Feature Importance
        └── Predictions
        │
        ▼
Web Data Generation
        │
        ▼
Next.js Visualization
```

---

## Model

The project uses an XGBoost regression model to predict lap time.

### Model evaluation

The model is evaluated using:

| Metric | Description |
|---|---|
| MAE | Mean Absolute Error between predicted and observed lap time |
| R² | Proportion of variance explained by the model |

A lower MAE indicates smaller prediction errors.

An R² value closer to `1.0` indicates stronger predictive performance.

---

## Feature Importance

Feature importance is used to identify which input variables contribute most to the model's predictions.

The frontend exposes the feature-importance results interactively so the relationship between the input data and predicted lap time can be inspected.

---

# Data Analysis

The project analyzes several aspects of Formula 1 performance.

## Lap Performance

Examines lap-time performance and identifies differences between drivers and sessions.

## Sector Performance

Breaks a lap into three sectors:

```text
Sector 1
Sector 2
Sector 3
```

This makes it possible to identify where performance differences occur around a circuit.

## Speed

Analyzes speed measurements recorded at different telemetry points.

The project includes:

- Intermediate 1
- Intermediate 2
- Finish Line
- Speed Trap

## Tyre Degradation

Examines the relationship between tyre life and lap-time performance.

The analysis considers:

- Tyre compound
- Tyre life
- Lap time
- Normalized lap time
- Degradation rate

## Race Pace

Analyzes how normalized lap pace changes as tyre life increases during a stint.

This helps distinguish between:

- Initial pace
- Sustained pace
- Late-stint performance

## Driver Consistency

Examines the variation in driver performance across available laps and sessions.

## Track Evolution

Analyzes how circuit performance changes as sessions progress.

---

# Web Application

The frontend is implemented as a Next.js application.

The application presents the analysis as a sequence of interactive sections rather than a traditional dashboard.

## Sections

| Section | Purpose |
|---|---|
| Lap Performance | Explore lap-time performance |
| Sectors | Compare sector performance |
| Speed | Analyze speed measurements |
| Tyres | Explore tyre degradation |
| Race Pace | Analyze sustained stint performance |
| Model | Explore the machine-learning model |
| Verdict | Summarize the analysis |

The visualizations include interactive hover states, filters, prediction plots, feature-importance charts, and model metrics.

---

# Technology

## Machine Learning

- Python
- Pandas
- NumPy
- Scikit-learn
- XGBoost
- Jupyter Notebook

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Plotly

## Development

- Git
- GitHub
- Vercel

---

# Getting Started

## Prerequisites

Install the following before running the project:

- Python
- Node.js
- npm
- Git

---

## Clone the repository

```bash
git clone https://github.com/Rick7118/Formula1-ml.git
cd Formula1-ML
```

---

# Run the Web Application

The frontend is located in the `frontend` directory.

## 1. Change to the frontend directory

```bash
cd frontend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# Data Pipeline

The web application consumes pre-generated JSON datasets.

These datasets are generated by:

```text
web_data_builder.py
```

The generated files are stored in:

```text
data/web/
```

and copied into:

```text
frontend/public/data/
```

The frontend then accesses them through paths such as:

```text
/data/lap-performance.json
/data/model-metrics.json
/data/predictions.json
/data/tyre-degradation.json
```

This allows the current frontend to operate without an external API.

---

# Generate Web Data

From the project root:

```bash
python web_data_builder.py
```

The script generates the datasets required by the frontend.

After generating the data, verify that the corresponding files exist in:

```text
frontend/public/data/
```

---

# Machine Learning Notebook

The primary analysis notebook is:

```text
Formula1-ML_fixed.ipynb
```

The notebook contains the data analysis and machine learning workflow used to produce the model and analytical results.

The saved model is:

```text
f1_xgb_model.pkl
```

---

# Deployment

The frontend can be deployed using Vercel.

Because the Next.js application is located inside the `frontend` directory, configure the deployment with:

```text
Root Directory: frontend
Framework: Next.js
```

The current frontend does not require external API keys.

---

# Data Files

The project contains generated datasets used by the visualization layer.

| File | Purpose |
|---|---|
| `best-laps.json` | Best lap analysis |
| `circuits.json` | Circuit information |
| `consistency.json` | Driver consistency data |
| `feature-importance.json` | Model feature importance |
| `lap-performance.json` | Lap performance data |
| `model-metrics.json` | Model evaluation metrics |
| `overall-consistency.json` | Overall consistency analysis |
| `predictions.json` | Model predictions |
| `speed.json` | Speed measurements |
| `track-evolution.json` | Track evolution data |
| `tyre-degradation.json` | Tyre degradation analysis |

---

# Repository Workflow

The general development workflow is:

```text
Analyze Data
     │
     ▼
Update Notebook
     │
     ▼
Train / Evaluate Model
     │
     ▼
Generate Web Data
     │
     ▼
Update Frontend
     │
     ▼
Test Locally
     │
     ▼
Commit Changes
     │
     ▼
Deploy
```

---

# Current Status

The following components are currently implemented:

- [x] Formula 1 data analysis
- [x] Feature engineering
- [x] XGBoost regression
- [x] Model evaluation
- [x] Feature importance
- [x] Lap performance analysis
- [x] Sector analysis
- [x] Speed analysis
- [x] Tyre degradation analysis
- [x] Race pace analysis
- [x] Driver consistency analysis
- [x] Track evolution analysis
- [x] Interactive Next.js application
- [x] Interactive visualization hover states
- [x] Prediction visualization
- [x] GitHub repository
- [ ] Production deployment
- [ ] Additional model experiments

---

# License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

# Author

**Subhayu Sengupta**

Computer Science and Business Systems
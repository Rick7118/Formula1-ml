"use client";

import { useEffect, useMemo, useState } from "react";

type ModelMetric = {
  model?: string;
  mae?: number;
  r2?: number;
  features?: string[];
};

type ModelMetrics = Record<string, ModelMetric>;

type FeatureImportanceModel = {
  model: string;
  features: {
    name: string;
    importance: number;
  }[];
};

type Prediction = {
  model?: string;
  actual?: number;
  predicted?: number;
  error?: number;
};

type ModelData = {
  metrics?: ModelMetrics;
  featureImportance?: FeatureImportanceModel[];
  predictions?: Prediction[];
};

const FEATURE_LABELS: Record<string, string> = {
  TyreLife: "TYRE LIFE",
  FreshTyre: "FRESH TYRE",
  S1: "SECTOR 1",
  S2: "SECTOR 2",
  S3: "SECTOR 3",
  SpeedI1: "SPEED I1",
  SpeedI2: "SPEED I2",
  SpeedFL: "SPEED FL",
  SpeedST: "SPEED ST",
  Compound: "COMPOUND",
  Driver: "DRIVER",
  Team: "TEAM",
  SessionType: "SESSION TYPE",
};

export default function ModelSection() {
  const [data, setData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModelData() {
      try {
        const [
          metricsResponse,
          importanceResponse,
          predictionsResponse,
        ] = await Promise.all([
          fetch("/data/model-metrics.json"),
          fetch("/data/feature-importance.json"),
          fetch("/data/predictions.json"),
        ]);

        const metrics = metricsResponse.ok
          ? await metricsResponse.json()
          : {};

        const featureImportance =
          importanceResponse.ok
            ? await importanceResponse.json()
            : [];

        const predictions =
          predictionsResponse.ok
            ? await predictionsResponse.json()
            : [];

        setData({
          metrics:
            metrics?.metrics ??
            metrics ??
            {},

          featureImportance:
            Array.isArray(featureImportance)
              ? featureImportance
              : [],

          predictions:
            Array.isArray(predictions)
              ? predictions
              : predictions?.predictions ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to load model data:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadModelData();
  }, []);

  /*
   * The builder exports several model experiments.
   *
   * For the portfolio, the four-circuit model is the
   * final/general model, so this is the one we present
   * in the main performance section.
   */
  const finalMetrics = useMemo(() => {
    return (
      data?.metrics?.four_circuit ??
      null
    );
  }, [data]);

  /*
   * Feature importance is stored as:
   *
   * [
   *   {
   *     model: "bahrain_with_sectors",
   *     features: [...]
   *   },
   *   ...
   *   {
   *     model: "four_circuit",
   *     features: [...]
   *   }
   * ]
   */
  const features = useMemo(() => {
    if (!data?.featureImportance) {
      return [];
    }

    const finalModel =
      data.featureImportance.find(
        (item) =>
          item.model === "four_circuit"
      );

    if (!finalModel) {
      return [];
    }

    return [...finalModel.features]
      .filter(
        (feature) =>
          typeof feature.name === "string" &&
          typeof feature.importance === "number"
      )
      .sort(
        (a, b) =>
          b.importance - a.importance
      )
      .slice(0, 10);
  }, [data]);

  /*
   * predictions.json contains two prediction sets:
   *
   * - with_sectors
   * - without_sectors
   *
   * We use with_sectors for the visual comparison.
   */
  const predictions = useMemo(() => {
    if (!data?.predictions) {
      return [];
    }

    return data.predictions
      .filter(
        (prediction) =>
          prediction.model ===
          "with_sectors"
      )
      .filter(
        (prediction) =>
          typeof prediction.actual ===
            "number" &&
          typeof prediction.predicted ===
            "number"
      )
      .map((prediction) => ({
        actual: prediction.actual as number,
        predicted:
          prediction.predicted as number,
        error:
          prediction.error ??
          (prediction.predicted as number) -
            (prediction.actual as number),
      }))
      .slice(0, 80);
  }, [data]);

  const maxImportance =
    features.length > 0
      ? Math.max(
          ...features.map(
            (feature) =>
              feature.importance
          )
        )
      : 1;

  return (
    <section
      id="model"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">

        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              07 / The Model
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              TEACHING
              <br />

              <span className="text-[var(--muted)]">
                A MACHINE
              </span>

              <br />

              TO GO FAST.
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              The final step was turning the
              analysis into a prediction problem:
              can a machine learn the relationship
              between telemetry and lap time?
            </p>
          </div>
        </div>

        {/* ============================================================
            MODEL IDENTITY
        ============================================================ */}

        <div className="mt-24 grid grid-cols-1 border-y border-[var(--border)] md:grid-cols-3">
          <ModelIdentity
            label="ALGORITHM"
            value="XGBOOST"
            description="Gradient boosted decision trees"
          />

          <ModelIdentity
            label="TASK"
            value="REGRESSION"
            description="Predict continuous lap time"
          />

          <ModelIdentity
            label="TARGET"
            value="LAP TIME"
            description="Measured in seconds"
          />
        </div>

        {/* ============================================================
            MODEL PERFORMANCE
        ============================================================ */}

        <div className="mt-24">
          <div className="flex items-center gap-4">
            <div className="h-px w-10 bg-[var(--accent)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Model performance
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <LoadingMetric count={4} />
            ) : (
              <>
                <Metric
                  label="MODEL"
                  value="XGBOOST"
                />

                <Metric
                  label="MAE"
                  value={
                    finalMetrics?.mae !==
                    undefined
                      ? `${finalMetrics.mae.toFixed(
                          3
                        )} S`
                      : "—"
                  }
                />

                <Metric
                  label="R² SCORE"
                  value={
                    finalMetrics?.r2 !==
                    undefined
                      ? finalMetrics.r2.toFixed(
                          3
                        )
                      : "—"
                  }
                />

                <Metric
                  label="FEATURES"
                  value={
                    finalMetrics?.features
                      ?.length
                      ? String(
                          finalMetrics.features
                            .length
                        ).padStart(2, "0")
                      : "—"
                  }
                />
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--muted)]">
            <span>
              FINAL MODEL / FOUR CIRCUIT
            </span>

            <span>
              LOWER MAE = BETTER
            </span>
          </div>
        </div>

        {/* ============================================================
            FEATURE IMPORTANCE
        ============================================================ */}

        <div className="mt-32 grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              What the model learned
            </div>

            <h3 className="mt-6 text-4xl font-medium leading-[0.95] tracking-[-0.04em] md:text-5xl">
              Not every
              <br />
              feature
              <br />
              matters equally.
            </h3>

            <p className="mt-8 max-w-sm text-sm leading-7 text-[var(--muted)]">
              Feature importance gives us a
              window into which inputs contribute
              most to the model&apos;s lap-time
              predictions.
            </p>

            <div className="mt-10 border-l border-[var(--accent)] pl-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Model
              </div>

              <div className="mt-2 font-mono text-xs tracking-[0.15em]">
                FOUR CIRCUIT
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="border border-[var(--border)] bg-[var(--surface)]">

              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 md:px-8">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Feature importance
                </div>

                <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]">
                  XGBOOST
                </div>
              </div>

              {loading ? (
                <div className="p-8">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Loading model features...
                  </div>
                </div>
              ) : features.length > 0 ? (
                <div className="divide-y divide-[var(--border)]">
                  {features.map(
                    (feature, index) => {
                      const width =
                        maxImportance > 0
                          ? (feature.importance /
                              maxImportance) *
                            100
                          : 0;

                      return (
                        <div
                          key={`${feature.name}-${index}`}
                          className="px-6 py-6 md:px-8"
                        >
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex min-w-0 items-center gap-5">
                              <span className="w-6 shrink-0 font-mono text-[9px] text-[var(--muted)]">
                                {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </span>

                              <span className="truncate font-mono text-[10px] tracking-[0.12em]">
                                {FEATURE_LABELS[
                                  feature.name
                                ] ??
                                  feature.name.toUpperCase()}
                              </span>
                            </div>

                            <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                              {feature.importance.toFixed(
                                3
                              )}
                            </span>
                          </div>

                          <div className="mt-4 ml-11 h-[2px] bg-[#202020]">
                            <div
                              className="h-full bg-[var(--accent)] transition-all duration-700"
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="p-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Feature importance unavailable
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            PREDICTIONS
        ============================================================ */}

        <div className="mt-32">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
                Prediction vs reality
              </div>

              <h3 className="mt-6 text-4xl font-medium leading-[0.95] tracking-[-0.04em] md:text-5xl">
                How close
                <br />
                did it get?
              </h3>

              <p className="mt-8 max-w-sm text-sm leading-7 text-[var(--muted)]">
                A regression model is only useful
                if its predictions remain close to
                the observed lap times.
              </p>

              <div className="mt-10 border-l border-[var(--accent)] pl-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Experiment
                </div>

                <div className="mt-2 font-mono text-xs tracking-[0.15em]">
                  WITH SECTOR TIMES
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <PredictionChart
                predictions={predictions}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            PIPELINE
        ============================================================ */}

        <div className="mt-32">
          <div className="flex items-center gap-4">
            <div className="h-px w-10 bg-[var(--accent)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              The pipeline
            </span>
          </div>

          <div className="mt-10 grid grid-cols-1 border-y border-[var(--border)] md:grid-cols-4">
            <PipelineStep
              number="01"
              title="INPUT"
              description="Telemetry + tyre data"
            />

            <PipelineStep
              number="02"
              title="FEATURES"
              description="Encode + prepare"
            />

            <PipelineStep
              number="03"
              title="XGBOOST"
              description="Train regression model"
            />

            <PipelineStep
              number="04"
              title="PREDICTION"
              description="Estimate lap time"
            />
          </div>
        </div>

        {/* ============================================================
            CONCLUSION
        ============================================================ */}

        <div className="mt-32">
          <div className="max-w-5xl">
            <p className="text-4xl font-medium leading-[0.95] tracking-[-0.04em] md:text-6xl">
              We started with
              <br />

              <span className="text-[var(--muted)]">
                raw telemetry.
              </span>
            </p>

            <p className="mt-6 text-4xl font-medium leading-[0.95] tracking-[-0.04em] md:text-6xl">
              We ended with
              <br />

              <span className="text-[var(--accent)]">
                a prediction.
              </span>
            </p>
          </div>
        </div>

        {/* ============================================================
            NEXT
        ============================================================ */}

        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Next
          </span>

          <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
            08 / The Verdict
          </span>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
   MODEL IDENTITY
======================================================================== */

function ModelIdentity({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-6 md:border-r md:p-8">
      <div className="font-mono text-[9px] tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>

      <div className="mt-5 text-2xl font-medium tracking-[-0.03em]">
        {value}
      </div>

      <div className="mt-2 text-sm text-[var(--muted)]">
        {description}
      </div>
    </div>
  );
}

/* ========================================================================
   METRIC
======================================================================== */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-6 md:border-r md:p-8">
      <div className="font-mono text-3xl tracking-[-0.04em] md:text-4xl">
        {value}
      </div>

      <div className="mt-3 font-mono text-[9px] tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

/* ========================================================================
   LOADING METRIC
======================================================================== */

function LoadingMetric({
  count,
}: {
  count: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map(
        (_, index) => (
          <div
            key={index}
            className="border-b border-[var(--border)] p-6 md:border-r md:p-8"
          >
            <div className="h-10 w-24 animate-pulse bg-[#151515]" />

            <div className="mt-4 h-2 w-20 animate-pulse bg-[#151515]" />
          </div>
        )
      )}
    </>
  );
}

/* ========================================================================
   PREDICTION CHART
======================================================================== */

function PredictionChart({
  predictions,
  loading,
}: {
  predictions: {
    actual: number;
    predicted: number;
    error: number;
  }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Loading predictions...
        </span>
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Prediction data unavailable
        </span>
      </div>
    );
  }

  const values = predictions.flatMap(
    (prediction) => [
      prediction.actual,
      prediction.predicted,
    ]
  );

  const min = Math.min(...values);
  const max = Math.max(...values);

  const range =
    max - min === 0
      ? 1
      : max - min;

  const points = predictions
    .map((prediction) => {
      const x =
        40 +
        ((prediction.actual - min) /
          range) *
          520;

      const y =
        360 -
        ((prediction.predicted - min) /
          range) *
          300;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
      <div className="flex items-center justify-between gap-6">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Actual vs predicted
        </div>

        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Prediction
          </span>

          <span className="flex items-center gap-2">
            <span className="h-px w-3 bg-[#666666]" />
            Perfect fit
          </span>
        </div>
      </div>

      <div className="mt-8 overflow-hidden">
        <svg
          viewBox="0 0 600 420"
          className="h-auto w-full"
          role="img"
          aria-label="Actual versus predicted lap time scatter plot"
        >
          {/* Perfect prediction line */}

          <line
            x1="40"
            y1="360"
            x2="560"
            y2="60"
            stroke="#404040"
            strokeWidth="1"
            strokeDasharray="5 7"
          />

          {/* Axes */}

          <line
            x1="40"
            y1="360"
            x2="560"
            y2="360"
            stroke="#292929"
          />

          <line
            x1="40"
            y1="60"
            x2="40"
            y2="360"
            stroke="#292929"
          />

          {/* Prediction trail */}

          <polyline
            points={points}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1"
            opacity="0.25"
          />

          {/* Prediction points */}

          {predictions.map(
            (prediction, index) => {
              const x =
                40 +
                ((prediction.actual - min) /
                  range) *
                  520;

              const y =
                360 -
                ((prediction.predicted -
                  min) /
                  range) *
                  300;

              return (
                <circle
                  key={`prediction-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="var(--accent)"
                  opacity="0.75"
                />
              );
            }
          )}

          <text
            x="300"
            y="405"
            textAnchor="middle"
            fill="#666666"
            fontSize="9"
            fontFamily="monospace"
          >
            ACTUAL LAP TIME
          </text>

          <text
            x="13"
            y="210"
            textAnchor="middle"
            fill="#666666"
            fontSize="9"
            fontFamily="monospace"
            transform="rotate(-90 13 210)"
          >
            PREDICTED LAP TIME
          </text>
        </svg>
      </div>

      <div className="mt-4 flex justify-between font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]">
        <span>
          {predictions.length} TEST SAMPLES
        </span>

        <span>
          WITH SECTOR FEATURES
        </span>
      </div>
    </div>
  );
}

/* ========================================================================
   PIPELINE STEP
======================================================================== */

function PipelineStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-6 md:border-r md:p-8">
      <div className="font-mono text-[9px] text-[var(--muted)]">
        {number}
      </div>

      <div className="mt-12 font-mono text-xs tracking-[0.2em]">
        {title}
      </div>

      <div className="mt-2 text-sm text-[var(--muted)]">
        {description}
      </div>
    </div>
  );
}
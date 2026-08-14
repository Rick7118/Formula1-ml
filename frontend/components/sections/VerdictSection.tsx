"use client";

import { useEffect, useMemo, useState } from "react";

type FeatureImportanceModel = {
  model: string;
  features: {
    name: string;
    importance: number;
  }[];
};

type ModelMetric = {
  mae?: number;
  r2?: number;
  features?: string[];
};

type ModelMetrics = Record<
  string,
  ModelMetric
>;

type VerdictData = {
  metrics: ModelMetrics;
  featureImportance: FeatureImportanceModel[];
};

const FEATURE_LABELS: Record<string, string> = {
  S1: "SECTOR 1",
  S2: "SECTOR 2",
  S3: "SECTOR 3",
  SpeedI1: "SPEED I1",
  SpeedI2: "SPEED I2",
  SpeedFL: "SPEED FL",
  SpeedST: "SPEED ST",
  TyreLife: "TYRE LIFE",
  FreshTyre: "FRESH TYRE",
  Compound: "COMPOUND",
};

export default function VerdictSection() {
  const [data, setData] =
    useState<VerdictData | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          metricsResponse,
          importanceResponse,
        ] = await Promise.all([
          fetch("/data/model-metrics.json"),
          fetch("/data/feature-importance.json"),
        ]);

        const metrics =
          metricsResponse.ok
            ? await metricsResponse.json()
            : {};

        const featureImportance =
          importanceResponse.ok
            ? await importanceResponse.json()
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
        });
      } catch (error) {
        console.error(
          "Failed to load verdict data:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const finalModel = useMemo(() => {
    return (
      data?.metrics?.four_circuit ??
      null
    );
  }, [data]);

  const topFeatures = useMemo(() => {
    const model =
      data?.featureImportance?.find(
        (item) =>
          item.model === "four_circuit"
      );

    if (!model) {
      return [];
    }

    return [...model.features]
      .sort(
        (a, b) =>
          b.importance - a.importance
      )
      .slice(0, 4);
  }, [data]);

  const strongestFeature =
    topFeatures[0] ?? null;

  const strongestFeatureName =
    strongestFeature
      ? FEATURE_LABELS[
          strongestFeature.name
        ] ??
        strongestFeature.name.toUpperCase()
      : "TELEMETRY";

  return (
    <section
      id="verdict"
      className="relative overflow-hidden border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">

        {/* ============================================================
            SECTION HEADER
        ============================================================ */}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              08 / The Verdict
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              After the data
            </div>

            <h2 className="mt-6 max-w-5xl text-[clamp(4rem,8vw,8.5rem)] font-semibold leading-[0.82] tracking-[-0.065em]">
              SO,
              <br />
              WHAT MAKES
              <br />
              <span className="text-[var(--accent)]">
                A LAP
              </span>
              <br />
              FAST?
            </h2>
          </div>
        </div>

        {/* ============================================================
            BIG ANSWER
        ============================================================ */}

        <div className="mt-32 grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              The short answer
            </div>
          </div>

          <div className="lg:col-span-8">
            <p className="max-w-5xl text-4xl font-medium leading-[0.94] tracking-[-0.045em] md:text-6xl lg:text-7xl">
              A fast lap is not
              <br />
              created by one number.
            </p>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              It is the result of multiple parts of
              the lap working together — sectors,
              speed, tyre state, and the conditions
              surrounding them.
            </p>
          </div>
        </div>

        {/* ============================================================
            THE FOUR FINDINGS
        ============================================================ */}

        <div className="mt-32">
          <div className="mb-8 font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Four things stand out
          </div>

          <div className="grid grid-cols-1 gap-px bg-[var(--border)] md:grid-cols-2">

            <Finding
              number="01"
              title="SECTOR TIME"
              text="Lap time is ultimately built sector by sector. A gain in one part of the circuit can become a measurable advantage over the full lap."
            />

            <Finding
              number="02"
              title="SPEED"
              text="Straight-line and terminal-speed measurements give the model information about how efficiently a car is carrying and generating speed."
            />

            <Finding
              number="03"
              title="TYRE STATE"
              text="Tyre compound and tyre life provide the context around the pace. The same car does not produce the same performance on every tyre state."
            />

            <Finding
              number="04"
              title="COMBINATION"
              text="The interesting part is the interaction between these variables. Performance emerges from the combination rather than from one isolated measurement."
            />

          </div>
        </div>

        {/* ============================================================
            MODEL VERDICT
        ============================================================ */}

        <div className="mt-32 border-y border-[var(--border)] py-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">

            <div className="lg:col-span-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
                What the model says
              </div>

              <p className="mt-6 text-3xl font-medium leading-[0.95] tracking-[-0.035em] md:text-4xl">
                The data
                <br />
                gets more
                <br />
                specific.
              </p>
            </div>

            <div className="lg:col-span-7">

              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Highest feature importance
              </div>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-3">
                <span className="text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
                  {loading
                    ? "..."
                    : strongestFeatureName}
                </span>

                {!loading &&
                  strongestFeature && (
                    <span className="font-mono text-sm text-[var(--accent)]">
                      {strongestFeature.importance.toFixed(
                        3
                      )}
                    </span>
                  )}
              </div>

              <p className="mt-8 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Among the features used by the final
                four-circuit model,{" "}
                <span className="text-[var(--foreground)]">
                  {loading
                    ? "the leading feature"
                    : strongestFeatureName}
                </span>{" "}
                carries the highest model-derived
                importance.
              </p>

            </div>
          </div>
        </div>

        {/* ============================================================
            FEATURE RANKING
        ============================================================ */}

        <div className="mt-24 grid grid-cols-1 gap-12 lg:grid-cols-12">

          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Feature ranking
            </div>
          </div>

          <div className="lg:col-span-8">

            {loading ? (
              <div className="border border-[var(--border)] p-8">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Reading model...
                </div>
              </div>
            ) : topFeatures.length > 0 ? (
              <div className="border border-[var(--border)]">
                {topFeatures.map(
                  (feature, index) => (
                    <div
                      key={`${feature.name}-${index}`}
                      className="grid grid-cols-[45px_1fr_auto] items-center gap-5 border-b border-[var(--border)] px-6 py-6 last:border-b-0 md:px-8"
                    >
                      <span className="font-mono text-[9px] text-[var(--muted)]">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="font-mono text-[10px] tracking-[0.15em]">
                        {FEATURE_LABELS[
                          feature.name
                        ] ??
                          feature.name.toUpperCase()}
                      </span>

                      <span className="font-mono text-[10px] text-[var(--muted)]">
                        {feature.importance.toFixed(
                          3
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="border border-[var(--border)] p-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Model feature data unavailable
              </div>
            )}

          </div>
        </div>

        {/* ============================================================
            MODEL NUMBERS
        ============================================================ */}

        <div className="mt-32 grid grid-cols-1 border-y border-[var(--border)] md:grid-cols-3">

          <VerdictMetric
            label="MODEL"
            value="XGBOOST"
          />

          <VerdictMetric
            label="MAE"
            value={
              loading
                ? "..."
                : finalModel?.mae !==
                    undefined
                  ? `${finalModel.mae.toFixed(
                      3
                    )} S`
                  : "—"
            }
          />

          <VerdictMetric
            label="R²"
            value={
              loading
                ? "..."
                : finalModel?.r2 !==
                    undefined
                  ? finalModel.r2.toFixed(
                      3
                    )
                  : "—"
            }
          />

        </div>

        {/* ============================================================
            FINAL STATEMENT
        ============================================================ */}

        <div className="mt-40">

          <div className="flex items-center gap-4">
            <div className="h-px w-10 bg-[var(--accent)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              The answer
            </span>
          </div>

          <h3 className="mt-10 max-w-6xl text-5xl font-semibold leading-[0.88] tracking-[-0.055em] md:text-7xl lg:text-8xl">
            A FAST LAP
            <br />
            IS A{" "}
            <span className="text-[var(--accent)]">
              SYSTEM.
            </span>
          </h3>

          <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
            No single measurement explains performance
            on its own. The lap emerges from the
            interaction between the circuit, the car,
            the tyres, and the driver's ability to turn
            all of that into speed.
          </p>

        </div>

        {/* ============================================================
            TRANSITION
        ============================================================ */}

        <div className="mt-40 flex flex-col gap-8 border-t border-[var(--border)] pt-8 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Analysis complete
            </div>

            <div className="mt-3 font-mono text-xs tracking-[0.15em]">
              2024 / FORMULA 1 / MACHINE LEARNING
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Next
            </span>

            <span className="h-px w-10 bg-[var(--accent)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
              09 / The End
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}

/* ========================================================================
   FINDING
======================================================================== */

function Finding({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-[var(--surface)] p-8 md:p-10">

      <div className="flex items-start justify-between">
        <span className="font-mono text-[9px] text-[var(--muted)]">
          {number}
        </span>

        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      </div>

      <div className="mt-20">

        <h4 className="font-mono text-xs tracking-[0.2em]">
          {title}
        </h4>

        <p className="mt-5 max-w-md text-sm leading-7 text-[var(--muted)]">
          {text}
        </p>

      </div>
    </div>
  );
}

/* ========================================================================
   VERDICT METRIC
======================================================================== */

function VerdictMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-8 md:border-r md:p-10">
      <div className="font-mono text-4xl tracking-[-0.04em] md:text-5xl">
        {value}
      </div>

      <div className="mt-4 font-mono text-[9px] tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}
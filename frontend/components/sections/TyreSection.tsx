"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Plot = dynamic(
  () => import("react-plotly.js"),
  { ssr: false }
);

type TyrePoint = {
  circuit: string;
  driver: string;
  compound: string;
  tyreLife: number;
  lapTime: number;
  normalizedLapTime: number;
};

type Trend = {
  circuit: string;
  compound: string;
  slopeSecondsPerLap: number;
  intercept: number;
  points: number;
};

type TyreData = {
  points: TyrePoint[];
  trends: Trend[];
};

const COMPOUNDS = [
  "SOFT",
  "MEDIUM",
  "HARD",
] as const;

type Compound =
  (typeof COMPOUNDS)[number];

export default function TyreSection() {
  const [data, setData] =
    useState<TyreData | null>(null);

  const [compound, setCompound] =
    useState<Compound>("SOFT");

  const [circuit, setCircuit] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetch("/data/tyre-degradation.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load tyre data: ${response.status}`
          );
        }

        return response.json();
      })
      .then((json: TyreData) => {
        setData(json);
      })
      .catch((error) => {
        console.error(
          "Failed to load tyre-degradation.json:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const circuits = useMemo(() => {
    if (!data) {
      return [];
    }

    return Array.from(
      new Set(
        data.points.map(
          (point) => point.circuit
        )
      )
    ).sort();
  }, [data]);

  const filteredPoints = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.points.filter(
      (point) =>
        point.compound === compound &&
        (circuit === "ALL" ||
          point.circuit === circuit)
    );
  }, [data, compound, circuit]);

  const filteredTrends = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.trends.filter(
      (trend) =>
        trend.compound === compound &&
        (circuit === "ALL" ||
          trend.circuit === circuit)
    );
  }, [data, compound, circuit]);

  const averageDegradation = useMemo(() => {
    if (!filteredTrends.length) {
      return null;
    }

    const total =
      filteredTrends.reduce(
        (sum, trend) =>
          sum +
          trend.slopeSecondsPerLap,
        0
      );

    return (
      total / filteredTrends.length
    );
  }, [filteredTrends]);

  const bestTrend = useMemo(() => {
    if (!filteredTrends.length) {
      return null;
    }

    return filteredTrends.reduce(
      (best, current) =>
        current.slopeSecondsPerLap <
        best.slopeSecondsPerLap
          ? current
          : best
    );
  }, [filteredTrends]);

  const worstTrend = useMemo(() => {
    if (!filteredTrends.length) {
      return null;
    }

    return filteredTrends.reduce(
      (worst, current) =>
        current.slopeSecondsPerLap >
        worst.slopeSecondsPerLap
          ? current
          : worst
    );
  }, [filteredTrends]);

  const chartData = useMemo(() => {
    if (!filteredPoints.length) {
      return [];
    }

    const grouped = new Map<
      string,
      TyrePoint[]
    >();

    filteredPoints.forEach((point) => {
      const key =
        `${point.circuit}-${point.driver}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(point);
    });

    return Array.from(
      grouped.entries()
    ).map(
      ([key, points]) => ({
        type: "scatter" as const,
        mode: "markers" as const,

        name: key,

        x: points.map(
          (point) => point.tyreLife
        ),

        y: points.map(
          (point) =>
            point.normalizedLapTime
        ),

        customdata: points.map(
          (point) => [
            point.driver,
            point.circuit,
            point.compound,
            point.lapTime,
          ]
        ),

        marker: {
          size: 5,
          opacity: 0.45,
        },

        hovertemplate:
          "<b>%{customdata[0]}</b>" +
          "<br>%{customdata[1]}" +
          "<br><br>" +
          "Tyre life: %{x}" +
          "<br>Δ lap: %{y:.3f}s" +
          "<br>Lap time: %{customdata[3]:.3f}s" +
          "<extra></extra>",

        showlegend: false,
      })
    );
  }, [filteredPoints]);

  const trendLines = useMemo(() => {
    return filteredTrends.map(
      (trend) => {
        const relevantPoints =
          filteredPoints.filter(
            (point) =>
              point.circuit ===
              trend.circuit
          );

        if (!relevantPoints.length) {
          return null;
        }

        const maxTyreLife =
          Math.max(
            ...relevantPoints.map(
              (point) =>
                point.tyreLife
            )
          );

        const minTyreLife =
          Math.min(
            ...relevantPoints.map(
              (point) =>
                point.tyreLife
            )
          );

        return {
          type: "scatter" as const,
          mode: "lines" as const,

          x: [
            minTyreLife,
            maxTyreLife,
          ],

          y: [
            trend.slopeSecondsPerLap *
                minTyreLife +
              trend.intercept,
            trend.slopeSecondsPerLap *
                maxTyreLife +
              trend.intercept,
          ],

          name: trend.circuit,

          line: {
            width: 2,
          },

          hovertemplate:
            `<b>${trend.circuit}</b>` +
            "<br>" +
            `+${trend.slopeSecondsPerLap.toFixed(
              4
            )}s / lap` +
            "<extra></extra>",
        };
      }
    ).filter(Boolean);
  }, [
    filteredTrends,
    filteredPoints,
  ]);

  const plotData = [
    ...chartData,
    ...trendLines,
  ];

  const compoundDescription =
    compound === "SOFT"
      ? "Maximum grip · shorter life"
      : compound === "MEDIUM"
        ? "Balanced performance"
        : "Long life · lower peak grip";

  return (
    <section
      id="tyres"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">
        {/* Header */}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              05 / The Tyres
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              GRIP
              <br />
              <span className="text-[var(--muted)]">
                HAS A PRICE.
              </span>
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              A tyre does not remain equally fast
              forever. As laps accumulate, performance
              changes. That loss of pace is the price of
              using the grip available at the start of a
              stint.
            </p>
          </div>
        </div>

        {/* Controls */}

        <div className="mt-20 flex flex-col gap-6 border-y border-[var(--border)] py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Compound
            </div>

            <div className="mt-1 font-mono text-xs uppercase tracking-[0.15em]">
              {compoundDescription}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMPOUNDS.map(
              (item) => {
                const active =
                  compound === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setCompound(item)
                    }
                    className={`border px-5 py-2 font-mono text-[10px] tracking-[0.15em] transition-all ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {item}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Circuit filter */}

        <div className="flex flex-col gap-4 border-b border-[var(--border)] py-5 md:flex-row md:items-center md:justify-between">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Circuit
          </div>

          <select
            value={circuit}
            onChange={(event) =>
              setCircuit(
                event.target.value
              )
            }
            className="w-full border border-[var(--border)] bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] outline-none transition-colors focus:border-[var(--accent)] md:w-56"
          >
            <option
              value="ALL"
              className="bg-[#0a0a0a]"
            >
              ALL CIRCUITS
            </option>

            {circuits.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-[#0a0a0a]"
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        {/* Visualization */}

        <div className="relative mt-12 border border-[var(--border)] bg-[var(--surface)]">
          {loading ? (
            <div className="flex min-h-[580px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                Loading tyre data...
              </div>
            </div>
          ) : plotData.length === 0 ? (
            <div className="flex min-h-[580px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                No tyre data available
              </div>
            </div>
          ) : (
            <Plot
              data={plotData}
              layout={{
                autosize: true,
                height: 580,

                paper_bgcolor:
                  "transparent",

                plot_bgcolor:
                  "transparent",

                margin: {
                  l: 70,
                  r: 35,
                  t: 40,
                  b: 65,
                },

                font: {
                  family:
                    "Geist Mono, monospace",
                  size: 10,
                  color: "#888888",
                },

                xaxis: {
                  title: {
                    text:
                      "TYRE LIFE (LAPS)",
                    font: {
                      size: 9,
                    },
                  },

                  showgrid: true,
                  gridcolor: "#202020",

                  zeroline: false,

                  linecolor: "#292929",

                  tickfont: {
                    size: 9,
                  },
                },

                yaxis: {
                  title: {
                    text:
                      "NORMALIZED LAP TIME (SECONDS)",
                    font: {
                      size: 9,
                    },
                  },

                  showgrid: true,
                  gridcolor: "#202020",

                  zeroline: true,
                  zerolinecolor:
                    "#393939",

                  linecolor: "#292929",

                  tickfont: {
                    size: 9,
                  },
                },

                hoverlabel: {
                  bgcolor: "#111111",
                  bordercolor:
                    "#292929",

                  font: {
                    family:
                      "Geist Mono, monospace",
                    size: 10,
                  },
                },
              }}
              config={{
                responsive: true,
                displayModeBar: false,
                scrollZoom: false,
              }}
              style={{
                width: "100%",
              }}
              useResizeHandler
            />
          )}
        </div>

        {/* Statistics */}

        <div className="grid grid-cols-1 border-b border-[var(--border)] md:grid-cols-3">
          <TyreStat
            value={
              averageDegradation !== null
                ? `+${averageDegradation.toFixed(
                    4
                  )}s`
                : "—"
            }
            unit="/ LAP"
            label="AVERAGE DEGRADATION"
            description={
              compound
            }
          />

          <TyreStat
            value={
              bestTrend
                ? `+${bestTrend.slopeSecondsPerLap.toFixed(
                    4
                  )}s`
                : "—"
            }
            unit="/ LAP"
            label="LOWEST DEGRADATION"
            description={
              bestTrend
                ? bestTrend.circuit
                : "No data"
            }
          />

          <TyreStat
            value={
              worstTrend
                ? `+${worstTrend.slopeSecondsPerLap.toFixed(
                    4
                  )}s`
                : "—"
            }
            unit="/ LAP"
            label="HIGHEST DEGRADATION"
            description={
              worstTrend
                ? worstTrend.circuit
                : "No data"
            }
          />
        </div>

        {/* Story */}

        <div className="mt-28 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              The takeaway
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-3xl font-medium leading-tight tracking-[-0.035em] md:text-5xl">
              The fastest tyre
              <br />
              <span className="text-[var(--muted)]">
                is not always the best tyre.
              </span>
            </p>

            <p className="mt-8 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
              Peak performance is only one part of
              tyre strategy. The rate at which that
              performance disappears matters just as
              much. A tyre that gives up less time per
              lap can change the shape of an entire
              stint.
            </p>
          </div>
        </div>

        {/* Tyre philosophy */}

        <div className="mt-24 grid grid-cols-1 gap-px bg-[var(--border)] md:grid-cols-3">
          <TyreCard
            compound="SOFT"
            title="PEAK GRIP"
            text="Fastest initial performance, but generally the shortest useful window."
          />

          <TyreCard
            compound="MEDIUM"
            title="BALANCE"
            text="A compromise between outright pace and usable stint life."
          />

          <TyreCard
            compound="HARD"
            title="ENDURANCE"
            text="Lower peak performance, but designed to survive longer."
          />
        </div>

        {/* Next chapter */}

        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Next
          </span>

          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--foreground)]">
            06 / Race Pace
          </span>
        </div>
      </div>
    </section>
  );
}

function TyreStat({
  value,
  unit,
  label,
  description,
}: {
  value: string;
  unit: string;
  label: string;
  description: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-6 md:border-r md:p-8">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-3xl tracking-[-0.04em] md:text-4xl">
          {value}
        </span>

        <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--muted)]">
          {unit}
        </span>
      </div>

      <div className="mt-3 font-mono text-[9px] tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>

      <div className="mt-2 text-sm text-[var(--muted)]">
        {description}
      </div>
    </div>
  );
}

function TyreCard({
  compound,
  title,
  text,
}: {
  compound: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-[var(--surface)] p-7 md:p-9">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]">
          {compound}
        </span>

        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      </div>

      <div className="mt-16">
        <div className="font-mono text-xs tracking-[0.2em]">
          {title}
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {text}
        </p>
      </div>
    </div>
  );
}
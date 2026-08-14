"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Plot = dynamic(
  () => import("react-plotly.js"),
  { ssr: false }
);

type SpeedData = {
  driver: string;
  speedI1: number | null;
  speedI2: number | null;
  speedFL: number | null;
  speedST: number | null;
  lapTime: number;
};

type SpeedMetric =
  | "speedI1"
  | "speedI2"
  | "speedFL"
  | "speedST";

const METRICS: {
  key: SpeedMetric;
  label: string;
  description: string;
}[] = [
  {
    key: "speedI1",
    label: "I1",
    description: "INTERMEDIATE 1",
  },
  {
    key: "speedI2",
    label: "I2",
    description: "INTERMEDIATE 2",
  },
  {
    key: "speedFL",
    label: "FL",
    description: "FINISH LINE",
  },
  {
    key: "speedST",
    label: "ST",
    description: "SPEED TRAP",
  },
];

export default function SpeedSection() {
  const [data, setData] = useState<SpeedData[]>([]);
  const [metric, setMetric] =
    useState<SpeedMetric>("speedST");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/speed.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load speed data: ${response.status}`
          );
        }

        return response.json();
      })
      .then((json: SpeedData[]) => {
        setData(json);
      })
      .catch((error) => {
        console.error(
          "Failed to load speed.json:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const validData = useMemo(() => {
    return data.filter(
      (item) =>
        item[metric] !== null &&
        item[metric] !== undefined
    );
  }, [data, metric]);

  const sortedData = useMemo(() => {
    return [...validData].sort(
      (a, b) =>
        (b[metric] ?? 0) -
        (a[metric] ?? 0)
    );
  }, [validData, metric]);

  const fastest = sortedData[0];

  const slowest =
    sortedData[sortedData.length - 1];

  const average = useMemo(() => {
    if (!validData.length) {
      return null;
    }

    const total = validData.reduce(
      (sum, item) =>
        sum + (item[metric] ?? 0),
      0
    );

    return total / validData.length;
  }, [validData, metric]);

  const spread = useMemo(() => {
    if (
      !fastest ||
      !slowest ||
      fastest[metric] === null ||
      slowest[metric] === null
    ) {
      return null;
    }

    return (
      (fastest[metric] ?? 0) -
      (slowest[metric] ?? 0)
    );
  }, [fastest, slowest, metric]);

  const chartData = useMemo(() => {
    return [
      {
        type: "bar" as const,
        orientation: "h" as const,

        x: sortedData.map(
          (item) => item[metric] ?? 0
        ),

        y: sortedData.map(
          (item) => item.driver
        ),

        customdata: sortedData.map(
          (item) => [
            item.driver,
            item[metric],
            item.lapTime,
          ]
        ),

        marker: {
          opacity: 0.85,
        },

        hovertemplate:
          "<b>%{customdata[0]}</b>" +
          "<br>" +
          "%{customdata[1]:.1f} km/h" +
          "<br>" +
          "Lap: %{customdata[2]:.3f}s" +
          "<extra></extra>",

        showlegend: false,
      },
    ];
  }, [sortedData, metric]);

  const activeMetric = METRICS.find(
    (item) => item.key === metric
  );

  return (
    <section
      id="speed"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">
        {/* Header */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              04 / Speed
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              CARRY
              <br />
              <span className="text-[var(--muted)]">
                THE SPEED.
              </span>
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              Lap time tells us who was fast. Speed
              measurements tell us something different:
              where that performance was expressed on the
              circuit.
            </p>
          </div>
        </div>

        {/* Metric selector */}
        <div className="mt-20 flex flex-col gap-6 border-y border-[var(--border)] py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Speed measurement
            </div>

            <div className="mt-1 font-mono text-xs uppercase tracking-[0.15em]">
              {activeMetric?.description}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {METRICS.map((item) => {
              const active =
                metric === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setMetric(item.key)
                  }
                  className={`border px-5 py-2 font-mono text-[10px] tracking-[0.15em] transition-all ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main visualization */}
        <div className="relative mt-12 border border-[var(--border)] bg-[var(--surface)]">
          {loading ? (
            <div className="flex min-h-[560px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                Loading speed data...
              </div>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex min-h-[560px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                No speed data available
              </div>
            </div>
          ) : (
            <Plot
              data={chartData}
              layout={{
                autosize: true,
                height: 560,

                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",

                margin: {
                  l: 70,
                  r: 35,
                  t: 40,
                  b: 60,
                },

                font: {
                  family:
                    "Geist Mono, monospace",
                  size: 10,
                  color: "#888888",
                },

                xaxis: {
                  title: {
                    text: "SPEED (KM/H)",
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
                  autorange: "reversed",

                  showgrid: false,

                  zeroline: false,

                  linecolor: "#292929",

                  tickfont: {
                    size: 9,
                  },
                },

                hoverlabel: {
                  bgcolor: "#111111",
                  bordercolor: "#292929",

                  font: {
                    family:
                      "Geist Mono, monospace",
                    size: 10,
                  },
                },

                bargap: 0.25,
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
          <SpeedStat
            value={
              fastest
                ? `${(
                    fastest[metric] ?? 0
                  ).toFixed(1)}`
                : "—"
            }
            unit="KM/H"
            label="HIGHEST SPEED"
            description={
              fastest
                ? fastest.driver
                : "No data"
            }
          />

          <SpeedStat
            value={
              average
                ? `${average.toFixed(1)}`
                : "—"
            }
            unit="KM/H"
            label="FIELD AVERAGE"
            description={
              activeMetric?.description ??
              ""
            }
          />

          <SpeedStat
            value={
              spread
                ? `${spread.toFixed(1)}`
                : "—"
            }
            unit="KM/H"
            label="FIELD SPREAD"
            description="Fastest → slowest"
          />
        </div>

        {/* Speed insight */}
        <div className="mt-28 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              The takeaway
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-3xl font-medium leading-tight tracking-[-0.035em] md:text-5xl">
              Speed is not just about
              <br />
              <span className="text-[var(--muted)]">
                going faster.
              </span>
            </p>

            <p className="mt-8 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
              Every speed trap measures a different
              moment of the lap. A car can be dominant
              through one part of the circuit and give
              away time somewhere else. Performance is
              about the combination.
            </p>
          </div>
        </div>

        {/* Telemetry strip */}
        <div className="mt-24 border-y border-[var(--border)] py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Telemetry points
              </div>

              <div className="mt-2 font-mono text-xs uppercase tracking-[0.15em]">
                I1 · I2 · FL · ST
              </div>
            </div>

            <div className="max-w-xl text-sm leading-6 text-[var(--muted)]">
              Four measurements. Four different glimpses
              into how a car generates and carries
              performance around a circuit.
            </div>
          </div>
        </div>

        {/* Next chapter */}
        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Next
          </span>

          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--foreground)]">
            05 / The Tyres
          </span>
        </div>
      </div>
    </section>
  );
}

function SpeedStat({
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
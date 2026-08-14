"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
});

type TyrePoint = {
  circuit: string;
  driver: string;
  compound: string;
  tyreLife: number;
  lapTime: number;
  normalizedLapTime: number;
};

type TyreData = {
  points: TyrePoint[];
};

type DriverSummary = {
  driver: string;
  averageLap: number;
  averageNormalized: number;
  laps: number;
  lateStintPace: number;
};

const COMPOUNDS = [
  "ALL",
  "SOFT",
  "MEDIUM",
  "HARD",
] as const;

type Compound = (typeof COMPOUNDS)[number];

const DRIVER_NAMES: Record<string, string> = {
  VER: "VERSTAPPEN",
  PER: "PEREZ",
  LEC: "LECLERC",
  SAI: "SAINZ",
  HAM: "HAMILTON",
  RUS: "RUSSELL",
  NOR: "NORRIS",
  PIA: "PIASTRI",
  ALO: "ALONSO",
  STR: "STROLL",
  GAS: "GASLY",
  OCO: "OCON",
  TSU: "TSUNODA",
  ALB: "ALBON",
  BOT: "BOTTAS",
  ZHO: "ZHOU",
  MAG: "MAGNUSSEN",
  HUL: "HULKENBERG",
  RIC: "RICCIARDO",
  BEA: "BEARMAN",
  LAW: "LAWSON",
};

export default function RacePaceSection() {
  const [data, setData] = useState<TyreData | null>(null);
  const [circuit, setCircuit] = useState("ALL");
  const [compound, setCompound] = useState<Compound>("ALL");
  const [driver, setDriver] = useState("ALL");
  const [loading, setLoading] = useState(true);

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
      new Set(data.points.map((point) => point.circuit))
    ).sort();
  }, [data]);

  const drivers = useMemo(() => {
    if (!data) {
      return [];
    }

    return Array.from(
      new Set(data.points.map((point) => point.driver))
    ).sort();
  }, [data]);

  const filteredPoints = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.points.filter((point) => {
      const circuitMatch =
        circuit === "ALL" || point.circuit === circuit;

      const compoundMatch =
        compound === "ALL" || point.compound === compound;

      const driverMatch =
        driver === "ALL" || point.driver === driver;

      return circuitMatch && compoundMatch && driverMatch;
    });
  }, [data, circuit, compound, driver]);

  const summaries = useMemo(() => {
    const groups = new Map<string, TyrePoint[]>();

    filteredPoints.forEach((point) => {
      if (!groups.has(point.driver)) {
        groups.set(point.driver, []);
      }

      groups.get(point.driver)!.push(point);
    });

    const result: DriverSummary[] = [];

    groups.forEach((points, driverCode) => {
      const averageLap =
        points.reduce(
          (sum, point) => sum + point.lapTime,
          0
        ) / points.length;

      const averageNormalized =
        points.reduce(
          (sum, point) =>
            sum + point.normalizedLapTime,
          0
        ) / points.length;

      const maxLife = Math.max(
        ...points.map((point) => point.tyreLife)
      );

      const lateStintPoints = points.filter(
        (point) =>
          point.tyreLife >= maxLife * 0.65
      );

      const lateStintPace =
        lateStintPoints.length > 0
          ? lateStintPoints.reduce(
              (sum, point) =>
                sum + point.normalizedLapTime,
              0
            ) / lateStintPoints.length
          : averageNormalized;

      result.push({
        driver: driverCode,
        averageLap,
        averageNormalized,
        laps: points.length,
        lateStintPace,
      });
    });

    return result.sort(
      (a, b) =>
        a.averageNormalized - b.averageNormalized
    );
  }, [filteredPoints]);

  const chartData = useMemo(() => {
    const groups = new Map<
      string,
      TyrePoint[]
    >();

    filteredPoints.forEach((point) => {
      if (!groups.has(point.driver)) {
        groups.set(point.driver, []);
      }

      groups.get(point.driver)!.push(point);
    });

    return Array.from(groups.entries()).map(
      ([driverCode, points]) => {
        const sorted = [...points].sort(
          (a, b) =>
            a.tyreLife - b.tyreLife
        );

        return {
          type: "scatter" as const,
          mode: "lines+markers" as const,

          name:
            DRIVER_NAMES[driverCode] ??
            driverCode,

          x: sorted.map(
            (point) => point.tyreLife
          ),

          y: sorted.map(
            (point) =>
              point.normalizedLapTime
          ),

          customdata: sorted.map(
            (point) => [
              point.driver,
              point.circuit,
              point.compound,
              point.lapTime,
            ]
          ),

          line: {
            width: 2,
          },

          marker: {
            size: 5,
          },

          hovertemplate:
            "<b>%{customdata[0]}</b>" +
            "  ·  %{customdata[1]}" +
            "<br><br>" +
            "<b>TYRE</b>        %{customdata[2]}" +
            "<br>" +
            "<b>TYRE LIFE</b>   %{x} LAPS" +
            "<br><br>" +
            "<b>Δ PACE</b>      %{y:.3f} S" +
            "<br>" +
            "<b>LAP TIME</b>    %{customdata[3]:.3f} S" +
            "<extra></extra>",
        };
      }
    );
  }, [filteredPoints]);

  const bestDriver = summaries[0] ?? null;

  const worstDriver =
    summaries.length > 0
      ? summaries[summaries.length - 1]
      : null;

  const strongestLateStint = useMemo(() => {
    if (!summaries.length) {
      return null;
    }

    return [...summaries].sort(
      (a, b) =>
        a.lateStintPace -
        b.lateStintPace
    )[0];
  }, [summaries]);

  return (
    <section
      id="race-pace"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">
        {/* HEADER */}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              06 / Race Pace
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              SPEED
              <br />
              <span className="text-[var(--muted)]">
                THAT LASTS.
              </span>
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              One fast lap proves that a car can be
              quick. Sustained pace tells us whether
              that speed survives the demands of a
              stint.
            </p>
          </div>
        </div>

        {/* CONTROLS */}

        <div className="mt-20 border-y border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <Filter
              label="Circuit"
              value={circuit}
              onChange={setCircuit}
              options={["ALL", ...circuits]}
            />

            <Filter
              label="Compound"
              value={compound}
              onChange={(value) =>
                setCompound(value as Compound)
              }
              options={[...COMPOUNDS]}
            />

            <Filter
              label="Driver"
              value={driver}
              onChange={setDriver}
              options={[
                "ALL",
                ...drivers,
              ]}
            />
          </div>
        </div>

        {/* CHART */}

        <div className="mt-12 border border-[var(--border)] bg-[var(--surface)]">
          {loading ? (
            <div className="flex min-h-[580px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                Loading race pace data...
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex min-h-[580px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                No matching data
              </div>
            </div>
          ) : (
            <Plot
              data={chartData}
              layout={{
                autosize: true,
                height: 580,

                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",

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
                    text: "TYRE LIFE (LAPS)",
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
                    text: "NORMALIZED PACE (SECONDS)",
                    font: {
                      size: 9,
                    },
                  },

                  showgrid: true,
                  gridcolor: "#202020",
                  zeroline: true,
                  zerolinecolor: "#393939",
                  linecolor: "#292929",

                  tickfont: {
                    size: 9,
                  },
                },

                legend: {
                  orientation: "h",
                  y: -0.15,
                  x: 0,

                  font: {
                    size: 9,
                  },
                },

                /*
                 * Global hover styling.
                 *
                 * The chart itself remains unchanged.
                 * This only controls the data-point popup.
                 */
                hoverlabel: {
                  bgcolor: "#171717",
                  bordercolor: "#e10600",
                  align: "left",

                  font: {
                    family:
                      "Geist Mono, monospace",
                    size: 12,
                    color: "#f2f2f0",
                  },

                  namelength: -1,
                },

                hovermode: "closest",
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

        {/* STATS */}

        <div className="grid grid-cols-1 border-b border-[var(--border)] md:grid-cols-3">
          <PaceStat
            label="BEST OVERALL PACE"
            value={
              bestDriver
                ? bestDriver.driver
                : "—"
            }
            description={
              bestDriver
                ? `${DRIVER_NAMES[bestDriver.driver] ?? bestDriver.driver} · ${bestDriver.averageNormalized.toFixed(2)}s normalized`
                : "No data"
            }
          />

          <PaceStat
            label="STRONGEST LATE STINT"
            value={
              strongestLateStint
                ? strongestLateStint.driver
                : "—"
            }
            description={
              strongestLateStint
                ? `${DRIVER_NAMES[strongestLateStint.driver] ?? strongestLateStint.driver} · ${strongestLateStint.lateStintPace.toFixed(2)}s normalized`
                : "No data"
            }
          />

          <PaceStat
            label="PACE SPREAD"
            value={
              bestDriver && worstDriver
                ? `${(
                    worstDriver.averageNormalized -
                    bestDriver.averageNormalized
                  ).toFixed(2)}s`
                : "—"
            }
            description="Average normalized pace difference"
          />
        </div>

        {/* EXPLANATION */}

        <div className="mt-28 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              What we're seeing
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-3xl font-medium leading-tight tracking-[-0.035em] md:text-5xl">
              Race pace is not
              <br />
              <span className="text-[var(--muted)]">
                a single number.
              </span>
            </p>

            <p className="mt-8 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
              The chart follows normalized pace as
              tyre life increases. The interesting part
              isn't simply who starts fastest. It is who
              can maintain a competitive pace deeper
              into the stint.
            </p>
          </div>
        </div>

        {/* DRIVER TABLE */}

        <div className="mt-24 overflow-hidden border border-[var(--border)]">
          <div className="border-b border-[var(--border)] px-6 py-5 md:px-8">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Driver comparison
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {summaries
              .slice(0, 10)
              .map((summary, index) => (
                <div
                  key={summary.driver}
                  className="grid grid-cols-[50px_1fr_auto] items-center gap-4 px-6 py-5 md:grid-cols-[60px_1fr_160px_160px] md:px-8"
                >
                  <div className="font-mono text-[10px] text-[var(--muted)]">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div>
                    <div className="font-mono text-xs tracking-[0.15em]">
                      {DRIVER_NAMES[
                        summary.driver
                      ] ?? summary.driver}
                    </div>

                    <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]">
                      {summary.laps} data points
                    </div>
                  </div>

                  <div className="hidden text-right md:block">
                    <div className="font-mono text-sm">
                      {summary.averageNormalized.toFixed(
                        2
                      )}
                      s
                    </div>

                    <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]">
                      Avg. pace
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm">
                      {summary.lateStintPace.toFixed(
                        2
                      )}
                      s
                    </div>

                    <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]">
                      Late stint
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* CLOSING STATEMENT */}

        <div className="mt-32">
          <div className="flex items-center gap-4">
            <div className="h-px w-10 bg-[var(--accent)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              The takeaway
            </span>
          </div>

          <p className="mt-8 max-w-5xl text-4xl font-medium leading-[0.95] tracking-[-0.04em] md:text-6xl">
            The fastest car isn't necessarily
            <br />
            <span className="text-[var(--muted)]">
              the car that stays fastest.
            </span>
          </p>
        </div>

        {/* NEXT */}

        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Next
          </span>

          <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
            07 / The Model
          </span>
        </div>
      </div>
    </section>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="border-b border-[var(--border)] p-5 md:border-r md:p-6">
      <div className="mb-3 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#0a0a0a]"
          >
            {option === "ALL"
              ? `ALL ${label.toUpperCase()}S`
              : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaceStat({
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
      <div className="font-mono text-3xl tracking-[-0.04em] md:text-4xl">
        {value}
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
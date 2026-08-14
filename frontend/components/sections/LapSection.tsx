"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Plot = dynamic(
  () => import("react-plotly.js"),
  {
    ssr: false,
  }
);

type LapData = {
  driver: string;
  team: string;
  compound: string;
  tyreLife: number | null;
  freshTyre: boolean | null;
  s1?: number | null;
  s2?: number | null;
  s3?: number | null;
  speedI1?: number | null;
  speedI2?: number | null;
  speedFL?: number | null;
  speedST?: number | null;
  lapTime: number;
};

export default function LapSection() {
  const [laps, setLaps] = useState<LapData[]>([]);
  const [selectedDriver, setSelectedDriver] =
    useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/lap-performance.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load lap data: ${response.status}`
          );
        }

        return response.json();
      })
      .then((data: LapData[]) => {
        setLaps(data);
      })
      .catch((error) => {
        console.error(
          "Failed to load lap-performance.json:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const drivers = useMemo(() => {
    return [
      "ALL",
      ...Array.from(
        new Set(
          laps
            .map((lap) => lap.driver)
            .filter(Boolean)
        )
      ).sort(),
    ];
  }, [laps]);

  const filteredLaps = useMemo(() => {
    if (selectedDriver === "ALL") {
      return laps;
    }

    return laps.filter(
      (lap) => lap.driver === selectedDriver
    );
  }, [laps, selectedDriver]);

  const fastestLap = useMemo(() => {
    if (!laps.length) {
      return null;
    }

    return laps.reduce((fastest, current) =>
      current.lapTime < fastest.lapTime
        ? current
        : fastest
    );
  }, [laps]);

  const driverBestLap = useMemo(() => {
    if (!filteredLaps.length) {
      return null;
    }

    return filteredLaps.reduce(
      (fastest, current) =>
        current.lapTime < fastest.lapTime
          ? current
          : fastest
    );
  }, [filteredLaps]);

  const chartData = useMemo(() => {
    if (!filteredLaps.length) {
      return [];
    }

    const traces = new Map<
      string,
      {
        x: number[];
        y: number[];
        customdata: (
          | string
          | number
          | null
          | boolean
        )[][];
      }
    >();

    filteredLaps.forEach((lap, index) => {
      if (!traces.has(lap.driver)) {
        traces.set(lap.driver, {
          x: [],
          y: [],
          customdata: [],
        });
      }

      const trace = traces.get(lap.driver)!;

      trace.x.push(index + 1);
      trace.y.push(lap.lapTime);

      trace.customdata.push([
        lap.driver,
        lap.team,
        lap.compound,
        lap.tyreLife ?? "—",
        lap.s1 ?? "—",
        lap.s2 ?? "—",
        lap.s3 ?? "—",
      ]);
    });

    return Array.from(
      traces.entries()
    ).map(
      ([driver, trace]) => ({
        type: "scattergl" as const,
        mode: "markers" as const,
        name: driver,
        x: trace.x,
        y: trace.y,
        customdata: trace.customdata,
        marker: {
          size: 6,
          opacity:
            selectedDriver === "ALL"
              ? 0.55
              : 0.8,
        },
        hovertemplate:
          "<b>%{customdata[0]}</b>" +
          "<br>%{customdata[1]}" +
          "<br><br>" +
          "Lap Time: %{y:.3f}s" +
          "<br>Tyre: %{customdata[2]}" +
          "<br>Tyre Life: %{customdata[3]}" +
          "<br>S1: %{customdata[4]}" +
          "<br>S2: %{customdata[5]}" +
          "<br>S3: %{customdata[6]}" +
          "<extra></extra>",
      })
    );
  }, [filteredLaps, selectedDriver]);

  const fastestTrace = useMemo(() => {
    if (!fastestLap) {
      return null;
    }

    const fastestIndex = filteredLaps.indexOf(
      fastestLap
    );

    if (fastestIndex === -1) {
      return null;
    }

    return {
      type: "scatter" as const,
      mode: "markers" as const,
      x: [fastestIndex + 1],
      y: [fastestLap.lapTime],
      marker: {
        size: 14,
        symbol: "circle-open",
        line: {
          width: 2,
        },
      },
      name: "Fastest lap",
      hovertemplate:
        "<b>FASTEST LAP</b>" +
        "<br>%{y:.3f}s" +
        "<extra></extra>",
      showlegend: false,
    };
  }, [fastestLap, filteredLaps]);

  const plotData = fastestTrace
    ? [...chartData, fastestTrace]
    : chartData;

  return (
    <section
      id="lap"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">
        {/* Section heading */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              02 / The Lap
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              THE CLOCK
              <br />
              <span className="text-[var(--muted)]">
                DOESN&apos;T LIE.
              </span>
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              Every qualifying lap is a measurement of
              performance. Before looking at sectors,
              tyres, or machine learning, we start with
              the number every driver is ultimately trying
              to reduce.
            </p>
          </div>
        </div>

        {/* Dataset controls */}
        <div className="mt-20 flex flex-col gap-6 border-y border-[var(--border)] py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Dataset
            </div>

            <div className="mt-1 font-mono text-xs uppercase tracking-[0.15em]">
              Bahrain · Qualifying · 2024
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label
              htmlFor="driver-filter"
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              Driver
            </label>

            <select
              id="driver-filter"
              value={selectedDriver}
              onChange={(event) =>
                setSelectedDriver(
                  event.target.value
                )
              }
              className="min-w-36 border border-[var(--border)] bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] outline-none transition-colors focus:border-[var(--accent)]"
            >
              {drivers.map((driver) => (
                <option
                  key={driver}
                  value={driver}
                  className="bg-[#0a0a0a]"
                >
                  {driver}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main visualization */}
        <div className="relative mt-12 min-h-[520px] border border-[var(--border)] bg-[var(--surface)]">
          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                Loading telemetry...
              </div>
            </div>
          ) : filteredLaps.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                No lap data available
              </div>
            </div>
          ) : (
            <Plot
              data={plotData}
              layout={{
                autosize: true,
                height: 520,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                margin: {
                  l: 65,
                  r: 30,
                  t: 35,
                  b: 60,
                },
                font: {
                  family:
                    "Geist Mono, monospace",
                  size: 10,
                  color: "#888888",
                },
                showlegend:
                  selectedDriver === "ALL",
                legend: {
                  orientation: "h",
                  x: 0,
                  y: 1.08,
                  font: {
                    size: 9,
                  },
                },
                xaxis: {
                  title: {
                    text: "LAP INDEX",
                    font: {
                      size: 9,
                    },
                  },
                  showgrid: false,
                  zeroline: false,
                  linecolor: "#292929",
                  tickfont: {
                    size: 9,
                  },
                },
                yaxis: {
                  title: {
                    text: "LAP TIME (SECONDS)",
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
                hoverlabel: {
                  bgcolor: "#111111",
                  bordercolor: "#292929",
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

        {/* Key numbers */}
        <div className="grid grid-cols-1 border-b border-[var(--border)] md:grid-cols-3">
          <Stat
            value={
              fastestLap
                ? `${fastestLap.lapTime.toFixed(3)}s`
                : "—"
            }
            label="FASTEST LAP"
            description={
              fastestLap
                ? fastestLap.driver
                : "Awaiting data"
            }
          />

          <Stat
            value={
              driverBestLap
                ? `${driverBestLap.lapTime.toFixed(3)}s`
                : "—"
            }
            label={
              selectedDriver === "ALL"
                ? "BEST OBSERVED"
                : "DRIVER BEST"
            }
            description={
              driverBestLap
                ? driverBestLap.driver
                : "Awaiting data"
            }
          />

          <Stat
            value={filteredLaps.length.toString()}
            label="LAPS ANALYSED"
            description={
              selectedDriver === "ALL"
                ? "All drivers"
                : selectedDriver
            }
          />
        </div>

        {/* Story continuation */}
        <div className="mt-28 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              What we see
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-3xl font-medium leading-tight tracking-[-0.035em] md:text-5xl">
              The gap between laps looks small.
              <br />
              <span className="text-[var(--muted)]">
                In Formula 1, small gaps are enormous.
              </span>
            </p>

            <p className="mt-8 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
              A few tenths can separate multiple
              positions on a qualifying grid. But a lap
              time is only the final result. To understand
              where those tenths come from, we have to
              break the lap apart.
            </p>
          </div>
        </div>

        {/* Next chapter marker */}
        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Next
          </span>

          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--foreground)]">
            03 / The Sectors
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
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
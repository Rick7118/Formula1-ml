"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Plot = dynamic(
  () => import("react-plotly.js"),
  { ssr: false }
);

type Lap = {
  driver: string;
  team: string;
  compound: string;
  tyreLife: number | null;
  s1: number | null;
  s2: number | null;
  s3: number | null;
  lapTime: number;
};

type Sector = "s1" | "s2" | "s3";

const SECTORS: {
  key: Sector;
  label: string;
  fullName: string;
}[] = [
  {
    key: "s1",
    label: "S1",
    fullName: "SECTOR 01",
  },
  {
    key: "s2",
    label: "S2",
    fullName: "SECTOR 02",
  },
  {
    key: "s3",
    label: "S3",
    fullName: "SECTOR 03",
  },
];

export default function SectorsSection() {
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedSector, setSelectedSector] =
    useState<Sector>("s1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/best-laps.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load sector data: ${response.status}`
          );
        }

        return response.json();
      })
      .then((data: Lap[]) => {
        setLaps(data);
      })
      .catch((error) => {
        console.error(
          "Failed to load best-laps.json:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const validLaps = useMemo(() => {
    return laps.filter(
      (lap) =>
        lap[selectedSector] !== null &&
        lap[selectedSector] !== undefined
    );
  }, [laps, selectedSector]);

  const sortedLaps = useMemo(() => {
    return [...validLaps].sort(
      (a, b) =>
        (a[selectedSector] ?? Infinity) -
        (b[selectedSector] ?? Infinity)
    );
  }, [validLaps, selectedSector]);

  const fastestSector = sortedLaps[0];

  const slowestSector =
    sortedLaps[sortedLaps.length - 1];

  const sectorAverage = useMemo(() => {
    if (!validLaps.length) {
      return null;
    }

    const total = validLaps.reduce(
      (sum, lap) =>
        sum + (lap[selectedSector] ?? 0),
      0
    );

    return total / validLaps.length;
  }, [validLaps, selectedSector]);

  const chartData = useMemo(() => {
    if (!sortedLaps.length) {
      return [];
    }

    return [
      {
        type: "bar" as const,
        orientation: "h" as const,

        x: sortedLaps.map(
          (lap) => lap[selectedSector] ?? 0
        ),

        y: sortedLaps.map(
          (lap) => lap.driver
        ),

        customdata: sortedLaps.map(
          (lap) => [
            lap.driver,
            lap.team,
            lap[selectedSector],
            lap.lapTime,
            lap.compound,
          ]
        ),

        marker: {
          opacity: 0.8,
        },

        hovertemplate:
          "<b>%{customdata[0]}</b>" +
          "  ·  %{customdata[1]}" +
          "<br><br>" +
          "<b>SECTOR</b>      %{customdata[2]:.3f} S" +
          "<br>" +
          "<b>TOTAL LAP</b>   %{customdata[3]:.3f} S" +
          "<br>" +
          "<b>TYRE</b>        %{customdata[4]}" +
          "<extra></extra>",

        showlegend: false,
      },
    ];
  }, [sortedLaps, selectedSector]);

  const selectedSectorInfo = SECTORS.find(
    (sector) =>
      sector.key === selectedSector
  );

  return (
    <section
      id="sectors"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">
        {/* Header */}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              03 / The Sectors
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] md:text-7xl lg:text-8xl">
              WHERE
              <br />
              <span className="text-[var(--muted)]">
                TIME DISAPPEARS.
              </span>
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              A lap is not one continuous effort. It is
              three sectors, each with its own corners,
              straights, compromises, and opportunities.
              Breaking the lap apart reveals where the
              differences actually come from.
            </p>
          </div>
        </div>

        {/* Sector selector */}

        <div className="mt-20 flex flex-col gap-6 border-y border-[var(--border)] py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Select sector
            </div>

            <div className="mt-1 font-mono text-xs uppercase tracking-[0.15em]">
              {selectedSectorInfo?.fullName}
            </div>
          </div>

          <div className="flex gap-2">
            {SECTORS.map((sector) => {
              const active =
                selectedSector === sector.key;

              return (
                <button
                  key={sector.key}
                  type="button"
                  onClick={() =>
                    setSelectedSector(
                      sector.key
                    )
                  }
                  className={`border px-5 py-2 font-mono text-[10px] tracking-[0.15em] transition-all ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {sector.label}
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
                Loading sector data...
              </div>
            </div>
          ) : sortedLaps.length === 0 ? (
            <div className="flex min-h-[560px] items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                No sector data available
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
                    text: "SECTOR TIME (SECONDS)",
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

                /*
                 * Standardized F1-ML hover treatment.
                 *
                 * The visualization itself is unchanged.
                 * Only the data-point popup is being restyled.
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

        {/* Sector statistics */}

        <div className="grid grid-cols-1 border-b border-[var(--border)] md:grid-cols-3">
          <SectorStat
            value={
              fastestSector
                ? `${(
                    fastestSector[
                      selectedSector
                    ] ?? 0
                  ).toFixed(3)}s`
                : "—"
            }
            label="FASTEST SECTOR"
            description={
              fastestSector
                ? fastestSector.driver
                : "No data"
            }
          />

          <SectorStat
            value={
              sectorAverage
                ? `${sectorAverage.toFixed(
                    3
                  )}s`
                : "—"
            }
            label="FIELD AVERAGE"
            description={
              selectedSectorInfo?.fullName ??
              ""
            }
          />

          <SectorStat
            value={
              slowestSector
                ? `${(
                    slowestSector[
                      selectedSector
                    ] ?? 0
                  ).toFixed(3)}s`
                : "—"
            }
            label="SLOWEST SECTOR"
            description={
              slowestSector
                ? slowestSector.driver
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
              The fastest lap is built
              <br />
              <span className="text-[var(--muted)]">
                one sector at a time.
              </span>
            </p>

            <p className="mt-8 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
              The driver who wins a sector does not
              necessarily win the lap. Different cars and
              drivers can trade time from one part of the
              circuit to another. The interesting question
              is not simply who is fastest — but where they
              are fastest.
            </p>
          </div>
        </div>

        {/* Next chapter */}

        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Next
          </span>

          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--foreground)]">
            04 / Speed
          </span>
        </div>
      </div>
    </section>
  );
}

function SectorStat({
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
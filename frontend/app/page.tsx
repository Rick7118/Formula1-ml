"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import LapSection from "@/components/sections/LapSection";
import SectorsSection from "@/components/sections/SectorsSection";
import SpeedSection from "@/components/sections/SpeedSection";
import TyreSection from "@/components/sections/TyreSection";
import RacePaceSection from "@/components/sections/RacePaceSection";
import ModelSection from "@/components/sections/ModelSection";
import VerdictSection from "@/components/sections/VerdictSection";

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
        }
      )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          "-=0.6"
        )
        .fromTo(
          metaRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          "-=0.4"
        )
        .fromTo(
          telemetryRef.current,
          { opacity: 0, x: 40 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
          },
          "-=0.8"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main>
      {/* ============================================================
          00 — HERO
      ============================================================ */}

      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden border-b border-[var(--border)]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage: `
              linear-gradient(
                to right,
                rgba(255,255,255,0.04) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                rgba(255,255,255,0.04) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "80px 80px",
          }}
        />

        <div
          className="pointer-events-none absolute right-[8%] top-[25%] h-[420px] w-[420px] rounded-full opacity-10 blur-[120px]"
          style={{
            background: "var(--accent)",
          }}
          aria-hidden="true"
        />

        <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10 lg:px-16">
          <div className="font-mono text-sm font-medium tracking-[0.2em]">
            F1-ML
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            2024 / Data Study
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-[1600px] items-center px-6 pb-16 md:px-10 lg:px-16">
          <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="mb-8 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
                Formula 1 · 2024
              </div>

              <h1
                ref={titleRef}
                className="max-w-3xl text-[clamp(4rem,8vw,8.5rem)] font-semibold leading-[0.86] tracking-[-0.065em]"
              >
                WHAT
                <br />
                MAKES
                <br />
                <span className="text-[var(--accent)]">
                  A LAP
                </span>
                <br />
                FAST?
              </h1>

              <p
                ref={subtitleRef}
                className="mt-10 max-w-md text-base leading-7 text-[var(--muted)] md:text-lg"
              >
                An exploration of Formula 1 performance
                through telemetry, statistical analysis,
                and machine learning.
              </p>

              <div
                ref={metaRef}
                className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-[var(--border)] pt-5"
              >
                <MetaItem value="2024" label="SEASON" />
                <MetaItem value="04" label="CIRCUITS" />
                <MetaItem value="XGBOOST" label="MODEL" />
              </div>
            </div>

            <div
              ref={telemetryRef}
              className="relative min-h-[420px] lg:col-span-7"
            >
              <TelemetryGraphic />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-6 z-10 flex items-center gap-3 md:left-10 lg:left-16">
          <div className="h-px w-8 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            Scroll to explore
          </span>
        </div>

        <div className="absolute bottom-8 right-6 z-10 font-mono text-[9px] tracking-[0.2em] text-[var(--muted)] md:right-10 lg:right-16">
          00 / 09
        </div>
      </section>

      {/* ============================================================
          01 — DATA
      ============================================================ */}

      <DataSection />

      {/* ============================================================
          02 — LAP
      ============================================================ */}

      <LapSection />

      {/* ============================================================
          03 — SECTORS
      ============================================================ */}

      <SectorsSection />

      {/* ============================================================
          04 — SPEED
      ============================================================ */}

      <SpeedSection />

      {/* ============================================================
          05 — TYRES
      ============================================================ */}

      <TyreSection />

      {/* ============================================================
          06 — RACE PACE
      ============================================================ */}

      <RacePaceSection />

      {/* ============================================================
          07 — MODEL
      ============================================================ */}

      <ModelSection />

      {/* ============================================================
          08 — VERDICT
      ============================================================ */}

      <VerdictSection />

      {/* ============================================================
          09 — THE END
      ============================================================ */}

      <EndSection />
    </main>
  );
}

/* ========================================================================
   META ITEM
======================================================================== */

function MetaItem({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="font-mono text-sm text-[var(--foreground)]">
        {value}
      </div>

      <div className="mt-1 font-mono text-[8px] tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

/* ========================================================================
   TELEMETRY GRAPHIC
======================================================================== */

function TelemetryGraphic() {
  return (
    <div className="relative h-full min-h-[420px] w-full">
      <div className="absolute inset-[4%] border border-[var(--border)]" />

      <div className="absolute left-[4%] top-[4%] h-3 w-3 border-l border-t border-[var(--accent)]" />

      <div className="absolute right-[4%] top-[4%] h-3 w-3 border-r border-t border-[var(--accent)]" />

      <div className="absolute bottom-[4%] left-[4%] h-3 w-3 border-b border-l border-[var(--accent)]" />

      <div className="absolute bottom-[4%] right-[4%] h-3 w-3 border-b border-r border-[var(--accent)]" />

      <svg
        viewBox="0 0 700 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-label="Abstract telemetry circuit visualization"
        role="img"
      >
        <path
          d="M120 330 C120 230 180 150 290 150 C400 150 470 90 560 140 C625 176 600 250 535 275 C470 300 425 265 370 300 C315 335 335 405 250 410 C165 415 120 390 120 330Z"
          stroke="#292929"
          strokeWidth="2"
        />

        <path
          d="M120 330 C120 230 180 150 290 150 C400 150 470 90 560 140 C625 176 600 250 535 275 C470 300 425 265 370 300 C315 335 335 405 250 410 C165 415 120 390 120 330Z"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="8 14"
          opacity="0.9"
        />

        <circle
          cx="120"
          cy="330"
          r="5"
          fill="var(--accent)"
        />

        <circle
          cx="290"
          cy="150"
          r="4"
          fill="#F2F2F0"
        />

        <circle
          cx="560"
          cy="140"
          r="4"
          fill="#F2F2F0"
        />

        <circle
          cx="535"
          cy="275"
          r="4"
          fill="#F2F2F0"
        />

        <circle
          cx="370"
          cy="300"
          r="4"
          fill="#F2F2F0"
        />

        <circle
          cx="250"
          cy="410"
          r="4"
          fill="#F2F2F0"
        />

        <line
          x1="290"
          y1="150"
          x2="290"
          y2="110"
          stroke="#292929"
        />

        <line
          x1="535"
          y1="275"
          x2="575"
          y2="275"
          stroke="#292929"
        />

        <line
          x1="250"
          y1="410"
          x2="250"
          y2="450"
          stroke="#292929"
        />
      </svg>

      <div className="absolute left-[8%] top-[10%] font-mono text-[9px] leading-5 text-[var(--muted)]">
        <div>BAHRAIN</div>
        <div>QUALIFYING</div>
        <div>2024</div>
      </div>

      <div className="absolute right-[9%] top-[21%] text-right font-mono text-[9px] leading-5 text-[var(--muted)]">
        <div>SECTOR 02</div>

        <div className="text-[var(--foreground)]">
          39.102 S
        </div>
      </div>

      <div className="absolute bottom-[12%] left-[10%] font-mono text-[9px] leading-5 text-[var(--muted)]">
        <div>TELEMETRY</div>

        <div className="text-[var(--accent)]">
          ● LIVE TRACE
        </div>
      </div>

      <div className="absolute bottom-[12%] right-[9%] text-right font-mono text-[9px] leading-5 text-[var(--muted)]">
        <div>LAP TIME</div>

        <div className="text-sm text-[var(--foreground)]">
          01:32.421
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   DATA SECTION
======================================================================== */

function DataSection() {
  return (
    <section
      id="data"
      className="relative border-b border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-32 md:px-10 md:py-40 lg:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              01 / The Data
            </div>
          </div>

          <div className="lg:col-span-7">
            <h2 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-7xl">
              EVERY LAP
              <br />

              <span className="text-[var(--muted)]">
                TELLS A STORY.
              </span>
            </h2>

            <p className="mt-10 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              We started with Formula 1 telemetry from
              the 2024 season and turned it into a dataset
              designed to answer one question: what
              actually separates a fast lap from an
              ordinary one?
            </p>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-4">
          <DataMetric
            value="2024"
            label="SEASON"
            description="Formula 1"
          />

          <DataMetric
            value="04"
            label="CIRCUITS"
            description="Bahrain · Monaco · Monza · Silverstone"
          />

          <DataMetric
            value="02"
            label="SESSION TYPES"
            description="Qualifying + Race"
          />

          <DataMetric
            value="14"
            label="FEATURES"
            description="Telemetry + tyre + sector data"
          />
        </div>

        <div className="mt-24 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              What we measure
            </div>

            <h3 className="mt-5 text-3xl font-medium tracking-[-0.03em] md:text-4xl">
              From telemetry
              <br />
              to performance.
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 lg:col-span-8">
            <Feature
              number="01"
              title="SECTORS"
              text="S1 · S2 · S3"
            />

            <Feature
              number="02"
              title="SPEED"
              text="I1 · I2 · FL · ST"
            />

            <Feature
              number="03"
              title="TYRES"
              text="Compound · Life · Fresh"
            />

            <Feature
              number="04"
              title="LAP TIME"
              text="Measured in seconds"
            />
          </div>
        </div>

        <div className="mt-32 flex items-center gap-4">
          <div className="h-px w-10 bg-[var(--accent)]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            First question
          </span>
        </div>

        <div className="mt-8 max-w-4xl">
          <p className="text-3xl font-medium leading-tight tracking-[-0.03em] md:text-5xl">
            If lap time is the result,
            <br />

            <span className="text-[var(--muted)]">
              where is that time actually being won?
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
   DATA METRIC
======================================================================== */

function DataMetric({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-6 md:border-r md:p-8 lg:min-h-40">
      <div className="font-mono text-3xl tracking-[-0.03em] md:text-4xl">
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

/* ========================================================================
   FEATURE
======================================================================== */

function Feature({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-[var(--surface)] p-6 md:p-8">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[9px] text-[var(--muted)]">
          {number}
        </span>

        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      </div>

      <div className="mt-14">
        <div className="font-mono text-xs tracking-[0.2em]">
          {title}
        </div>

        <div className="mt-2 text-sm text-[var(--muted)]">
          {text}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   END SECTION
======================================================================== */

function EndSection() {
  return (
    <section
      id="end"
      className="relative min-h-screen overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(255,255,255,0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255,255,255,0.04) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-[140px]"
        style={{
          background: "var(--accent)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col justify-between px-6 py-8 md:px-10 md:py-10 lg:px-16">
        {/* TOP */}

        <div className="flex items-center justify-between">
          <div className="font-mono text-sm tracking-[0.2em]">
            F1-ML
          </div>

          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
            2024 / Data Study
          </div>
        </div>

        {/* CENTER */}

        <div className="py-32">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--accent)]">
            09 / The End
          </div>

          <h2 className="mt-8 max-w-6xl text-[clamp(4rem,9vw,10rem)] font-semibold leading-[0.82] tracking-[-0.07em]">
            DATA.
            <br />

            <span className="text-[var(--muted)]">
              ANALYSIS.
            </span>

            <br />

            <span className="text-[var(--accent)]">
              SPEED.
            </span>
          </h2>

          <p className="mt-12 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
            A study of Formula 1 performance using
            telemetry, statistical analysis, and
            machine learning.
          </p>
        </div>

        {/* FINAL STATEMENT */}

        <div className="grid grid-cols-1 gap-12 border-t border-[var(--border)] pt-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Final thought
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-3xl font-medium leading-[0.95] tracking-[-0.04em] md:text-5xl">
              The fastest lap isn't
              <br />
              found in one number.
            </p>

            <p className="mt-8 max-w-xl text-sm leading-7 text-[var(--muted)] md:text-base">
              It is built from hundreds of small
              decisions, measurements, and
              interactions — compressed into a
              single number on the timing screen.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-24 flex flex-col gap-8 border-t border-[var(--border)] pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Built with
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.15em]">
              <span>PYTHON</span>
              <span>FASTF1</span>
              <span>XGBOOST</span>
              <span>NEXT.JS</span>
              <span>TAILWIND</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Rick7118/Formula1-ml"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="mr-2 text-[var(--accent)]">
                →
              </span>
              GitHub
            </a>

            <a
              href="#"
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <span className="mr-2 text-[var(--accent)]">
                ↑
              </span>
              Back to top
            </a>
          </div>
        </div>

        {/* BOTTOM MARK */}

        <div className="mt-10 flex items-center justify-between">
          <div className="font-mono text-[8px] tracking-[0.2em] text-[var(--muted)]">
            FORMULA 1 · MACHINE LEARNING · 2024
          </div>

          <div className="font-mono text-[8px] tracking-[0.2em] text-[var(--muted)]">
            09 / 09
          </div>
        </div>
      </div>
    </section>
  );
}
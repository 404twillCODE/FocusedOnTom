/** Development-only samples for comparing the same scroll interactions. */
export function measureWork<T>(name: string, work: () => T): T {
  if (!import.meta.env.DEV) return work();
  const start = performance.now();
  try {
    return work();
  } finally {
    if (performance.getEntriesByName(name).length >= 200)
      performance.clearMeasures(name);
    performance.measure(name, { start, end: performance.now() });
    const samples = performance
      .getEntriesByName(name)
      .map((entry) => entry.duration)
      .sort((a, b) => a - b);
    let output = document.getElementById("fot-dev-performance");
    if (!output) {
      output = document.createElement("output");
      output.id = "fot-dev-performance";
      output.hidden = true;
      document.body.append(output);
    }
    output.setAttribute(
      "data-" + name.replace("fot:", ""),
      JSON.stringify({
        samples: samples.length,
        mean: samples.reduce((sum, value) => sum + value, 0) / samples.length,
        p95: samples[Math.floor(samples.length * 0.95)],
        max: samples.at(-1),
      }),
    );
  }
}

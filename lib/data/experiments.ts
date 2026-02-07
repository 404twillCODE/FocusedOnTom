import type { Experiment } from "@/lib/types/content";
import data from "@/data/experiments.json";

const experiments = data as Experiment[];

export function getExperiments(): Experiment[] {
  return experiments;
}

export function getExperimentById(id: string): Experiment | undefined {
  return experiments.find((e) => e.id === id);
}

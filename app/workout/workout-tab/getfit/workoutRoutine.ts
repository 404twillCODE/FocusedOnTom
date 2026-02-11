// Default 4-day workout routine (from GetFit)
export type ExerciseCategory =
  | "legs"
  | "arms"
  | "chest"
  | "back"
  | "shoulders"
  | "core"
  | "cardio"
  | "full_body";

export interface Set {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  breakTime?: number;
}

export interface Exercise {
  id: number;
  name: string;
  categories: ExerciseCategory[];
  sets?: Set[];
  selectedDays?: number[];
  notes?: string;
  completed?: boolean;
}

const createUniformSets = (
  count: number,
  reps: number,
  weight: number,
  breakTime: number = 60
): Set[] =>
  Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps,
    weight,
    completed: false,
    breakTime,
  }));

const createFailureSet = (weight: number, breakTime: number = 60): Set => ({
  setNumber: 1,
  reps: 999,
  weight,
  completed: false,
  breakTime,
});

const createSetsWithFailure = (
  sets: Array<{ reps: number; weight: number }>,
  failureWeight: number,
  breakTime: number = 60
): Set[] => {
  const regularSets = sets.map((set, index) => ({
    setNumber: index + 1,
    reps: set.reps,
    weight: set.weight,
    completed: false,
    breakTime,
  }));
  regularSets.push({
    setNumber: regularSets.length + 1,
    reps: 999,
    weight: failureWeight,
    completed: false,
    breakTime,
  });
  return regularSets;
};

const day1Exercises: Exercise[] = [
  { id: 1001, name: "Shoulder Press", categories: ["shoulders"], sets: createUniformSets(4, 20, 60), selectedDays: [1] },
  {
    id: 1002,
    name: "Chest Press",
    categories: ["chest"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 100).map((s) => ({ reps: s.reps, weight: s.weight })),
      110
    ),
    selectedDays: [1],
  },
  {
    id: 1003,
    name: "Tricep Press",
    categories: ["arms"],
    sets: [
      ...createUniformSets(2, 12, 160),
      ...createUniformSets(2, 10, 120),
      createFailureSet(165),
    ],
    notes: "Cable or Machine",
    selectedDays: [1],
  },
  { id: 1004, name: "Ab Machine", categories: ["core"], sets: createUniformSets(4, 20, 120), selectedDays: [1] },
  { id: 1005, name: "Ab Crunch", categories: ["core"], sets: createUniformSets(4, 20, 110), selectedDays: [1] },
  {
    id: 1006,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [{ setNumber: 1, reps: 1, weight: 0, completed: false, breakTime: undefined }],
    notes: "15 min",
    selectedDays: [1],
  },
];

const day2Exercises: Exercise[] = [
  {
    id: 2001,
    name: "Lat Pulldown",
    categories: ["back"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 100).map((s) => ({ reps: s.reps, weight: s.weight })),
      120
    ),
    selectedDays: [2],
  },
  {
    id: 2002,
    name: "Seated Row",
    categories: ["back"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 80).map((s) => ({ reps: s.reps, weight: s.weight })),
      100
    ),
    selectedDays: [2],
  },
  {
    id: 2003,
    name: "Bicep Curl Machine",
    categories: ["arms"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 90).map((s) => ({ reps: s.reps, weight: s.weight })),
      100
    ),
    selectedDays: [2],
  },
  {
    id: 2004,
    name: "Face Pulls",
    categories: ["back", "shoulders"],
    sets: createUniformSets(3, 15, 0),
    notes: "Optional finisher - light, slow",
    selectedDays: [2],
  },
  {
    id: 2005,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [{ setNumber: 1, reps: 1, weight: 0, completed: false, breakTime: undefined }],
    notes: "15 min",
    selectedDays: [2],
  },
];

const day3Exercises: Exercise[] = [
  {
    id: 3001,
    name: "Leg Press",
    categories: ["legs"],
    sets: [
      ...createUniformSets(3, 15, 0),
      { setNumber: 4, reps: 999, weight: 0, completed: false, breakTime: 60 },
    ],
    notes: "Moderate weight, 4×15, last set to failure",
    selectedDays: [3],
  },
  {
    id: 3002,
    name: "Seated Leg Curl",
    categories: ["legs"],
    sets: [...createUniformSets(3, 12, 0), createFailureSet(0)],
    selectedDays: [3],
  },
  {
    id: 3003,
    name: "Leg Extension",
    categories: ["legs"],
    sets: [...createUniformSets(3, 12, 0), createFailureSet(0)],
    selectedDays: [3],
  },
  { id: 3004, name: "Calf Raise", categories: ["legs"], sets: createUniformSets(4, 20, 0), notes: "Standing or Seated", selectedDays: [3] },
  {
    id: 3005,
    name: "Plank",
    categories: ["core"],
    sets: [1, 2, 3].map((i) => ({
      setNumber: i,
      reps: 45,
      weight: 0,
      completed: false,
      breakTime: undefined as number | undefined,
    })),
    notes: "3×45 sec",
    selectedDays: [3],
  },
  {
    id: 3006,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [{ setNumber: 1, reps: 1, weight: 0, completed: false, breakTime: undefined }],
    notes: "15 min",
    selectedDays: [3],
  },
];

const day4Exercises: Exercise[] = [
  {
    id: 4001,
    name: "Chest Press",
    categories: ["chest"],
    sets: createSetsWithFailure(
      createUniformSets(3, 12, 90).map((s) => ({ reps: s.reps, weight: s.weight })),
      100
    ),
    selectedDays: [4],
  },
  {
    id: 4002,
    name: "Lat Pulldown",
    categories: ["back"],
    sets: createSetsWithFailure(
      createUniformSets(3, 12, 90).map((s) => ({ reps: s.reps, weight: s.weight })),
      110
    ),
    selectedDays: [4],
  },
  { id: 4003, name: "Shoulder Press", categories: ["shoulders"], sets: createUniformSets(3, 20, 50), selectedDays: [4] },
  { id: 4004, name: "Bicep Curl", categories: ["arms"], sets: createUniformSets(3, 12, 80), selectedDays: [4] },
  { id: 4005, name: "Tricep Press", categories: ["arms"], sets: createUniformSets(3, 12, 140), selectedDays: [4] },
  { id: 4006, name: "Ab Machine", categories: ["core"], sets: createUniformSets(3, 20, 120), selectedDays: [4] },
  {
    id: 4007,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [{ setNumber: 1, reps: 1, weight: 0, completed: false, breakTime: undefined }],
    notes: "15 min",
    selectedDays: [4],
  },
];

export const getDefaultWorkoutRoutine = (): Exercise[] => [
  ...day1Exercises,
  ...day2Exercises,
  ...day3Exercises,
  ...day4Exercises,
];

export const getDefaultWorkoutSchedule = (): string[] => [
  "Rest Day",
  "Push",
  "Pull",
  "Legs",
  "Full Upper",
  "Rest Day",
  "Rest Day",
];

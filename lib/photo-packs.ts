export const PHOTO_PACK_RARITY_WEIGHTS = {
  Standard: 65,
  Rare: 25,
  Epic: 8,
  Signature: 2,
} as const;

export type PhotoPackRarity = keyof typeof PHOTO_PACK_RARITY_WEIGHTS;

export type PhotoPackCard = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  rarity: PhotoPackRarity;
  series: string;
  description: string;
  cardNumber: string;
  isPackEligible: boolean;
  isExclusive: boolean;
  createdAt: string;
};

type CollectionStorageShape = {
  pulledCardIds: string[];
  duplicateCounts: Record<string, number>;
};

export type PullResult = {
  card: PhotoPackCard;
  isDuplicate: boolean;
  duplicateCount: number;
};

const COLLECTION_KEY = "focusedontom:photo-pack-collection:v1";

const RARITY_ORDER: PhotoPackRarity[] = [
  "Standard",
  "Rare",
  "Epic",
  "Signature",
];

function readCollectionStorage(): CollectionStorageShape {
  if (typeof window === "undefined") {
    return { pulledCardIds: [], duplicateCounts: {} };
  }

  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return { pulledCardIds: [], duplicateCounts: {} };

    const parsed = JSON.parse(raw) as Partial<CollectionStorageShape>;
    return {
      pulledCardIds: Array.isArray(parsed.pulledCardIds)
        ? parsed.pulledCardIds.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
      duplicateCounts:
        parsed.duplicateCounts && typeof parsed.duplicateCounts === "object"
          ? Object.fromEntries(
              Object.entries(parsed.duplicateCounts).filter(
                ([key, value]) =>
                  typeof key === "string" &&
                  typeof value === "number" &&
                  Number.isFinite(value)
              )
            )
          : {},
    };
  } catch {
    return { pulledCardIds: [], duplicateCounts: {} };
  }
}

function writeCollectionStorage(value: CollectionStorageShape): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep UI functional.
  }
}

export function getPhotoPackCollection(): CollectionStorageShape {
  return readCollectionStorage();
}

export function savePulledCard(cardId: string): {
  isDuplicate: boolean;
  duplicateCount: number;
} {
  const state = readCollectionStorage();
  const alreadyOwned = state.pulledCardIds.includes(cardId);

  if (alreadyOwned) {
    const nextCount = (state.duplicateCounts[cardId] ?? 0) + 1;
    state.duplicateCounts[cardId] = nextCount;
    writeCollectionStorage(state);
    return { isDuplicate: true, duplicateCount: nextCount };
  }

  state.pulledCardIds.push(cardId);
  writeCollectionStorage(state);
  return { isDuplicate: false, duplicateCount: 0 };
}

export function pickPackCard(cards: PhotoPackCard[]): PhotoPackCard | null {
  const eligibleCards = cards.filter((card) => card.isPackEligible);
  if (eligibleCards.length === 0) return null;

  const cardsByRarity = new Map<PhotoPackRarity, PhotoPackCard[]>(
    RARITY_ORDER.map((rarity) => [rarity, []])
  );

  for (const card of eligibleCards) {
    cardsByRarity.get(card.rarity)?.push(card);
  }

  const availableRarityWeights: Array<{
    rarity: PhotoPackRarity;
    weight: number;
  }> = [];

  for (const rarity of RARITY_ORDER) {
    const bucket = cardsByRarity.get(rarity);
    if (!bucket || bucket.length === 0) continue;
    availableRarityWeights.push({
      rarity,
      weight: PHOTO_PACK_RARITY_WEIGHTS[rarity],
    });
  }

  if (availableRarityWeights.length === 0) return null;

  const totalWeight = availableRarityWeights.reduce(
    (sum, item) => sum + item.weight,
    0
  );
  let roll = Math.random() * totalWeight;
  let selectedRarity = availableRarityWeights[0].rarity;

  for (const item of availableRarityWeights) {
    if (roll < item.weight) {
      selectedRarity = item.rarity;
      break;
    }
    roll -= item.weight;
  }

  const bucket = cardsByRarity.get(selectedRarity) ?? eligibleCards;
  const chosenIndex = Math.floor(Math.random() * bucket.length);
  return bucket[chosenIndex] ?? null;
}

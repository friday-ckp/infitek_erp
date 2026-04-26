export const SecondaryIndustry = {
  AGRICULTURE_COLLEGE: 'agriculture_college',
  FOOD: 'food',
  ANIMAL_SCIENCE: 'animal_science',
  PHARMACY: 'pharmacy',
  MEDICAL_COLLEGE: 'medical_college',
  PUBLIC_HEALTH: 'public_health',
  LIFE_SCIENCE: 'life_science',
  ENVIRONMENT: 'environment',
} as const;

export type SecondaryIndustry =
  (typeof SecondaryIndustry)[keyof typeof SecondaryIndustry];

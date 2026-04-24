export const PortType = {
  DEPARTURE: '起运港',
  DESTINATION: '目的港',
} as const;

export type PortType = (typeof PortType)[keyof typeof PortType];

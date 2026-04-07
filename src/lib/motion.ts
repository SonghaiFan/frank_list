export const layoutSpring = {
  type: "spring",
  stiffness: 340,
  damping: 32,
} as const;

export const panelTransition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1],
} as const;

export const overlayTransition = {
  duration: 0.18,
  ease: [0.33, 1, 0.68, 1],
} as const;

export const sheetTransition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
} as const;

// Scene four's measured geometry — every number read off the supplied
// reference (section 4 image.jpg, 1600x900), which is the source of truth.
// The card sprites and the environment plate are cut from that image by
// tools/extract_s4.py; this module records where each piece goes back.
//
// Coordinates are reference-frame pixels. fitCover() maps the frame onto the
// viewport the way the plate shader does (cover: fill, centre-anchored), so
// the DOM cards and the canvas can never drift apart.

export const FRAME = [1600, 900];

export const CARDS = [
  { id: 'p01_web', title: 'Website Development',
    box: [22, 47, 502, 366], depth: 0.45,
    tint: [0.45, 0.35, 0.20] },
  { id: 'p02_marketing', title: 'Digital Marketing',
    box: [531, 122, 559, 280], depth: 0.60,
    tint: [0.45, 0.35, 0.20] },
  { id: 'p03_branding', title: 'Branding & Strategy',
    box: [1094, 47, 483, 363], depth: 0.45,
    tint: [0.45, 0.35, 0.20] },
  { id: 'p04_social', title: 'Social Media Management',
    box: [0, 378, 475, 325], depth: 0.25,
    tint: [0.45, 0.35, 0.20] },
  { id: 'p05_video', title: 'Video Production & Direction',
    box: [475, 388, 606, 353], depth: 0.70,
    tint: [0.45, 0.35, 0.20] },
  { id: 'p06_pr', title: 'Celebrity PR & Influencer Marketing',
    box: [1072, 369, 516, 353], depth: 0.25,
    tint: [0.45, 0.35, 0.20] },
];

// the central figure: crop box in frame px (his lighting is baked in)
export const PERSON = { x: 710, y: 440, w: 180, h: 420 };

// the floor's lit ellipses (centre x, centre y, rx, ry) and the overhead ring,
// used by the live glints the canvas draws over the baked plate
export const FLOOR_OUT = [800, 830, 480, 110];
export const FLOOR_IN = [800, 835, 320, 75];
export const RING = [800, 60, 460, 160];

/** Cover-fit the reference frame onto a viewport. */
export function fitCover(w, h) {
  const s = Math.max(w / FRAME[0], h / FRAME[1]);
  return { s, ox: (w - FRAME[0] * s) / 2, oy: (h - FRAME[1] * s) / 2 };
}

// Portrait recomposition for tall phone viewports
export const PORTRAIT = new Map([
  [1, { cx: 0.50, cy: 0.20, w: 0.88 }],  // Digital Marketing
  [0, { cx: 0.28, cy: 0.38, w: 0.44 }],  // Website Development
  [2, { cx: 0.72, cy: 0.38, w: 0.44 }],  // Branding & Strategy
  [4, { cx: 0.50, cy: 0.56, w: 0.88 }],  // Video Production & Direction
  [3, { cx: 0.28, cy: 0.74, w: 0.44 }],  // Social Media Management
  [5, { cx: 0.72, cy: 0.74, w: 0.44 }],  // Celebrity PR
]);

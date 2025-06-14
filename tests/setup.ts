// Global test setup
import { vi } from "vitest";

// Mock Phaser globally for tests
const mockBodies = {
  rectangle: vi.fn((x, y, width, height, options) => ({
    id: Math.random(),
    position: { x, y },
    bounds: {
      min: { x: x - width / 2, y: y - height / 2 },
      max: { x: x + width / 2, y: y + height / 2 },
    },
    label: options?.label || "body",
    ...options,
  })),
  circle: vi.fn((x, y, radius, options) => ({
    id: Math.random(),
    position: { x, y },
    circleRadius: radius,
    label: options?.label || "body",
    ...options,
  })),
};

(globalThis as any).Phaser = {
  Physics: {
    Matter: {
      Matter: {
        Bodies: mockBodies,
      },
    },
  },
};

// Mock console methods to avoid test output noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

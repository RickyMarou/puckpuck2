import { describe, it, expect } from "vitest";
import { GameConfig, ImportedTrack } from "../src/utils/track-types";
import { MOCK_TRACK_SVG, MOCK_GAME_CONFIG } from "./test-utils";
import {
  importTrack,
  validateTrackData,
  loadTrackFromFile,
  importTrackFromFile,
} from "../src/utils/track-importer";

describe("track-importer", () => {
  describe("importTrack", () => {
    it("should successfully import a valid track SVG", () => {
      const result = importTrack(MOCK_TRACK_SVG, MOCK_GAME_CONFIG);

      expect(result).toBeDefined();
      expect(result.bounds).toBeDefined();
      expect(result.walls).toBeInstanceOf(Array);
      expect(result.obstacles).toBeInstanceOf(Array);
      expect(result.boundaries).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();

      // Check metadata
      expect(result.metadata.originalSVGSize.width).toBe(1000);
      expect(result.metadata.originalSVGSize.height).toBe(500);
      expect(result.metadata.elementCounts.walls).toBe(2);
      expect(result.metadata.elementCounts.obstacles).toBe(2);
      expect(result.metadata.elementCounts.trackAreas).toBe(1);
    });

    it("should throw error for invalid SVG", () => {
      const invalidSVG = "<invalid>not an svg</invalid>";

      expect(() => importTrack(invalidSVG, MOCK_GAME_CONFIG)).toThrow();
    });

    it("should throw error for SVG without track areas", () => {
      const svgWithoutTrack = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect x="100" y="100" width="100" height="100" fill="#FF0000"/>
</svg>`;

      expect(() => importTrack(svgWithoutTrack, MOCK_GAME_CONFIG)).toThrow(
        "No track areas found in SVG",
      );
    });

    it("should handle SVG without start/finish lines", () => {
      const svgWithoutLines = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect x="100" y="100" width="800" height="300" fill="#FFFFFF"/>
</svg>`;

      const result = importTrack(svgWithoutLines, MOCK_GAME_CONFIG);

      expect(result.startPosition).toBeNull();
      expect(result.finishPosition).toBeNull();
    });
  });

  describe("validateTrackData", () => {
    it("should validate a good track", () => {
      const track = importTrack(MOCK_TRACK_SVG, MOCK_GAME_CONFIG);
      const validation = validateTrackData(track);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid track bounds", () => {
      const invalidTrack: ImportedTrack = {
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        walls: [],
        obstacles: [],
        boundaries: [],
        startPosition: null,
        finishPosition: null,
        metadata: {
          originalSVGSize: { width: 100, height: 100 },
          scaleFactor: 1,
          elementCounts: { walls: 0, obstacles: 0, trackAreas: 0 },
        },
      };

      const validation = validateTrackData(invalidTrack);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Track bounds are invalid");
    });

    it("should warn about missing elements", () => {
      const track = importTrack(MOCK_TRACK_SVG, MOCK_GAME_CONFIG);

      // Create track without start/finish positions
      const trackWithoutLines: ImportedTrack = {
        ...track,
        startPosition: null,
        finishPosition: null,
      };

      const validation = validateTrackData(trackWithoutLines);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain("No start line found in track");
      expect(validation.warnings).toContain("No finish line found in track");
    });

    it("should warn about very large tracks", () => {
      const largeTrack: ImportedTrack = {
        bounds: { x: 0, y: 0, width: 15000, height: 12000 },
        walls: [],
        obstacles: [],
        boundaries: [],
        startPosition: null,
        finishPosition: null,
        metadata: {
          originalSVGSize: { width: 15000, height: 12000 },
          scaleFactor: 1,
          elementCounts: { walls: 0, obstacles: 0, trackAreas: 1 },
        },
      };

      const validation = validateTrackData(largeTrack);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain(
        "Track is very large and may impact performance",
      );
    });
  });

  describe("loadTrackFromFile", () => {
    it("should load text from file", async () => {
      const mockFile = new File([MOCK_TRACK_SVG], "test.svg", {
        type: "image/svg+xml",
      });

      const result = await loadTrackFromFile(mockFile);

      expect(result).toBe(MOCK_TRACK_SVG);
    });

    it("should handle file reading errors", async () => {
      // Create a mock file that will fail to read
      const mockFile = {
        text: () => Promise.reject(new Error("File read error")),
      } as File;

      await expect(loadTrackFromFile(mockFile)).rejects.toThrow();
    });
  });

  describe("importTrackFromFile", () => {
    it("should import track from file", async () => {
      const mockFile = new File([MOCK_TRACK_SVG], "test.svg", {
        type: "image/svg+xml",
      });

      const result = await importTrackFromFile(mockFile, MOCK_GAME_CONFIG);

      expect(result).toBeDefined();
      expect(result.bounds).toBeDefined();
      expect(result.walls).toBeInstanceOf(Array);
      expect(result.obstacles).toBeInstanceOf(Array);
    });

    it("should propagate import errors", async () => {
      const invalidSVG = "<invalid>not svg</invalid>";
      const mockFile = new File([invalidSVG], "invalid.svg", {
        type: "image/svg+xml",
      });

      await expect(
        importTrackFromFile(mockFile, MOCK_GAME_CONFIG),
      ).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle empty SVG", () => {
      const emptySVG =
        '<?xml version="1.0"?><svg width="100" height="100"></svg>';

      expect(() => importTrack(emptySVG, MOCK_GAME_CONFIG)).toThrow();
    });

    it("should handle SVG with malformed elements", () => {
      const malformedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="300" fill="#FFFFFF"/>
  <rect x="abc" y="def" width="100" height="100" fill="#000000"/>
</svg>`;

      const result = importTrack(malformedSVG, MOCK_GAME_CONFIG);

      // Should still work, malformed elements will have default values
      expect(result).toBeDefined();
    });

    it("should handle very small game config", () => {
      const smallConfig: GameConfig = { worldWidth: 100, worldHeight: 100 };

      const result = importTrack(MOCK_TRACK_SVG, smallConfig);

      expect(result).toBeDefined();
      expect(result.bounds.width).toBeLessThan(100);
      expect(result.bounds.height).toBeLessThan(100);
    });
  });
});

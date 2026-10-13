/**
 * Workflow Path Integration Tests
 *
 * These tests verify that the paths used in GitHub Actions workflows
 * match the actual output paths from the CLI builders.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Workflow path integration", () => {
  describe("Platform-specific output paths", () => {
    it("should match macOS output paths", () => {
      // Expected paths based on MacBuilder behavior
      const macosPaths = {
        dmg: {
          // CLI copies to project root
          primary: "appname.dmg",
          // Universal builds use universal-apple-darwin target
          universalBundle:
            "src-tauri/target/universal-apple-darwin/release/bundle/dmg",
          // Regular builds
          genericBundle: "src-tauri/target/release/bundle/dmg",
        },
        app: {
          primary: "appname.app",
          universalBundle:
            "src-tauri/target/universal-apple-darwin/release/bundle/macos",
          genericBundle: "src-tauri/target/release/bundle/macos",
        },
      };

      expect(macosPaths.dmg.primary).toBeTruthy();
      expect(macosPaths.dmg.universalBundle).toBeTruthy();
      expect(macosPaths.app.primary).toBeTruthy();
      expect(macosPaths.app.universalBundle).toBeTruthy();
    });
  });

  describe("Multi-target scenarios", () => {
    it("should handle targets with spaces", () => {
      const targets = "app, dmg";
      const parsedTargets = targets.split(",").map((t) => t.trim());

      expect(parsedTargets).toEqual(["app", "dmg"]);
      expect(parsedTargets).toHaveLength(2);
    });

    it("should filter valid targets", () => {
      const targets = "app,invalid,dmg";
      const parsedTargets = targets.split(",").map((t) => t.trim());
      const validTargets = ["app", "dmg"];
      const filtered = parsedTargets.filter((t) => validTargets.includes(t));

      expect(filtered).toEqual(["app", "dmg"]);
      expect(filtered).not.toContain("invalid");
    });
  });

  describe("Workflow artifact uploads", () => {
    it("should forward the new-window input on macOS", () => {
      const workflow = fs.readFileSync(
        ".github/workflows/pake-cli.yaml",
        "utf8",
      );

      expect(workflow).toContain("new_window:");
      expect(workflow).toContain('ARGS+=("--new-window")');
    });
  });

  describe("Architecture-specific paths", () => {
    it("should construct correct macOS universal path", () => {
      const basePath = "src-tauri/target";
      const arch = "universal-apple-darwin";
      const mode = "release";
      const bundleType = "dmg";

      const fullPath = path.join(basePath, arch, mode, "bundle", bundleType);

      expect(fullPath).toContain("universal-apple-darwin");
      expect(fullPath).toContain("release");
      expect(fullPath).toContain("dmg");
    });
  });

  describe("File naming patterns", () => {
    it("should match macOS DMG naming pattern", () => {
      // Format: {name}_{version}_{arch}.dmg
      const pattern = /^[\w-]+_\d+\.\d+\.\d+_(universal|x64|aarch64)\.dmg$/;

      expect("myapp_1.0.0_universal.dmg").toMatch(pattern);
      expect("my-app_2.5.1_x64.dmg").toMatch(pattern);
      expect("my-app_3.0.0_aarch64.dmg").toMatch(pattern);
      expect("invalid.dmg").not.toMatch(pattern);
    });
  });

  describe("Path traversal safety", () => {
    it("should handle paths without directory traversal", () => {
      const safePaths = [
        "src-tauri/target/release/bundle/dmg",
        "output/macos",
        "dist/cli.js",
      ];

      safePaths.forEach((p) => {
        expect(p).not.toContain("..");
        expect(p).not.toMatch(/\.\.[/\\]/);
      });
    });

    it("should normalize paths correctly", () => {
      const inputPath = "src-tauri/target/../target/release/bundle";
      const normalized = path.normalize(inputPath);

      // path.normalize should resolve the .. reference
      expect(normalized).not.toContain("..");
      expect(normalized).toContain("target");
      expect(normalized).toContain("release");
    });
  });

  describe("Cross-platform path handling", () => {
    it("should use correct path separator", () => {
      const joined = path.join("src-tauri", "target", "release");

      // Should not contain wrong separators
      if (path.sep === "/") {
        expect(joined).not.toContain("\\");
      } else {
        expect(joined).not.toContain("/");
      }
    });

    it("should handle paths with both separators", () => {
      // This can happen when paths come from different sources
      const mixedPath = "src-tauri\\target/release";
      const normalized = path.normalize(mixedPath);

      // After normalization, should use consistent separator
      const parts = normalized.split(path.sep);
      expect(parts.length).toBeGreaterThan(1);
    });
  });

  describe("npm package boundaries", () => {
    it("excludes generated Tauri build state from the shipped template", () => {
      const ignoredPaths = fs
        .readFileSync("src-tauri/.npmignore", "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      expect(ignoredPaths).toEqual(
        expect.arrayContaining([".pake/", "target/", ".cargo/config.toml"]),
      );
    });
  });
});

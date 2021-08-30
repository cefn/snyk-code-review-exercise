import * as assert from "assert";
import * as nock from "nock";
import { nockRecord } from "./util";
import {
  getDependencies,
  getDependenciesDeep,
  getNPMPackage,
} from "../src/package";
import { AssertionError } from "assert/strict";
import { NPMPackage } from "../src/types";

describe("NPM retrieval functions", () => {
  describe("getNpmData()", () => {
    it("retrieves data if package version exists", async () => {
      const { nockDone } = await nockRecord("getNpmData_present");
      const data = await getNPMPackage("@lauf/store-react");
      assert(data !== null, "Should retrieve data");
      expect(data.name).toBe("@lauf/store-react");
      expect(
        (data as unknown as { author: { name: string } })?.author?.name
      ).toBe("Cefn Hoile");
      nockDone();
    });

    it("returns null for non-existent package", async () => {
      const { nockDone } = await nockRecord("getNpmData_absent");
      const data = await getNPMPackage("nothingburger42");
      expect(data).toBe(null);
      nockDone();
    });

    it("throws for unexpected server response", async () => {
      try {
        nock("https://registry.npmjs.org:443")
          .get("/nothingburger42")
          .reply(429, { message: "Quota limit reached" });
        await expect(async () => await getNPMPackage("nothingburger42")).rejects
          .toThrowErrorMatchingInlineSnapshot(`
                "Server rejected with status:429
                {\\"message\\":\\"Quota limit reached\\"}"
              `);
      } finally {
        nock.cleanAll();
      }
    });
  });

  describe("getDependencies()", () => {
    it("retrieves data if package version exists", async () => {
      const { nockDone } = await nockRecord("getDependencies_present");
      const npmPackage = await getNPMPackage("@lauf/store-react");
      assert(npmPackage !== null, "Should retrieve data");
      const result = await getDependencies(npmPackage, "1.0.1");
      expect(result).toMatchInlineSnapshot(`
        Object {
          "@lauf/store": "^1.0.1",
        }
      `);
      nockDone();
    });

    it("returns null for non-existent package version", async () => {
      const { nockDone } = await nockRecord("getDependencies_absent");
      const npmPackage = await getNPMPackage("@lauf/store-react");
      assert(npmPackage !== null, "Should retrieve data");
      const result = await getDependencies(npmPackage, "42.42.42");
      expect(result).toBe(null);
      nockDone();
    });
  });

  describe("getDependenciesDeep()", () => {
    it("retrieves data if package version exists", async () => {
      const { nockDone } = await nockRecord("getDependenciesDeep_present");
      const npmPackage = await getNPMPackage("@lauf/store-react");
      assert(npmPackage !== null, "Should retrieve data");
      const result = await getDependenciesDeep(npmPackage, "1.0.1");
      expect(result).toMatchInlineSnapshot(`
        Object {
          "@lauf/store": Object {
            "dependencies": Object {
              "immer": Object {
                "dependencies": Object {},
                "version": "8.0.4",
              },
            },
            "version": "1.0.1",
          },
        }
      `);
      nockDone();
    });

    it("returns null for non-existent package version", async () => {
      const { nockDone } = await nockRecord("getDependenciesDeep_absent");
      const npmPackage = await getNPMPackage("@lauf/store-react");
      assert(npmPackage !== null, "Should retrieve data");
      const result = await getDependenciesDeep(npmPackage, "42.42.42");
      expect(result).toBe(null);
      nockDone();
    });

    it("throws for non-existent dependency version", async () => {
      const parentPackage: NPMPackage = {
        name: "imaginaryparent",
        description: "",
        "dist-tags": {
          latest: "0.1.0",
        },
        versions: {
          "0.1.0": {
            name: "imaginaryparent",
            version: "0.1.0",
            dependencies: {
              imaginarychild: "0.2.0", // non-existent version
            },
          },
        },
      };
      const childPackage: NPMPackage = {
        name: "imaginarychild",
        description: "",
        "dist-tags": {
          latest: "0.1.0",
        },
        versions: {
          "0.1.0": {
            name: "imaginarychild",
            version: "0.1.0",
          },
        },
      };
      nock("https://registry.npmjs.org:443")
        .get("/imaginarychild")
        .reply(200, childPackage);
      try {
        await expect(async () => {
          await getDependenciesDeep(parentPackage, "0.1.0");
        }).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Package imaginaryparent has non-existent dependency imaginarychild:0.2.0"`
        );
      } finally {
        nock.cleanAll();
      }
    });
  });
});

import * as fs from "fs/promises";
import path from "path";
import { loadJson, loadRuleJson, loadPropositionJson, createLookupFunctions } from "../../router/Rules.utility.js";

jest.mock("fs/promises");
jest.mock("path");

describe("Rules.utility", () => {
	let originalConsoleMethods = {};
	beforeAll(() => {
		originalConsoleMethods = Object.keys(console).reduce((methods, methodName) => {
			methods[methodName] = console[methodName];
			return methods;
		}, {});

		Object.keys(console).forEach(methodName => {
			console[methodName] = () => {};
		});
	});

	afterAll(() => {
		Object.keys(originalConsoleMethods).forEach(methodName => {
			console[methodName] = originalConsoleMethods[methodName];
		});
	});

	describe("loadJson", () => {
		it("should load and parse JSON from file", async () => {
			const mockJson = { key: "value" };
			fs.readFile.mockResolvedValue(JSON.stringify(mockJson));
			const result = await loadJson("dummyPath");
			expect(result).toEqual(mockJson);
		});

		it("should return null on error", async () => {
			fs.readFile.mockRejectedValue(new Error("Failed to read"));
			const result = await loadJson("dummyPath");
			expect(result).toBeNull();
		});
	});

	describe("loadRuleJson", () => {
		beforeEach(() => {
			path.join.mockImplementation((...args) => args.join("/"));
		});

		it("should load a rule JSON and its associated proposition logic and lookup", async () => {
			const mockRuleJson = { logic: "propositionUuid", lookup: {} };
			const mockPropositionJson = { logic: [ "logic1", "logic2" ], lookup: { key: "value" } };
			fs.readFile
				.mockResolvedValueOnce(JSON.stringify(mockRuleJson))
				.mockResolvedValueOnce(JSON.stringify(mockPropositionJson));

			const result = await loadRuleJson("ruleUuid");
			expect(result).toEqual({
				logic: mockPropositionJson.logic,
				lookup: mockPropositionJson.lookup,
			});
		});

		// Add more tests to cover edge cases and error handling
	});

	describe("loadPropositionJson", () => {
		beforeEach(() => {
			path.join.mockImplementation((...args) => args.join("/"));
		});

		it("should load a proposition JSON", async () => {
			const mockPropositionJson = { logic: "someLogic", lookup: {} };
			fs.readFile.mockResolvedValue(JSON.stringify(mockPropositionJson));
			const result = await loadPropositionJson("propositionUuid");
			expect(result).toEqual(mockPropositionJson);
		});

		// Add more tests as needed
	});

	describe("createLookupFunctions", () => {
		it("should create lookup functions from an object", () => {
			const lookups = { test: "() => 42" };
			const result = createLookupFunctions(lookups);
			expect(typeof result.test).toBe("function");
			expect(result.test()).toBe(42);
		});

		it("should return an empty object if no lookups are provided", () => {
			const result = createLookupFunctions(null);
			expect(result).toEqual({});
		});
	});
});
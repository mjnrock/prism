import supertest from "supertest";
import app, { server } from "../main.js";
import fs from "fs";
import path from "path";
import { validate as uuidValidate } from "uuid";

const request = supertest(app);

const getFirstFileUUID = (relativeDirPath, extension) => {
	const dirPath = path.join(process.cwd(), relativeDirPath);
	const files = fs.readdirSync(dirPath);
	const firstFile = files.find((file) => file.endsWith(extension));
	return firstFile ? firstFile.split(".")[ 0 ] : null;
};

describe("Rule and Proposition Endpoints", () => {
	let propUUID;
	let ruleUUID;
	let log;

	beforeAll(() => {
		/* Suppress console.log output from invoked functions, if present */
		log = console.log;
		console.log = () => { };

		propUUID = getFirstFileUUID("data/props", ".prop");
		ruleUUID = getFirstFileUUID("data/rules", ".rule");
	});

	afterAll(() => {
		/* Restore console.log output */
		console.log = log;

		server.close();
	});

	test("props/:uuid returns 200, a JSON payload, and verifies uuid and results", async () => {
		if(propUUID) {
			const response = await request.get(`/rules/prop/${ propUUID }`);
			expect(response.statusCode).toBe(200);
			expect(response.type).toBe("application/json");

			/* Ensure existing and validation of uuid and result */
			expect(response.body).toHaveProperty("uuid");
			expect(uuidValidate(response.body.uuid)).toBe(true);

			expect(response.body).toHaveProperty("result");
			expect(typeof response.body.result).toBe("boolean");
		} else {
			log("No proposition file found for testing");
		}
	});

	test("rule/:uuid returns 200, a JSON payload, and verifies uuid and results", async () => {
		if(ruleUUID) {
			const response = await request.get(`/rules/rule/${ ruleUUID }`);
			expect(response.statusCode).toBe(200);
			expect(response.type).toBe("application/json");

			/* Ensure existing and validation of uuid and results */
			expect(response.body).toHaveProperty("uuid");
			expect(uuidValidate(response.body.uuid)).toBe(true);

			expect(response.body).toHaveProperty("results");
			expect(typeof response.body.results).toBe("object");
			expect(response.body.results).not.toBe(null);
		} else {
			log("No rule file found for testing");
		}
	});
});

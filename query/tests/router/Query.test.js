import supertest from "supertest";
import app, { server } from "../../main.js";

const request = supertest(app);

describe("GET /test endpoint", () => {
	let log;

	beforeAll(() => {
		/* Suppress console.log output from invoked functions, if present */
		log = console.log;
		console.log = () => { };
	});

	afterAll(() => {
		/* Restore console.log output */
		console.log = log;

		server.close();
	});

	it("should return 200 status and JSON response with message key", async () => {
		const response = await request.get(`/query/test`);
		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty("message");
		expect(typeof response.body.message).toBe("string");
	});
});
import express from "express";
import Proposition from "../lib/Proposition.js";

const router = express.Router();
const { OR, AND, NOT, XOR, evaluate, toJson, fromJson } = Proposition;

const registry = {
	"22791c63-3824-4a9e-9561-5aabb138a7bf": [
		AND,
		[ AND, true, [ NOT, () => fetch("http://localhost:3200").then(response => response.ok) ] ],
		[ NOT, () => Math.random() > 0.5 ],
	],
	"3ac6db27-422a-4243-92d8-abdade872edd": [
		AND,
		[ OR, true, false ],
		[ NOT, false ],
	],
	"8e7c4722-ca99-45a8-a79c-810e86fa8cf7": [
		XOR,
		[ NOT, false ],
		true,
	],
	"e3e3e3e3-3e3e-3e3e-3e3e-3e3e3e3e3e3e": [
		AND,
		[ OR, false, (ctx) => {
			console.log("This function should log the context object:", ctx);
			ctx.cats = "This is a test";
			return true;
		}, [ NOT, (ctx) => {
			console.log("This function should log the context object2:", ctx);
			return false;
		} ] ],
		[ NOT, false ],
	],
};


router.use("/:uuid", async (req, res) => {
	const { uuid } = req.params;
	const circuit = registry[ uuid ];
	const context = req.body;

	if(circuit) {
		try {
			const result = await evaluate(circuit, context);
			res.json({ uuid, result });
		} catch(error) {
			res.status(500).json({ error: error.message });
		}
	} else {
		res.status(404).send("Circuit not found");
	}
});

export default router;
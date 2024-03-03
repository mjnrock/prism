import express from "express";
import Proposition from "../lib/Proposition.js";

const router = express.Router();

//TODO: Replace this with a database
const { OR, AND, NOT, XOR, evaluate } = Proposition;
const circuitRegistry = {
	"22791c63": [
		AND,
		[ AND, true, [ NOT, () => fetch("http://localhost:3200").then(response => response.ok) ] ],
		[ NOT, () => Math.random() > 0.5 ],
	],
	"3ac6db27": [
		AND,
		[ OR, true, false ],
		[ NOT, false ],
	],
	"8e7c4722": [
		XOR,
		[ NOT, false ],
		true,
	],
	"e3e3e3e3": [
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
	const circuit = circuitRegistry[ uuid ];
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
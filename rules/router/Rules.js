import express from "express";
import { loadRuleJson, loadPropositionJson } from "./Rules.utility.js";
import Rule from "../lib/Rule.js";
import Proposition from "../lib/Proposition.js";

const router = express.Router();

router.use((req, res, next) => {
	// console log the endpoint, params, and body
	console.log("-=| Request received |=-");
	console.log(`Method: ${ req.method }`);
	console.log(`Endpoint: ${ req.originalUrl }`);
	console.log(`Params: ${ JSON.stringify(req.params) }`);
	console.log(`Body: ${ JSON.stringify(req.body) }`);
	console.log("-======================-");
	next();
});

router.use("/rule/:uuid", async (req, res) => {
	const { uuid } = req.params;
	const ruleJson = await loadRuleJson(uuid);
	let lookupFunctions = {};

	if(ruleJson.lookup) {
		lookupFunctions = Object.entries(ruleJson.lookup).reduce((acc, [ key, value ]) => {
			acc[ key ] = new Function(`return ${ value }`)();
			return acc;
		}, {});
	}

	if(ruleJson) {
		const rule = Rule.fromJson(ruleJson);
		const context = req.body;

		Rule.ruleEngine([ rule ], { context, lookup: lookupFunctions })
			.then(results => res.status(200).json({ id: uuid, results }))
			.catch(error => res.status(500).json({ error: error.message }));
	} else {
		res.status(404).send("Rule not found");
	}
});

router.use("/prop/:uuid", async (req, res) => {
	const { uuid } = req.params;
	const propositionJson = await loadPropositionJson(uuid);

	if(propositionJson) {
		const context = req.body;
		let lookupFunctions = {};

		if(propositionJson.lookup) {
			lookupFunctions = Object.entries(propositionJson.lookup).reduce((acc, [ key, value ]) => {
				acc[ key ] = new Function(`return ${ value }`)();
				return acc;
			}, {});
		}

		if(Array.isArray(propositionJson.logic)) {
			try {
				const result = await Proposition.evaluate(propositionJson.logic, context, lookupFunctions);
				res.status(200).json({ id: uuid, result });
			} catch(error) {
				res.status(500).json({ error: error.message });
			}
		} else {
			res.status(400).send("Invalid proposition format");
		}
	} else {
		res.status(404).send("Proposition not found");
	}
});


export default router;
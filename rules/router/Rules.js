import express from "express";
import { loadRuleJson, loadPropositionJson } from "./Rules.utility.js";
import Rule from "../lib/Rule.js";
import Proposition from "../lib/Proposition.js";

const router = express.Router();

router.use("/rule/:uuid", async (req, res) => {
	const { uuid } = req.params;
	const ruleJson = await loadRuleJson(uuid);

	console.log(uuid)
	console.log(ruleJson)

	if(ruleJson) {
		const rule = Rule.fromJson(ruleJson);
		const context = req.body;

		Rule.ruleEngine([ rule ], { context })
			.then(results => res.status(200).json({ uuid, results }))
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
		let routerFunctions = {};

		// Check if router is provided and parse stringified functions
		if(propositionJson.router) {
			routerFunctions = Object.entries(propositionJson.router).reduce((acc, [ key, value ]) => {
				acc[ key ] = new Function(`return ${ value }`)();
				return acc;
			}, {});
		}

		if(Array.isArray(propositionJson.logic)) {
			try {
				// Pass the router functions along with the logic and context
				const result = await Proposition.evaluate(propositionJson.logic, context, routerFunctions);
				res.status(200).json({ uuid, result });
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
import express from "express";
import { loadRuleJson, loadPropositionJson, createLookupFunctions, handleRouteError, determineAdditionalInfo, sendJsonResponse as sendRuleResponse } from "./Rules.utility.js";

import Rule from "../lib/Rule.js";
import Proposition from "../lib/Proposition.js";

const router = express.Router();

router.use((req, res, next) => {
	console.log("-=| Request received |=-");
	console.log(`Method: ${ req.method }`);
	console.log(`Endpoint: ${ req.originalUrl }`);
	console.log(`Params: ${ JSON.stringify(req.params) }`);
	console.log(`Body: ${ JSON.stringify(req.body) }`);
	console.log("-======================-");
	next();
});

router.use("/prop/:uuid", async (req, res) => {
	try {
		const { uuid } = req.params;
		const propositionJson = await loadPropositionJson(uuid);

		if(propositionJson) {
			const context = req.body;
			const lookupFunctions = createLookupFunctions(propositionJson.lookup);

			if(Array.isArray(propositionJson.logic)) {
				try {
					const ts = Date.now();
					const result = await Proposition.evaluate(propositionJson.logic, context, lookupFunctions);
					res.status(200).json({
						id: uuid,
						result,
						ts,
						elapsed: Date.now() - ts,
					});
				} catch(error) {
					res.status(500).json({ error: error.message });
				}
			} else {
				res.status(400).send("Invalid proposition format");
			}
		} else {
			res.status(404).send("Proposition not found");
		}
	} catch(error) {
		handleRouteError(res, error);
	}
});

router.use("/rule/:uuid", async (req, res) => {
	try {
		const { uuid } = req.params;
		const { info } = req.query;
		const ruleJson = await loadRuleJson(uuid);

		if(ruleJson) {
			const context = req.body;
			const lookupFunctions = createLookupFunctions(ruleJson.lookup);
			const rule = Rule.fromJson(ruleJson);

			const ts = Date.now();
			Rule.ruleEngine([ rule ], { context, lookup: lookupFunctions })
				.then(results => res.status(200).json({
					id: uuid,
					...determineAdditionalInfo(info, results),
					ts,
					elapsed: Date.now() - ts,
				}))
				.catch(error => res.status(500).json({ error: error.message }));
		} else {
			res.status(404).send("Rule not found");
		}
	} catch(error) {
		handleRouteError(res, error);
	}
});

export default router;
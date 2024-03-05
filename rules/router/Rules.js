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

router.use("/prop/:uuid", async (req, res) => {
	try {
		const { uuid } = req.params;
		const propositionJson = await loadPropositionJson(uuid);

		if(propositionJson) {
			const context = req.body;
			let lookupFunctions = {};

			/* Create lookup functions from the proposition's lookup object */
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
	} catch(error) {
		console.log(error);
		res.status(500).send("Internal Server Error");
	}
});

router.use("/rule/:uuid", async (req, res) => {
	try {
		const { uuid } = req.params;
		const { info } = req.query;
		const ruleJson = await loadRuleJson(uuid);
		let lookupFunctions = {};

		/* Create lookup functions from the rule's lookup object */
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
				.then(results => {
					let obj = {
						id: uuid,
						result: results.result,
					};

					if(info === "all" || info === "full" || info == 3) {
						obj = {
							...obj,
							audit: results.audit,
							context: results.context,
						};
					} else if(info === "audit" || info == 1) {
						obj.audit = results.audit;
					} else if(info === "context" || info == 2) {
						obj.context = results.context;
					}

					res.status(200).json(obj);
				})
				.catch(error => res.status(500).json({ error: error.message }));
		} else {
			res.status(404).send("Rule not found");
		}
	} catch(error) {
		console.log(error);
		res.status(500).send("Internal Server Error");
	}
});

export default router;
import express from "express";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

import Proposition from "../lib/Proposition.js";
import Rule from "../lib/Rule.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadRuleJson(uuid) {
	const rulePath = path.join(__dirname, `../data/rules/${ uuid }.rule.json`);
	try {
		const fileContents = await fs.readFile(rulePath, "utf-8");
		return JSON.parse(fileContents);
	} catch(error) {
		console.error(error);
		return null;
	}
};
async function loadPropositionJson(uuid) {
	const propositionPath = path.join(__dirname, `../data/propositions/${ uuid }.proposition.json`);
	try {
		const fileContents = await fs.readFile(propositionPath, "utf-8");
		return JSON.parse(fileContents);
	} catch(error) {
		console.error(error);
		return null;
	}
};

router.use("/rule/:uuid", async (req, res) => {
	const { uuid } = req.params;
	const ruleJson = await loadRuleJson(uuid);

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

	console.log(uuid)
	console.log(propositionJson)

	if(propositionJson) {
		const context = req.body;

		if(Array.isArray(propositionJson.logic)) {
			try {
				const result = await Proposition.evaluate(Proposition.fromJson(propositionJson.logic), context);
				res.json({ uuid, result });
			} catch(error) {
				res.status(500).json({ error: error.message });
			}
		} else {
			res.status(400).send("Invalid proposition format");
		}
	} else {
		res.status(404).send("Proposition not found");
	}
})

export default router;
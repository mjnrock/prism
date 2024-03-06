import fs from "fs/promises";
import path from "path";

const __dirname = process.cwd();

async function loadJson(filePath) {
	try {
		const fileContents = await fs.readFile(filePath, "utf-8");
		return JSON.parse(fileContents);
	} catch(error) {
		console.error(`Error reading file at ${ filePath }:`, error);
		return null;
	}
}

async function getPropositionLogicAndLookupByUuid(uuid) {
	const proposition = await loadPropositionJson(uuid);
	if(!proposition) return { logic: null, lookup: {} };

	const { logic, lookup = {} } = proposition;
	return { logic, lookup };
}

async function loadRuleJson(uuid) {
	const rulePath = path.join(__dirname, `./data/rules/${ uuid }.rule`);
	let rule = await loadJson(rulePath);

	if(rule && typeof rule.logic === "string") {
		const { logic: propositionLogic, lookup: propositionLookup } = await getPropositionLogicAndLookupByUuid(rule.logic);

		if(propositionLogic) {
			rule.logic = propositionLogic;
			rule.lookup = { ...rule.lookup, ...propositionLookup };
		} else {
			throw new Error(`Proposition with UUID ${ rule.logic } not found.`);
		}
	}
	return rule;
}

async function loadPropositionJson(uuid) {
	const propositionPath = path.join(__dirname, `./data/props/${ uuid }.prop`);
	return await loadJson(propositionPath);
}

export const createLookupFunctions = (lookupObject) => {
	if(!lookupObject) return {};
	return Object.entries(lookupObject).reduce((acc, [ key, value ]) => {
		acc[ key ] = new Function(`return ${ value }`)();
		return acc;
	}, {});
};

export const handleRouteError = (res, error) => {
	console.log(error);
	res.status(500).send("Internal Server Error");
};

export const sendJsonResponse = (res, status, uuid, result, info = null, additionalResults = {}) => {
	let response = {
		id: uuid,
		result,
		ts: Date.now(),
	};

	if(info) {
		response = { ...response, ...determineAdditionalInfo(info, additionalResults) };
	}

	res.status(status).json(response);
};

export const determineAdditionalInfo = (info, results) => {
	let obj = {
		result: results.result,
	};
	if([ "all", "full", "3" ].includes(info)) {
		obj = {
			results: results.results,
			context: results.context,
		};
	} else if([ "audit", "results", "detail", "1" ].includes(info)) {
		obj.results = results.results;
	} else if([ "context", "state", "2" ].includes(info)) {
		obj.context = results.context;
	}
	return obj;
};

export { loadJson, loadRuleJson, loadPropositionJson };
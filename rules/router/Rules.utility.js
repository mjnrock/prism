import fs from 'fs/promises';
import path from 'path';

const __dirname = process.cwd();

async function loadJson(filePath) {
	try {
		const fileContents = await fs.readFile(filePath, 'utf-8');
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

	if(rule && typeof rule.logic === 'string') {
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

export { loadRuleJson, loadPropositionJson };
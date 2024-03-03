import fs from "fs/promises";
import path from "path";

const __dirname = process.cwd();

async function loadRuleJson(uuid) {
	const rulePath = path.join(__dirname, `./data/rules/${ uuid }.rule`);
	try {
		const fileContents = await fs.readFile(rulePath, "utf-8");
		return JSON.parse(fileContents);
	} catch(error) {
		console.error(error);
		return null;
	}
}

async function loadPropositionJson(uuid) {
	const propositionPath = path.join(__dirname, `./data/props/${ uuid }.prop`);
	try {
		const fileContents = await fs.readFile(propositionPath, "utf-8");
		return JSON.parse(fileContents);
	} catch(error) {
		console.error(error);
		return null;
	}
}

export { loadRuleJson, loadPropositionJson };
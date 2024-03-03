import Proposition, { AND, NOT, OR } from "./Proposition.js";

export const EnumRuleType = {
	IF: "IF",
	WHILE: "WHILE",
};

const executeRoute = async (route, { context, router } = {}) => {
	if(typeof route === "function") {
		return await route(context);
	} else if(typeof route === "string" && router && router[ route ]) {
		return await router[ route ](context);
	} else {
		throw new Error("Route must be a function or a valid route key within the provided router.");
	}
};

export const ruleHandlers = {
	[ EnumRuleType.IF ]: async (logic, route, options) => {
		const result = await Proposition.evaluate(logic, options.context, options.router);
		await executeRoute(route[ result ? "true" : "false" ], options);
		return result;
	},
	[ EnumRuleType.WHILE ]: async (logic, route, options) => {
		const results = [];
		while(await Proposition.evaluate(logic, options.context, options.router)) {
			const iterationResult = await executeRoute(route, options) ?? true;
			results.push(iterationResult);
		}
		return results;
	},
};

/**
 * If *any* Rule contains a name, the result will be an object with the name as the key and the result as the value.
 * Otherwise, the result will be an array of results in the same order as the rules.
 */
export const ruleEngine = async (ruleSet, context = {}, router = {}) => {
	let useObjectForResult = ruleSet.some(rule => typeof rule === "object" && rule.name);
	let results = useObjectForResult ? {} : [];

	for(let i = 0; i < ruleSet.length; i++) {
		let rule = ruleSet[ i ];
		let resultKey = (typeof rule === "object" && rule.name) ? rule.name : i.toString();

		if(Array.isArray(rule)) {
			const logic = rule;
			const route = { true: () => true, false: () => false };
			const result = await ruleHandlers[ EnumRuleType.IF ](logic, route, { context, router });

			if(useObjectForResult) {
				results[ resultKey ] = result;
			} else {
				results.push(result);
			}
		} else {
			const result = await executeRule(rule, { context, router });

			if(useObjectForResult) {
				results[ resultKey ] = result;
			} else {
				results.push(result);
			}
		}
	}

	return results;
};

/**
 * Rule Syntax:
 * - type: EnumRuleType
 * - logic: Proposition
 * - route: Function | String
 * - ?name: String
 */
export const executeRule = async (rule, options) => {
	const { type, logic, route } = rule;
	if(!ruleHandlers[ type ]) {
		throw new Error("Invalid rule type.");
	}
	return await ruleHandlers[ type ](logic, route, options);
};

export const Rule = {
	EnumRuleType,
	executeRule,
	ruleEngine,
};

export default Rule;


// ============================================
// 			Example Usage
// ============================================
ruleEngine([
	/* This first shorthand is for such cases where the results of ruleEngine(...) are used for their side effects (basically, direct support for Propositions) */
	[
		OR,
		[ AND, true, true ],
		false,
	],
	/* Normal syntax */
	{
		// name: "Test Rule 1",	// This is optional, but useful for debugging
		type: "IF",
		logic: [
			AND,
			[ AND, true, [ NOT, false ] ],
			false,
		],
		route: {
			true: (...args) => console.log("TtTtrue", args),
			false: (...args) => console.log("FfFfalse", args),
		},
	},
	{
		type: "WHILE",
		logic: [
			AND,
			true,
			() => Math.random() < 0.5,
		],
		route: () => console.log("WHILE action executed"),
	}

], {}, {
	logTrue: () => console.log("Condition evaluated to true"),
	logFalse: () => console.log("Condition evaluated to false"),
})
	.then((results) => console.log("Rule engine execution completed", results))
	.catch(error => console.error("Rule engine error:", error));
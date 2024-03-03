import Proposition, { AND, NOT, OR } from "./Proposition.js";

export const EnumRuleType = {
	IF: "IF",
	WHILE: "WHILE",
	PROPOSITION: "PROPOSITION",
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
	[ EnumRuleType.PROPOSITION ]: async (logic, route, options) => {
		const result = await Proposition.evaluate(logic, options.context, options.router);
		await executeRoute(route[ result ? "true" : "false" ], options);
		return result;
	},
};

export const ruleEngine = async (ruleSet, context = {}, router = {}) => {
	let useObjectForResult = ruleSet.some(rule => typeof rule === "object" && rule.name);
	let results = useObjectForResult ? {} : [];

	for(let i = 0; i < ruleSet.length; i++) {
		let rule = ruleSet[ i ];
		let resultKey = (typeof rule === "object" && rule.name) ? rule.name : i.toString();

		if(Array.isArray(rule)) {
			const logic = rule;
			const route = { true: () => true, false: () => false };
			const result = await ruleHandlers[ EnumRuleType.PROPOSITION ](logic, route, { context, router });

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
 * - ?name: String
 * - ?type: EnumRuleType (df = PROPOSITION)
 * - logic: Proposition
 * - route: Function | String
 */

export const executeRule = async (rule, options) => {
	const { type = EnumRuleType.PROPOSITION, logic, route } = rule;
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
// ruleEngine([
// 	/* Shorthand to support (direct Propositions for) cases where the final result of `ruleEngine` is used for further processing, instead of individual routing */
// 	[
// 		OR,
// 		[ AND, true, true ],
// 		false,
// 	],
// 	/* Normal syntax */
// 	{
// 		// type: EnumRuleType.PROPOSITION,	// This is optional, but useful for debugging
// 		// name: "Test Rule 1",	// This is optional, but useful for debugging
// 		logic: [
// 			OR,
// 			[ AND, true, [ NOT, false ] ],
// 			false,
// 		],
// 		route: {
// 			true: (...args) => console.log("123", args),
// 			false: (...args) => console.log("321", args),
// 		},
// 	},
// 	{
// 		logic: [
// 			() => Math.random() < 0.5,
// 		],
// 		route: {
// 			true: (...args) => console.log("556", args),
// 			false: (...args) => console.log("665", args),
// 		},
// 	},
// 	{
// 		type: "IF",
// 		logic: [
// 			AND,
// 			[ AND, true, [ NOT, false ] ],
// 			false,
// 		],
// 		route: {
// 			true: (...args) => console.log("TtTtrue", args),
// 			false: (...args) => console.log("FfFfalse", args),
// 		},
// 	},
// 	{
// 		type: "WHILE",
// 		logic: [
// 			AND,
// 			true,
// 			() => Math.random() < 0.5,
// 		],
// 		route: () => console.log("WHILE action executed"),
// 	},
// ], {}, {
// 	logTrue: () => console.log("Condition evaluated to true"),
// 	logFalse: () => console.log("Condition evaluated to false"),
// })
// 	.then((results) => console.log("Rule engine execution completed", results))
// 	.catch(error => console.error("Rule engine error:", error));
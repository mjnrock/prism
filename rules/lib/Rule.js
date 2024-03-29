import Proposition, { AND, NOT, OR } from "./Proposition.js";

export const EnumRuleType = {
	IF: "IF",
	WHILE: "WHILE",
	PROPOSITION: "PROPOSITION",
};

/**
 * This is used for cases where a Proposition expects a custom function
 * to be present in the lookup, as a lookup.  This will inject that custom
 * function into the Proposition logic.
 */
const preprocessLogic = (logic, lookup) => {
	if(Array.isArray(logic)) {
		return logic.map(item => preprocessLogic(item, lookup));
	} else if(typeof logic === "string" && lookup[ logic ]) {
		return lookup[ logic ];
	}
	return logic;
};

const executeRoute = async (route, { context, lookup } = {}) => {
	/* Account for stringified functions */
	if(typeof route === "string") {
		try {
			route = new Function(`return ${ route };`)();
		} catch(error) { }
	}

	if(typeof route === "function") {
		return await route(context);
	} else if(typeof route === "string" && lookup && lookup[ route ]) {
		return await lookup[ route ](context);
	} else {
		throw new Error("Route must be a function or a valid route key within the provided lookup.");
	}
};

export const ruleHandlers = {
	[ EnumRuleType.IF ]: async (logic, route, options) => {
		const result = await Proposition.evaluate(logic, options.context, options.lookup);
		await executeRoute(route[ result ? "true" : "false" ], options);
		return result;
	},
	[ EnumRuleType.WHILE ]: async (logic, route, options) => {
		const results = [];
		while(await Proposition.evaluate(logic, options.context, options.lookup)) {
			const iterationResult = await executeRoute(route, options) ?? true;
			results.push(iterationResult);
		}
		return results;
	},
	[ EnumRuleType.PROPOSITION ]: async (logic, route, options) => {
		const result = await Proposition.evaluate(logic, options.context, options.lookup);
		await executeRoute(route[ result ? "true" : "false" ], options);
		return result;
	},
};

export const ruleEngine = async (ruleSet, { context = {}, lookup = {} } = {}) => {
	let useObjectForResult = ruleSet.some(rule => typeof rule === "object" && rule.name);
	let results = useObjectForResult ? {} : [];

	/* Intermix rule-specific context and lookup from ruleSet */
	for(const rule of ruleSet) {
		if(rule?.context) {
			context = { ...context, ...rule.context };
		}
		if(rule?.lookup) {
			lookup = { ...lookup, ...rule.lookup };
		}
	}

	for(let i = 0; i < ruleSet.length; i++) {
		let rule = ruleSet[ i ];
		let resultKey = (typeof rule === "object" && rule.name) ? rule.name : i.toString();

		if(Array.isArray(rule)) {
			const logic = rule;
			const route = { true: () => true, false: () => false };
			const result = await ruleHandlers[ EnumRuleType.PROPOSITION ](logic, route, { context, lookup });

			if(useObjectForResult) {
				results[ resultKey ] = result;
			} else {
				results.push(result);
			}
		} else {
			const result = await executeRule(rule, { context, lookup });

			if(useObjectForResult) {
				results[ resultKey ] = result;
			} else {
				results.push(result);
			}
		}
	}

	let lastResult = Array.isArray(results) ? results[ results.length - 1 ] : Object.values(results).pop();

	return {
		results: results,
		result: lastResult,
		context,
	};
};

export const toJson = (rule, spacing = 0) => {
	return JSON.stringify(rule, (key, value) => {
		if(typeof value === "function") {
			const functionName = Object.keys(Proposition).find(key => Proposition[ key ] === value);
			if(functionName) {
				return functionName;
			}

			return value.toString();
		}
		return value;
	}, spacing);
};
export const fromJson = (json) => {
	if(typeof json === "object") {
		// json is a file import, recreate any nested stringified functions
		return JSON.parse(JSON.stringify(json), (key, value) => {
			if(typeof value === "string" && (value.startsWith("function") || value.startsWith("(") || value.startsWith("async"))) {
				return new Function(`return ${ value }`)();
			} else {
				return value;
			}
		});
	}

	// json is a toJson result, undo
	return JSON.parse(json, (key, value) => {
		if(typeof value === "string" && (value.startsWith("function") || value.startsWith("(") || value.startsWith("async"))) {
			return new Function(`return ${ value }`)();
		} else {
			return value;
		}
	});
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

	const processedLogic = preprocessLogic(logic, options.lookup);

	if(!ruleHandlers[ type ]) {
		throw new Error("Invalid rule type.");
	}

	return await ruleHandlers[ type ](processedLogic, route, options);
};


export const Rule = {
	EnumRuleType,
	executeRule,
	ruleEngine,
	toJson,
	fromJson,
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
// ], {
// 	context: {},
// 	lookup: {
// 		logTrue: () => console.log("Condition evaluated to true"),
// 		logFalse: () => console.log("Condition evaluated to false"),
// 	},
// })
// 	.then((results) => console.log("Rule engine execution completed", results))
// 	.catch(error => console.error("Rule engine error:", error));
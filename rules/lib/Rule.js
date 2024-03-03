import Proposition, { AND, NOT, OR } from "./Proposition.js";

export const EnumRuleType = {
	IF: "IF",
	SWITCH: "SWITCH",
	LOOP: "LOOP",
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
	[ EnumRuleType.SWITCH ]: async (logic, routes, options) => {
		const switchResult = await Proposition.evaluate(logic, options.context, options.router);
		const matchedRoute = routes.find(([ condition, _ ]) => condition === switchResult || (typeof condition === "function" && condition(options.context, options.router)));
		if(matchedRoute) {
			await executeRoute(matchedRoute[ 1 ], options);
		}
		return switchResult;
	},
	[ EnumRuleType.LOOP ]: async (logic, route, options) => {
		const results = [];
		while(await Proposition.evaluate(logic, options.context, options.router)) {
			const iterationResult = await executeRoute(route, options) ?? true;
			results.push(iterationResult);
		}
		return results;
	},
};

export const ruleEngine = async (ruleSet, context = {}, router = {}) => {
	const results = [];
	for(let rule of ruleSet) {
		// Check if the rule is directly an array (shorthand syntax for logic)
		if(Array.isArray(rule)) {
			// Execute the rule using the IF type handler with a default truthy route
			const logic = rule;
			const route = { true: () => true, false: () => false }; // Default routes
			const result = await ruleHandlers[ EnumRuleType.IF ](logic, route, { context, router });
			results.push(result);
		} else {
			// Process as a regular rule object
			const result = await executeRule(rule, { context, router });
			results.push(result);
		}
	}
	return results;
};

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
		type: "SWITCH",
		logic: [
			AND,
			true,
			[ NOT, false ],
		],
		route: [
			[ true, "logTrue" ],
			[ false, "logFalse" ],
			[ async (...args) => { /* something conditional */ }, "logTrue" ],
			() => console.log("Executing default action"),
		]
	},
	{
		type: "LOOP",
		logic: [
			AND,
			true,
			() => Math.random() < 0.5,
		],
		route: () => console.log("Loop action executed"),
	}

], {}, {
	logTrue: () => console.log("Condition evaluated to true"),
	logFalse: () => console.log("Condition evaluated to false"),
})
	.then((results) => console.log("Rule engine execution completed", results))
	.catch(error => console.error("Rule engine error:", error));
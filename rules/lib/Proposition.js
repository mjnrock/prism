export const toBooleanFunc = (arg, context = {}) => async (...args) => {
	if(typeof arg !== "function" && typeof arg !== "boolean") {
		throw new Error("All arguments must be functions that return boolean values or raw booleans.");
	}
	if(typeof arg === "function") {
		const result = await arg(context, ...args); // Pass context as the first argument
		if(typeof result !== "boolean") {
			throw new Error("Function did not return a boolean value.");
		}
		return result;
	} else {
		return arg;
	}
};

// Update logical operation functions to include context
export const OR = (context, ...args) => async () => {
	const resolvedArgs = await Promise.all(args.map(arg => toBooleanFunc(arg, context)()));
	return resolvedArgs.some(arg => arg);
};

export const AND = (context, ...args) => async () => {
	const resolvedArgs = await Promise.all(args.map(arg => toBooleanFunc(arg, context)()));
	return resolvedArgs.every(arg => arg);
};

export const NOT = (context, arg) => async () => !await toBooleanFunc(arg, context)();

export const NAND = (context, ...args) => async () => !await AND(context, ...args)();

export const NOR = (context, ...args) => async () => !await OR(context, ...args)();

export const XOR = (context, ...args) => async () => {
	const resolvedArgs = await Promise.all(args.map(arg => toBooleanFunc(arg, context)()));
	return resolvedArgs.filter(arg => arg).length % 2 === 1;
};

export const XNOR = (context, ...args) => async () => !await XOR(context, ...args)();

export const IF = (context, a, b) => async () => await OR(context, NOT(context, a), b)();

export const IFF = (context, a, b) => async () => await NOT(context, XOR(context, a, b))();

export const evaluate = async (circuit, context = {}) => {
	if(typeof circuit === "function") {
		return await circuit(context);
	} else if(Array.isArray(circuit)) {
		const operator = circuit[ 0 ];
		const operands = circuit.slice(1);
		/* Recurse the circuit and evaluate all operands */
		const evaluatedOperands = await Promise.all(operands.map(async operand => await evaluate(operand, context)));

		if(typeof operator === "string") {
			const operatorFunc = Proposition[ operator ];

			if(typeof operatorFunc === "function") {
				return evaluate(await operatorFunc(context, ...evaluatedOperands), context);
			}
		} else if(typeof operator === "function") {
			return evaluate(await operator(context, ...evaluatedOperands), context);
		} else {
			throw new Error("Invalid operator in logic circuit.");
		}
	} else {
		return circuit;
	}
};

export const toJson = (circuit) => {
	if(typeof circuit === "function") {
		return circuit.toString();
	} else if(Array.isArray(circuit)) {
		const operator = circuit[ 0 ];
		const operands = circuit.slice(1);

		return [ operator.name, ...operands.map(operand => toJson(operand)) ];
	} else {
		return circuit;
	}
};
export const fromJson = (circuit) => {
	if(typeof circuit === "string") {
		return new Function(`return ${ circuit };`)();
	} else if(Array.isArray(circuit)) {
		const operator = circuit[ 0 ];
		const operands = circuit.slice(1);

		return [ Proposition[ operator ], ...operands.map(operand => fromJson(operand)) ];
	} else {
		return circuit;
	}
};

export const Proposition = {
	OR,
	AND,
	NOT,
	NAND,
	NOR,
	XOR,
	XNOR,
	IF,
	IFF,
	evaluate,
	toJson,
	fromJson,
};

export default Proposition;


/**
 * ============================================
 * 		Example usage
 * ============================================
 */
// // Syntactical variant that uses function syntax
// const logicCircuit = AND(
// 	AND(true, NOT(false)),
// 	NOR(false, false),
// 	XOR(true, false),
// 	true,
// 	() => fetch("https://jsonplaceholder.typicode.com/todos/1").then(response => !response.ok).then(result => !result),
// 	IF(false, true),
// );

// logicCircuit().then(result => console.log(111, result));

// // Syntactical variant that uses array syntax
// const logicCircuit2 = [
// 	AND,
// 	[ AND, true, [ NOT, false ] ],
// 	[ NOR, false, false ],
// 	[ XOR, true, false ],
// 	true,
// 	() => fetch("https://jsonplaceholder.typicode.com/todos/1").then(response => !response.ok).then(result => !result),
// 	[ IF, false, true ],
// ];

// evaluate(logicCircuit).then(result => console.log(222, result));
// evaluate(logicCircuit2).then(result => console.log(333, result));
// evaluate([ OR, logicCircuit, logicCircuit2 ]).then(result => console.log(444, result));

// const A = async () => fetch("https://jsonplaceholder.typicode.com/todos/1").then(response => response.ok);
// const B = async () => fetch("https://example.com").then(response => response.ok);
// const C = async () => fetch("https://google.com").then(response => response.ok);

// const circuit = OR(
// 	AND(A, B),
// 	NOT(C)
// );

// const evaluateCircuit = async () => {
// 	try {
// 		const result = await evaluate(circuit);
// 		console.log("Result:", result);
// 	} catch(error) {
// 		console.error("Error evaluating circuit:", error.message);
// 	}
// };

// evaluateCircuit();
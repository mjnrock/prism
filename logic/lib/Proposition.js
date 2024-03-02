export const toBooleanFunc = (arg) => async (...args) => {
	if(typeof arg !== "function" && typeof arg !== "boolean") {
		throw new Error("All arguments must be functions that return boolean values or raw booleans.");
	}
	if(typeof arg === "function") {
		const result = await arg(...args);
		if(typeof result !== "boolean") {
			throw new Error("Function did not return a boolean value.");
		}
		return result;
	} else {
		return arg;
	}
};

export const OR = (...args) => async () => {
	const resolvedArgs = await Promise.all(args.map(arg => toBooleanFunc(arg)()));
	return resolvedArgs.some(arg => arg);
};

export const AND = (...args) => async () => {
	const resolvedArgs = await Promise.all(args.map(arg => toBooleanFunc(arg)()));
	return resolvedArgs.every(arg => arg);
};

export const NOT = (arg) => async () => !await toBooleanFunc(arg)();

export const NAND = (...args) => async () => !await AND(...args)();

export const NOR = (...args) => async () => !await OR(...args)();

export const XOR = (...args) => async () => {
	const resolvedArgs = await Promise.all(args.map(arg => toBooleanFunc(arg)()));
	return resolvedArgs.filter(arg => arg).length % 2 === 1;
};

export const XNOR = (...args) => async () => !await XOR(...args)();

export const IF = (a, b) => async () => await OR(NOT(a), b)();

export const IFF = (a, b) => async () => await NOT(XOR(a, b))();

/**
 * Evaluates a logic circuit. The circuit can be a function that returns a boolean value, an array that represents a logic circuit, or a raw boolean value.
 * Use if you need to evaluate multiple circuits at once, or if you need to process the array syntax.
 */
export const evaluate = async (circuit) => {
	if(typeof circuit === "function") {
		return await circuit();
	} else if(Array.isArray(circuit)) {
		const operator = circuit[ 0 ];
		const operands = circuit.slice(1);

		const evaluatedOperands = await Promise.all(operands.map(async operand => await evaluate(operand)));

		if(typeof operator === "function") {
			return evaluate(await operator(...evaluatedOperands));
		} else {
			throw new Error("Invalid operator in logic circuit.");
		}
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
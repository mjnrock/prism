import express from "express";
import "./dotenv.js";

import RulesRouter from "./router/Rules.js";

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use((req, res, next) => {
	console.log(`Received ${ req.method } request for ${ req.url }`);
	next();
});

/*
* Example Usage:
* http://localhost:3201/rules/rule/cc120ac7-6879-4203-966a-d04a002b8a0e?info=all
* http://localhost:3201/rules/rule/cc120ac7-6879-4203-966a-d04a002b8a0e?info=context
* http://localhost:3201/rules/rule/cc120ac7-6879-4203-966a-d04a002b8a0e?info=audit
* http://localhost:3201/rules/prop/cc120ac7-6879-4203-966a-d04a002b8a0f
*/
app.use("/rules", RulesRouter);

app.use("*", (req, res) => {
	res.status(404).send("404 Not Found");
});

/* Expose server for testing */
export const server = app.listen(port, () => {
	console.log(`Server running on port ${ port }`);
});

export default app;
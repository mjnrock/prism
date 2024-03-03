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

app.use("/rules", RulesRouter);

app.use("*", (req, res) => {
	res.status(404).send("404 Not Found");
});

/* Expose server for testing */
export const server = app.listen(port, () => {
	console.log(`Server running on port ${ port }`);
});

export default app;
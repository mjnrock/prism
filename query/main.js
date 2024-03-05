import express from "express";
import "./dotenv.js";

import QueryRouter from "./router/Query.js";

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use((req, res, next) => {
	console.log(`Received ${ req.method } request for ${ req.url }`);
	next();
});

app.use("/query", QueryRouter);

app.use("*", (req, res) => {
	res.status(404).send("404 Not Found");
});

/* Expose server for testing */
export const server = app.listen(port, () => {
	console.log(`Server running on port ${ port }`);
});

export default app;
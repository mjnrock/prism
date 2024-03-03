import express from "express";
import "./dotenv.js";

import LogicRouter from "./router/Logic.js";

const app = express();
const port = process.env.PORT ?? 3200;

app.use(express.json());

app.use((req, res, next) => {
	console.log(`Received ${ req.method } request for ${ req.url }`);
	next();
});

app.use("/logic", LogicRouter);

app.use("*", (req, res) => {
	res.status(404).send("404 Not Found");
});

app.listen(port, () => {
	console.log(`Server running on port ${ port }`);
});
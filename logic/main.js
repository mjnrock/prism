import "./dotenv.js";
import express from "express";

const app = express();
const port = process.env.PORT ?? 3200;

app.use(express.json());
app.use((req, res, next) => {
	console.log(`Received ${ req.method } request for ${ req.url }`);
	next();
});

app.use("*", (req, res) => {
	res.status(404).send("404 Not Found");
});

app.listen(port, () => {
	console.log(`Server running on port ${ port }`);
});
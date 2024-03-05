import express from "express";

const router = express.Router();

router.use((req, res, next) => {
	console.log("-=| Request received |=-");
	console.log(`Method: ${ req.method }`);
	console.log(`Endpoint: ${ req.originalUrl }`);
	console.log(`Params: ${ JSON.stringify(req.params) }`);
	console.log(`Body: ${ JSON.stringify(req.body) }`);
	console.log("-======================-");
	next();
});

router.use("/test", (req, res) => {
	res.status(200).json({ message: "Hello world!" });
});

export default router;
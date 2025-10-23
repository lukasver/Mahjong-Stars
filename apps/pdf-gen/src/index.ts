import { createServer } from "node:http";
import main from "./main.js";

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"]) : 8080;
const HOSTNAME = process.env["HOSTNAME"] || "0.0.0.0";

const server = createServer(async (req, res) => {
	try {
		await main(req, res);
	} catch (error) {
		console.error(error);
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end("Internal Server Error");
	}
});

server.listen(PORT, HOSTNAME, () => {
	console.log(`Server listening on ${HOSTNAME}:${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV}`);
	console.log(`Webhook target: ${process.env.PDF_WEBHOOK_URL}`);
});

import puppeteer, { type PDFOptions } from "puppeteer";
import { getHtmlTemplate, processHtmlContent } from "./utils.js";

const executablePath =
	process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();

let lastStepTime: number;

const logWithTiming = (message: string) => {
	const now = Date.now();
	const elapsedSinceLastStep = ((now - lastStepTime) / 1000).toFixed(2);
	console.log(`${message} (took ${elapsedSinceLastStep}s)`);
	lastStepTime = now;
};

export async function generatePdf(
	content: string,
): Promise<{ pageCount: number; buffer: Buffer }> {
	lastStepTime = Date.now();
	console.log("Starting PDF generation process...", {
		env: process.env.NODE_ENV,
	});
	logWithTiming(
		"Launching browser with config:" + JSON.stringify({ executablePath }),
	);

	const browser = await puppeteer
		.launch({
			headless: "shell",
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-accelerated-2d-canvas",
				"--no-first-run",
				"--no-zygote",
				"--disable-gpu",
				"--disable-software-rasterizer",
				"--window-size=595,842",
			],
			protocolTimeout: 20000,
			timeout: 20000,
			defaultViewport: {
				width: 595,
				height: 842,
				deviceScaleFactor: 1,
			},
			dumpio: true,
		})
		.catch((err) => {
			console.error("Failed to launch browser:", err);
			throw err;
		});

	logWithTiming("Browser launched successfully, creating new page...");

	const page = await browser.newPage().catch(async (err) => {
		console.error("Failed to create new page:", err);
		await browser.close();
		throw err;
	});

	logWithTiming(
		"Page created successfully, setting up request interception...",
	);

	// Logging for resource handling
	const resourceCounts = { allowed: 0, blocked: 0 };

	await page.setRequestInterception(true);
	page.on("request", (request) => {
		const resourceType = request.resourceType();
		if (["image", "stylesheet", "font"].includes(resourceType)) {
			void request.continue();
			resourceCounts.allowed++;
			console.log(`Allowing resource: ${resourceType}, URL: ${request.url()}`);
		} else {
			void request.abort();
			resourceCounts.blocked++;
			console.log(`Blocking resource: ${resourceType}, URL: ${request.url()}`);
		}
	});

	logWithTiming("Processing content and setting up HTML...");
	const processedContent = processHtmlContent(content);
	const htmlContent = getHtmlTemplate(processedContent);

	logWithTiming("Setting page content...");
	const startTime = Date.now();
	await page
		.setContent(htmlContent, {
			waitUntil: ["networkidle0", "load", "domcontentloaded"],
			timeout: 30000,
		})
		.catch((err) => {
			console.error("Failed to set content:", err);
			console.log("Time elapsed:", Date.now() - startTime, "ms");
			throw err;
		});
	logWithTiming("Content set successfully");

	logWithTiming("Waiting for fonts...");
	await page
		.evaluateHandle("document.fonts.ready")
		.catch((err) => console.error("Font loading error:", err));

	logWithTiming("Waiting for images and ready state...");
	await page
		.waitForFunction(
			'document.body.getAttribute("data-ready") === "true" || document.querySelectorAll("img").length === 0',
			{ timeout: 30000 },
		)
		.catch((err) => {
			console.log("Image loading timeout or error:", err);
			console.log("Continuing anyway...");
		});

	logWithTiming("Setting viewport...");
	await page.setViewport({
		width: 595,
		height: 842,
		deviceScaleFactor: 1,
	});

	logWithTiming("Setting media type and styles...");
	await page.emulateMediaType("print");
	await page.addStyleTag({
		content: `
      @page {
        padding-bottom: 4cm;
        size: A4;
        padding-top: 1cm;
      }
      @page :first {
        padding-top: 0 !important;
      }
      body {
        margin: 0;
        padding: 0;
      }
      /* Force page breaks before elements with class="page-break" */
      .page-break {
        page-break-before: always;
        /* Hide the visual content in PDF but keep the page break functionality */
        color: transparent;
        border: none;
        height: 0;
        margin: 0;
        padding: 0;
      }
      /* Hide the "Page Break" text in PDF */
      .page-break span {
        display: none;
      }
      /* Avoid page breaks inside elements with class="no-break" */
      .no-break {
        page-break-inside: avoid;
      }
    `,
	});

	logWithTiming("Generating PDF with options...");
	logWithTiming("Resource statistics:" + JSON.stringify(resourceCounts));

	const pdfOptions: PDFOptions = {
		format: "A4",
		printBackground: true,
		waitForFonts: true,
		preferCSSPageSize: true,
		displayHeaderFooter: true,
		headerTemplate: "<span></span>", // Empty header
		footerTemplate: `
      <div style="width: 100%; font-size: 10pt; text-align: right; position: fixed; bottom: 0.25cm; right: 0.5cm;">
        <p style="text-alignt: right;">Page <span class="pageNumber"></span></p>
      </div>
    `,
		// For debugging, create the file in the output directory
		...(process.env.NODE_ENV !== "production" && {
			path: `./out/preview-${new Date().getTime()}.pdf`,
		}),
		timeout: 60000,
	};

	const stream = await page.pdf(pdfOptions).catch((err) => {
		console.error("PDF generation failed:", err);
		throw err;
	});
	logWithTiming("PDF generated successfully");

	logWithTiming("Closing browser...");
	await browser.close();

	const pageCount = await getPageCount(stream);
	console.log("Final PDF statistics:", {
		pageCount,
		sizeKB: Math.round(stream.byteLength / 1024),
		totalTimeMs: Date.now() - startTime,
	});

	return { pageCount, buffer: Buffer.from(stream) };
}

const getPageCount = async (content: Uint8Array) => {
	console.log("Calculating page count...");
	const { PDFDocument } = await import("pdf-lib");
	const pdfDoc = await PDFDocument.load(content);
	const pageCount = pdfDoc.getPageCount();
	console.log(`Generated PDF with ${pageCount} pages`);
	return pageCount;
};

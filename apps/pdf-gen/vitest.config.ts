import dotenv from "dotenv";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env.test" });

export default defineConfig({
	plugins: [tsConfigPaths()],
	test: {
		globals: true,
		passWithNoTests: true,
		// setupFiles: './__tests__/setup-tests.ts',
		css: false,
		outputFile: {
			json: "coverage/report.json",
		},
		coverage: {
			reporter: ["text", "json", "html", "text-summary"],
			include: ["__tests__/**/*.ts", "__tests__/**/*.tsx"],
			exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**"],
		},
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
		unstubGlobals: true,
		unstubEnvs: true,
		include: ["src/__tests__/**/*.test.ts"],
		environment: "node",
		testTimeout: 10000,
	},
	define: {
		"process.env": process.env,
	},
});

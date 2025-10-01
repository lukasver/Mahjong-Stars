import type { CoreMessage } from "ai";

type BaseArgs = {
	systemPrompt?: string | { text: string; variables: Record<string, string> };
	model: "gemini-2.5-flash-lite" | (string & {});
	documents?: {
		src: string;
	}[];
};

type ArgsWithMessages = {
	messages: CoreMessage[];
	prompt?: never;
};

type ArgsWithPrompt = {
	prompt: string | { src: string; variables: Record<string, string> };
	messages?: never;
};

export type GenerateArgs = BaseArgs & (ArgsWithMessages | ArgsWithPrompt);

export type GenerateOptions = {
	perf?: boolean;
	save?: {
		path: string;
		name: string;
	};
};

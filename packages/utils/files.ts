import fs from 'node:fs/promises';
import Handlebars from 'handlebars';

/**
 * Retrieve a file
 * @param path The path to the file
 * @returns The file
 */
export const getFile = async (path: string) => {
  try {
    const file = await fs.readFile(path, 'utf-8');
    if (!file) {
      throw new Error(`File ${path} does not exist`);
    }
    return file;
  } catch (error) {
    console.error(
      `Error reading file ${path}:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
};

/**
 * Retrieves a prompt from a file and compiles its variables using Handlebars templating
 * @param promptPath The path to the prompt file
 * @param variables An object containing variables to compile into the template
 * @returns The compiled prompt string with variables replaced
 */
export async function getPrompt(
  promptPath: string,
  variables: Record<string, string> = {}
) {
  try {
    const prompt = await getFile(promptPath);
    return Handlebars.compile(prompt)(variables);
  } catch (error) {
    console.error(
      `Error getting prompt from ${promptPath}:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

export async function saveFile(path: string, content: string) {
  try {
    await fs.writeFile(path, content);
  } catch (error) {
    console.error(
      `Error saving file ${path}:`,
      error instanceof Error ? error.message : error
    );
  }
}

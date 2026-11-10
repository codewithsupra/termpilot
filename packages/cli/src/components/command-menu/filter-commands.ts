import { COMMANDS } from "./commands";
import type { Command } from "./types";

/**
 * Filters slash commands by what the user has typed so far.
 * Accepts input with or without the leading "/". Names that start with the
 * query rank first, then names that merely contain it, then descriptions.
 */
export function filterCommands(
  input: string,
  commands: Command[] = COMMANDS,
): Command[] {
  const query = input.trim().replace(/^\//, "").toLowerCase();
  if (!query) return commands;

  const prefix: Command[] = [];
  const contains: Command[] = [];
  const inDescription: Command[] = [];

  for (const command of commands) {
    const name = command.name.toLowerCase();
    if (name.startsWith(query)) prefix.push(command);
    else if (name.includes(query)) contains.push(command);
    else if (command.description.toLowerCase().includes(query))
      inDescription.push(command);
  }

  return [...prefix, ...contains, ...inDescription];
}

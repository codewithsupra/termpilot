import { relative, isAbsolute, sep } from "path";

// Deviation from the tutorial. The tutorial checks `resolved.startsWith(cwd)`,
// which also accepts a sibling directory that merely shares the prefix
// (cwd "/work/app" accepts "/work/app-secrets"). Comparing the relative path
// is the correct test. This does not follow symlinks.
export function isInsideDirectory(cwd: string, target: string): boolean {
  const rel = relative(cwd, target);
  if (rel === "") return true;
  return rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel);
}

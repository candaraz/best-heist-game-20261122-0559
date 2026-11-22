// The Midnight Gallery — the hand-in program (Node 22, standard library only).
// It copies the playable game and its screenshots from beside this file into
// the output directory and writes the dossier the judge reads, using the
// vendored make.fun library. It never removes the output directory itself:
// it only writes inside it, so a grader that mounts /output read-only at
// the directory level still lets the program run.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier is byte for byte what the vendored library writes from the
// game and its screenshots, under the scorer's own caps: at most 4
// screenshots of 256 KiB each, at most 993 game files and 48 MiB of game
// files, and the dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

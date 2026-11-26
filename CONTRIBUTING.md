# Contributing

Thanks for helping. The most useful contribution is a new crawler list.

## Add a crawler

1. Find the operator's own documentation page and the URL of the address list it publishes. A list someone else
   compiled is not accepted.
2. Add one entry to `src/sources.js` with `id`, `operator`, `userAgents`, `purpose`, `docs`, `url`, `format` and,
   when the operator documents reverse DNS, `reverseDns`.
3. Run `node src/cli.js update --out .tmp/snapshot.json` and check the new source appears with its prefixes.
4. Run `npm test` and `npm run lint`.

## Pull requests

Keep a pull request to one change, describe what it changes and how you checked it, and leave `dist/` alone: the
daily workflow rebuilds it. See `AGENTS.md` for the layout and the rules.

By contributing you agree that your contribution is released under the MIT licence of the project.

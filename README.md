# Deck to CSV

Simple static page to convert a deck list file into CSV in the browser.

## Files

- `index.html`: upload UI + in-browser conversion + CSV download
- `deckToCSV.js`: existing CLI converter

## Run locally

You can open the page directly:

```bash
open index.html
```

Or serve the folder (recommended):

```bash
npx http-server .
```

## Usage

1. Open the page.
2. Upload a deck file (example: `annie`).
3. Optional: check **Keep section column**.
4. Click **Convert and Download CSV**.

## Notes

- Supported sections: `Legend`, `Champion`, `MainDeck`, `Battlefields`, `Runes`
- Ready to publish as a static site (e.g. GitHub Pages via GitHub Actions later)

# J-Slop

**Room for better ideas.** A quieter LinkedIn feed, with you in control.

![J-Slop logo](extension/icons/icon-128.png)

J-Slop is a standalone Chrome extension using Jev 1.13 directly through OpenRouter. Original project logo and interface assets are in `extension/` and `branding/`. No server, build, or dependency installation required.

## Setup

1. Download the extension ZIP from [Releases](https://github.com/MalakaAvinashRaj/j-slop/releases), then unzip it into a folder you can keep. For a release ZIP, select the extracted folder itself; for a source-code download, select its `extension` subfolder.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the folder containing `manifest.json`.
3. Open the extension popup, paste your OpenRouter API key, and click **Save key**.
4. Reload LinkedIn and scroll. Posts above 85% slop probability collapse with a **Show post** button.

Adjust the threshold or pause filtering from the popup. Settings apply within two seconds. Reload LinkedIn after reloading the extension.

## Cost

Free to download and install. Requires your own OpenRouter API key; model usage is billed by OpenRouter. No Chrome Web Store registration is needed to install this unpacked extension.

## Help

See the [user guide](docs/USER_GUIDE.md) and [privacy policy](docs/PRIVACY.md). The extension popup also links to a built-in help page. Support: avinashmalaka07@gmail.com.

## Data and limitations

Only a normalized excerpt of at most 1,500 UTF-8 bytes goes to OpenRouter and TypeSafe. Long posts use beginning, middle and ending samples; no second full-text request is made. The key stays in local Chrome extension storage, is not synced, and is restricted to trusted extension contexts so LinkedIn content scripts cannot read it. Storage is not encrypted; someone with access to your browser profile may access the key. Use **Remove key** to clear it.

The project `.env` is no longer used. Do not package credentials into extension files. Decisions are cached locally by excerpt hash for 30 days and reused after worker restarts or page reloads. Old cache entries are pruned at startup. Concurrent duplicates share one API call. There is a hard cap of 250 new API attempts per UTC day, including failed attempts, and at most three simultaneous requests. API failures leave posts visible without automatic retries; only local busy responses retry. The popup shows the daily call count. Keys and posts are not logged.

This judges writing style, not provable AI authorship. Small excerpts can miss context and changes in LinkedIn markup may affect results. Classification accuracy has not been formally measured.

Developer checks: `npm test`.

API reference: https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request

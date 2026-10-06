# J-Slop privacy policy

Last updated: October 6, 2026

J-Slop filters writing in a user's LinkedIn feed. It uses TypeSafe's Jev model through OpenRouter to produce a probability used by the extension's local filtering controls.

## Information processed

J-Slop reads text in LinkedIn feed posts and sends a normalized excerpt of no more than 1,500 UTF-8 bytes to OpenRouter for classification by TypeSafe. Excerpts can contain personal information included in the post by its author. J-Slop does not intentionally collect comments, private messages, cookies, or browsing history outside LinkedIn. It does not inspect text embedded in images or videos.

Your OpenRouter API key is sent to OpenRouter to authenticate requests. It is stored in local Chrome extension storage, with access restricted to trusted extension contexts, and is not synced by J-Slop. This storage is not encrypted by J-Slop.

Filtering preferences, excerpt hashes and probabilities, cache expiry times and daily request counts are stored locally. The developer does not operate a collection server or receive these records. J-Slop contains no advertising or analytics trackers and does not sell information.

## Purpose and recipients

Excerpts and the API key are used only to provide the requested classification feature. OpenRouter routes classification to TypeSafe. Their applicable terms and privacy policies govern their processing and retention. J-Slop does not promise zero retention by these providers.

OpenRouter privacy information: https://openrouter.ai/privacy
TypeSafe privacy information: https://typesafe.ai/legal/privacy-policy

## Retention and control

Cached decisions are eligible for reuse for 30 days. Expired entries and excess entries are pruned when the background worker starts; expired records may remain locally until pruning occurs. No post text is intentionally persisted in the cache.

You can pause filtering in the popup, reveal individual posts, or remove the saved API key. Removing the key prevents new authenticated classifications; cached scores and settings remain. Uninstalling the extension removes its local extension storage. Removing the key or uninstalling does not delete records already processed by external providers.

## Limited use

J-Slop uses and transfers user data only to provide its single filtering purpose, consistent with the Chrome Web Store User Data Policy, including its Limited Use requirements. J-Slop does not use this data for advertising, unrelated profiling, or creditworthiness decisions.

## Contact

Contact: avinashmalaka07@gmail.com

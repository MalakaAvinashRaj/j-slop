# Get started with J-Slop

## Install from GitHub

1. Download `j-slop-0.2.0.zip` from the repository's Releases page.
2. Unzip it into a permanent folder. Chrome uses those files directly, so don't delete or move them after loading.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Open J-Slop from Chrome's extensions menu. Pin it for easier access if you like.

## Connect and filter

Expand **OpenRouter connection**, paste only your API key, and select **Save key**. Your OpenRouter account needs credits and permission to use TypeSafe Jev. Refresh LinkedIn and scroll.

Posts remain visible while being checked. Above your threshold, they collapse once. **Show post** reveals one and keeps it open for this page session. **Hide post** lets you hide one manually. Lower the threshold to filter more, or raise it to be more selective. Changing the threshold reuses saved scores. Turn off **Clear the noise** to restore posts.

## Costs

J-Slop is free to download. OpenRouter bills you separately for API usage. Long posts use excerpts of at most 1,500 UTF-8 bytes. Decisions are cached for 30 days. The extension caps new API attempts at 250 per UTC day, including failed attempts.

## Troubleshooting

- No posts checked: refresh LinkedIn after loading or updating, enable filtering, and save a valid key.
- Invalid key: paste the plain key beginning `sk-or-v1-`, without quotes or surrounding text.
- Provider blocked: allow TypeSafe and Jev in your OpenRouter guardrail.
- API error: check credits, key and provider access, then refresh. API errors do not automatically retry.
- Daily limit reached: wait until the next UTC day, then refresh. Cached scores remain available.
- Wrong classification: reveal the post or adjust your threshold. Jev judges writing style, not provable AI authorship, and cannot read text inside media.

## Update

Download and unzip the new release into your existing installation folder, then click **Reload** on J-Slop's card at `chrome://extensions`. Refresh LinkedIn. Browser settings are preserved when reloading the same extension folder.

## Remove

Use **Remove key** in the popup to clear the saved API key. Remove J-Slop at `chrome://extensions` to uninstall and delete its local extension storage. External provider records are governed by their policies.

Support: avinashmalaka07@gmail.com.

async function getLinkTitle(link) {
	return await fetch(link, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
			Accept: "text/html",
		},
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error("fetch error");
			}
			return res.text();
		})
		.then((text) => {
			let matchedGroup = text.match(/<title.*?>(.*?)<\/title>/);
			return matchedGroup ? matchedGroup[1] : "";
		})
		.catch((e) => {
			logseq.UI.showMsg("Connection timeout.");
		});
}

function isMarkdownURL(content) {
	let markdownURL = content.match(/\[.*?\]\((.*)?\)/);
	return markdownURL && markdownURL[1] ? markdownURL[1] : null;
}

async function main() {
	logseq.provideModel({
		async updateBlock() {
			const currentBlock = await logseq.Editor.getCurrentBlock();
			let content = currentBlock?.content;
			let blockUuid = currentBlock?.uuid;

			if (content) {
				let markdownURL = isMarkdownURL(content);
				if (markdownURL) {
					await logseq.Editor.updateBlock(blockUuid, markdownURL);
					return;
				}

				logseq.UI.showMsg("🚀 Fetching title...");
				let title = await getLinkTitle(content);
				if (title) {
					let newContent = `[${title}](${content})`;
					await logseq.Editor.updateBlock(blockUuid, newContent);
				} else {
					logseq.UI.showMsg("No title get.");
				}
			}
		},
	});

	logseq.App.registerUIItem("toolbar", {
		key: "get-link-title",
		template: `<a data-on-click="updateBlock" class="button"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16"><path width="18" d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/><path width="18" d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/></svg></a>`,
	});
}

logseq.ready(main).catch(console.error);

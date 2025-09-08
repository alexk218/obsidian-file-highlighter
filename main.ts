import { Plugin, TFile, Menu } from "obsidian";

interface FtaHighlighterSettings {
	highlightedFiles: string[];
}

const DEFAULT_SETTINGS: FtaHighlighterSettings = {
	highlightedFiles: [],
};

export default class FtaHighlighterPlugin extends Plugin {
	settings: FtaHighlighterSettings;

	async onload() {
		console.log("FTA Highlighter loaded");

		await this.loadSettings();

		// Apply highlights on load
		this.highlightFiles();

		// Watch DOM changes (FTA updates dynamically)
		const observer = new MutationObserver(() => this.highlightFiles());
		observer.observe(document.body, { childList: true, subtree: true });

		// Add right-click context menu in FTA
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				if (!file) return;

				menu.addItem((item) =>
					item
						.setTitle(
							this.settings.highlightedFiles.includes(file.path)
								? "Remove Highlight"
								: "Highlight File"
						)
						.setIcon("star")
						.onClick(() => this.toggleHighlight(file.path))
				);
			})
		);
	}

	onunload() {
		console.log("FTA Highlighter unloaded");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.highlightFiles();
	}

	toggleHighlight(path: string) {
		if (this.settings.highlightedFiles.includes(path)) {
			this.settings.highlightedFiles =
				this.settings.highlightedFiles.filter((p) => p !== path);
		} else {
			this.settings.highlightedFiles.push(path);
		}
		this.saveSettings();
	}

	highlightFiles() {
		const ftaElements =
			document.querySelectorAll<HTMLDivElement>(".oz-nav-file-title");
		ftaElements.forEach((el) => {
			const filePath = el.getAttribute("data-path");
			if (!filePath) return;

			if (this.settings.highlightedFiles.includes(filePath)) {
				el.classList.add("fta-highlighted");
			} else {
				el.classList.remove("fta-highlighted");
			}
		});

		const defaultTreeElements =
			document.querySelectorAll<HTMLDivElement>(".nav-file-title");
		defaultTreeElements.forEach((el) => {
			const filePath = el.getAttribute("data-path");
			if (!filePath) return;
			el.classList.toggle(
				"fta-highlighted",
				this.settings.highlightedFiles.includes(filePath)
			);
		});
	}
}

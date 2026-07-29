import { BOARD_URL, readSettings } from "./settings";

const status = document.querySelector<HTMLElement>("[data-status]");
const openMind = document.querySelector<HTMLButtonElement>("[data-open-mind]");
const openSettings = document.querySelector<HTMLButtonElement>("[data-open-settings]");

void renderStatus();

openMind?.addEventListener("click", () => {
  void chrome.tabs.create({ url: BOARD_URL });
  window.close();
});

openSettings?.addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
  window.close();
});

async function renderStatus() {
  const settings = await readSettings();
  if (!status) return;
  status.textContent = settings.token ? "Ready to capture" : "Connection required";
  status.dataset.connected = settings.token ? "true" : "false";
}

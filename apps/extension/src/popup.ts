import { BOARD_URL, CONNECT_URL, readSettings } from "./settings";

const status = document.querySelector<HTMLElement>("[data-status]");
const primaryAction = document.querySelector<HTMLButtonElement>("[data-primary-action]");
const openSettings = document.querySelector<HTMLButtonElement>("[data-open-settings]");

void renderStatus();

primaryAction?.addEventListener("click", () => {
  void openPrimaryDestination();
});

async function openPrimaryDestination() {
  const settings = await readSettings();
  await chrome.tabs.create({ url: settings.token ? BOARD_URL : CONNECT_URL });
  window.close();
}

openSettings?.addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
  window.close();
});

async function renderStatus() {
  const settings = await readSettings();
  if (!status) return;
  status.textContent = settings.token ? "Ready to capture" : "Connection required";
  status.dataset.connected = settings.token ? "true" : "false";
  if (primaryAction) primaryAction.textContent = settings.token ? "Open Mind" : "Connect to Mind";
}

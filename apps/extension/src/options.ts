import { parseTags, readSettings, saveSettings } from "./settings";

const form = document.querySelector<HTMLFormElement>("[data-settings-form]");
const tokenInput = document.querySelector<HTMLInputElement>("[data-token]");
const tagsInput = document.querySelector<HTMLInputElement>("[data-tags]");
const message = document.querySelector<HTMLElement>("[data-message]");

void hydrate();

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  void persist();
});

async function hydrate() {
  const settings = await readSettings();
  if (tokenInput) tokenInput.value = settings.token;
  if (tagsInput) tagsInput.value = settings.defaultTags.join(", ");
}

async function persist() {
  const token = tokenInput?.value.trim() ?? "";
  if (!token) {
    showMessage("Paste your extension token first.", true);
    tokenInput?.focus();
    return;
  }

  await saveSettings({
    token,
    defaultTags: parseTags(tagsInput?.value ?? "")
  });
  showMessage("Settings saved. Right-click anything to send it to Mind.", false);
}

function showMessage(value: string, isError: boolean) {
  if (!message) return;
  message.textContent = value;
  message.dataset.error = isError ? "true" : "false";
}

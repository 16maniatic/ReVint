document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;

const defaults = { deleteOld: true, confirm: true };

chrome.storage.sync.get(defaults, (s) => {
  for (const key of Object.keys(defaults)) {
    const el = document.getElementById(key);
    el.checked = s[key];
    el.addEventListener("change", () => chrome.storage.sync.set({ [key]: el.checked }));
  }
});

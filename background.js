// Descarga las fotos desde el CDN de Vinted (evita problemas de CORS en el content script)
// y las devuelve como data URL, porque los Blob no se pueden pasar por mensajería.

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "fetchImage") return;

  (async () => {
    try {
      const res = await fetch(msg.url, { credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status} al descargar la foto`);
      const blob = await res.blob();
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      }
      sendResponse({ ok: true, dataUrl: `data:${blob.type || "image/jpeg"};base64,${btoa(bin)}` });
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();

  return true; // respuesta asíncrona
});

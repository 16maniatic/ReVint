// ReVint — content script
// Añade un botón "Republicar" en la página de un artículo propio. Al pulsarlo:
//   1. lee los datos del artículo desde la API interna de Vinted,
//   2. vuelve a subir sus fotos,
//   3. crea un artículo nuevo idéntico,
//   4. (opcional) borra el artículo original.
// Usa la sesión ya iniciada en el navegador: no pide ni guarda contraseñas.

(() => {
  const BTN_ID = "vr-republish-btn";

  // ---------- utilidades ----------

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const uuid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });

  const getCookie = (name) =>
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="))
      ?.split("=")
      .slice(1)
      .join("=");

  const itemIdFromUrl = () => location.pathname.match(/\/items\/(\d+)/)?.[1] ?? null;

  let csrfCache = null;
  async function getCsrfToken() {
    if (csrfCache) return csrfCache;
    const meta = document.querySelector('meta[name="csrf-token"]')?.content;
    if (meta) return (csrfCache = meta);

    const re = /\\?"CSRF_TOKEN\\?"\s*:\s*\\?"([^"\\]+)/;
    let m = document.documentElement.innerHTML.match(re);
    if (!m) {
      const html = await (await fetch("/", { credentials: "include" })).text();
      m = html.match(re) || html.match(/name="csrf-token" content="([^"]+)"/);
    }
    if (!m) throw new Error("No se encontró el token CSRF. ¿Has iniciado sesión en Vinted?");
    return (csrfCache = m[1]);
  }

  async function api(path, { method = "GET", json, form } = {}) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "X-CSRF-Token": await getCsrfToken(),
    };
    const anon = getCookie("anon_id");
    if (anon) headers["X-Anon-Id"] = decodeURIComponent(anon);

    let body;
    if (json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }

    const res = await fetch(path, { method, headers, body, credentials: "include" });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* respuesta no JSON */
    }
    if (!res.ok || (data && data.code && data.code !== 0)) {
      const detail =
        data?.message ||
        data?.errors?.map((e) => e.value || e.field).join(", ") ||
        text.slice(0, 200);
      throw new Error(`${method} ${path} → ${res.status}: ${detail}`);
    }
    return data;
  }

  function fetchImageViaBackground(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "fetchImage", url }, (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!resp?.ok) return reject(new Error(resp?.error || "Error descargando foto"));
        fetch(resp.dataUrl).then((r) => r.blob()).then(resolve, reject);
      });
    });
  }

  const getSettings = () =>
    new Promise((resolve) =>
      chrome.storage.sync.get({ deleteOld: true, confirm: true }, resolve)
    );

  // ---------- lógica de republicación ----------

  async function loadItem(id) {
    try {
      const d = await api(`/api/v2/item_upload/items/${id}`);
      if (d?.item) return d.item;
    } catch (e) {
      console.warn("[ReVint] item_upload falló, probando /items:", e);
    }
    const d = await api(`/api/v2/items/${id}`);
    if (!d?.item) throw new Error("No se pudieron leer los datos del artículo.");
    return d.item;
  }

  async function reuploadPhotos(item, tempUuid, progress) {
    const photos = (item.photos || []).slice().sort(
      (a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)
    );
    if (!photos.length) throw new Error("El artículo no tiene fotos.");

    const assigned = [];
    for (let i = 0; i < photos.length; i++) {
      progress(`Subiendo foto ${i + 1}/${photos.length}…`);
      const p = photos[i];
      const url = p.full_size_url || p.url;
      const blob = await fetchImageViaBackground(url);

      const form = new FormData();
      form.append("photo[type]", "item");
      form.append("photo[temp_uuid]", tempUuid);
      form.append("photo[file]", blob, `photo_${i + 1}.jpg`);

      const res = await api("/api/v2/photos", { method: "POST", form });
      const newId = res?.id ?? res?.photo?.id;
      if (!newId) throw new Error("Vinted no devolvió el id de la foto subida.");
      assigned.push({ id: newId, orientation: 0 });
      await sleep(400);
    }
    return assigned;
  }

  function buildPayload(item, assignedPhotos, tempUuid) {
    const price =
      typeof item.price === "object" && item.price !== null
        ? Number(item.price.amount)
        : Number(item.price_numeric ?? item.price);
    const currency = item.currency || item.price?.currency_code || "EUR";

    const colorIds =
      item.color_ids ||
      [item.color1_id, item.color2_id].filter((c) => c !== null && c !== undefined);

    return {
      item: {
        id: null,
        currency,
        temp_uuid: tempUuid,
        title: item.title,
        description: item.description,
        brand_id: item.brand_id ?? item.brand_dto?.id ?? null,
        brand: item.brand_title ?? item.brand?.title ?? item.brand ?? null,
        size_id: item.size_id ?? null,
        catalog_id: item.catalog_id,
        isbn: item.isbn ?? null,
        is_unisex: item.is_unisex ?? null,
        status_id: item.status_id,
        video_game_rating_id: item.video_game_rating_id ?? null,
        price,
        package_size_id: item.package_size_id ?? null,
        shipment_prices: { domestic: null, international: null },
        color_ids: colorIds,
        assigned_photos: assignedPhotos,
        measurement_length: item.measurement_length ?? null,
        measurement_width: item.measurement_width ?? null,
        item_attributes: item.item_attributes ?? [],
        manufacturer: item.manufacturer ?? null,
        manufacturer_labelling: item.manufacturer_labelling ?? null,
      },
      feedback_id: null,
      push_up: false,
      parcel: null,
      upload_session_id: tempUuid,
    };
  }

  async function republish(id, progress) {
    const settings = await getSettings();

    progress("Leyendo artículo…");
    const item = await loadItem(id);

    if (
      settings.confirm &&
      !confirm(
        `¿Republicar "${item.title}"?\n\n` +
          (settings.deleteOld
            ? "Se creará un anuncio nuevo idéntico y se BORRARÁ el actual (perderás sus favoritos y visitas)."
            : "Se creará un anuncio nuevo idéntico. El actual NO se borrará.")
      )
    ) {
      return null;
    }

    const tempUuid = uuid();
    const photos = await reuploadPhotos(item, tempUuid, progress);

    progress("Creando anuncio nuevo…");
    const created = await api("/api/v2/item_upload/items", {
      method: "POST",
      json: buildPayload(item, photos, tempUuid),
    });
    const newItem = created?.item;
    if (!newItem?.id) throw new Error("Vinted no devolvió el artículo nuevo.");

    if (settings.deleteOld) {
      progress("Borrando anuncio antiguo…");
      await sleep(800);
      await api(`/api/v2/items/${id}/delete`, { method: "POST" });
    }

    return newItem;
  }

  // ---------- interfaz ----------

  function setBtn(btn, text, state = "") {
    btn.textContent = text;
    btn.dataset.state = state;
  }

  function injectButton() {
    const id = itemIdFromUrl();
    const existing = document.getElementById(BTN_ID);
    if (!id) {
      existing?.remove();
      return;
    }
    if (existing) {
      existing.dataset.itemId = id;
      return;
    }

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.dataset.itemId = id;
    setBtn(btn, "🔁 Republicar");

    btn.addEventListener("click", async () => {
      if (btn.dataset.state === "busy") return;
      setBtn(btn, "Preparando…", "busy");
      try {
        const newItem = await republish(btn.dataset.itemId, (t) => setBtn(btn, t, "busy"));
        if (!newItem) return setBtn(btn, "🔁 Republicar");
        setBtn(btn, "✅ Republicado. Abriendo…", "done");
        await sleep(1200);
        location.href = newItem.url || `/items/${newItem.id}`;
      } catch (e) {
        console.error("[ReVint]", e);
        setBtn(btn, "❌ Error (ver detalles)", "error");
        alert("No se pudo republicar:\n\n" + e.message);
        setTimeout(() => setBtn(btn, "🔁 Republicar"), 4000);
      }
    });

    document.body.appendChild(btn);
  }

  // Vinted es una SPA: vigilamos los cambios de URL.
  let lastPath = "";
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      injectButton();
    }
  }, 700);
})();

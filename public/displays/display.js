/* RAVINTOLA BABYLON — shared display renderer */
(function () {
  const stage = document.getElementById("stage");
  const screen = Number(document.body.dataset.screen || 1);

  // ── Auto-scale the 1280×720 stage to fill the TV ──
  function fit() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener("resize", fit);
  fit();

  // ── Live clock ──
  function tick() {
    const el = document.getElementById("clock");
    if (el) {
      const d = new Date();
      el.textContent =
        String(d.getHours()).padStart(2, "0") + "." +
        String(d.getMinutes()).padStart(2, "0");
    }
  }
  tick();
  setInterval(tick, 5000);

  // ── Reload every night at ~04:00 to pick up menu updates ──
  (function scheduleReload() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(4, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    setTimeout(() => location.reload(true), next - now);
  })();

  // ── Renderers ──
  function pizzaRow(p) {
    return `
      <div class="row">
        <img class="photo" src="images/${p.img}" alt="${p.name}">
        <div class="txt">
          <span class="pill">${p.name} <span class="size">(L)</span></span>
          <div class="desc">${p.desc}</div>
        </div>
        <div class="prices">
          <div class="p"><div class="lbl">Norm.</div><div class="val">${p.norm}</div></div>
          <div class="p"><div class="lbl">Perhe.</div><div class="val">${p.perhe}</div></div>
        </div>
      </div>`;
  }

  function priceline(name, price, unit) {
    return `<div class="priceline"><span>${name}</span><span class="dots"></span><span class="pr">${price}${unit || " €"}</span></div>`;
  }

  const main = document.querySelector("main");

  if (screen === 1 || screen === 2) {
    const slice = screen === 1 ? PIZZAS.slice(0, 5) : PIZZAS.slice(5, 10);
    main.className = "rows";
    main.innerHTML = slice.map(pizzaRow).join("");
  }

  if (screen === 3) {
    main.className = "cols";
    const col1 = `
      <div class="col">
        <h2>Kokoa oma pizzasi</h2>
        ${OMA_PIZZA.map(r => `
          <div class="priceline"><span>${r.name}</span><span class="dots"></span>
          <span class="pr">${r.norm} € · ${r.perhe} €</span></div>`).join("")}
        <div class="note">Hinnat: Norm. · Perhe.</div>
        ${priceline("Tuplaliha", MUUT[0].price)}
        <h2 class="mt">Sipit</h2>
        ${SIPIT.map(s => priceline(s.name, s.price)).join("")}
        <div class="note">${SIPIT_NOTE}</div>
      </div>`;

    const col2 = `
      <div class="col">
        <h2>Kebabit &amp; annokset</h2>
        ${ANNOKSET.map(a => priceline(a.name, a.price) + `<div class="subdesc">${a.desc}</div>`).join("")}
      </div>`;

    const fillHtml = Object.entries(TAYTTEET).map(([g, items]) =>
      `<div class="fillgroup"><h3>${g}</h3><p>${items.join(", ")}</p></div>`).join("");

    const col3 = `
      <div class="col">
        <h2>Burgerit</h2>
        ${BURGERIT.map(b => priceline(b.name, b.price) + `<div class="subdesc">${b.desc}</div>`).join("")}
        <h2 class="mt">Täytteet</h2>
        <div class="fillgroups">${fillHtml}</div>
      </div>`;

    main.innerHTML = col1 + col2 + col3;
  }
})();

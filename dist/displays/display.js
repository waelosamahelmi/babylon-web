/* RAVINTOLA BABYLON — shared display renderer */
(function () {
  const stage = document.getElementById("stage");
  const screen = Number(document.body.dataset.screen || 1);

  // ── Auto-scale the 1280×720 stage to fill the TV ──
  const portrait = stage.classList.contains("portrait");
  function fit() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = portrait
      ? `translate(-50%, -50%) rotate(-90deg) scale(${s})`
      : `translate(-50%, -50%) scale(${s})`;
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

  // ── Rotating pizza background (screens 1 & 2) ──
  function startBackground(order, cutout) {
    const bg = document.createElement("div");
    bg.className = "bg-pizzas";
    const cls = "bgp" + (cutout ? " cutout" : "");
    bg.innerHTML = `
      <img class="${cls} pos-a" alt="">
      <img class="${cls} pos-b" alt="">`;
    stage.prepend(bg);
    const imgs = bg.querySelectorAll(".bgp");
    let idx = [0, Math.floor(order.length / 2)];

    imgs.forEach((im, i) => { setSrc(im, order[idx[i]]); im.classList.add("show"); });

    function setSrc(im, name) {
      im.src = "images/" + name;
      im.classList.toggle("cutout", name.endsWith(".png"));
    }
    function cycle(i) {
      const im = imgs[i];
      im.classList.remove("show");
      setTimeout(() => {
        idx[i] = (idx[i] + 1) % order.length;
        setSrc(im, order[idx[i]]);
        im.onload = () => im.classList.add("show");
      }, 2100);
    }
    // stagger the two slots so one is always fully visible
    setInterval(() => cycle(0), 16000);
    setTimeout(() => setInterval(() => cycle(1), 16000), 8000);
  }

  const main = document.querySelector("main");

  // ── Screen 1: all ten pizzas ──
  if (screen === 1) {
    main.className = "grid10";
    main.innerHTML = PIZZAS.map(p => `
      <div class="item">
        <div class="line">
          <span class="pname"><span class="num">${p.num}.</span>${p.name} <span class="size">(L)</span></span>
          <span class="prices-inline">
            <span class="pl">Norm.</span><span class="pv">${p.norm}</span>
            <span class="pl">Perhe.</span><span class="pv">${p.perhe}</span>
          </span>
        </div>
        <div class="desc">${p.desc}</div>
      </div>`).join("");
    startBackground(PIZZAS.map(p => p.img));
  }

  // ── Screen 2: build your own pizza + toppings ──
  if (screen === 2) {
    main.className = "buildown";
    const pricing = OMA_PIZZA.map(r => `
      <div class="bigline">
        <span class="bname">${r.name}</span>
        <span class="bdots"></span>
        <span class="bprices"><span class="pl">Norm.</span><span class="pv">${r.norm} €</span>
        <span class="pl">Perhe.</span><span class="pv">${r.perhe} €</span></span>
      </div>`).join("");

    const fills = Object.entries(TAYTTEET).map(([g, items]) =>
      `<div class="fillgroup"><h3>${g}</h3><p>${items.join(", ")}</p></div>`).join("");

    main.innerHTML = `
      <section class="pricing">
        <h2>Hinnat</h2>
        ${pricing}
        <div class="bigline extra">
          <span class="bname">Tuplaliha</span><span class="bdots"></span>
          <span class="bprices"><span class="pv">${MUUT[0].price} €</span></span>
        </div>
      </section>
      <section class="fills">
        <h2>Täytteet</h2>
        <div class="fillgroups">${fills}</div>
      </section>`;
    startBackground(PIZZAS.map(p => p.img));
  }

  // ── Screen 3: rest of the menu, larger type ──
  if (screen === 3) {
    main.className = "cols2";
    const priceline = (item, unit) =>
      `<div class="priceline"><span class="iname">${item.num ? `<span class="num">${item.num}.</span>` : ""}${item.name}</span><span class="dots"></span><span class="pr">${item.price}${unit || " €"}</span></div>`;

    const col1 = `
      <div class="col">
        <h2>Kebabit &amp; annokset</h2>
        ${ANNOKSET.map(a => priceline(a) + `<div class="subdesc">${a.desc}</div>`).join("")}
      </div>`;

    const col2 = `
      <div class="col">
        <h2>Sipit</h2>
        ${SIPIT.map(s => priceline(s)).join("")}
        <div class="note">${SIPIT_NOTE}</div>
        <h2 class="mt">Burgerit</h2>
        ${BURGERIT.map(b => priceline(b) + `<div class="subdesc">${b.desc}</div>`).join("")}
      </div>`;

    main.innerHTML = col1 + col2;
    startBackground(["bg-burger.png", "bg-sipit.png", "bg-rulla.png", "bg-ranskalaiset.png"], true);
  }

  // ── Screen 4: portrait rotator cycling all three menus ──
  if (screen === 4) {
    const priceline = (item, unit) =>
      `<div class="priceline"><span class="iname">${item.num ? `<span class="num">${item.num}.</span>` : ""}${item.name}</span><span class="dots"></span><span class="pr">${item.price}${unit || " €"}</span></div>`;

    const viewPizzas = `
      <section class="view" data-title="PIZZAT">
        <h2 class="vtitle">Pizzat</h2>
        <div class="plist">
          ${PIZZAS.map(p => `
            <div class="p-item">
              <div class="p-name"><span class="num">${p.num}.</span>${p.name} <span class="size">(L)</span></div>
              <div class="p-sub">
                <span class="desc">${p.desc}</span>
                <span class="prices-inline">
                  <span class="pl">Norm.</span><span class="pv">${p.norm}</span>
                  <span class="pl">Perhe.</span><span class="pv">${p.perhe}</span>
                </span>
              </div>
            </div>`).join("")}
        </div>
      </section>`;

    const pricing = OMA_PIZZA.map(r => `
      <div class="bigline">
        <span class="bname">${r.name}</span>
        <span class="bdots"></span>
        <span class="bprices"><span class="pl">Norm.</span><span class="pv">${r.norm} €</span>
        <span class="pl">Perhe.</span><span class="pv">${r.perhe} €</span></span>
      </div>`).join("");
    const fills = Object.entries(TAYTTEET).map(([g, items]) =>
      `<div class="fillgroup"><h3>${g}</h3><p>${items.join(", ")}</p></div>`).join("");
    const viewBuild = `
      <section class="view" data-title="KOKOA OMA PIZZASI">
        <h2 class="vtitle">Kokoa oma pizzasi</h2>
        ${pricing}
        <div class="bigline extra">
          <span class="bname">Tuplaliha</span><span class="bdots"></span>
          <span class="bprices"><span class="pv">${MUUT[0].price} €</span></span>
        </div>
        <h2 class="mt">Täytteet</h2>
        <div class="fillgroups">${fills}</div>
      </section>`;

    const viewRest = `
      <section class="view" data-title="KEBABIT · ANNOKSET · BURGERIT">
        <h2 class="vtitle">Kebabit &amp; annokset</h2>
        ${ANNOKSET.map(a => priceline(a) + `<div class="subdesc">${a.desc}</div>`).join("")}
        <h2 class="mt">Sipit</h2>
        ${SIPIT.map(s => priceline(s)).join("")}
        <div class="note">${SIPIT_NOTE}</div>
        <h2 class="mt">Burgerit</h2>
        ${BURGERIT.map(b => priceline(b) + `<div class="subdesc">${b.desc}</div>`).join("")}
      </section>`;

    main.className = "rotator";
    main.innerHTML = viewPizzas + viewBuild + viewRest;

    const views = [...main.querySelectorAll(".view")];
    const title = document.getElementById("viewtitle");
    const numEl = document.getElementById("viewnum");
    let cur = 0;
    function show(i) {
      views.forEach((v, k) => v.classList.toggle("active", k === i));
      title.textContent = views[i].dataset.title;
      numEl.textContent = (i + 1) + " / 3";
    }
    show(0);
    setInterval(() => { cur = (cur + 1) % views.length; show(cur); }, 20000);

    startBackground(
      PIZZAS.map(p => p.img).concat(["bg-burger.png", "bg-sipit.png", "bg-rulla.png", "bg-ranskalaiset.png"]),
      false);
  }
})();

/* =========================================================
   Baykuş oyun altyapısı
   - BaykusSkor: sıralama tablosu (Supabase ya da cihaz)
   - BaykusOyun: süreli oyun kabuğu (puan, seri, süre, giriş/çıkış ekranı)
   ========================================================= */
(function(){
const A = window.BAYKUS_AYAR || {};
const URL_ = (A.supabaseUrl || "").trim().replace(/\/+$/, "");
const KEY = (A.supabaseKey || "").trim();
const UZAK = !!(URL_ && KEY);
const SEZON = String(A.sezon || "1");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kucuk = s => String(s).toLocaleLowerCase("tr");

const CSS = `
:root{--bk-bg:#0b1233;--bk-ink:#f3eedf;--bk-soft:rgba(243,238,223,.72);--bk-faint:rgba(243,238,223,.5);--bk-gold:#e7c063;--bk-line:rgba(231,192,99,.5);--bk-s2:rgba(255,255,255,.1);--bk-good:#30a46c;--bk-bad:#e5484d}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bk-bg:#eef1f8;--bk-ink:#141d45;--bk-soft:rgba(20,29,69,.75);--bk-faint:rgba(20,29,69,.5);--bk-gold:#9a6b12;--bk-line:rgba(154,107,18,.45);--bk-s2:rgba(20,29,69,.09);--bk-good:#218358;--bk-bad:#ce2c31}}
.bk-koyu{--bk-bg:#0b1233;--bk-ink:#f3eedf;--bk-soft:rgba(243,238,223,.72);--bk-faint:rgba(243,238,223,.5);--bk-gold:#e7c063;--bk-line:rgba(231,192,99,.5);--bk-s2:rgba(255,255,255,.1);--bk-good:#30a46c;--bk-bad:#e5484d;color-scheme:dark}
.bk-d{font:600 .95rem/1.2 "Figtree",-apple-system,"Segoe UI",Roboto,sans-serif;border:1.5px solid var(--bk-line);background:transparent;color:var(--bk-gold);border-radius:999px;padding:9px 18px;cursor:pointer;white-space:nowrap}
.bk-d:hover:not(:disabled){border-color:var(--bk-gold)}
.bk-d.ana{background:var(--bk-gold);border-color:var(--bk-gold);color:var(--bk-bg)}
.bk-d:disabled{opacity:.5;cursor:default}
.bk-ortu{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(2,4,14,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);user-select:text;-webkit-user-select:text}
.bk-panel{background:var(--bk-bg);color:var(--bk-ink);border:1.5px solid var(--bk-line);border-radius:22px;padding:26px 24px 22px;width:min(440px,100%);max-height:calc(100% - 20px);overflow:auto;font:400 17px/1.45 "Figtree",-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}
.bk-panel h2{font:700 2.3rem/1.05 "Cormorant Garamond",Georgia,serif;margin:0 0 6px}
.bk-alt{color:var(--bk-soft);margin:0 0 12px;font-size:.95rem}
.bk-nasil{margin:0 0 16px;padding-left:1.1em;color:var(--bk-soft)}
.bk-nasil li{margin-bottom:6px}
.bk-etiket{display:block;font-weight:600;font-size:.9rem;margin:14px 0 6px}
.bk-satir{display:flex;gap:8px}
.bk-girdi{flex:1;min-width:0;font:500 1rem "Figtree",sans-serif;color:var(--bk-ink);background:var(--bk-s2);border:1.5px solid var(--bk-line);border-radius:12px;padding:10px 12px}
.bk-girdi:focus{outline:2px solid var(--bk-gold);outline-offset:1px}
.bk-mesaj{min-height:1.3em;margin:6px 0 10px;font-size:.9rem;color:var(--bk-gold)}
.bk-liste{list-style:none;margin:0 0 4px;padding:0}
.bk-liste li{display:grid;grid-template-columns:2em 1fr auto;gap:10px;align-items:baseline;padding:8px 6px;border-bottom:1px solid var(--bk-s2);font-variant-numeric:tabular-nums}
.bk-liste li:nth-child(-n+3) .bk-sira{color:var(--bk-gold);font-weight:700}
.bk-liste .bk-sira{color:var(--bk-faint)}
.bk-liste .bk-ad{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-liste .bk-p{font-weight:700}
.bk-liste li.bk-ben{background:var(--bk-s2);border-radius:8px}
.bk-bos{color:var(--bk-faint);margin:4px 0 8px}
.bk-dugmeler{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.bk-yuzen{position:fixed;z-index:60;pointer-events:none;transform:translate(-50%,-50%);font:700 1.5rem "Figtree",sans-serif;color:var(--bk-good);animation:bkyuz .9s ease-out forwards;text-shadow:0 1px 6px rgba(0,0,0,.35)}
.bk-yuzen.kotu{color:var(--bk-bad)}
@keyframes bkyuz{from{opacity:1;margin-top:0}to{opacity:0;margin-top:-46px}}
@media (prefers-reduced-motion: reduce){.bk-yuzen{animation-duration:.01s}}`;
function cssEkle(){
  if(document.getElementById("bk-ortak-css")) return;
  const st = document.createElement("style"); st.id = "bk-ortak-css"; st.textContent = CSS; document.head.appendChild(st);
}
cssEkle();

/* ---------- kayıt ---------- */
const yerelK = o => `baykus-skor-${o}-${SEZON}`;
function yerelOku(o){ try{ return JSON.parse(localStorage.getItem(yerelK(o))) || []; }catch(e){ return []; } }
function yerelYaz(o, k){ const l = yerelOku(o); l.push(k); l.sort((a, b) => b.puan - a.puan); try{ localStorage.setItem(yerelK(o), JSON.stringify(l.slice(0, 60))); }catch(e){} }
function adOku(){ try{ return localStorage.getItem("baykus-ad") || ""; }catch(e){ return ""; } }
function adYaz(a){ try{ localStorage.setItem("baykus-ad", a); }catch(e){} }
function hdr(extra){ const h = Object.assign({apikey:KEY}, extra || {}); if(KEY.startsWith("eyJ")) h.Authorization = "Bearer " + KEY; return h; }

async function kaydet(oyun, ad, puan){
  ad = String(ad).trim().slice(0, 16); puan = Math.max(0, Math.round(puan));
  yerelYaz(oyun, {ad, puan, tarih:new Date().toISOString()});
  if(!UZAK) return;
  const r = await fetch(`${URL_}/rest/v1/skorlar`, {method:"POST", headers:hdr({"Content-Type":"application/json", Prefer:"return=minimal"}),
    body:JSON.stringify({oyun, ad, puan, sezon:SEZON})});
  if(!r.ok) throw new Error(`Skor gönderilemedi (hata ${r.status})`);
}
async function liste(oyun, n = 20){
  let rows;
  if(UZAK){
    const r = await fetch(`${URL_}/rest/v1/skorlar?select=ad,puan,tarih&oyun=eq.${encodeURIComponent(oyun)}&sezon=eq.${encodeURIComponent(SEZON)}&order=puan.desc,tarih.asc&limit=300`, {headers:hdr()});
    if(!r.ok) throw new Error(`Sıralama yüklenemedi (hata ${r.status})`);
    rows = await r.json();
  } else rows = yerelOku(oyun);
  const gor = new Set(), out = [];
  for(const x of rows){ const k = kucuk(x.ad); if(gor.has(k)) continue; gor.add(k); out.push(x); if(out.length >= n) break; }
  return out;
}
function listeHTML(rows, vurgu){
  if(!rows.length) return `<p class="bk-bos">Henüz skor yok. İlk sen ol!</p>`;
  const v = vurgu ? kucuk(vurgu) : null;
  return `<ol class="bk-liste">${rows.map((x, i) => `<li class="${v && kucuk(x.ad) === v ? "bk-ben" : ""}"><span class="bk-sira">${i + 1}</span><span class="bk-ad">${esc(x.ad)}</span><span class="bk-p">${Number(x.puan).toLocaleString("tr-TR")}</span></li>`).join("")}</ol>`;
}
async function listeyiDoldur(el, oyun, n, vurgu){
  el.innerHTML = `<p class="bk-bos">Yükleniyor…</p>`;
  try{ el.innerHTML = listeHTML(await liste(oyun, n), vurgu); }
  catch(e){ el.innerHTML = `<p class="bk-bos">${esc(e.message)}. İnternet bağlantını kontrol et.</p>`; }
}
const kapsam = () => UZAK ? `Sezon ${esc(SEZON)}, tüm oyuncular` : "Bu cihazdaki skorlar";

/* ---------- pencereler ---------- */
function ortu(html, koyu){
  const o = document.createElement("div");
  o.className = "bk-ortu" + (koyu ? " bk-koyu" : "");
  o.innerHTML = `<div class="bk-panel" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(o);
  return o;
}
function siralamaAc(oyun, baslik, koyu){
  const o = ortu(`<h2>Sıralama</h2><p class="bk-alt">${esc(baslik)}. ${kapsam()}</p><div class="bk-l"></div>
    <div class="bk-dugmeler"><button class="bk-d ana" data-k>Kapat</button></div>`, koyu);
  listeyiDoldur(o.querySelector(".bk-l"), oyun, 20);
  o.querySelector("[data-k]").onclick = () => o.remove();
  o.addEventListener("click", e => { if(e.target === o) o.remove(); });
}
function skorKaydetAc(oyun, baslik, puan, opt = {}){
  const o = ortu(`<h2>${Number(puan).toLocaleString("tr-TR")} puan</h2><p class="bk-alt">${esc(baslik)}</p>
    <label class="bk-etiket" for="bk-ad">Sıralamada görünecek adın</label>
    <div class="bk-satir"><input id="bk-ad" class="bk-girdi" maxlength="16" autocomplete="nickname" placeholder="Adın" value="${esc(adOku())}"><button class="bk-d ana" data-kaydet>Kaydet</button></div>
    <p class="bk-mesaj" aria-live="polite"></p>
    <p class="bk-alt">${kapsam()}</p><div class="bk-l"></div>
    <div class="bk-dugmeler">${opt.tekrar ? `<button class="bk-d ana" data-tekrar>Tekrar oyna</button>` : ""}<button class="bk-d" data-k>Kapat</button></div>`, opt.koyu);
  const inp = o.querySelector("#bk-ad"), msg = o.querySelector(".bk-mesaj"), btn = o.querySelector("[data-kaydet]"), l = o.querySelector(".bk-l");
  inp.addEventListener("keydown", e => { e.stopPropagation(); if(e.key === "Enter") btn.click(); });
  inp.addEventListener("keyup", e => e.stopPropagation());
  listeyiDoldur(l, oyun, 10);
  btn.onclick = async () => {
    const ad = inp.value.trim();
    if(!ad){ msg.textContent = "Önce bir ad yaz."; inp.focus(); return; }
    if(puan <= 0){ msg.textContent = "0 puan sıralamaya girmez. Bir daha dene!"; return; }
    btn.disabled = true; msg.textContent = "Kaydediliyor…";
    try{ adYaz(ad); await kaydet(oyun, ad, puan); msg.textContent = "Kaydedildi."; inp.disabled = true; btn.textContent = "Kaydedildi"; listeyiDoldur(l, oyun, 10, ad); }
    catch(e){ msg.textContent = e.message; btn.disabled = false; }
  };
  o.querySelector("[data-k]").onclick = () => o.remove();
  const t = o.querySelector("[data-tekrar]"); if(t) t.onclick = () => { o.remove(); opt.tekrar(); };
  return o;
}
window.BaykusSkor = {kaydet, liste, listeHTML, listeyiDoldur, siralamaAc, skorKaydetAc, kapsam, UZAK, SEZON};

/* ---------- süreli oyun kabuğu ---------- */
window.BaykusOyun = function(cfg){
  const SURE = cfg.sure || 60;
  document.body.insertAdjacentHTML("afterbegin", `
    <header class="bk-ust"><a class="bk-geri" href="./">‹ Oyunlar</a><h1 class="bk-baslik">${esc(cfg.ad)}</h1><button class="bk-d" id="bk-sira">Sıralama</button></header>
    <div class="bk-hud"><div><span class="bk-puan" id="bk-puan">0</span> <span class="bk-etk">puan</span></div><div class="bk-seri" id="bk-seri"></div><div class="bk-kalan" id="bk-kalan">${SURE} sn</div></div>
    <div class="bk-sure" id="bk-sure"><span></span></div>
    <main class="bk-sahne" id="bk-sahne"></main>`);
  const $ = id => document.getElementById(id);
  let puan = 0, kalan = SURE, calisiyor = false, son = 0, raf = 0;
  function yuzen(t, el, iyi){
    const r = (el || $("bk-sahne")).getBoundingClientRect(), d = document.createElement("div");
    d.className = "bk-yuzen" + (iyi ? "" : " kotu"); d.textContent = t;
    d.style.left = (r.left + r.width/2) + "px"; d.style.top = (r.top + r.height/2) + "px";
    document.body.appendChild(d); setTimeout(() => d.remove(), 950);
  }
  const api = {
    sahne: $("bk-sahne"),
    get calisiyor(){ return calisiyor; },
    get puan(){ return puan; },
    puanEkle(n, el){ puan = Math.max(0, puan + n); $("bk-puan").textContent = puan; if(n) yuzen((n > 0 ? "+" : "") + n, el, n > 0); },
    seri(v){ $("bk-seri").textContent = v >= 2 ? `Seri ×${v}` : ""; },
    sureEkle(s, el){ kalan = Math.min(SURE, kalan + s); yuzen(`+${s} sn`, el, true); guncelle(); },
    sars(el){ el.classList.remove("bk-sars"); void el.offsetWidth; el.classList.add("bk-sars"); },
    bitir
  };
  function guncelle(){
    $("bk-sure").firstElementChild.style.transform = `scaleX(${Math.max(0, kalan/SURE)})`;
    $("bk-sure").classList.toggle("az", kalan < 10);
    $("bk-kalan").textContent = Math.ceil(kalan) + " sn";
  }
  function dongu(t){
    if(!calisiyor) return;
    kalan -= Math.min(.1, (t - son)/1000); son = t;
    if(kalan <= 0){ kalan = 0; guncelle(); bitir(); return; }
    guncelle(); raf = requestAnimationFrame(dongu);
  }
  function basla(){
    puan = 0; kalan = SURE; $("bk-puan").textContent = 0; api.seri(0); guncelle();
    calisiyor = true; $("bk-sira").disabled = true;
    cfg.basla(api);
    son = performance.now(); raf = requestAnimationFrame(dongu);
  }
  function bitir(){
    if(!calisiyor) return;
    calisiyor = false; cancelAnimationFrame(raf); $("bk-sira").disabled = false;
    if(cfg.bitti) cfg.bitti(api);
    setTimeout(() => skorKaydetAc(cfg.id, cfg.ad, puan, {tekrar:basla}), 400);
  }
  function giris(){
    const o = ortu(`<h2>${esc(cfg.ad)}</h2><p class="bk-alt">${esc(cfg.aciklama)}</p>
      <ul class="bk-nasil">${cfg.nasil.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <p class="bk-alt">En iyiler (${kapsam()})</p><div class="bk-l"></div>
      <div class="bk-dugmeler"><button class="bk-d ana" data-basla>Başla</button></div>`);
    listeyiDoldur(o.querySelector(".bk-l"), cfg.id, 3);
    o.querySelector("[data-basla]").onclick = () => { o.remove(); basla(); };
  }
  $("bk-sira").onclick = () => siralamaAc(cfg.id, cfg.ad);
  guncelle();
  if(cfg.kur) cfg.kur(api);
  giris();
  return api;
};
window.karistir = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
})();

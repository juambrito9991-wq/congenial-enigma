const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ROOT = __dirname;
const CSV_PATH = path.join(ROOT, "supabase", "seed_padron_provincial.csv");
const CONSULTAS_PATH = path.join(ROOT, "supabase", "consultas_demo.json");
const PORT = Number(process.env.PORT || 4173);

const CANDIDATES = ["Luzmila Abad", "Melina Barahona", "Liliana Taish", "Piedad Wampash", "Angelina Chumpi"];

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-zÑñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function loadPadron() {
  const raw = fs.readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map((line) => {
    const [cedula, nombres, canton, parroquia, sexo, fuente] = parseCsvLine(line);
    return { cedula, nombres, canton, parroquia, sexo, fuente, normalized: normalizeName(nombres) };
  });
}

function loadConsultas() {
  if (!fs.existsSync(CONSULTAS_PATH)) return [];
  return JSON.parse(fs.readFileSync(CONSULTAS_PATH, "utf8"));
}

function saveConsultas(rows) {
  fs.writeFileSync(CONSULTAS_PATH, JSON.stringify(rows, null, 2), "utf8");
}

const padron = loadPadron();

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function isPhone(value) {
  return /^(?:\+593|593|0)9\d{8}$/.test(String(value || "").replace(/\s|-/g, ""));
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("593")) return `+${digits}`;
  if (digits.startsWith("09")) return `+593${digits.slice(1)}`;
  return value;
}

function pageHtml() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Padrón Primarias Pachakutik</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: linear-gradient(180deg,#fff9df,#f7f4ea 45%,#eef7ef); color: #1d2b1f; }
    main { max-width: 760px; min-height: 100vh; margin: auto; padding: 18px; }
    .hero, .panel, .card { background: white; border-radius: 8px; box-shadow: 0 14px 40px rgba(31,122,61,.14); }
    .hero { border: 4px solid #1f7a3d; padding: 18px; display: flex; gap: 14px; align-items: center; }
    .logo { width: 58px; height: 58px; border-radius: 50%; background:#1f7a3d; color:white; display:grid; place-items:center; font-size:26px; font-weight:900; }
    h1 { margin: 0; color:#6d4c1f; font-size: clamp(25px, 7vw, 38px); line-height: 1.05; }
    .eyebrow { margin: 0 0 4px; color:#b34d21; font-weight:900; text-transform: uppercase; font-size: 13px; }
    .panel { margin-top: 18px; padding: 18px; }
    .tabs { display:grid; grid-template-columns:1fr 1fr; gap: 8px; background:#eef7ef; padding:6px; border-radius:8px; }
    button, input, select { font: inherit; }
    button { cursor:pointer; border:0; }
    .tab, .primary { min-height:58px; border-radius:7px; font-weight:900; font-size:18px; }
    .tab { color:#1f7a3d; background: transparent; }
    .tab.active { background:#1f7a3d; color:white; }
    label { display:block; margin-top:18px; font-weight:900; color:#6d4c1f; font-size:18px; }
    input, select { width:100%; height:60px; border:2px solid rgba(31,122,61,.28); border-radius:8px; padding:0 14px; font-size:19px; font-weight:800; margin-top:8px; }
    .primary { width:100%; margin-top:18px; background:#f2b705; color:#6d4c1f; }
    .green { background:#1f7a3d; color:white; }
    .message { margin-top:16px; padding:14px; border-radius:8px; font-weight:900; font-size:17px; }
    .ok { background:#ecfdf3; color:#1f7a3d; }
    .bad { background:#fff1f2; color:#be123c; }
    .result { margin-top:10px; width:100%; background:white; border:2px solid rgba(31,122,61,.25); border-radius:8px; padding:14px; text-align:left; }
    .result strong { display:block; color:#6d4c1f; font-size:17px; }
    .place { margin-top:14px; border:2px solid rgba(31,122,61,.22); border-radius:8px; background:white; padding:14px; }
    .place b { display:block; color:#6d4c1f; font-size:18px; }
    .place span { display:block; color:#1f7a3d; font-size:20px; font-weight:900; margin-top:6px; }
    .radio { display:flex; gap:12px; align-items:center; border:2px solid rgba(31,122,61,.25); padding:12px; border-radius:8px; margin-top:9px; font-weight:900; }
    .radio input { width:24px; height:24px; margin:0; accent-color:#1f7a3d; }
    .muted { color:#55715b; font-weight:700; }
    .admin { max-width: 1180px; }
    .grid { display:grid; gap:14px; grid-template-columns: repeat(auto-fit,minmax(190px,1fr)); }
    .metric { padding:16px; }
    .metric b { color:#1f7a3d; font-size:38px; display:block; margin-top:8px; }
    table { width:100%; border-collapse: collapse; min-width:760px; }
    th { background:#1f7a3d; color:white; text-align:left; }
    th, td { padding:10px; border-bottom:1px solid #dfe9df; font-size:14px; }
    .wide { overflow:auto; }
    a { color:#1f7a3d; font-weight:900; }
  </style>
</head>
<body>
<main id="public">
  <section class="hero"><div class="logo">18</div><div><p class="eyebrow">Primarias Pachakutik</p><h1>Consulta del padrón electoral</h1><p class="muted">${padron.length.toLocaleString("es-EC")} registros provinciales cargados</p></div></section>
  <section class="panel" id="app"></section>
</main>
<main id="admin" class="admin" style="display:none"></main>
<script>
const CANDIDATES = ${JSON.stringify(CANDIDATES)};
let mode = "cedula";
let selected = null;
const app = document.getElementById("app");
function renderSearch(message = "", results = [], ok = false) {
  app.innerHTML = \`
    <div class="tabs">
      <button class="tab \${mode === "cedula" ? "active" : ""}" onclick="mode='cedula';renderSearch()">Por cédula</button>
      <button class="tab \${mode === "nombres" ? "active" : ""}" onclick="mode='nombres';renderSearch()">Por nombres</button>
    </div>
    <form onsubmit="search(event)">
      <label>\${mode === "cedula" ? "Número de cédula" : "Nombres y apellidos"}
        <input id="q" required maxlength="\${mode === "cedula" ? "10" : "80"}" inputmode="\${mode === "cedula" ? "numeric" : "text"}" placeholder="\${mode === "cedula" ? "Ej. 1400000000" : "Ej. MARÍA PÉREZ"}" />
      </label>
      <button class="primary">Buscar</button>
    </form>
    \${message ? \`<div class="message \${ok ? "ok" : "bad"}">\${message}</div>\` : ""}
    \${results.map((r, i) => \`<button class="result" onclick="selectResult(\${i})"><strong>\${r.nombres}</strong><span>\${r.cedula} · \${r.canton} · \${r.parroquia}</span></button>\`).join("")}
  \`;
  window.lastResults = results;
}
async function search(ev) {
  ev.preventDefault();
  const value = document.getElementById("q").value;
  const res = await fetch("/api/search", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ [mode]: value }) });
  const data = await res.json();
  if (!data.found) return renderSearch(data.message, [], false);
  if (data.results.length === 1) return selectResultDirect(data.results[0]);
  renderSearch(data.message, data.results, true);
}
function selectResult(i) { selectResultDirect(window.lastResults[i]); }
function selectResultDirect(r) { selected = r; renderRegister(); }
function renderRegister(msg = "", ok = false) {
  app.innerHTML = \`
    <button class="result" onclick="selected=null;renderSearch()">← Volver</button>
    <div class="message ok"><strong>\${selected.nombres}</strong><br>\${selected.cedula}<br><br>Usted consta en el padrón electoral y está habilitado para participar en las elecciones primarias de Pachakutik.<div class="place"><b>Lugar de sufragio</b><span>Cantón: \${selected.canton || 'No especificado'}</span><span>Parroquia: \${selected.parroquia || 'No especificada'}</span><p>Acuda a sufragar en el recinto correspondiente a esta parroquia y cantón.</p></div></div>
    <form onsubmit="registerVote(event)">
      <label>Número telefónico celular
        <input id="phone" required inputmode="tel" placeholder="Ej. 0991234567" />
      </label>
      <label>¿Por cuál candidata tiene intención de votar en las elecciones primarias de Pachakutik?</label>
      \${CANDIDATES.map(c => \`<label class="radio"><input name="candidate" value="\${c}" required type="radio" /> \${c}</label>\`).join("")}
      <button class="primary green">Guardar respuesta</button>
    </form>
    \${msg ? \`<div class="message \${ok ? "ok" : "bad"}">\${msg}</div>\` : ""}
  \`;
}
async function registerVote(ev) {
  ev.preventDefault();
  const candidate = document.querySelector("input[name=candidate]:checked")?.value;
  const res = await fetch("/api/register", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ ...selected, telefono: document.getElementById("phone").value, candidata_seleccionada: candidate }) });
  const data = await res.json();
  renderRegister(res.ok ? "Registro guardado correctamente." : data.error, res.ok);
}
async function renderAdmin() {
  document.getElementById("public").style.display = "none";
  const admin = document.getElementById("admin");
  admin.style.display = "block";
  const res = await fetch("/api/admin");
  const data = await res.json();
  admin.innerHTML = \`
    <h1>Panel administrativo Pachakutik</h1><p><a href="/">Volver a consulta</a></p>
    <div class="grid">
      <div class="card metric">Personas consultadas <b>\${data.total}</b></div>
      <div class="card metric">Teléfonos registrados <b>\${data.telefonos}</b></div>
      <div class="card metric">Padrón cargado <b>${padron.length.toLocaleString("es-EC")}</b></div>
    </div>
    <section class="panel"><h2>Intención de voto</h2>\${data.votos.map(v => \`<p><strong>\${v.name}</strong>: \${v.total} (\${v.percentage}%)</p><div style="height:18px;background:#eef7ef;border-radius:5px"><div style="height:18px;width:\${v.percentage}%;background:#1f7a3d;border-radius:5px"></div></div>\`).join("")}</section>
    <section class="panel wide"><h2>Consultas registradas</h2><table><thead><tr><th>Cédula</th><th>Nombres</th><th>Teléfono</th><th>Candidata</th><th>Fecha</th></tr></thead><tbody>\${data.consultas.map(r => \`<tr><td>\${r.cedula}</td><td>\${r.nombres}</td><td>\${r.telefono}</td><td>\${r.candidata_seleccionada}</td><td>\${new Date(r.fecha_hora).toLocaleString("es-EC")}</td></tr>\`).join("")}</tbody></table></section>
  \`;
}
if (location.pathname === "/admin") renderAdmin(); else renderSearch();
</script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === "GET" && (parsed.pathname === "/" || parsed.pathname === "/admin")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(pageHtml());
    return;
  }

  if (req.method === "POST" && parsed.pathname === "/api/search") {
    const body = await readBody(req);
    const cedula = String(body.cedula || "").replace(/\D/g, "");
    const nombres = normalizeName(body.nombres || "");
    const results = cedula
      ? padron.filter((row) => row.cedula === cedula).slice(0, 10)
      : padron.filter((row) => row.normalized.includes(nombres)).slice(0, 10);
    sendJson(res, {
      found: results.length > 0,
      results,
      message: results.length
        ? "Usted consta en el padrón electoral y está habilitado para participar en las elecciones primarias de Pachakutik."
        : "No se encontró información en el padrón electoral.",
    });
    return;
  }

  if (req.method === "POST" && parsed.pathname === "/api/register") {
    const body = await readBody(req);
    if (!isPhone(body.telefono)) return sendJson(res, { error: "Ingrese un celular ecuatoriano válido." }, 400);
    if (!CANDIDATES.includes(body.candidata_seleccionada)) return sendJson(res, { error: "Seleccione una candidata." }, 400);
    const consultas = loadConsultas().filter((row) => row.cedula !== body.cedula);
    consultas.push({
      cedula: body.cedula,
      nombres: body.nombres,
      telefono: normalizePhone(body.telefono),
      candidata_seleccionada: body.candidata_seleccionada,
      fecha_hora: new Date().toISOString(),
      ip: req.socket.remoteAddress,
      dispositivo: req.headers["user-agent"] || "",
    });
    saveConsultas(consultas);
    sendJson(res, { ok: true });
    return;
  }

  if (req.method === "GET" && parsed.pathname === "/api/admin") {
    const consultas = loadConsultas();
    const votos = CANDIDATES.map((name) => {
      const total = consultas.filter((row) => row.candidata_seleccionada === name).length;
      return { name, total, percentage: consultas.length ? Number(((total / consultas.length) * 100).toFixed(2)) : 0 };
    });
    sendJson(res, { total: consultas.length, telefonos: consultas.filter((row) => row.telefono).length, votos, consultas });
    return;
  }

  sendJson(res, { error: "No encontrado" }, 404);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Vista previa lista en http://127.0.0.1:${PORT}`);
});

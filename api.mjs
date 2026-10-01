// Backend del Inventario Arsan Motors — Netlify Function + Netlify Blobs
// Rutas (todas requieren el encabezado x-pin = variable de entorno INVENTARIO_PIN):
//   GET    /api/ping               -> valida el PIN
//   GET    /api/items              -> todas las piezas
//   POST   /api/items              -> alta (asigna folio ARS-CAT-####)
//   PUT    /api/items/:folio       -> edición
//   DELETE /api/items/:folio       -> baja del registro
//   GET    /api/foto/:folio        -> foto de la pieza
//   POST   /api/etiquetas          -> marca folios como etiquetados
//   GET    /api/export             -> respaldo JSON completo (incluye fotos no)
import { getStore } from "@netlify/blobs";

const CATS = ["MAN", "DAD", "ELE", "NEU", "MED", "DIA", "TRA", "LEV", "LIM", "OFI"];
const FIELDS = ["cat", "nombre", "tipo", "piezas", "faltan", "marca", "modelo", "encastre", "sistema", "medida",
  "cantidad", "serie", "sucursal", "ubicacion", "estado", "clase", "responsable", "notas", "capturo"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const store = () => getStore({ name: "inventario", consistency: "strong" });

function clean(input) {
  const o = {};
  for (const f of FIELDS) {
    let v = input?.[f];
    if (v === undefined || v === null) v = "";
    if (typeof v === "string") v = v.slice(0, 500);
    else if (typeof v !== "number") v = String(v).slice(0, 500);
    o[f] = v;
  }
  o.cantidad = Math.max(1, parseInt(o.cantidad, 10) || 1);
  return o;
}
const numOf = (f) => parseInt((/(\d+)$/.exec(f || "") || [0, 0])[1], 10);

// Lee el documento de una categoría con su etag
async function readCat(s, cat) {
  const r = await s.getWithMetadata(`cat/${cat}`, { type: "json" });
  return r ? { doc: r.data || { items: {} }, etag: r.etag } : { doc: { items: {} }, etag: null };
}
// Aplica un cambio a la categoría con escritura condicional (evita que dos capturas se pisen)
async function mutateCat(s, cat, fn) {
  for (let i = 0; i < 12; i++) {
    const { doc, etag } = await readCat(s, cat);
    const out = fn(doc);
    if (out === null) return null;
    const opts = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
    const w = await s.setJSON(`cat/${cat}`, doc, opts);
    if (w.modified) return out;
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 220));
  }
  throw new Error("Mucha actividad al mismo tiempo. Intenta de nuevo.");
}
const catOf = (folio) => (/^ARS-([A-Z]{3})-\d+$/.exec(folio) || [])[1];

export default async (req) => {
  const PIN = Netlify.env.get("INVENTARIO_PIN");
  if (!PIN) return json({ error: "Falta configurar la variable INVENTARIO_PIN en Netlify." }, 500);
  if ((req.headers.get("x-pin") || "") !== PIN) return json({ error: "PIN incorrecto" }, 401);

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [route, id] = parts;
  const s = store();

  try {
    if (route === "ping") return json({ ok: true });

    if (route === "items" && req.method === "GET" && !id) {
      const docs = await Promise.all(CATS.map((c) => readCat(s, c)));
      const items = docs.flatMap((d) => Object.values(d.doc.items || {}));
      return json({ items, ts: Date.now() });
    }

    if (route === "items" && req.method === "POST" && !id) {
      const body = await req.json();
      const item = clean(body.item);
      if (!CATS.includes(item.cat)) return json({ error: "Categoría inválida" }, 400);
      if (!item.nombre) return json({ error: "Falta el nombre" }, 400);
      const now = new Date().toISOString();
      const saved = await mutateCat(s, item.cat, (doc) => {
        doc.items = doc.items || {};
        const n = Math.max(0, ...Object.keys(doc.items).map(numOf), doc.last || 0) + 1;
        doc.last = n;
        const folio = `ARS-${item.cat}-${String(n).padStart(4, "0")}`;
        doc.items[folio] = { ...item, folio, foto: !!body.foto, etiqueta: false, creado: now, actualizado: now };
        return doc.items[folio];
      });
      if (body.foto) await s.set(`foto/${saved.folio}`, String(body.foto).slice(0, 600000));
      return json({ item: saved });
    }

    if (route === "items" && id && (req.method === "PUT" || req.method === "DELETE")) {
      const cat = catOf(id);
      if (!cat || !CATS.includes(cat)) return json({ error: "Folio inválido" }, 400);
      if (req.method === "DELETE") {
        await mutateCat(s, cat, (doc) => { delete doc.items[id]; return true; });
        await s.delete(`foto/${id}`);
        return json({ ok: true });
      }
      const body = await req.json();
      const upd = clean(body.item);
      const hasFoto = body.foto !== undefined;
      const saved = await mutateCat(s, cat, (doc) => {
        const prev = doc.items?.[id];
        if (!prev) return null;
        upd.cat = cat; // la categoría no cambia el folio
        upd.capturo = prev.capturo || upd.capturo;
        doc.items[id] = { ...prev, ...upd, editadoPor: body.item?.capturo || "", foto: hasFoto ? !!body.foto : prev.foto, actualizado: new Date().toISOString() };
        return doc.items[id];
      });
      if (!saved) return json({ error: "Ese folio ya no existe" }, 404);
      if (hasFoto) body.foto ? await s.set(`foto/${id}`, String(body.foto).slice(0, 600000)) : await s.delete(`foto/${id}`);
      return json({ item: saved });
    }

    if (route === "foto" && id && req.method === "GET") {
      const img = await s.get(`foto/${id}`, { type: "text" });
      return json({ img: img || null });
    }

    if (route === "etiquetas" && req.method === "POST") {
      const { folios = [] } = await req.json();
      const byCat = {};
      for (const f of folios) { const c = catOf(f); if (c) (byCat[c] ||= []).push(f); }
      let n = 0;
      for (const [c, list] of Object.entries(byCat)) {
        n += await mutateCat(s, c, (doc) => { let k = 0; for (const f of list) if (doc.items?.[f] && !doc.items[f].etiqueta) { doc.items[f].etiqueta = true; k++; } return k; });
      }
      return json({ n });
    }

    if (route === "export" && req.method === "GET") {
      const docs = await Promise.all(CATS.map((c) => readCat(s, c)));
      return json({ exportado: new Date().toISOString(), items: docs.flatMap((d) => Object.values(d.doc.items || {})) });
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (e) {
    return json({ error: e.message || "Error del servidor" }, 500);
  }
};

export const config = { path: "/api/*" };

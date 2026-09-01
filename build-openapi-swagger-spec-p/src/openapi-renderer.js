===
import React, { useState, useEffect, useCallback } from "react";

const METHOD_COLORS = {
  get: "#61affe", post: "#49cc90", put: "#fca130",
  patch: "#50e3c2", delete: "#f93e3e", head: "#9012fe", options: "#9012fe",
};

function resolveRef(spec, ref) {
  if (!ref || !ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/");
  let node = spec;
  for (const p of parts) { node = node?.[p]; }
  return node || null;
}

function resolveSchema(spec, schema) {
  if (!schema) return null;
  if (schema.$ref) return resolveSchema(spec, resolveRef(spec, schema.$ref));
  if (schema.allOf) {
    return schema.allOf.reduce((acc, s) => ({ ...acc, ...resolveSchema(spec, s) }), {});
  }
  if (schema.oneOf || schema.anyOf) {
    const variant = (schema.oneOf || schema.anyOf)[0];
    return { ...resolveSchema(spec, variant), _oneOf: true };
  }
  return schema;
}

function schemaToExample(spec, schema) {
  const s = resolveSchema(spec, schema);
  if (!s) return null;
  if (s.example !== undefined) return s.example;
  if (s.type === "object" && s.properties) {
    const obj = {};
    for (const [k, v] of Object.entries(s.properties)) {
      obj[k] = schemaToExample(spec, v);
    }
    return obj;
  }
  if (s.type === "array" && s.items) return [schemaToExample(spec, s.items)];
  if (s.default !== undefined) return s.default;
  if (s.enum) return s.enum[0];
  if (s.type === "string") return "string";
  if (s.type === "integer" || s.type === "number") return 0;
  if (s.type === "boolean") return true;
  return null;
}

function ParamTable({ params, spec }) {
  if (!params?.length) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 16 }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
          <th style={{ padding: 8 }}>Name</th><th style={{ padding: 8 }}>In</th>
          <th style={{ padding: 8 }}>Required</th><th style={{ padding: 8 }}>Type</th>
          <th style={{ padding: 8 }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {params.map((p, i) => {
          const resolved = p.schema ? resolveSchema(spec, p.schema) : null;
          return (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8, fontFamily: "monospace" }}>{p.name}</td>
              <td style={{ padding: 8 }}>{p.in}</td>
              <td style={{ padding: 8 }}>{p.required ? "✔" : ""}</td>
              <td style={{ padding: 8 }}>{resolved?.type || p.type || "—"}</td>
              <td style={{ padding: 8 }}>{p.description || ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ExampleBlock({ label, data }) {
  if (data === null || data === undefined) return null;
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#666" }}>{label}</div>
      <pre style={{ background: "#1e1e2e", color: "#cdd6f4", padding: 12, borderRadius: 6, overflowX: "auto", fontSize: 13, margin: 0 }}>{text}</pre>
    </div>
  );
}

function TryIt({ method, path, serverUrl, params, bodySchema, spec }) {
  const [url, setUrl] = useState(serverUrl + path);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let filled = path;
    (params || []).forEach(p => {
      if (p.in === "path" && p.example !== undefined) {
        filled = filled.replace(`{${p.name}}`, p.example);
      }
    });
    setUrl(serverUrl + filled);
  }, [serverUrl, path, params]);

  const send = useCallback(async () => {
    setLoading(true);
    try {
      const opts = { method: method.toUpperCase(), headers: { "Content-Type": "application/json" } };
      if (body && method !== "get" && method !== "head") opts.body = body;
      const res = await fetch(url, opts);
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("json") ? await res.json() : await res.text();
      setResponse({ status: res.status, body: data });
    } catch (e) {
      setResponse({ status: 0, body: { error: e.message } });
    }
    setLoading(false);
  }, [url, method, body]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1, padding: 8, fontSize: 13, fontFamily: "monospace", border: "1px solid #ccc", borderRadius: 4 }} />
        <button onClick={send} disabled={loading} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>{loading ? "…" : "Send"}</button>
      </div>
      {bodySchema && method !== "get" && method !== "head" && (
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Request body JSON" rows={4} style={{ width: "100%", padding: 8, fontSize: 13, fontFamily: "monospace", border: "1px solid #ccc", borderRadius: 4, marginBottom: 8, boxSizing: "border-box" }} />
      )}
      {response && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Response — {response.status}</div>
          <pre style={{ background: "#1e1e2e", color: response.status < 400 ? "#a6e3a1" : "#f38ba8", padding: 12, borderRadius: 6, overflowX: "auto", fontSize: 13, margin: 0 }}>{typeof response.body === "string" ? response.body : JSON.stringify(response.body, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function Endpoint({ method, path, operation, spec, serverUrl }) {
  const [expanded, setExpanded] = useState(false);
  const color = METHOD_COLORS[method] || "#999";
  const params = operation.parameters || [];
  const bodyContent = operation.requestBody?.content;
  const bodySchema = bodyContent?.["application/json"]?.schema
    ? resolveSchema(spec, bodyContent["application/json"].schema) : null;
  const bodyExample = bodySchema ? schemaToExample(spec, bodyContent["application/json"].schema) : null;

  const responses = operation.responses || {};
  const resp200 = responses["200"] || responses["201"] || responses["2XX"];
  const respSchema = resp200?.content?.["application/json"]?.schema;
  const respExample = respSchema ? schemaToExample(spec, respSchema) : null;

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, marginBottom: 12 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", userSelect: "none" }}>
        <span style={{ background: color, color: "#fff", padding: "3px 10px", borderRadius: 3, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", minWidth: 64, textAlign: "center" }}>{method}</span>
        <span style={{ fontFamily: "monospace", fontSize: 14, color: "#333" }}>{path}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>{operation.summary || ""}</span>
        <span style={{ fontSize: 18, transition: "transform .15s", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #e0e0e0" }}>
          {operation.description && <p style={{ color: "#555", margin: "10px 0" }}>{operation.description}</p>}
          {params.length > 0 && <><h4 style={{ margin: "12px 0 4px", fontSize: 14 }}>Parameters</h4><ParamTable params={params} spec={spec} /></>}
          {bodySchema && <><h4 style={{ margin: "12px 0 4px", fontSize: 14 }}>Request Body</h4><ExampleBlock label="application/json" data={bodyExample} /></>}
          {respExample !== null && <><h4 style={{ margin: "12px 0 4px", fontSize: 14 }}>Response Example</h4><ExampleBlock label="200 OK" data={respExample} /></>}
          <h4 style={{ margin: "12px 0 4px", fontSize: 14 }}>Try it out</h4>
          <TryIt method={method} path={path} serverUrl={serverUrl} params={params} bodySchema={bodySchema} spec={spec} />
        </div>
      )}
    </div>
  );
}

function TagGroup({ tag, paths, spec, serverUrl }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ borderBottom: "2px solid #eee", paddingBottom: 6, marginBottom: 12 }}>{tag}</h3>
      {paths.map(({ method, path, operation }) => (
        <Endpoint key={`${method} ${path}`} method={method} path={path} operation={operation} spec={spec} serverUrl={serverUrl} />
      ))}
    </div>
  );
}

export default function OpenApiRenderer({ spec }) {
  const serverUrl = spec?.servers?.[0]?.url || "http://localhost:8080";
  const grouped = {};
  const paths = spec?.paths || {};
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!METHOD_COLORS[method]) continue;
      const tags = operation.tags?.length ? operation.tags : ["default"];
      for (const tag of tags) {
        (grouped[tag] = grouped[tag] || []).push({ method, path, operation });
      }
    }
  }
  const tagOrder = spec?.tags?.map(t => t.name).filter(t => grouped[t]) || [];
  for (const t of Object.keys(grouped)) { if (!tagOrder.includes(t)) tagOrder.push(t); }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 960, margin: "0 auto" }}>
      {spec?.info && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>{spec.info.title || "API Reference"}</h2>
          {spec.info.version && <span style={{ color: "#888", fontSize: 14 }}>v{spec.info.version}</span>}
          {spec.info.description && <p style={{ color: "#555", margin: "8px 0" }}>{spec.info.description}</p>}
          <div style={{ fontSize: 12, color: "#999", background: "#f5f5f5", padding: 6, borderRadius: 4, fontFamily: "monospace" }}>Base URL: {serverUrl}</div>
        </div>
      )}
      {tagOrder.map(tag => (
        <TagGroup key={tag} tag={tag} paths={grouped[tag]} spec={spec} serverUrl={serverUrl} />
      ))}
    </div>
  );
}
===
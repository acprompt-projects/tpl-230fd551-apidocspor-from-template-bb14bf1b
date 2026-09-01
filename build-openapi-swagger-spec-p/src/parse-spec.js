===
function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

function resolveComponentRefs(obj, spec, visited = new Set()) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(item => resolveComponentRefs(item, spec, visited));
  if (obj.$ref) {
    const path = obj.$ref;
    if (visited.has(path)) return { $ref: path, _circular: true };
    visited.add(path);
    const parts = path.replace(/^#\//, "").split("/");
    let node = spec;
    for (const p of parts) { node = node?.[p]; }
    if (!node) return { $ref: path, _unresolved: true };
    return resolveComponentRefs(node, spec, visited);
  }
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = resolveComponentRefs(v, spec, visited);
  }
  return result;
}

export async function parseSpec(input) {
  let raw;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      raw = JSON.parse(trimmed);
    } else {
      const { default: YAML } = await import("yamljs");
      raw = YAML.parse(trimmed);
    }
  } else if (typeof input === "object") {
    raw = input;
  } else {
    throw new Error("parseSpec: input must be a YAML/JSON string or spec object");
  }

  if (!raw.openapi || !raw.openapi.startsWith("3")) {
    throw new Error(`parseSpec: unsupported OpenAPI version "${raw.openapi}" — only 3.x is supported`);
  }

  if (raw.components?.schemas) {
    const resolved = resolveComponentRefs(raw, raw);
    Object.assign(raw, resolved);
  }

  const spec = {
    openapi: raw.openapi,
    info: raw.info || { title: "Untitled API", version: "0.0.0" },
    servers: raw.servers || [{ url: "http://localhost" }],
    tags: raw.tags || [],
    paths: {},
    components: raw.components || {},
  };

  for (const [path, methods] of Object.entries(raw.paths || {})) {
    spec.paths[path] = {};
    for (const [method, operation] of Object.entries(methods)) {
      if (["get","post","put","patch","delete","head","options"].includes(method)) {
        spec.paths[path][method] = { ...operation };
        if (operation.parameters) {
          spec.paths[path][method].parameters = operation.parameters.map(p =>
            p.$ref ? resolveComponentRefs(p, raw) : p
          );
        }
        if (operation.requestBody?.$ref) {
          spec.paths[path][method].requestBody = resolveComponentRefs(operation.requestBody, raw);
        } else if (operation.requestBody) {
          spec.paths[path][method].requestBody = resolveComponentRefs(operation.requestBody, raw);
        }
      }
    }
  }

  return spec;
}

export function specToNav(spec) {
  const nav = [];
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation) continue;
      const tags = operation.tags?.length ? operation.tags : ["default"];
      for (const tag of tags) {
        let group = nav.find(n => n.tag === tag);
        if (!group) { group = { tag, endpoints: [] }; nav.push(group); }
        group.endpoints.push({ method, path, id: operation.operationId || `${method}-${path.replace(/[^a-zA-Z0-9]/g, "-")}` });
      }
    }
  }
  return nav;
}
===
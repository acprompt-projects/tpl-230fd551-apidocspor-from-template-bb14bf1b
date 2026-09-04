import React, { useState, useCallback, useMemo } from "react";

const SPEC_VERSIONS = [
  { label: "v3.2 (latest)", value: "v3.2", latest: true },
  { label: "v3.1", value: "v3.1" },
  { label: "v2.4", value: "v2.4" },
  { label: "v2.3 (deprecated)", value: "v2.3", deprecated: true },
];

const NAV_SPEC = {
  v3.2: [
    { section: "Authentication", items: [
      { id: "auth-overview", label: "Overview", href: "/docs/auth/overview" },
      { id: "auth-oauth2", label: "OAuth 2.0 Flows", href: "/docs/auth/oauth2" },
      { id: "auth-tokens", label: "Token Management", href: "/docs/auth/tokens" },
      { id: "auth-mfa", label: "Multi-Factor Auth", href: "/docs/auth/mfa" },
    ]},
    { section: "Metrics", items: [
      { id: "metrics-overview", label: "Overview", href: "/docs/metrics/overview" },
      { id: "metrics-ingest", label: "Ingest API", href: "/docs/metrics/ingest" },
      { id: "metrics-query", label: "Query Language", href: "/docs/metrics/query" },
      { id: "metrics-aggregation", label: "Aggregations", href: "/docs/metrics/aggregation" },
    ]},
    { section: "Monitoring", items: [
      { id: "monitor-overview", label: "Overview", href: "/docs/monitor/overview" },
      { id: "monitor-alerts", label: "Alert Rules", href: "/docs/monitor/alerts" },
      { id: "monitor-incidents", label: "Incidents", href: "/docs/monitor/incidents" },
      { id: "monitor-webhooks", label: "Webhooks", href: "/docs/monitor/webhooks" },
    ]},
    { section: "Dashboards", items: [
      { id: "dash-overview", label: "Overview", href: "/docs/dash/overview" },
      { id: "dash-crud", label: "CRUD Operations", href: "/docs/dash/crud" },
      { id: "dash-widgets", label: "Widget Library", href: "/docs/dash/widgets" },
      { id: "dash-sharing", label: "Sharing & Permissions", href: "/docs/dash/sharing" },
    ]},
    { section: "Runbooks", items: [
      { id: "rb-auth-rotation", label: "Credential Rotation", href: "/docs/runbooks/cred-rotation" },
      { id: "rb-incident-response", label: "Incident Response", href: "/docs/runbooks/incident-response" },
      { id: "rb-migration-v3", label: "Migrate to v3", href: "/docs/runbooks/migration-v3" },
    ]},
  ],
  v3.1: [
    { section: "Authentication", items: [
      { id: "auth-overview", label: "Overview", href: "/docs/auth/overview" },
      { id: "auth-oauth2", label: "OAuth 2.0 Flows", href: "/docs/auth/oauth2" },
      { id: "auth-tokens", label: "Token Management", href: "/docs/auth/tokens" },
    ]},
    { section: "Metrics", items: [
      { id: "metrics-overview", label: "Overview", href: "/docs/metrics/overview" },
      { id: "metrics-ingest", label: "Ingest API", href: "/docs/metrics/ingest" },
      { id: "metrics-query", label: "Query Language", href: "/docs/metrics/query" },
    ]},
    { section: "Monitoring", items: [
      { id: "monitor-overview", label: "Overview", href: "/docs/monitor/overview" },
      { id: "monitor-alerts", label: "Alert Rules", href: "/docs/monitor/alerts" },
    ]},
  ],
  v2.4: [{ section: "Auth & Metrics (v2)", items: [
    { id: "v2-auth", label: "Authentication", href: "/docs/v2/auth" },
    { id: "v2-metrics", label: "Metrics API", href: "/docs/v2/metrics" },
  ]}],
  v2.3: [{ section: "Legacy API", items: [
    { id: "v2-legacy", label: "Legacy Endpoints", href: "/docs/v2/legacy" },
  ]}],
};

export default function Sidebar({ activeId, onNavigate, defaultVersion = "v3.2" }) {
  const [version, setVersion] = useState(defaultVersion);
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    (NAV_SPEC[version] || []).forEach((s, i) => { init[i] = true; });
    return init;
  });

  const nav = NAV_SPEC[version] || [];

  const toggleSection = useCallback((idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const handleVersionChange = useCallback((e) => {
    const v = e.target.value;
    setVersion(v);
    const init = {};
    (NAV_SPEC[v] || []).forEach((s, i) => { init[i] = true; });
    setExpanded(init);
    if (onNavigate) onNavigate({ type: "version-change", version: v });
  }, [onNavigate]);

  const currentVersionMeta = SPEC_VERSIONS.find((v) => v.value === version);

  return (
    <aside className="sidebar" role="navigation" aria-label="Documentation sidebar">
      <div className="sidebar__version">
        <label htmlFor="version-select" className="sidebar__version-label">API Version</label>
        <select
          id="version-select"
          value={version}
          onChange={handleVersionChange}
          className="sidebar__version-select"
          aria-label="Select API version"
        >
          {SPEC_VERSIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
        {currentVersionMeta?.deprecated && (
          <span className="sidebar__version-badge sidebar__version-badge--deprecated">deprecated</span>
        )}
        {currentVersionMeta?.latest && (
          <span className="sidebar__version-badge sidebar__version-badge--latest">latest</span>
        )}
      </div>

      <nav className="sidebar__nav">
        {nav.map((group, idx) => (
          <div key={group.section} className="sidebar__section">
            <button
              className="sidebar__section-toggle"
              onClick={() => toggleSection(idx)}
              aria-expanded={!!expanded[idx]}
              aria-controls={`section-${idx}`}
            >
              <span className="sidebar__section-arrow">{expanded[idx] ? "▾" : "▸"}</span>
              <span className="sidebar__section-title">{group.section}</span>
            </button>
            <ul
              id={`section-${idx}`}
              className="sidebar__items"
              role="group"
              style={{ display: expanded[idx] ? "block" : "none" }}
            >
              {group.items.map((item) => (
                <li key={item.id} className="sidebar__item">
                  <a
                    href={item.href}
                    className={`sidebar__link${activeId === item.id ? " sidebar__link--active" : ""}`}
                    aria-current={activeId === item.id ? "page" : undefined}
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate({ type: "navigate", id: item.id, href: item.href, version });
                      }
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export { SPEC_VERSIONS, NAV_SPEC };
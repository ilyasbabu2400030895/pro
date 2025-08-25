import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * FEDF-PS03: Gender-responsive mechanism to combat domestic violence
 * Single-file SPA demo (no backend):
 * - Roles: Admin, Victim/Survivor, Counsellor, Legal Advisor
 * - Features: resources, help requests, progress notes, legal info, role/users
 * - Safety: Quick Exit, discrete UI, minimal localStorage persistence
 *
 * Notes:
 * - This is a client-side starter. For production, add a secure backend,
 *   auth (OAuth/passwordless), audit logs, encryption at rest + in transit.
 */

const STORAGE_KEY = "fedf_ps03_state_v1";

/* ---------- Utilities ---------- */
const nowISO = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

const saveState = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};
const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

/* ---------- Seed Data ---------- */
const seed = {
  users: [
    { id: "u-admin", name: "Admin", role: "Admin" },
    { id: "u-c1", name: "Counsellor A", role: "Counsellor" },
    { id: "u-l1", name: "Legal Advisor A", role: "Legal Advisor" },
  ],
  resources: [
    { id: id(), type: "Helpline", title: "National DV Helpline", contact: "181", region: "India", url: "", notes: "24x7, women-centric" },
    { id: id(), type: "Police", title: "Emergency Police", contact: "112", region: "India", url: "", notes: "Immediate danger" },
    { id: id(), type: "NGO", title: "Sakhi One Stop Centre", contact: "", region: "State-wise", url: "", notes: "Medical, legal, counselling support" },
    { id: id(), type: "Health", title: "Medical Emergency", contact: "108", region: "India", url: "", notes: "Ambulance" },
  ],
  legal: [
    { id: id(), title: "Protection of Women from Domestic Violence Act, 2005", summary: "Civil remedies: protection, residence, monetary, custody, compensation orders.", link: "" },
    { id: id(), title: "Section 498A IPC", summary: "Cruelty by husband/relatives; cognizable offense.", link: "" },
    { id: id(), title: "POCSO Act (if minor involved)", summary: "Protection of children from sexual offenses.", link: "" },
  ],
  helpRequests: [
    // { id, createdAt, status, byName (optional), contactPref, details, assignedTo (counsellorId), updates: [] }
  ],
  sessions: [
    // counselling sessions or progress notes
  ],
};

/* ---------- Top App ---------- */
export default function App() {
  const [state, setState] = useState(() => loadState() || seed);
  const [role, setRole] = useState("Victim/Survivor");
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentUser, setCurrentUser] = useState("u-admin"); // default
  const [search, setSearch] = useState("");

  /* persist */
  useEffect(() => { saveState(state); }, [state]);

  /* derived */
  const user = useMemo(() => state.users.find(u => u.id === currentUser) || state.users[0], [state.users, currentUser]);

  /* role guard tabs */
  const tabsForRole = {
    "Victim/Survivor": ["Overview", "Resources", "Get Help", "Legal Rights", "Safety Plan"],
    "Counsellor": ["Overview", "Assigned Cases", "Progress Notes", "Resources"],
    "Legal Advisor": ["Overview", "Legal Resources", "Case Actions"],
    "Admin": ["Overview", "Content", "Users", "Data & Security"],
  };
  const tabs = tabsForRole[role] || ["Overview"];

  /* quick exit */
  const quickExit = () => {
    try { localStorage.clear(); } catch {}
    window.location.href = "https://www.google.com/";
  };

  /* shared updaters */
  const addResource = (r) => setState(s => ({ ...s, resources: [{ id: id(), ...r }, ...s.resources] }));
  const deleteResource = (rid) => setState(s => ({ ...s, resources: s.resources.filter(r => r.id !== rid) }));

  const addLegal = (item) => setState(s => ({ ...s, legal: [{ id: id(), ...item }, ...s.legal] }));
  const deleteLegal = (lid) => setState(s => ({ ...s, legal: s.legal.filter(x => x.id !== lid) }));

  const createHelp = (payload) => {
    const req = {
      id: id(),
      createdAt: nowISO(),
      status: "New",
      byName: payload.byName || "",
      contactPref: payload.contactPref || "Hidden",
      details: payload.details || "",
      region: payload.region || "",
      assignedTo: payload.assignedTo || "",
      updates: [],
    };
    setState(s => ({ ...s, helpRequests: [req, ...s.helpRequests] }));
  };
  const assignHelp = (hid, counsellorId) => setState(s => ({
    ...s,
    helpRequests: s.helpRequests.map(h => h.id === hid ? { ...h, assignedTo: counsellorId, status: "Assigned" } : h),
  }));
  const updateHelpStatus = (hid, status, note) => setState(s => ({
    ...s,
    helpRequests: s.helpRequests.map(h => h.id === hid ? {
      ...h,
      status,
      updates: [{ at: nowISO(), note }, ...h.updates],
    } : h),
  }));

  const addUser = (name, role) => setState(s => ({ ...s, users: [...s.users, { id: id(), name, role }] }));
  const removeUser = (uid) => setState(s => ({ ...s, users: s.users.filter(u => u.id !== uid) }));

  /* filtering */
  const filteredResources = state.resources.filter(r =>
    [r.type, r.title, r.contact, r.region, r.notes].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container" role="application" aria-label="Domestic violence support app">
      <header className="header" aria-live="polite">
        <div className="brand">
          <span className="badge">SafeBridge</span>
          <div>
            <div className="small">Gender-responsive resources & support</div>
            <div className="subtle">If you are in immediate danger call <strong>112</strong> (India) or your local emergency number.</div>
          </div>
        </div>

        <div className="actions">
          <select
            className="select"
            aria-label="Select role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {["Victim/Survivor", "Counsellor", "Legal Advisor", "Admin"].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            className="select"
            aria-label="Select active user"
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            title="Simulated login"
          >
            {state.users.map(u => (
              <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
            ))}
          </select>

          <button className="btn btn-danger" onClick={quickExit} aria-label="Quick exit to a safe site">
            Quick Exit
          </button>
        </div>
      </header>

      {/* Top search (for resources, cases etc.) */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="grid grid-2">
          <div>
            <label className="section-title">Search</label>
            <input
              className="input"
              placeholder="Search resources, regions, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="small" style={{ marginTop: 6 }}>
              Tip: Use <span className="kbd">Ctrl</span>+<span className="kbd">K</span> to focus search (browser dependent).
            </div>
          </div>
          <SafetyHints />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist" aria-label="Section tabs" style={{ marginTop: 14 }}>
        {tabs.map(t => (
          <button
            key={t}
            className={`tab ${activeTab === t ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === t}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-2">
        <div className="grid" aria-live="polite">
          {role === "Victim/Survivor" && (
            <>
              {activeTab === "Overview" && <VictimOverview resources={filteredResources} />}
              {activeTab === "Resources" && <ResourcesList resources={filteredResources} canDelete={false} onDelete={() => {}} />}
              {activeTab === "Get Help" && <GetHelpForm onSubmit={createHelp} counsellors={state.users.filter(u=>u.role==="Counsellor")} />}
              {activeTab === "Legal Rights" && <LegalResources legal={state.legal} canAdd={false} canDelete={false} onAdd={()=>{}} onDelete={()=>{}} />}
              {activeTab === "Safety Plan" && <SafetyPlan />}
            </>
          )}

          {role === "Counsellor" && (
            <>
              {activeTab === "Overview" && <CounsellorOverview help={state.helpRequests} users={state.users} />}
              {activeTab === "Assigned Cases" && (
                <CasesList
                  help={state.helpRequests}
                  users={state.users}
                  onAssign={assignHelp}
                  onStatus={updateHelpStatus}
                  onlyMine={true}
                  me={user.id}
                />
              )}
              {activeTab === "Progress Notes" && (
                <CasesList
                  help={state.helpRequests}
                  users={state.users}
                  onAssign={assignHelp}
                  onStatus={updateHelpStatus}
                  onlyMine={true}
                  me={user.id}
                  showUpdates
                />
              )}
              {activeTab === "Resources" && <ResourcesList resources={filteredResources} canDelete={false} onDelete={()=>{}} />}
            </>
          )}

          {role === "Legal Advisor" && (
            <>
              {activeTab === "Overview" && <LegalOverview help={state.helpRequests} />}
              {activeTab === "Legal Resources" && (
                <LegalResources legal={state.legal} canAdd={true} canDelete={true} onAdd={addLegal} onDelete={deleteLegal} />
              )}
              {activeTab === "Case Actions" && (
                <CasesList
                  help={state.helpRequests}
                  users={state.users}
                  onAssign={assignHelp}
                  onStatus={updateHelpStatus}
                />
              )}
            </>
          )}

          {role === "Admin" && (
            <>
              {activeTab === "Overview" && <AdminOverview counts={{
                users: state.users.length,
                resources: state.resources.length,
                legal: state.legal.length,
                cases: state.helpRequests.length
              }}/>}
              {activeTab === "Content" && (
                <>
                  <AddResource onAdd={addResource}/>
                  <ResourcesList resources={filteredResources} canDelete={true} onDelete={deleteResource} />
                  <LegalResources legal={state.legal} canAdd={true} canDelete={true} onAdd={addLegal} onDelete={deleteLegal} />
                </>
              )}
              {activeTab === "Users" && (
                <UserAdmin users={state.users} onAdd={addUser} onRemove={removeUser} />
              )}
              {activeTab === "Data & Security" && <SecurityPanel />}
            </>
          )}
        </div>

        {/* Right column: always-on summaries */}
        <aside className="grid">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Quick Contacts</h3>
            <div className="list">
              <div className="item"><strong>Emergency</strong><div className="small">112</div></div>
              <div className="item"><strong>DV Helpline</strong><div className="small">181 (India)</div></div>
              <div className="item"><strong>Ambulance</strong><div className="small">108</div></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recent Help Requests</h3>
            {state.helpRequests.length === 0 ? (
              <div className="small">No requests yet.</div>
            ) : (
              <table className="table" aria-label="Recent help requests">
                <thead>
                  <tr><th>Date</th><th>Status</th><th>Assigned</th></tr>
                </thead>
                <tbody>
                  {state.helpRequests.slice(0,5).map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.createdAt).toLocaleString()}</td>
                      <td>{h.status}</td>
                      <td>{(state.users.find(u => u.id===h.assignedTo)?.name) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card notice">
            <strong>Confidentiality</strong>
            <div className="small">We never ask for unnecessary personal details. Clear your browser history after use if it is safe to do so.</div>
          </div>
        </aside>
      </div>

      <div className="quick-exit">
        <button className="btn btn-danger" onClick={quickExit} aria-label="Quick exit to a safe site (floating)">
          Quick Exit
        </button>
      </div>

      <footer className="footer">© {new Date().getFullYear()} SafeBridge • For education/demo use • Replace with secure backend before production.</footer>
    </div>
  );
}

/* ---------- Components ---------- */

function SafetyHints() {
  return (
    <div className="card">
      <div className="section-title">Safety Tips</div>
      <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
        <li>Use the <strong>Quick Exit</strong> if someone walks in.</li>
        <li>Consider using a private/incognito window.</li>
        <li>If it’s safe, set a code word with trusted contacts.</li>
        <li>Keep essential documents and emergency numbers accessible.</li>
      </ul>
    </div>
  );
}

/* --- Victim/Survivor --- */
function VictimOverview({ resources }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>You are not alone.</h3>
      <div className="notice">
        If you are in immediate danger, call your local emergency number (e.g., <strong>112</strong> in India).
      </div>
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <strong>Featured Resources</strong>
          <div className="list" style={{ marginTop: 8 }}>
            {resources.slice(0,3).map(r => (
              <div key={r.id} className="item">
                <div><strong>{r.title}</strong> <span className="small">({r.type})</span></div>
                {r.contact && <div className="small">Contact: {r.contact}</div>}
                <div className="small">{r.region || "—"}</div>
                <div className="small">{r.notes}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <strong>How we support you</strong>
          <ul className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>Confidential listening and crisis support</li>
            <li>Safety planning tailored to your needs</li>
            <li>Connections to shelters, health, and legal services</li>
            <li>Gender-responsive care that respects your identity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ResourcesList({ resources, canDelete, onDelete }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Resources Directory</h3>
      {resources.length === 0 ? <div className="small">No resources yet.</div> : (
        <table className="table" aria-label="Resources table">
          <thead>
            <tr><th>Type</th><th>Title</th><th>Contact</th><th>Region</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id}>
                <td>{r.type}</td>
                <td>{r.title}</td>
                <td>{r.contact || "-"}</td>
                <td>{r.region || "-"}</td>
                <td className="small">{r.notes}</td>
                <td style={{ textAlign: "right" }}>
                  {canDelete && <button className="btn btn-ghost" onClick={()=>onDelete(r.id)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GetHelpForm({ onSubmit, counsellors }) {
  const [byName, setByName] = useState("");
  const [contactPref, setContactPref] = useState("Hidden");
  const [region, setRegion] = useState("");
  const [details, setDetails] = useState("");
  const [assign, setAssign] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ byName, contactPref, details, region, assignedTo: assign });
    setByName(""); setRegion(""); setDetails(""); setAssign(""); setContactPref("Hidden");
    alert("Your request has been submitted. If it’s safe, keep your phone nearby.");
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Seek Help</h3>
      <div className="notice warn" style={{ marginBottom: 10 }}>
        Share only what feels safe. You can submit anonymously.
      </div>
      <div className="grid">
        <label>
          <div className="section-title">Your name (optional)</div>
          <input className="input" value={byName} onChange={e=>setByName(e.target.value)} placeholder="Leave blank to stay anonymous" />
        </label>
        <label>
          <div className="section-title">Preferred contact</div>
          <select className="select" value={contactPref} onChange={e=>setContactPref(e.target.value)}>
            <option>Hidden</option>
            <option>Phone</option>
            <option>SMS</option>
            <option>WhatsApp</option>
            <option>Email</option>
          </select>
        </label>
        <label>
          <div className="section-title">Region / City</div>
          <input className="input" value={region} onChange={e=>setRegion(e.target.value)} placeholder="e.g., Jaipur, Rajasthan" />
        </label>
        <label>
          <div className="section-title">Assign counsellor (optional)</div>
          <select className="select" value={assign} onChange={e=>setAssign(e.target.value)}>
            <option value="">—</option>
            {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          <div className="section-title">What’s happening? (optional)</div>
          <textarea className="textarea" value={details} onChange={e=>setDetails(e.target.value)} placeholder="Write only what you are comfortable sharing." />
        </label>
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
        <button className="btn btn-primary" type="submit">Submit Request</button>
        <button className="btn" type="reset" onClick={()=>{ setByName(""); setRegion(""); setDetails(""); setAssign(""); setContactPref("Hidden"); }}>Reset</button>
      </div>
    </form>
  );
}

function LegalResources({ legal, canAdd, canDelete, onAdd, onDelete }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState("");

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, summary, link });
    setTitle(""); setSummary(""); setLink("");
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Legal Rights & Resources</h3>

      {canAdd && (
        <form onSubmit={add} className="grid">
          <label>
            <div className="section-title">Title</div>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Act/Section/Guideline title" />
          </label>
          <label>
            <div className="section-title">Summary</div>
            <textarea className="textarea" value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Short non-legal summary in plain language" />
          </label>
          <label>
            <div className="section-title">Link (optional)</div>
            <input className="input" value={link} onChange={e=>setLink(e.target.value)} placeholder="Official or government source if possible" />
          </label>
          <div><button className="btn btn-primary" type="submit">Add Legal Resource</button></div>
        </form>
      )}

      <div className="list" style={{ marginTop: 12 }}>
        {legal.map(x => (
          <div key={x.id} className="item">
            <div><strong>{x.title}</strong></div>
            <div className="small" style={{ marginTop: 4 }}>{x.summary || "—"}</div>
            {x.link && <div className="small"><a href={x.link} target="_blank" rel="noreferrer">Open link</a></div>}
            {canDelete && <div style={{ marginTop: 8 }}><button className="btn btn-ghost" onClick={()=>onDelete(x.id)}>Delete</button></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SafetyPlan() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Safety Plan</h3>
      <ul className="small" style={{ paddingLeft: 18, marginTop: 8 }}>
        <li>Identify safe rooms with exits; avoid kitchens or garages during conflicts.</li>
        <li>Keep emergency numbers and spare keys accessible.</li>
        <li>Arrange a code word or emoji with trusted people to signal you need help.</li>
        <li>Store important documents and some cash in a safe place.</li>
        <li>Document incidents (only if it’s safe) and consider medical attention for injuries.</li>
      </ul>
    </div>
  );
}

/* --- Counsellor --- */
function CounsellorOverview({ help, users }) {
  const assigned = help.filter(h => h.status !== "New");
  const newOnes = help.filter(h => h.status === "New");
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Your Work at a Glance</h3>
      <div className="grid grid-3" style={{ marginTop: 8 }}>
        <Stat title="New requests" value={newOnes.length} />
        <Stat title="Assigned / In progress" value={assigned.length} />
        <Stat title="Closed" value={help.filter(h=>h.status==="Closed").length} />
      </div>
      <div className="section-title" style={{ marginTop: 12 }}>Recent</div>
      <table className="table">
        <thead><tr><th>Date</th><th>Status</th><th>Assigned</th><th>Region</th></tr></thead>
        <tbody>
          {help.slice(0,5).map(h=>(
            <tr key={h.id}>
              <td>{new Date(h.createdAt).toLocaleString()}</td>
              <td>{h.status}</td>
              <td>{users.find(u=>u.id===h.assignedTo)?.name || "-"}</td>
              <td>{h.region || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CasesList({ help, users, onAssign, onStatus, onlyMine=false, me="", showUpdates=false }) {
  const mine = onlyMine ? help.filter(h => h.assignedTo === me) : help;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Cases</h3>
      <table className="table" aria-label="Cases table">
        <thead>
          <tr><th>Date</th><th>Status</th><th>Region</th><th>Assigned</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {mine.map(h => (
            <tr key={h.id}>
              <td>{new Date(h.createdAt).toLocaleString()}</td>
              <td>{h.status}</td>
              <td>{h.region || "-"}</td>
              <td>{users.find(u=>u.id===h.assignedTo)?.name || "-"}</td>
              <td>
                <CaseActions h={h} users={users} onAssign={onAssign} onStatus={onStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showUpdates && mine.map(h => (
        <div key={h.id} className="item" style={{ marginTop: 10 }}>
          <strong>Updates for case {h.id}</strong>
          {h.updates.length === 0 ? <div className="small">No updates yet.</div> : (
            <ul className="small" style={{ paddingLeft: 18, marginTop: 6 }}>
              {h.updates.map((u,i)=>(
                <li key={i}><strong>{new Date(u.at).toLocaleString()}:</strong> {u.note}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function CaseActions({ h, users, onAssign, onStatus }) {
  const [assignee, setAssignee] = useState(h.assignedTo || "");
  const [status, setStatus] = useState(h.status);
  const [note, setNote] = useState("");

  const counsellors = users.filter(u => u.role === "Counsellor");

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select className="select" value={assignee} onChange={e=>setAssignee(e.target.value)} title="Assign counsellor">
        <option value="">—</option>
        {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn" onClick={()=>onAssign(h.id, assignee)}>Assign</button>

      <select className="select" value={status} onChange={e=>setStatus(e.target.value)} title="Update status">
        {["New","Assigned","In progress","Closed"].map(s=>(<option key={s} value={s}>{s}</option>))}
      </select>
      <input className="input" placeholder="Add note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="btn btn-primary" onClick={()=>{ onStatus(h.id, status, note); setNote(""); }}>
        Save
      </button>
    </div>
  );
}

/* --- Legal Advisor --- */
function LegalOverview({ help }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Legal Actions Overview</h3>
      <div className="grid grid-3" style={{ marginTop: 8 }}>
        <Stat title="Open cases" value={help.filter(h=>h.status!=="Closed").length} />
        <Stat title="Closed" value={help.filter(h=>h.status==="Closed").length} />
        <Stat title="Unassigned" value={help.filter(h=>!h.assignedTo).length} />
      </div>
      <div className="notice" style={{ marginTop: 10 }}>
        Provide plain-language guidance. Avoid legalese unless strictly necessary.
      </div>
    </div>
  );
}

/* --- Admin --- */
function AdminOverview({ counts }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>System Health</h3>
      <div className="grid grid-3" style={{ marginTop: 8 }}>
        <Stat title="Users" value={counts.users} />
        <Stat title="Resources" value={counts.resources} />
        <Stat title="Legal Items" value={counts.legal} />
        <Stat title="Cases" value={counts.cases} />
      </div>
      <div className="notice" style={{ marginTop: 12 }}>
        Before production: add secure authentication, encrypted database, audit logs, RBAC, rate limiting, and data retention policies.
      </div>
    </div>
  );
}

function AddResource({ onAdd }) {
  const [form, setForm] = useState({ type: "Helpline", title: "", contact: "", region: "", url: "", notes: "" });
  const set = (k,v)=>setForm(f=>({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd(form);
    setForm({ type: "Helpline", title: "", contact: "", region: "", url: "", notes: "" });
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Add Resource</h3>
      <div className="grid grid-2">
        <label><div className="section-title">Type</div>
          <select className="select" value={form.type} onChange={e=>set("type", e.target.value)}>
            {["Helpline","Police","Health","Shelter","NGO","Legal Aid","Counselling"].map(t=><option key={t}>{t}</option>)}
          </select>
        </label>
        <label><div className="section-title">Title</div>
          <input className="input" value={form.title} onChange={e=>set("title", e.target.value)} placeholder="e.g., City Shelter Helpline" />
        </label>
        <label><div className="section-title">Contact</div>
          <input className="input" value={form.contact} onChange={e=>set("contact", e.target.value)} placeholder="phone/email/URL" />
        </label>
        <label><div className="section-title">Region</div>
          <input className="input" value={form.region} onChange={e=>set("region", e.target.value)} placeholder="State/City" />
        </label>
        <label><div className="section-title">URL (optional)</div>
          <input className="input" value={form.url} onChange={e=>set("url", e.target.value)} placeholder="https://…" />
        </label>
        <label><div className="section-title">Notes</div>
          <input className="input" value={form.notes} onChange={e=>set("notes", e.target.value)} placeholder="Availability, timing, languages…" />
        </label>
      </div>
      <div style={{ marginTop: 10 }}><button className="btn btn-primary" type="submit">Add</button></div>
    </form>
  );
}

function UserAdmin({ users, onAdd, onRemove }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Counsellor");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, role);
    setName(""); setRole("Counsellor");
  };

  return (
    <div className="grid">
      <form className="card" onSubmit={submit}>
        <h3 style={{ marginTop: 0 }}>Add User</h3>
        <div className="grid grid-2">
          <label><div className="section-title">Name</div>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} />
          </label>
          <label><div className="section-title">Role</div>
            <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
              {["Admin","Counsellor","Legal Advisor","Victim/Survivor"].map(r=><option key={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div style={{ marginTop: 10 }}><button className="btn btn-primary" type="submit">Create</button></div>
      </form>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>All Users</h3>
        <table className="table" aria-label="Users table">
          <thead><tr><th>Name</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost" onClick={()=>onRemove(u.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="notice warn" style={{ marginTop: 8 }}>
          For production: require strong authentication and role-based permissions.
        </div>
      </div>
    </div>
  );
}

function SecurityPanel() {
  const wipe = () => {
    try { localStorage.clear(); alert("Local data cleared."); } catch {}
  };
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Data & Security</h3>
      <ul className="small" style={{ paddingLeft: 18 }}>
        <li>Client-side demo only; add a secure backend and database encryption.</li>
        <li>Implement RBAC, audit logs, IP rate limiting, and data retention.</li>
        <li>Mask sensitive fields at rest and in UI; use HTTPS everywhere.</li>
      </ul>
      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
        <button className="btn btn-danger" onClick={wipe}>Clear Local Data</button>
        <button className="btn">Export (coming soon)</button>
      </div>
    </div>
  );
}

/* --- Shared --- */
function Stat({ title, value }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div className="small">{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: .3 }}>{value}</div>
    </div>
  );
}

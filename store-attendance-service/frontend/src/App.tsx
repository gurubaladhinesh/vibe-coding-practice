import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, AttendanceRow, Dashboard, EmployeeRow, Me, Timecard } from "./api";

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatTime(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page"><p>Loading…</p></div>;
  }
  if (!me) {
    return <Login onLoggedIn={setMe} />;
  }
  return (
    <Shell
      me={me}
      onLogout={async () => {
        await api.logout();
        setMe(null);
      }}
      error={error}
      setError={setError}
      refreshMe={() => api.me().then(setMe)}
    />
  );
}

function Login({ onLoggedIn }: { onLoggedIn: (me: Me) => void }) {
  const [storeCode, setStoreCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      onLoggedIn(await api.login(username, password, storeCode.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="page">
      <form className="card login" onSubmit={submit}>
        <h1>Store Attendance</h1>
        <p className="muted">Owner: leave store code empty. Staff: enter store code.</p>
        <label>
          Store code
          <input value={storeCode} onChange={(e) => setStoreCode(e.target.value)} placeholder="MAIN or EAST" />
        </label>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}

function Shell({
  me,
  onLogout,
  error,
  setError,
  refreshMe,
}: {
  me: Me;
  onLogout: () => void;
  error: string | null;
  setError: (v: string | null) => void;
  refreshMe: () => void;
}) {
  return (
    <div className="page">
      <header className="top">
        <div>
          <strong>{me.fullName}</strong>
          <span className="pill">{me.role}</span>
          {me.storeName && <span className="muted">{me.storeName}</span>}
        </div>
        <button className="ghost" onClick={onLogout}>
          Logout
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      {me.role === "OWNER" ? (
        <OwnerHome me={me} setError={setError} />
      ) : (
        <StaffHome me={me} setError={setError} refreshMe={refreshMe} />
      )}
    </div>
  );
}

function StaffHome({
  me,
  setError,
  refreshMe,
}: {
  me: Me;
  setError: (v: string | null) => void;
  refreshMe: () => void;
}) {
  const [tab, setTab] = useState<"time" | "reportings">("time");
  const [selected, setSelected] = useState<AttendanceRow | null>(null);

  return (
    <>
      <ClockCard me={me} setError={setError} refreshMe={refreshMe} />
      {me.role === "MANAGER" && (
        <div className="row tabs">
          <button className={tab === "time" ? "" : "ghost"} onClick={() => { setTab("time"); setSelected(null); }}>
            My time
          </button>
          <button className={tab === "reportings" ? "" : "ghost"} onClick={() => { setTab("reportings"); setSelected(null); }}>
            Reportings
          </button>
        </div>
      )}
      {(me.role === "EMPLOYEE" || tab === "time") && (
        <TimecardCard employeeId={me.employeeId || undefined} refreshKey={me.checkedIn} />
      )}
      {me.role === "MANAGER" && tab === "reportings" && !selected && (
        <ReportingsCard storeId={me.storeId || undefined} onSelect={setSelected} />
      )}
      {me.role === "MANAGER" && tab === "reportings" && selected && (
        <TimecardCard
          employeeId={selected.employeeId}
          title={`${selected.fullName} · timecard`}
          onBack={() => setSelected(null)}
        />
      )}
    </>
  );
}

function ClockCard({
  me,
  setError,
  refreshMe,
}: {
  me: Me;
  setError: (v: string | null) => void;
  refreshMe: () => void;
}) {
  async function clock(kind: "in" | "out") {
    setError(null);
    try {
      if (kind === "in") await api.checkIn();
      else await api.checkOut();
      refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clock action failed");
    }
  }

  return (
    <section className="card">
      <h2>Time clock</h2>
      <p>
        Status:{" "}
        <strong className={me.checkedIn ? "ok" : ""}>{me.checkedIn ? "Checked in" : "Checked out"}</strong>
      </p>
      <div className="row">
        <button disabled={me.checkedIn} onClick={() => clock("in")}>
          Check-In
        </button>
        <button className="ghost" disabled={!me.checkedIn} onClick={() => clock("out")}>
          Check-Out
        </button>
      </div>
    </section>
  );
}

function OwnerHome({ me, setError }: { me: Me; setError: (v: string | null) => void }) {
  const [storeKey, setStoreKey] = useState("ALL");
  const [tab, setTab] = useState<"reportings" | "staff">("reportings");
  const [selected, setSelected] = useState<AttendanceRow | null>(null);
  const selectedStore = me.stores.find((s) => s.id === storeKey);

  return (
    <>
      <section className="card">
        <h2>Stores</h2>
        <div className="row wrap">
          <button className={storeKey === "ALL" ? "" : "ghost"} onClick={() => { setStoreKey("ALL"); setSelected(null); }}>
            All stores
          </button>
          {me.stores.map((store) => (
            <button
              key={store.id}
              className={storeKey === store.id ? "" : "ghost"}
              onClick={() => { setStoreKey(store.id); setSelected(null); }}
            >
              {store.code} · {store.name}
            </button>
          ))}
        </div>
      </section>
      <div className="row tabs">
        <button className={tab === "reportings" ? "" : "ghost"} onClick={() => { setTab("reportings"); setSelected(null); }}>
          Reportings
        </button>
        <button
          className={tab === "staff" ? "" : "ghost"}
          disabled={!selectedStore}
          onClick={() => { setTab("staff"); setSelected(null); }}
        >
          Staff
        </button>
      </div>
      {tab === "reportings" && !selected && (
        <ReportingsCard storeId={storeKey === "ALL" ? undefined : storeKey} onSelect={setSelected} showStore />
      )}
      {tab === "reportings" && selected && (
        <TimecardCard
          employeeId={selected.employeeId}
          title={`${selected.fullName} · ${selected.storeCode}`}
          onBack={() => setSelected(null)}
        />
      )}
      {tab === "staff" && selectedStore && <StaffAdmin storeId={selectedStore.id} setError={setError} />}
    </>
  );
}

function DateRange({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <div className="row">
      <label>
        From
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      </label>
      <label>
        To
        <input type="date" value={to} min={from} onChange={(e) => onTo(e.target.value)} />
      </label>
    </div>
  );
}

function TimecardCard({
  employeeId,
  title,
  onBack,
  refreshKey,
}: {
  employeeId?: string;
  title?: string;
  onBack?: () => void;
  refreshKey?: boolean;
}) {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<Timecard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .timecard(from, to, employeeId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Timecard failed"));
  }, [from, to, employeeId, refreshKey]);

  return (
    <section className="card">
      <div className="spread">
        <h2>{title || "My time"}</h2>
        <DateRange
          from={from}
          to={to}
          onFrom={(value) => {
            setFrom(value);
            if (value > to) setTo(value);
          }}
          onTo={setTo}
        />
      </div>
      {onBack && (
        <button className="ghost" onClick={onBack}>
          Back to reportings
        </button>
      )}
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <div className="kpis">
            <Kpi label="Total hours" value={data.totalHours.toFixed(2)} />
            <Kpi label="Avg hours / day" value={data.avgHours.toFixed(2)} />
            <Kpi label="Store avg hours / day" value={data.storeAvgHours.toFixed(2)} />
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.length === 0 && (
                <tr>
                  <td colSpan={5}>No time entries for this range.</td>
                </tr>
              )}
              {data.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.workDate}</td>
                  <td>{formatTime(entry.checkInAt)}</td>
                  <td>{formatTime(entry.checkOutAt)}</td>
                  <td>{entry.hours.toFixed(2)}</td>
                  <td>{entry.open ? "In" : "Out"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function ReportingsCard({
  storeId,
  onSelect,
  showStore,
}: {
  storeId?: string;
  onSelect: (row: AttendanceRow) => void;
  showStore?: boolean;
}) {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .dashboard(from, to, storeId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Reportings failed"));
  }, [from, to, storeId]);

  return (
    <section className="card">
      <div className="spread">
        <h2>Reportings</h2>
        <DateRange
          from={from}
          to={to}
          onFrom={(value) => {
            setFrom(value);
            if (value > to) setTo(value);
          }}
          onTo={setTo}
        />
      </div>
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <div className="kpis">
            <Kpi label="People" value={String(data.totals.employeeCount)} />
            <Kpi label="Checked in" value={String(data.totals.currentlyCheckedIn)} />
            <Kpi label="Total hours" value={data.totals.totalHours.toFixed(2)} />
            <Kpi label="Avg hours / day" value={data.totals.avgHours.toFixed(2)} />
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {showStore && <th>Store</th>}
                <th>Role</th>
                <th>Status</th>
                <th>Current</th>
                <th>Total hours</th>
                <th>Avg hours</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((row) => (
                <tr key={row.employeeId} className="clickable" onClick={() => onSelect(row)}>
                  <td>{row.fullName}</td>
                  {showStore && <td>{row.storeCode}</td>}
                  <td>{row.role}</td>
                  <td>{row.status}</td>
                  <td>{row.currentlyCheckedIn ? "In" : "Out"}</td>
                  <td>{row.hoursWorked.toFixed(2)}</td>
                  <td>{row.avgHours.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="muted">{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function StaffAdmin({ storeId, setError }: { storeId: string; setError: (v: string | null) => void }) {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState<"MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [managerId, setManagerId] = useState("");

  const managers = useMemo(
    () => employees.filter((e) => e.role === "MANAGER" && e.status === "ACTIVE"),
    [employees]
  );

  function reload() {
    api.employees(storeId).then(setEmployees).catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function onboard(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.onboard({
        storeId,
        fullName,
        username,
        password,
        role,
        managerId: role === "EMPLOYEE" ? managerId : undefined,
      });
      setFullName("");
      setUsername("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboard failed");
    }
  }

  async function terminate(id: string) {
    setError(null);
    try {
      await api.terminate(id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terminate failed");
    }
  }

  return (
    <section className="card">
      <h2>Staff</h2>
      <form className="grid" onSubmit={onboard}>
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select value={role} onChange={(e) => setRole(e.target.value as "MANAGER" | "EMPLOYEE")}>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
        </select>
        {role === "EMPLOYEE" && (
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} required>
            <option value="">Reports to…</option>
            {managers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.fullName}
              </option>
            ))}
          </select>
        )}
        <button type="submit">Onboard</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.fullName}</td>
              <td>{emp.username}</td>
              <td>{emp.role}</td>
              <td>{emp.status}</td>
              <td>
                {emp.status === "ACTIVE" && (
                  <button className="ghost" onClick={() => terminate(emp.id)}>
                    Terminate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

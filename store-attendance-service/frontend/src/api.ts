export type Role = "OWNER" | "MANAGER" | "EMPLOYEE";

export type StoreSummary = {
  id: string;
  code: string;
  name: string;
};

export type Me = {
  role: Role;
  username: string;
  fullName: string;
  storeId: string | null;
  storeCode: string | null;
  storeName: string | null;
  employeeId: string | null;
  stores: StoreSummary[];
  checkedIn: boolean;
};

export type EmployeeRow = {
  id: string;
  storeId: string;
  username: string;
  fullName: string;
  role: "MANAGER" | "EMPLOYEE";
  managerId: string | null;
  status: "ACTIVE" | "TERMINATED";
  terminatedAt: string | null;
};

export type AttendanceRow = {
  employeeId: string;
  fullName: string;
  username: string;
  role: "MANAGER" | "EMPLOYEE";
  status: "ACTIVE" | "TERMINATED";
  storeCode: string;
  storeName: string;
  storeId: string;
  hoursWorked: number;
  avgHours: number;
  currentlyCheckedIn: boolean;
  lastCheckInAt: string | null;
  lastCheckOutAt: string | null;
};

export type StoreKpi = {
  storeId: string | null;
  storeCode: string;
  storeName: string;
  employeeCount: number;
  currentlyCheckedIn: number;
  totalHours: number;
  avgHours: number;
};

export type Dashboard = {
  from: string;
  to: string;
  cumulative: boolean;
  totals: StoreKpi;
  storeSummaries: StoreKpi[];
  employees: AttendanceRow[];
};

export type TimecardEntry = {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  workDate: string;
  open: boolean;
  hours: number;
};

export type Timecard = {
  employeeId: string;
  fullName: string;
  storeCode: string;
  storeName: string;
  from: string;
  to: string;
  totalHours: number;
  avgHours: number;
  storeAvgHours: number;
  entries: TimecardEntry[];
};

async function parse<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (res.status === 204) {
    return undefined as T;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  login: (username: string, password: string, storeCode?: string) =>
    parse<Me>(
      awaitFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, storeCode: storeCode || null }),
      })
    ),
  logout: () => awaitFetch("/api/auth/logout", { method: "POST" }).then(() => undefined),
  me: () => parse<Me>(awaitFetch("/api/auth/me")),
  dashboard: (from: string, to: string, storeId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (storeId) params.set("storeId", storeId);
    return parse<Dashboard>(awaitFetch(`/api/attendance/dashboard?${params}`));
  },
  timecard: (from: string, to: string, employeeId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (employeeId) params.set("employeeId", employeeId);
    return parse<Timecard>(awaitFetch(`/api/attendance/timecard?${params}`));
  },
  checkIn: () => parse(awaitFetch("/api/attendance/check-in", { method: "POST" })),
  checkOut: () => parse(awaitFetch("/api/attendance/check-out", { method: "POST" })),
  employees: (storeId: string) => parse<EmployeeRow[]>(awaitFetch(`/api/employees?storeId=${storeId}`)),
  onboard: (payload: {
    storeId: string;
    username: string;
    password: string;
    fullName: string;
    role: "MANAGER" | "EMPLOYEE";
    managerId?: string;
  }) =>
    parse<EmployeeRow>(
      awaitFetch("/api/employees", { method: "POST", body: JSON.stringify(payload) })
    ),
  terminate: (id: string) => parse<EmployeeRow>(awaitFetch(`/api/employees/${id}/terminate`, { method: "POST" })),
};

function awaitFetch(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

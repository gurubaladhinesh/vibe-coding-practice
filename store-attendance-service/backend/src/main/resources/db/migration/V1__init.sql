CREATE TABLE owners (
    id UUID PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE owner_stores (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES owners (id),
    store_id UUID NOT NULL REFERENCES stores (id),
    UNIQUE (owner_id, store_id)
);

CREATE TABLE employees (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores (id),
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL CHECK (role IN ('MANAGER', 'EMPLOYEE')),
    manager_id UUID REFERENCES employees (id),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TERMINATED')),
    terminated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (store_id, username)
);

CREATE TABLE attendance_entries (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees (id),
    store_id UUID NOT NULL REFERENCES stores (id),
    check_in_at TIMESTAMPTZ NOT NULL,
    check_out_at TIMESTAMPTZ,
    work_date DATE NOT NULL
);

CREATE INDEX idx_attendance_employee_work_date ON attendance_entries (employee_id, work_date);
CREATE INDEX idx_attendance_store_work_date ON attendance_entries (store_id, work_date);
CREATE UNIQUE INDEX idx_one_open_attendance ON attendance_entries (employee_id) WHERE check_out_at IS NULL;
CREATE INDEX idx_employees_store_manager ON employees (store_id, manager_id);

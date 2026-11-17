export const WEB_PORT = 3100;
export const API_PORT = 4100;
export const DB_PORT = 27018;
export const DB_READY_PORT = 4110;

export const BASE_URL = `http://localhost:${WEB_PORT}`;
export const API_URL = `http://127.0.0.1:${API_PORT}`;
export const MONGODB_URL = `mongodb://127.0.0.1:${DB_PORT}/ems-e2e?replicaSet=e2e`;

export const ADMIN = { email: "admin@e2e.test", password: "Admin#E2E-12345" };

export const JWT_SECRET = "e2e-access-secret-0123456789-abcdefghijklmnop";
export const JWT_REFRESH_SECRET =
  "e2e-refresh-secret-0123456789-abcdefghijklmno";

export const dbConfig = Object.freeze({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "claud",
  user: process.env.DB_USER || "claud",
  password: process.env.DB_PASSWORD || "claud_password",
  port: parseInt(process.env.DB_PORT || "5432"),
} as const);

import { defineConfig } from 'drizzle-kit';
import config from "./src/config.js"

export default defineConfig({
    out: './drizzle',
    schema: './src/database/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: config.env.databaseUrl,
    },
});

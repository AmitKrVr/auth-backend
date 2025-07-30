const config = {
    env: {
        port: process.env.PORT,
        JWT_SECRET: process.env.JWT_SECRET,
        databaseUrl: process.env.DATABASE_URL,
        nodeENV: process.env.NEXT_PUBLIC_NODE_ENV,
        jwtExpires: process.env.JWT_EXPIRES_IN,
    }
};
export default config;

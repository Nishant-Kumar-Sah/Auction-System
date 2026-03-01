require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3001,
    postgres: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user : process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "auction_db",
    }
}

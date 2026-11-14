import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    clientUrl: process.env.CLIENT_URL,
};

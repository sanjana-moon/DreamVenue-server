import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI as string,
    clientUrl: process.env.CLIENT_URL as string,
};
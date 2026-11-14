import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config/env.js";
const JWKS = createRemoteJWKSet(new URL(`${config.clientUrl}/api/auth/jwks`), {
    timeoutDuration: 10000,
    cooldownDuration: 30000,
});
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const { payload } = await jwtVerify(token, JWKS);
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(403).json({ message: "Forbidden" });
    }
};

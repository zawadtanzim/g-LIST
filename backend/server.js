import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { authRouter, groupRouter, invitationRouter, itemRouter, userRouter } from "./routes/index.js";
import Response from "./utils/Response.js";
import { appLogger } from "./utils/logger.js";
import { initializeSocket } from "./socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT;
const server = http.createServer(app);

initializeSocket(server);

// const corsOptions = {
//     origin: process.env.FRONTEND_URL, // Replace with your frontend's origin
//     credentials: true // Allow sending cookies/authentication headers
// };

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    appLogger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/items', itemRouter);
app.use('/api/v1/invitations', invitationRouter);

app.use((err, req, res, next) => {
    appLogger.error('Unhandled error', { error: err.message, stack: err.stack });
    const response = Response.internalServerError('Internal server error');
    res.status(response.status).json(response.toJSON());
});

server.listen(port, () => {
    appLogger.info("Server started", { port: port, env: process.env.NODE_ENV });
    console.log("Server is listening on port " + port + ".");
});

export default app;
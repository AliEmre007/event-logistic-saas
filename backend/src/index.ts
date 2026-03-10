import app from './app';
import { prisma } from './lib/prisma';
import { getJwtSecret } from './config/env';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Fail fast for required configuration.
        getJwtSecret();

        // Attempt to connect to database
        await prisma.$connect();
        console.log('[Database] Connected successfully');

        app.listen(PORT, () => {
            console.log(`[Server] Running on port ${PORT}`);
        });
    } catch (error) {
        console.error('[Fatal Error] Unable to start server:', error);
        process.exit(1);
    }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
    console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
    // In production, you might want to gracefully shutdown
    // process.exit(1);
});

process.on('SIGTERM', async () => {
    console.log('[SIGTERM] Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
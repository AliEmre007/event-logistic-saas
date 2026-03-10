import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './utils/errors';
import authRoutes from './routes/auth.routes';
import gigRoutes from './routes/gig.routes';
import assetRoutes from './routes/asset.routes';
import invoiceRoutes from './routes/invoice.routes';
import clientRoutes from './routes/client.routes';
import locationRoutes from './routes/location.routes';
import performerRoutes from './routes/performer.routes';
import userRoutes from './routes/user.routes';
import { getCorsOrigins } from './config/env';

const app: Express = express();

const allowedCorsOrigins = getCorsOrigins();
const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedCorsOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/performers', performerRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Handle unhandled routes
app.all('*', (req: Request, res: Response, next) => {
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
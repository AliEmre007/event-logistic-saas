const DEFAULT_DEV_CORS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

export const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is required');
    }
    return secret;
};

export const getCorsOrigins = (): string[] => {
    const configured = process.env.CORS_ORIGIN
        ?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (configured && configured.length > 0) {
        return configured;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('CORS_ORIGIN is required in production');
    }

    return DEFAULT_DEV_CORS_ORIGINS;
};
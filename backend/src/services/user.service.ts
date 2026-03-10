import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';

export const getAllUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            createdAt: true,
            performerProfile: {
                select: { id: true, active: true },
            },
        },
        orderBy: { lastName: 'asc' },
    });
};

export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            createdAt: true,
            performerProfile: true,
        },
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
};

export const updateUser = async (id: string, data: { firstName?: string; lastName?: string; phone?: string; role?: 'ADMIN' | 'PERFORMER' }) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');

    return await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
        },
    });
};

export const deleteUser = async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');

    // Prevent deleting the last admin or yourself could be handled here if needed
    // For now, let's just implement basic delete

    await prisma.user.delete({ where: { id } });
};
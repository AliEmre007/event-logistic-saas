import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

const companyScope = (companyId?: string | null) => (companyId ? { companyId } : {});

export const getAllUsers = async (companyId?: string | null) => {
    return prisma.user.findMany({
        where: companyScope(companyId),
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdAt: true,
            performerProfile: {
                select: { id: true, active: true },
            },
        },
        orderBy: { lastName: 'asc' },
    });
};

export const getUserById = async (id: string, companyId?: string | null) => {
    const user = await prisma.user.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdAt: true,
            performerProfile: true,
        },
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
};

export const updateUser = async (
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string; role?: 'ADMIN' | 'PERFORMER' },
    actorId: string,
    companyId?: string | null
) => {
    const user = await prisma.user.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
    });

    if (!user) throw new NotFoundError('User not found');

    if (id === actorId && data.role && data.role !== user.role) {
        throw new BadRequestError('You cannot change your own role');
    }

    if (user.role === 'ADMIN' && data.role && data.role !== 'ADMIN') {
        const adminCount = await prisma.user.count({
            where: {
                role: 'ADMIN',
                ...companyScope(companyId),
            },
        });

        if (adminCount <= 1) {
            throw new BadRequestError('Cannot demote the last admin in the company');
        }
    }

    return prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            companyId: true,
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const deleteUser = async (id: string, actorId: string, companyId?: string | null) => {
    if (id === actorId) {
        throw new BadRequestError('You cannot delete your own account');
    }

    const user = await prisma.user.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
    });

    if (!user) throw new NotFoundError('User not found');

    if (user.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
            where: {
                role: 'ADMIN',
                ...companyScope(companyId),
            },
        });

        if (adminCount <= 1) {
            throw new BadRequestError('Cannot delete the last admin in the company');
        }
    }

    await prisma.user.delete({ where: { id } });
};
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../schema/auth.schema';
import { getJwtSecret } from '../config/env';

const signToken = (id: string, role: string, companyId?: string | null) => {
    return jwt.sign({ id, role, companyId: companyId || null }, getJwtSecret(), {
        expiresIn: '7d',
    });
};

const getOrCreateDefaultCompany = async (tx: Prisma.TransactionClient) => {
    const existing = await tx.company.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) return existing;

    return tx.company.create({
        data: { name: 'Default Entertainment Company' },
    });
};

export const registerUser = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new BadRequestError('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const newUser = await prisma.$transaction(async (tx) => {
        const trimmedCompanyName = data.companyName?.trim();

        let companyId: string;
        let assignedRole: Role;

        if (trimmedCompanyName) {
            const company = await tx.company.create({
                data: { name: trimmedCompanyName },
            });
            companyId = company.id;
            assignedRole = 'ADMIN';
        } else {
            const company = await getOrCreateDefaultCompany(tx);
            companyId = company.id;

            // Bootstrap rule per company: first account becomes ADMIN.
            const adminCount = await tx.user.count({ where: { companyId, role: 'ADMIN' } });
            assignedRole = adminCount === 0 ? 'ADMIN' : 'PERFORMER';
        }

        const user = await tx.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: assignedRole,
                companyId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                companyId: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (assignedRole === 'PERFORMER') {
            await tx.performerProfile.create({
                data: {
                    userId: user.id,
                    skills: data.skills || [],
                },
            });
        }

        return user;
    });

    const token = signToken(newUser.id, newUser.role, newUser.companyId);
    return { user: newUser, token };
};

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
        throw new UnauthorizedError('Incorrect email or password');
    }

    const token = signToken(user.id, user.role, user.companyId);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};

export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            performerProfile: true,
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user) {
        throw new UnauthorizedError('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
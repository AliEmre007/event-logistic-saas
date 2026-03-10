import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../schema/auth.schema';
import { getJwtSecret } from '../config/env';

const signToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, getJwtSecret(), {
        expiresIn: '7d',
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
        // Bootstrap rule: only the first account can become ADMIN.
        const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
        const assignedRole: Role = adminCount === 0 ? 'ADMIN' : 'PERFORMER';

        const user = await tx.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: assignedRole,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
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

    const token = signToken(newUser.id, newUser.role);
    return { user: newUser, token };
};

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
        throw new UnauthorizedError('Incorrect email or password');
    }

    const token = signToken(user.id, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};

export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            performerProfile: true,
        },
    });

    if (!user) {
        throw new UnauthorizedError('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
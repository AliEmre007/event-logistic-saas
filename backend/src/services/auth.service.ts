import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../schema/auth.schema';

const signToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecret_change_me_in_production', {
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
        const user = await tx.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: data.role,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        if (data.role === 'PERFORMER') {
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

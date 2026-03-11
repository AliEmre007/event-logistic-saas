import { prisma } from '../lib/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';

export const getAllPerformers = async (companyId?: string | null) => {
    return prisma.performerProfile.findMany({
        where: companyId ? { user: { companyId } } : {},
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    companyId: true,
                },
            },
        },
        orderBy: { user: { lastName: 'asc' } },
    });
};

export const getPerformerById = async (id: string, companyId?: string | null) => {
    const performer = await prisma.performerProfile.findFirst({
        where: {
            id,
            ...(companyId ? { user: { companyId } } : {}),
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    companyId: true,
                },
            },
            gigAssignments: {
                include: {
                    gig: {
                        include: {
                            client: true,
                            location: true,
                        },
                    },
                },
                orderBy: { gig: { startTime: 'desc' } },
            },
        },
    });

    if (!performer) throw new NotFoundError('Performer not found');
    return performer;
};

export const createPerformer = async (data: { userId: string; skills: string[] }, companyId?: string | null) => {
    // Check if user exists in company scope
    const user = await prisma.user.findFirst({
        where: {
            id: data.userId,
            ...(companyId ? { companyId } : {}),
        },
    });

    if (!user) throw new NotFoundError('User not found');
    if (user.role !== 'PERFORMER') {
        throw new BadRequestError('Only users with PERFORMER role can have a performer profile');
    }

    // Check if already has a profile
    const existing = await prisma.performerProfile.findUnique({ where: { userId: data.userId } });
    if (existing) throw new ConflictError('User already has a performer profile');

    return prisma.performerProfile.create({
        data: {
            userId: data.userId,
            skills: data.skills,
        },
        include: { user: true },
    });
};

export const updatePerformer = async (id: string, data: { skills?: string[]; active?: boolean }, companyId?: string | null) => {
    await getPerformerById(id, companyId);

    return prisma.performerProfile.update({
        where: { id },
        data,
        include: { user: true },
    });
};

export const deletePerformer = async (id: string, companyId?: string | null) => {
    await getPerformerById(id, companyId);

    // Check for active/future gig assignments
    const futureAssignments = await prisma.gigAssignment.count({
        where: {
            performerProfileId: id,
            gig: {
                startTime: { gt: new Date() },
                ...(companyId ? { companyId } : {}),
            },
        },
    });

    if (futureAssignments > 0) {
        throw new ConflictError(`Cannot delete performer: has ${futureAssignments} future gig assignment(s).`);
    }

    await prisma.performerProfile.delete({ where: { id } });
};
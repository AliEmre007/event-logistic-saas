import { prisma } from '../lib/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { CreateGigInput, UpdateGigInput, AssignPerformerInput, AssignAssetInput } from '../schema/gig.schema';

type GigAccessContext = {
    userId: string;
    role: string;
    companyId?: string | null;
};

const companyScope = (companyId?: string | null) => (companyId ? { companyId } : {});

const gigInclude = {
    client: true,
    location: true,
    assignments: { include: { performer: { include: { user: true } } } },
    assets: { include: { asset: true } },
};

const getPerformerProfileIdForUser = async (userId: string, companyId?: string | null) => {
    const profile = await prisma.performerProfile.findFirst({
        where: {
            userId,
            ...(companyId ? { user: { companyId } } : {}),
        },
        select: { id: true },
    });

    return profile?.id;
};

const getAdminGigById = async (id: string, companyId?: string | null) => {
    const gig = await prisma.gig.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
        include: gigInclude,
    });

    if (!gig) throw new NotFoundError('Gig not found');
    return gig;
};

export const getAllGigs = async (ctx: GigAccessContext) => {
    if (ctx.role === 'ADMIN') {
        return prisma.gig.findMany({
            where: companyScope(ctx.companyId),
            include: gigInclude,
            orderBy: { startTime: 'asc' },
        });
    }

    const performerProfileId = await getPerformerProfileIdForUser(ctx.userId, ctx.companyId);
    if (!performerProfileId) return [];

    return prisma.gig.findMany({
        where: {
            ...companyScope(ctx.companyId),
            assignments: {
                some: {
                    performerProfileId,
                },
            },
        },
        include: gigInclude,
        orderBy: { startTime: 'asc' },
    });
};

export const createGig = async (data: CreateGigInput, companyId?: string | null) => {
    return prisma.gig.create({
        data: {
            title: data.title,
            description: data.description,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            clientId: data.clientId,
            locationId: data.locationId,
            stage: data.stage,
            quotedAmount: data.quotedAmount,
            depositRequired: data.depositRequired,
            depositDueDate: data.depositDueDate ? new Date(data.depositDueDate) : undefined,
            depositPaidAt: data.depositPaidAt ? new Date(data.depositPaidAt) : undefined,
            companyId: companyId || undefined,
        },
    });
};

export const getGigById = async (id: string, ctx: GigAccessContext) => {
    if (ctx.role === 'ADMIN') {
        return getAdminGigById(id, ctx.companyId);
    }

    const performerProfileId = await getPerformerProfileIdForUser(ctx.userId, ctx.companyId);
    if (!performerProfileId) throw new NotFoundError('Gig not found');

    const gig = await prisma.gig.findFirst({
        where: {
            id,
            ...companyScope(ctx.companyId),
            assignments: {
                some: {
                    performerProfileId,
                },
            },
        },
        include: gigInclude,
    });

    if (!gig) throw new NotFoundError('Gig not found');
    return gig;
};

// --- CRITICAL: Conflict Prevention Logic ---

export const assignPerformer = async (gigId: string, data: AssignPerformerInput, companyId?: string | null) => {
    const gig = await getAdminGigById(gigId, companyId);

    const performer = await prisma.performerProfile.findFirst({
        where: {
            id: data.performerProfileId,
            ...(companyId ? { user: { companyId } } : {}),
        },
        select: { id: true },
    });

    if (!performer) {
        throw new BadRequestError('Performer does not belong to this company');
    }

    // Check for time overlap for this performer
    const overlappingAssignments = await prisma.gigAssignment.findMany({
        where: {
            performerProfileId: data.performerProfileId,
            gig: {
                AND: [
                    { startTime: { lt: gig.endTime } },
                    { endTime: { gt: gig.startTime } },
                ],
                ...companyScope(companyId),
            },
        },
    });

    if (overlappingAssignments.length > 0) {
        throw new ConflictError('Performer is already double-booked for this time slot.');
    }

    try {
        return await prisma.gigAssignment.create({
            data: {
                gigId,
                performerProfileId: data.performerProfileId,
            },
        });
    } catch (error: any) {
        // Handle unique constraint violation on multiple quick clicks
        if (error.code === 'P2002') {
            throw new ConflictError('Performer is already assigned to this gig.');
        }
        throw error;
    }
};

export const assignAsset = async (gigId: string, data: AssignAssetInput, companyId?: string | null) => {
    const gig = await getAdminGigById(gigId, companyId);

    // Check if asset exists in scope and if it can be assigned
    const asset = await prisma.asset.findFirst({
        where: {
            id: data.assetId,
            ...companyScope(companyId),
        },
    });
    if (!asset) throw new NotFoundError('Asset not found');

    if (['MAINTENANCE_CLEANING', 'OUT_OF_SERVICE'].includes(asset.state)) {
        throw new BadRequestError(`Cannot assign asset. Current state is: ${asset.state}`);
    }

    // Check for time overlap for this asset
    const overlappingAssets = await prisma.gigAsset.findMany({
        where: {
            assetId: data.assetId,
            gig: {
                AND: [
                    { startTime: { lt: gig.endTime } },
                    { endTime: { gt: gig.startTime } },
                ],
                ...companyScope(companyId),
            },
        },
    });

    if (overlappingAssets.length > 0) {
        throw new ConflictError('Asset is already assigned/double-booked for this time slot.');
    }

    try {
        return await prisma.gigAsset.create({
            data: {
                gigId,
                assetId: data.assetId,
            },
            include: { asset: true },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ConflictError('Asset is already assigned to this gig.');
        }
        throw error;
    }
};

export const updateGig = async (id: string, data: UpdateGigInput, companyId?: string | null) => {
    const existingGig = await getAdminGigById(id, companyId);
    const nextStartTime = data.startTime ? new Date(data.startTime) : existingGig.startTime;
    const nextEndTime = data.endTime ? new Date(data.endTime) : existingGig.endTime;
    const scheduleChanged = nextStartTime.getTime() !== existingGig.startTime.getTime()
        || nextEndTime.getTime() !== existingGig.endTime.getTime();

    if (scheduleChanged) {
        const performerIds = existingGig.assignments.map((assignment) => assignment.performerProfileId);
        if (performerIds.length > 0) {
            const performerConflict = await prisma.gigAssignment.findFirst({
                where: {
                    gigId: { not: id },
                    performerProfileId: { in: performerIds },
                    gig: {
                        AND: [
                            { startTime: { lt: nextEndTime } },
                            { endTime: { gt: nextStartTime } },
                        ],
                        ...companyScope(companyId),
                    },
                },
                include: {
                    performer: { include: { user: { select: { firstName: true, lastName: true } } } },
                    gig: { select: { title: true } },
                },
            });

            if (performerConflict) {
                const firstName = performerConflict.performer.user.firstName;
                const lastName = performerConflict.performer.user.lastName;
                throw new ConflictError(
                    `Cannot reschedule this gig. ${firstName} ${lastName} is already booked on "${performerConflict.gig.title}".`,
                );
            }
        }

        const assetIds = existingGig.assets.map((gigAsset) => gigAsset.assetId);
        if (assetIds.length > 0) {
            const assetConflict = await prisma.gigAsset.findFirst({
                where: {
                    gigId: { not: id },
                    assetId: { in: assetIds },
                    gig: {
                        AND: [
                            { startTime: { lt: nextEndTime } },
                            { endTime: { gt: nextStartTime } },
                        ],
                        ...companyScope(companyId),
                    },
                },
                include: {
                    asset: { select: { name: true } },
                    gig: { select: { title: true } },
                },
            });

            if (assetConflict) {
                throw new ConflictError(
                    `Cannot reschedule this gig. Asset "${assetConflict.asset.name}" is already in use on "${assetConflict.gig.title}".`,
                );
            }
        }
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.locationId !== undefined) updateData.locationId = data.locationId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.quotedAmount !== undefined) updateData.quotedAmount = data.quotedAmount;
    if (data.depositRequired !== undefined) updateData.depositRequired = data.depositRequired;
    if (data.depositDueDate !== undefined) updateData.depositDueDate = new Date(data.depositDueDate);
    if (data.depositPaidAt !== undefined) updateData.depositPaidAt = new Date(data.depositPaidAt);

    return prisma.gig.update({
        where: { id },
        data: updateData,
        include: gigInclude,
    });
};

export const deleteGig = async (id: string, companyId?: string | null) => {
    await getAdminGigById(id, companyId); // Ensure exists in scope
    // Cascade deletes assignments and assets via schema onDelete: Cascade
    await prisma.gig.delete({ where: { id } });
};

export const removePerformerAssignment = async (gigId: string, assignmentId: string, companyId?: string | null) => {
    await getAdminGigById(gigId, companyId);

    const assignment = await prisma.gigAssignment.findFirst({
        where: { id: assignmentId, gigId },
    });
    if (!assignment) throw new NotFoundError('Assignment not found');
    await prisma.gigAssignment.delete({ where: { id: assignmentId } });
};

export const removeAssetAssignment = async (gigId: string, gigAssetId: string, companyId?: string | null) => {
    await getAdminGigById(gigId, companyId);

    const gigAsset = await prisma.gigAsset.findFirst({
        where: { id: gigAssetId, gigId },
    });
    if (!gigAsset) throw new NotFoundError('Asset assignment not found');
    await prisma.gigAsset.delete({ where: { id: gigAssetId } });
};

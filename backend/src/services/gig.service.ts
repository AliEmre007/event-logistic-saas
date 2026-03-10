import { prisma } from '../lib/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { CreateGigInput, UpdateGigInput, AssignPerformerInput, AssignAssetInput } from '../schema/gig.schema';

export const getAllGigs = async () => {
    return await prisma.gig.findMany({
        include: {
            client: true,
            location: true,
            assignments: { include: { performer: { include: { user: true } } } },
            assets: { include: { asset: true } },
        },
        orderBy: { startTime: 'asc' },
    });
};

export const createGig = async (data: CreateGigInput) => {
    return await prisma.gig.create({
        data: {
            title: data.title,
            description: data.description,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            clientId: data.clientId,
            locationId: data.locationId,
        },
    });
};

export const getGigById = async (id: string) => {
    const gig = await prisma.gig.findUnique({
        where: { id },
        include: {
            client: true,
            location: true,
            assignments: { include: { performer: { include: { user: true } } } },
            assets: { include: { asset: true } },
        },
    });

    if (!gig) throw new NotFoundError('Gig not found');
    return gig;
};

// --- CRITICAL: Conflict Prevention Logic ---

export const assignPerformer = async (gigId: string, data: AssignPerformerInput) => {
    const gig = await getGigById(gigId);

    // Check for time overlap for this performer
    const overlappingAssignments = await prisma.gigAssignment.findMany({
        where: {
            performerProfileId: data.performerProfileId,
            gig: {
                AND: [
                    { startTime: { lt: gig.endTime } },
                    { endTime: { gt: gig.startTime } },
                ],
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

export const assignAsset = async (gigId: string, data: AssignAssetInput) => {
    const gig = await getGigById(gigId);

    // Check if asset is out of service or in maintenance
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
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

export const updateGig = async (id: string, data: UpdateGigInput) => {
    await getGigById(id); // Ensure exists

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.locationId !== undefined) updateData.locationId = data.locationId;
    if (data.status !== undefined) updateData.status = data.status;

    return await prisma.gig.update({
        where: { id },
        data: updateData,
        include: {
            client: true,
            location: true,
            assignments: { include: { performer: { include: { user: true } } } },
            assets: { include: { asset: true } },
        },
    });
};

export const deleteGig = async (id: string) => {
    await getGigById(id); // Ensure exists
    // Cascade deletes assignments and assets via schema onDelete: Cascade
    await prisma.gig.delete({ where: { id } });
};

export const removePerformerAssignment = async (gigId: string, assignmentId: string) => {
    const assignment = await prisma.gigAssignment.findFirst({
        where: { id: assignmentId, gigId },
    });
    if (!assignment) throw new NotFoundError('Assignment not found');
    await prisma.gigAssignment.delete({ where: { id: assignmentId } });
};

export const removeAssetAssignment = async (gigId: string, gigAssetId: string) => {
    const gigAsset = await prisma.gigAsset.findFirst({
        where: { id: gigAssetId, gigId },
    });
    if (!gigAsset) throw new NotFoundError('Asset assignment not found');
    await prisma.gigAsset.delete({ where: { id: gigAssetId } });
};
import { prisma } from '../lib/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { CreateGigInput, AssignPerformerInput, AssignAssetInput } from '../schema/gig.schema';

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
            include: { asset: true }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ConflictError('Asset is already assigned to this gig.');
        }
        throw error;
    }
};

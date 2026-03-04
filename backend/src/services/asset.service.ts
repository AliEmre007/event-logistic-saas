import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { CreateAssetInput, UpdateAssetStateInput } from '../schema/asset.schema';

export const getAllAssets = async () => {
    return await prisma.asset.findMany({
        include: { location: true },
        orderBy: { name: 'asc' },
    });
};

export const getAssetById = async (id: string) => {
    const asset = await prisma.asset.findUnique({
        where: { id },
        include: { location: true, gigAssets: { include: { gig: true } } },
    });
    if (!asset) throw new NotFoundError('Asset not found');
    return asset;
};

export const createAsset = async (data: CreateAssetInput) => {
    try {
        return await prisma.asset.create({
            data: {
                name: data.name,
                sku: data.sku,
                category: data.category,
                locationId: data.locationId,
            },
            include: { location: true },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new BadRequestError('An asset with this SKU already exists');
        }
        throw error;
    }
};

export const updateAsset = async (id: string, data: Partial<CreateAssetInput> & { state?: string }) => {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('Asset not found');

    return await prisma.asset.update({
        where: { id },
        data: {
            name: data.name,
            sku: data.sku,
            category: data.category,
            locationId: data.locationId,
            state: data.state as any, // Cast as any if enum compatibility is strict
        },
        include: { location: true },
    });
};

export const updateAssetState = async (id: string, data: UpdateAssetStateInput) => {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('Asset not found');

    return await prisma.asset.update({
        where: { id },
        data: { state: data.state },
    });
};

export const deleteAsset = async (id: string) => {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('Asset not found');

    // Check if asset is currently assigned to any gig
    const assignedCount = await prisma.gigAsset.count({ where: { assetId: id } });
    if (assignedCount > 0) {
        throw new BadRequestError(`Cannot delete asset: assigned to ${assignedCount} gig(s). Remove assignments first.`);
    }

    await prisma.asset.delete({ where: { id } });
};

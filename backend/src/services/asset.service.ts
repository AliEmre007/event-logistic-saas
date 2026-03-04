import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { CreateAssetInput, UpdateAssetStateInput } from '../schema/asset.schema';

export const getAllAssets = async () => {
    return await prisma.asset.findMany({
        include: { location: true },
    });
};

export const getAssetById = async (id: string) => {
    const asset = await prisma.asset.findUnique({
        where: { id },
        include: { location: true },
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
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new BadRequestError('An asset with this SKU already exists');
        }
        throw error;
    }
};

export const updateAssetState = async (id: string, data: UpdateAssetStateInput) => {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('Asset not found');

    return await prisma.asset.update({
        where: { id },
        data: { state: data.state },
    });
};

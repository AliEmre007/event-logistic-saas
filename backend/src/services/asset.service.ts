import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { CreateAssetInput, UpdateAssetInput, UpdateAssetStateInput } from '../schema/asset.schema';

const companyScope = (companyId?: string | null) => (companyId ? { companyId } : {});

export const getAllAssets = async (companyId?: string | null) => {
    return prisma.asset.findMany({
        where: companyScope(companyId),
        include: { location: true },
        orderBy: { name: 'asc' },
    });
};

export const getAssetById = async (id: string, companyId?: string | null) => {
    const asset = await prisma.asset.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
        include: { location: true, gigAssets: { include: { gig: true } } },
    });
    if (!asset) throw new NotFoundError('Asset not found');
    return asset;
};

export const createAsset = async (data: CreateAssetInput, companyId?: string | null) => {
    try {
        return await prisma.asset.create({
            data: {
                name: data.name,
                sku: data.sku,
                category: data.category,
                locationId: data.locationId,
                companyId: companyId || undefined,
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

export const updateAsset = async (id: string, data: UpdateAssetInput, companyId?: string | null) => {
    await getAssetById(id, companyId);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.locationId !== undefined) updateData.locationId = data.locationId;
    if (data.state !== undefined) updateData.state = data.state;

    try {
        return await prisma.asset.update({
            where: { id },
            data: updateData,
            include: { location: true },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new BadRequestError('An asset with this SKU already exists');
        }
        throw error;
    }
};

export const updateAssetState = async (id: string, data: UpdateAssetStateInput, companyId?: string | null) => {
    await getAssetById(id, companyId);

    return prisma.asset.update({
        where: { id },
        data: { state: data.state },
    });
};

export const deleteAsset = async (id: string, companyId?: string | null) => {
    await getAssetById(id, companyId);

    // Check if asset is currently assigned to any gig
    const assignedCount = await prisma.gigAsset.count({
        where: {
            assetId: id,
            gig: companyScope(companyId),
        },
    });

    if (assignedCount > 0) {
        throw new BadRequestError(`Cannot delete asset: assigned to ${assignedCount} gig(s). Remove assignments first.`);
    }

    await prisma.asset.delete({ where: { id } });
};
import { PrismaClient } from '@prisma/client';
import { BaseSafetyService } from './BaseSafetyService';

interface DocumentUploadParams {
  companyId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  type: string;
  title: string;
  description?: string;
  expiryDate?: Date;
  uploadedBy: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface DocumentSearchParams {
  companyId: string;
  searchTerm?: string;
  documentType?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
  page?: number;
  limit?: number;
}

/**
 * Service for managing safety-related documents
 */
export class DocumentService extends BaseSafetyService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }
  /**
   * Upload a document
   */
  async uploadDocument(params: DocumentUploadParams) {
    try {
      this.validateRequiredFields(params as unknown as Record<string, unknown>, ['companyId', 'fileName', 'fileUrl', 'fileSize', 'mimeType', 'type', 'title', 'uploadedBy']);

      const document = await this.prisma.document.create({
        data: {
          companyId: params.companyId,
          fileName: params.fileName,
          fileUrl: params.fileUrl,
          fileSize: params.fileSize,
          mimeType: params.mimeType,
          type: params.type as any,
          title: params.title,
          description: params.description,
          expiryDate: params.expiryDate,
          uploadedBy: params.uploadedBy,
          ...(params.relatedEntityType === 'driver' && { driverId: params.relatedEntityId }),
          ...(params.relatedEntityType === 'truck' && { truckId: params.relatedEntityId }),
          ...(params.relatedEntityType === 'load' && { loadId: params.relatedEntityId }),
        }
      });

      return document;
    } catch (error) {
      this.handleError(error, 'Failed to upload document');
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(params: DocumentSearchParams) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: params.companyId,
        deletedAt: null,
      };

      if (params.searchTerm) {
        where.OR = [
          { title: { contains: params.searchTerm, mode: 'insensitive' } },
          { description: { contains: params.searchTerm, mode: 'insensitive' } },
          { fileName: { contains: params.searchTerm, mode: 'insensitive' } },
        ];
      }

      if (params.documentType) {
        where.type = params.documentType;
      }

      if (params.relatedEntityType && params.relatedEntityId) {
        if (params.relatedEntityType === 'driver') {
          where.driverId = params.relatedEntityId;
        } else if (params.relatedEntityType === 'truck') {
          where.truckId = params.relatedEntityId;
        } else if (params.relatedEntityType === 'load') {
          where.loadId = params.relatedEntityId;
        }
      }

      if (params.expiryDateFrom || params.expiryDateTo) {
        where.expiryDate = {};
        if (params.expiryDateFrom) {
          where.expiryDate.gte = params.expiryDateFrom;
        }
        if (params.expiryDateTo) {
          where.expiryDate.lte = params.expiryDateTo;
        }
      }

      const [documents, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.document.count({ where })
      ]);

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.handleError(error, 'Failed to search documents');
    }
  }

  /**
   * Get expiring documents
   */
  async getExpiringDocuments(companyId: string, days: number = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + days);

      const documents = await this.prisma.document.findMany({
        where: {
          companyId,
          expiryDate: {
            lte: thresholdDate,
            gte: new Date()
          },
          deletedAt: null
        },
        orderBy: { expiryDate: 'asc' }
      });

      return documents;
    } catch (error) {
      this.handleError(error, 'Failed to get expiring documents');
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, companyId: string) {
    try {
      const document = await this.prisma.document.update({
        where: { id: documentId },
        data: { deletedAt: new Date() }
      });

      if (document.companyId !== companyId) {
        throw new Error('Unauthorized');
      }

      return document;
    } catch (error) {
      this.handleError(error, 'Failed to delete document');
    }
  }
}


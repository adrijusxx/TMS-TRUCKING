/**
 * Samsara Device Sync Service
 * 
 * Synchronizes Samsara vehicles/assets with TMS trucks/trailers.
 * Refactored to delegate logic to specialized sub-modules to comply with 500-line law.
 */

import { SamsaraSyncManager } from './samsara/SyncManager';
import { SamsaraQueueManager } from './samsara/QueueManager';
import { SyncResult, ApproveQueuedDeviceParams, ApproveQueuedDeviceResult } from './samsara/types';

export class SamsaraDeviceSyncService {
  private readonly companyId: string;
  private syncManager: SamsaraSyncManager;
  private queueManager: SamsaraQueueManager;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.syncManager = new SamsaraSyncManager();
    this.queueManager = new SamsaraQueueManager();
  }

  /**
   * Full sync of all Samsara devices
   */
  async syncAllDevices(): Promise<SyncResult> {
    return this.syncManager.syncAllDevices(this.companyId);
  }

  /**
   * Approve a queued device - create new TMS record or link if exists
   */
  async approveQueuedDevice(
    queueId: string,
    userId: string,
    additionalData?: ApproveQueuedDeviceParams
  ): Promise<ApproveQueuedDeviceResult> {
    return this.queueManager.approveQueuedDevice(queueId, userId, additionalData);
  }

  /**
   * Link a queued device to an existing TMS record
   */
  async linkQueuedDevice(
    queueId: string,
    recordId: string,
    recordType: 'TRUCK' | 'TRAILER',
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.queueManager.linkQueuedDevice(queueId, recordId, recordType, userId);
  }

  /**
   * Reject a queued device
   */
  async rejectQueuedDevice(
    queueId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.queueManager.rejectQueuedDevice(queueId, userId, reason);
  }

  /**
   * Sync odometer readings for all linked trucks
   */
  async syncOdometerReadings(): Promise<number> {
    return this.syncManager.syncOdometerReadings(this.companyId);
  }
}

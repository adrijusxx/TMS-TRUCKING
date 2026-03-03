/**
 * enum-maps.ts — All enum mapping configs as constant objects.
 * Used by SmartEnumMapper.map() for keyword-based fuzzy matching
 * and SmartEnumMapper.mapExact() for exact lookup.
 */

import {
    VendorType, CustomerType, LocationType,
    TruckStatus, TrailerStatus, EquipmentType,
    DriverStatus, DriverType,
    LoadStatus, LoadType,
    InvoiceStatus, SettlementStatus,
} from '@prisma/client';
import type { EnumMapConfig } from './SmartEnumMapper';

// --- Keyword-based (fuzzy) maps ---

export const VENDOR_TYPE_MAP: EnumMapConfig<VendorType> = {
    keywords: [
        { match: ['PARTS'], value: VendorType.PARTS_VENDOR },
        { match: ['SERVICE'], value: VendorType.SERVICE_PROVIDER },
        { match: ['FUEL'], value: VendorType.FUEL_VENDOR },
        { match: ['REPAIR', 'SHOP'], value: VendorType.REPAIR_SHOP },
        { match: ['TIRE'], value: VendorType.TIRE_SHOP },
        { match: ['SUPPLY', 'SUPPLIER'], value: VendorType.SUPPLIER },
    ],
    defaultValue: VendorType.SUPPLIER,
};

export const CUSTOMER_TYPE_MAP: EnumMapConfig<CustomerType> = {
    keywords: [
        { match: ['BROKER'], value: CustomerType.BROKER },
        { match: ['FORWARD'], value: CustomerType.FREIGHT_FORWARDER },
        { match: ['3PL', 'THIRD'], value: CustomerType.THIRD_PARTY_LOGISTICS },
    ],
    defaultValue: CustomerType.DIRECT,
};

export const LOCATION_TYPE_MAP: EnumMapConfig<LocationType> = {
    keywords: [
        { match: ['PICKUP', 'SHIPPER'], value: LocationType.PICKUP },
        { match: ['DELIVER', 'RECEIVER', 'CONSIGNEE'], value: LocationType.DELIVERY },
        { match: ['WAREHOUSE', 'WHSE', 'STORAGE'], value: LocationType.WAREHOUSE },
        { match: ['TERMINAL', 'YARD', 'LOT'], value: LocationType.TERMINAL },
        { match: ['CUSTOMER'], value: LocationType.CUSTOMER },
        { match: ['VENDOR'], value: LocationType.VENDOR },
        { match: ['REPAIR', 'SHOP', 'SERVICE'], value: LocationType.REPAIR_SHOP },
        { match: ['FUEL', 'TRUCKSTOP', 'DAT'], value: LocationType.FUEL_STOP },
        { match: ['SCALE'], value: LocationType.SCALE },
    ],
    defaultValue: LocationType.PICKUP,
};

export const TRUCK_STATUS_MAP: EnumMapConfig<TruckStatus> = {
    keywords: [
        { match: ['IN_USE', 'INUSE', 'ACTIVE'], value: TruckStatus.IN_USE },
        { match: ['MAINT', 'SHOP', 'REPAIR'], value: TruckStatus.MAINTENANCE },
        { match: ['OUT', 'DOWN', 'SERVICE'], value: TruckStatus.OUT_OF_SERVICE },
        { match: ['INACTIVE', 'QUIT'], value: TruckStatus.INACTIVE },
        { match: ['AVAIL', 'READY', 'OK'], value: TruckStatus.AVAILABLE },
    ],
    defaultValue: TruckStatus.AVAILABLE,
};

export const TRAILER_STATUS_MAP: EnumMapConfig<TrailerStatus> = {
    keywords: [
        { match: ['IN_USE', 'INUSE', 'ACTIVE'], value: TrailerStatus.IN_USE },
        { match: ['MAINT', 'SHOP'], value: TrailerStatus.MAINTENANCE },
        { match: ['OUT', 'SERVICE'], value: TrailerStatus.OUT_OF_SERVICE },
        { match: ['INACTIVE'], value: TrailerStatus.INACTIVE },
        { match: ['REPAIR'], value: TrailerStatus.NEEDS_REPAIR },
    ],
    defaultValue: TrailerStatus.AVAILABLE,
};

export const EQUIPMENT_TYPE_MAP: EnumMapConfig<EquipmentType> = {
    keywords: [
        { match: ['REEFER', 'REF'], value: EquipmentType.REEFER },
        { match: ['FLAT', 'FB'], value: EquipmentType.FLATBED },
        { match: ['STEP', 'SD'], value: EquipmentType.STEP_DECK },
        { match: ['TANK'], value: EquipmentType.TANKER },
        { match: ['VAN', 'DRY'], value: EquipmentType.DRY_VAN },
    ],
    defaultValue: EquipmentType.DRY_VAN,
};

/** Trailer type — same as equipment but without STEP_DECK */
export const TRAILER_TYPE_MAP: EnumMapConfig<EquipmentType> = {
    keywords: [
        { match: ['REEFER', 'REF'], value: EquipmentType.REEFER },
        { match: ['FLAT', 'FB'], value: EquipmentType.FLATBED },
        { match: ['TANK'], value: EquipmentType.TANKER },
        { match: ['VAN', 'DRY'], value: EquipmentType.DRY_VAN },
    ],
    defaultValue: EquipmentType.DRY_VAN,
};

export const DRIVER_STATUS_MAP: EnumMapConfig<DriverStatus> = {
    keywords: [
        { match: ['AVAILABLE', 'AVAIL', 'READY'], value: DriverStatus.AVAILABLE },
        { match: ['DRIVING', 'ACTIVE'], value: DriverStatus.DRIVING },
        { match: ['TRANSIT'], value: DriverStatus.IN_TRANSIT },
        { match: ['ON_DUTY', 'ON DUTY'], value: DriverStatus.ON_DUTY },
        { match: ['OFF'], value: DriverStatus.OFF_DUTY },
        { match: ['LEAVE'], value: DriverStatus.ON_LEAVE },
        { match: ['INACTIVE', 'QUIT'], value: DriverStatus.INACTIVE },
    ],
    defaultValue: DriverStatus.AVAILABLE,
};

export const DRIVER_TYPE_MAP: EnumMapConfig<DriverType> = {
    keywords: [
        { match: ['OWNER'], value: DriverType.OWNER_OPERATOR },
        { match: ['LEASE'], value: DriverType.LEASE },
        { match: ['COMPANY', 'EMP'], value: DriverType.COMPANY_DRIVER },
    ],
    defaultValue: DriverType.COMPANY_DRIVER,
};

export const LOAD_STATUS_MAP: EnumMapConfig<LoadStatus> = {
    keywords: [
        { match: ['PENDING', 'OPEN', 'AVAILABLE'], value: LoadStatus.PENDING },
        { match: ['ASSIGNED', 'COVERED', 'DISPATCHED'], value: LoadStatus.ASSIGNED },
        { match: ['PICK', 'LOADING'], value: LoadStatus.AT_PICKUP },
        { match: ['TRANSIT', 'ROUTE'], value: LoadStatus.EN_ROUTE_DELIVERY },
        { match: ['DELIVERED', 'COMPLETED', 'DONE'], value: LoadStatus.DELIVERED },
        { match: ['INVOICE', 'BILLED'], value: LoadStatus.INVOICED },
        { match: ['PAID'], value: LoadStatus.PAID },
        { match: ['CANCEL'], value: LoadStatus.CANCELLED },
    ],
    defaultValue: LoadStatus.PENDING,
};

export const LOAD_TYPE_MAP: EnumMapConfig<LoadType> = {
    keywords: [
        { match: ['LTL', 'PARTIAL', 'LESS'], value: LoadType.LTL },
        { match: ['FTL', 'FULL', 'VAN'], value: LoadType.FTL },
        { match: ['INTERMODAL', 'RAIL', 'CONTAINER'], value: LoadType.INTERMODAL },
    ],
    defaultValue: LoadType.FTL,
};

export const INVOICE_STATUS_MAP: EnumMapConfig<InvoiceStatus> = {
    keywords: [
        { match: ['PAID'], value: InvoiceStatus.PAID },
        { match: ['SENT'], value: InvoiceStatus.SENT },
        { match: ['DRAFT'], value: InvoiceStatus.DRAFT },
        { match: ['OVERDUE'], value: InvoiceStatus.OVERDUE },
    ],
    defaultValue: InvoiceStatus.DRAFT,
};

export const SETTLEMENT_STATUS_MAP: EnumMapConfig<SettlementStatus> = {
    keywords: [
        { match: ['PAID'], value: SettlementStatus.PAID },
        { match: ['APPROV'], value: SettlementStatus.APPROVED },
        { match: ['PEND'], value: SettlementStatus.PENDING },
    ],
    defaultValue: SettlementStatus.PENDING,
};

// --- Exact-match maps (for Lead importer) ---

export const LEAD_STATUS_MAP: Record<string, string> = {
    new: 'NEW', contacted: 'CONTACTED', qualified: 'QUALIFIED',
    'docs pending': 'DOCUMENTS_PENDING', 'documents pending': 'DOCUMENTS_PENDING', documents_pending: 'DOCUMENTS_PENDING',
    'docs collected': 'DOCUMENTS_COLLECTED', 'documents collected': 'DOCUMENTS_COLLECTED', documents_collected: 'DOCUMENTS_COLLECTED',
    interview: 'INTERVIEW', offer: 'OFFER', hired: 'HIRED', rejected: 'REJECTED',
};

export const LEAD_PRIORITY_MAP: Record<string, string> = {
    hot: 'HOT', high: 'HOT', warm: 'WARM', medium: 'WARM', cold: 'COLD', low: 'COLD',
};

export const LEAD_SOURCE_MAP: Record<string, string> = {
    facebook: 'FACEBOOK', fb: 'FACEBOOK', 'facebook ads': 'FACEBOOK', instagram: 'FACEBOOK',
    referral: 'REFERRAL', 'word of mouth': 'REFERRAL', referred: 'REFERRAL',
    direct: 'DIRECT', 'walk-in': 'DIRECT', 'walk in': 'DIRECT', phone: 'DIRECT',
    website: 'WEBSITE', web: 'WEBSITE', online: 'WEBSITE',
    other: 'OTHER',
};

export const CDL_CLASS_MAP: Record<string, string> = {
    a: 'A', 'class a': 'A', 'cdl a': 'A',
    b: 'B', 'class b': 'B', 'cdl b': 'B',
    c: 'C', 'class c': 'C', 'cdl c': 'C',
};

// --- User role map (keyword-based, entity-aware) ---

export function mapUserRole(value: any, entity?: string): string {
    if (!value) {
        if (entity === 'dispatchers' || entity === 'employees') return 'DISPATCHER';
        return 'DISPATCHER';
    }
    const v = String(value).toUpperCase().trim();
    if (v.includes('ADMIN')) return 'ADMIN';
    if (v.includes('DISPATCH')) return 'DISPATCHER';
    if (v.includes('ACCOUNT') || v.includes('BILLING')) return 'ACCOUNTANT';
    if (v.includes('DRIVER')) return 'DRIVER';
    if (v.includes('SUPER')) return 'SUPER_ADMIN';
    return 'DISPATCHER';
}

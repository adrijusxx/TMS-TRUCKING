'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Expected fields for each entity type
export const ENTITY_FIELDS: Record<string, { key: string; label: string; required: boolean; aliases: string[] }[]> = {
    drivers: [
        { key: 'firstName', label: 'First Name', required: true, aliases: ['first name', 'firstname', 'first', 'fname', 'given name'] },
        { key: 'lastName', label: 'Last Name', required: true, aliases: ['last name', 'lastname', 'last', 'lname', 'surname', 'family name'] },
        { key: 'email', label: 'Email', required: false, aliases: ['email', 'e-mail', 'email address'] },
        { key: 'phone', label: 'Phone', required: false, aliases: ['phone', 'phone number', 'contact number', 'mobile', 'cell'] },
        { key: 'licenseNumber', label: 'License Number', required: false, aliases: ['license number', 'cdl number', 'license', 'cdl', 'driver license'] },
        { key: 'licenseState', label: 'License State', required: false, aliases: ['license state', 'cdl state', 'state', 'dl state'] },
        { key: 'licenseExpiry', label: 'License Expiry', required: false, aliases: ['license expiry', 'license expiration', 'cdl expiry', 'cdl exp'] },
        { key: 'medicalCardExpiry', label: 'Medical Card Expiry', required: false, aliases: ['medical card expiry', 'medical expiry', 'med card exp', 'medical'] },
        { key: 'dob', label: 'Date of Birth', required: false, aliases: ['dob', 'date of birth', 'birthday', 'birth date'] },
        { key: 'hireDate', label: 'Hire Date', required: false, aliases: ['hire date', 'start date', 'employment date', 'hired'] },
        { key: 'payRate', label: 'Pay Rate', required: false, aliases: ['pay rate', 'rate', 'driver tariff', 'salary', 'wage'] },
        { key: 'driverType', label: 'Driver Type', required: false, aliases: ['driver type', 'type', 'employment type', 'classification'] },
    ],
    trucks: [
        { key: 'truckNumber', label: 'Truck/Unit Number', required: true, aliases: ['truck number', 'unit number', 'truck', 'unit', 'truck #', 'unit #', 'vehicle number'] },
        { key: 'vin', label: 'VIN', required: false, aliases: ['vin', 'vehicle identification number', 'vin number'] },
        { key: 'make', label: 'Make', required: false, aliases: ['make', 'manufacturer', 'brand'] },
        { key: 'model', label: 'Model', required: false, aliases: ['model', 'truck model'] },
        { key: 'year', label: 'Year', required: false, aliases: ['year', 'model year', 'mfg year'] },
        { key: 'licensePlate', label: 'License Plate', required: false, aliases: ['license plate', 'plate', 'plate number', 'tag'] },
        { key: 'state', label: 'State', required: false, aliases: ['state', 'registration state', 'plate state'] },
    ],
    trailers: [
        { key: 'trailerNumber', label: 'Trailer/Unit Number', required: true, aliases: ['trailer number', 'unit number', 'trailer', 'unit', 'trailer #'] },
        { key: 'vin', label: 'VIN', required: false, aliases: ['vin', 'vehicle identification number'] },
        { key: 'make', label: 'Make', required: false, aliases: ['make', 'manufacturer'] },
        { key: 'year', label: 'Year', required: false, aliases: ['year', 'model year'] },
        { key: 'type', label: 'Type', required: false, aliases: ['type', 'trailer type', 'equipment type'] },
        { key: 'licensePlate', label: 'License Plate', required: false, aliases: ['license plate', 'plate', 'plate number'] },
    ],
    customers: [
        { key: 'name', label: 'Company Name', required: true, aliases: ['name', 'company name', 'customer name', 'customer', 'company'] },
        { key: 'email', label: 'Email', required: false, aliases: ['email', 'contact email', 'e-mail'] },
        { key: 'phone', label: 'Phone', required: false, aliases: ['phone', 'phone number', 'contact'] },
        { key: 'address', label: 'Address', required: false, aliases: ['address', 'street address', 'street'] },
        { key: 'city', label: 'City', required: false, aliases: ['city'] },
        { key: 'state', label: 'State', required: false, aliases: ['state', 'st'] },
        { key: 'zip', label: 'ZIP Code', required: false, aliases: ['zip', 'zip code', 'postal code', 'zipcode'] },
    ],
    loads: [
        { key: 'loadNumber', label: 'Load Number', required: true, aliases: ['load number', 'load #', 'load', 'order number'] },
        { key: 'customerRef', label: 'Customer Reference', required: false, aliases: ['customer ref', 'reference', 'ref', 'po number'] },
        { key: 'rate', label: 'Rate', required: false, aliases: ['rate', 'amount', 'price', 'revenue'] },
        { key: 'originCity', label: 'Origin City', required: false, aliases: ['origin city', 'pickup city', 'from city', 'origin'] },
        { key: 'originState', label: 'Origin State', required: false, aliases: ['origin state', 'pickup state', 'from state'] },
        { key: 'destCity', label: 'Destination City', required: false, aliases: ['destination city', 'dest city', 'delivery city', 'to city', 'destination'] },
        { key: 'destState', label: 'Destination State', required: false, aliases: ['destination state', 'dest state', 'delivery state', 'to state'] },
        { key: 'pickupDate', label: 'Pickup Date', required: false, aliases: ['pickup date', 'pick up date', 'load date'] },
        { key: 'deliveryDate', label: 'Delivery Date', required: false, aliases: ['delivery date', 'drop date', 'deliver date'] },
    ],
};

interface ColumnMapperProps {
    entityType: string;
    sourceColumns: string[];
    onMappingComplete: (mapping: Record<string, string>) => void;
    onCancel: () => void;
}

export function ColumnMapper({ entityType, sourceColumns, onMappingComplete, onCancel }: ColumnMapperProps) {
    const expectedFields = ENTITY_FIELDS[entityType] || [];

    // Auto-detect initial mappings based on aliases
    const initialMapping = useMemo(() => {
        const mapping: Record<string, string> = {};

        for (const field of expectedFields) {
            const normalizedAliases = field.aliases.map(a => a.toLowerCase().trim());

            for (const col of sourceColumns) {
                const normalizedCol = col.toLowerCase().trim();
                if (normalizedAliases.includes(normalizedCol) || normalizedCol === field.key.toLowerCase()) {
                    mapping[field.key] = col;
                    break;
                }
            }
        }

        return mapping;
    }, [expectedFields, sourceColumns]);

    const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

    const handleMappingChange = (fieldKey: string, sourceColumn: string) => {
        setMapping(prev => ({
            ...prev,
            [fieldKey]: sourceColumn === '__skip__' ? '' : sourceColumn
        }));
    };

    const requiredFieldsMapped = useMemo(() => {
        return expectedFields
            .filter(f => f.required)
            .every(f => mapping[f.key] && mapping[f.key] !== '');
    }, [expectedFields, mapping]);

    const mappedCount = Object.values(mapping).filter(v => v && v !== '').length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Map Your Columns</h3>
                    <p className="text-sm text-muted-foreground">
                        Match your file columns to our expected fields
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">{mappedCount} auto-detected</span>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {expectedFields.map((field) => {
                    const isMapped = mapping[field.key] && mapping[field.key] !== '';

                    return (
                        <div
                            key={field.key}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                isMapped ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        isMapped ? "text-green-400" : "text-foreground"
                                    )}>
                                        {field.label}
                                    </span>
                                    {field.required && (
                                        <span className="text-xs text-red-400">*Required</span>
                                    )}
                                </div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                            <Select
                                value={mapping[field.key] || '__skip__'}
                                onValueChange={(val) => handleMappingChange(field.key, val)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select column..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__skip__">
                                        <span className="text-muted-foreground">— Skip —</span>
                                    </SelectItem>
                                    {sourceColumns.map((col) => (
                                        <SelectItem key={col} value={col}>
                                            {col}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {isMapped && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                        </div>
                    );
                })}
            </div>

            {!requiredFieldsMapped && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 text-yellow-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Please map all required fields to continue
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onMappingComplete(mapping)}
                    disabled={!requiredFieldsMapped}
                    className="bg-purple-600 hover:bg-purple-500"
                >
                    Apply Mapping
                </Button>
            </div>
        </div>
    );
}

/**
 * Apply a column mapping to raw data records
 */
export function applyMapping(
    records: Record<string, any>[],
    mapping: Record<string, string>
): Record<string, any>[] {
    return records.map(record => {
        const mapped: Record<string, any> = {};

        for (const [targetField, sourceColumn] of Object.entries(mapping)) {
            if (sourceColumn && record[sourceColumn] !== undefined) {
                mapped[targetField] = record[sourceColumn];
            }
        }

        // Also include any unmapped fields as-is (for flexibility)
        for (const [key, value] of Object.entries(record)) {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
            if (!Object.values(mapping).includes(key)) {
                mapped[normalizedKey] = value;
            }
        }

        return mapped;
    });
}

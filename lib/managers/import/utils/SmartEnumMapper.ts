/**
 * SmartEnumMapper — keyword-based fuzzy enum matching.
 * Replaces 14+ inline mapXxxSmart() methods across importers.
 */

export interface EnumMapConfig<T> {
    /** Keyword → enum value mapping. Checked with `.includes()` on uppercased input. */
    keywords: Array<{ match: string[]; value: T }>;
    /** Default value if no keyword matches or input is empty. */
    defaultValue: T;
}

export class SmartEnumMapper {
    /**
     * Fuzzy-match a string value to an enum using keyword inclusion.
     * Each keyword group is checked in order; first match wins.
     */
    static map<T>(value: any, config: EnumMapConfig<T>): T {
        if (!value) return config.defaultValue;
        const v = String(value).toUpperCase().trim();

        for (const entry of config.keywords) {
            if (entry.match.some(kw => v.includes(kw))) {
                return entry.value;
            }
        }

        return config.defaultValue;
    }

    /**
     * Exact-match a string value to an enum using a lookup table.
     * Input is lowercased and trimmed before lookup.
     */
    static mapExact<T>(value: any, lookup: Record<string, T>, defaultValue: T): T {
        if (!value) return defaultValue;
        const key = String(value).trim().toLowerCase();
        return lookup[key] ?? defaultValue;
    }
}

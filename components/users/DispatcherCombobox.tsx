'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn, apiUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';

interface StaffUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: string;
}

interface DispatcherComboboxProps {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    defaultDispatcher?: {
        id: string;
        firstName: string;
        lastName: string;
        role?: string;
    };
}

async function fetchStaff(search?: string) {
    const url = search
        ? apiUrl(`/api/users/staff?limit=100&search=${encodeURIComponent(search)}`)
        : apiUrl('/api/users/staff?limit=100');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch staff');
    return response.json();
}

export default function DispatcherCombobox({
    value,
    onValueChange,
    placeholder = 'Select dispatcher...',
    className,
    disabled,
    defaultDispatcher,
}: DispatcherComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data: staffData, isLoading } = useQuery({
        queryKey: ['staff', searchQuery],
        queryFn: () => fetchStaff(searchQuery),
    });

    const staff: StaffUser[] = staffData?.data || [];

    // Filter for relevant roles if needed, though API returns non-drivers.
    // We can prioritize DISPATCHER and ADMIN.
    const relevantStaff = staff.filter(u =>
        ['DISPATCHER', 'ADMIN', 'SUPER_ADMIN'].includes(u.role)
    );

    const selectedUser = staff.find((u) => u.id === value) || (value === defaultDispatcher?.id ? (defaultDispatcher as StaffUser) : undefined);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn('h-9 w-full justify-between font-normal', className)}
                >
                    {selectedUser ? (
                        <span className="truncate">
                            {selectedUser.firstName} {selectedUser.lastName}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search dispatchers..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                                Loading...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>
                                    <div className="py-6 text-center text-xs text-muted-foreground">
                                        {searchQuery ? 'No dispatchers found.' : 'Start typing to search...'}
                                    </div>
                                </CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="none"
                                        onSelect={() => {
                                            onValueChange('');
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                !value ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <span>None</span>
                                    </CommandItem>
                                    {relevantStaff.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.id}
                                            onSelect={() => {
                                                onValueChange(user.id);
                                                setOpen(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    value === user.id ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

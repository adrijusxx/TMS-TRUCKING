'use client';

interface TruckInlineEditProps {
    row: any;
    onSave: () => void;
    onCancel: () => void;
}

export default function TruckInlineEdit({ row, onSave, onCancel }: TruckInlineEditProps) {
    return (
        <div className="p-4 border rounded bg-muted/20">
            <p className="text-sm font-medium">Inline editing for truck: {row.truckNumber}</p>
            <div className="flex gap-2 mt-2">
                <button onClick={onSave} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Save</button>
                <button onClick={onCancel} className="text-xs px-2 py-1 border rounded">Cancel</button>
            </div>
        </div>
    );
}

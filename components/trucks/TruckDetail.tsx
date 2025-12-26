'use client';

import EditTruckForm from './EditTruckForm';

interface TruckDetailProps {
    truck: any;
    onClose?: () => void;
}

export default function TruckDetail({ truck, onClose }: TruckDetailProps) {
    return (
        <div className="p-4">
            <EditTruckForm
                truck={truck}
                onCancel={onClose}
                onSuccess={onClose}
            />
        </div>
    );
}

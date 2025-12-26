'use client';

import EditTrailerForm from './EditTrailerForm';

interface TrailerDetailProps {
    trailer: any;
    onClose?: () => void;
}

export default function TrailerDetail({ trailer, onClose }: TrailerDetailProps) {
    return (
        <div className="p-4">
            <EditTrailerForm
                trailer={trailer}
                onCancel={onClose}
                onSuccess={onClose}
            />
        </div>
    );
}

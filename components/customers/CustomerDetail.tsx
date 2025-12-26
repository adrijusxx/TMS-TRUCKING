'use client';

import EditCustomerForm from './EditCustomerForm';

interface CustomerDetailProps {
    customer: any;
    onClose?: () => void;
}

export default function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
    return (
        <div className="p-4">
            <EditCustomerForm
                customer={customer}
                onCancel={onClose}
                onSuccess={onClose}
            />
        </div>
    );
}

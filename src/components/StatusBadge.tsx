import { CardStatus } from '../types';

interface StatusBadgeProps {
    status: CardStatus | string;
}

const labels: Record<string, string> = {
    created: 'Awaiting Payment',
    funding: 'Loading BTC…',
    active: 'Active',
    redeemed: 'Redeemed',
    expired: 'Expired',
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const label = labels[status] ?? status;
    const cls = {
        created: 'badge-created',
        funding: 'badge-funding',
        active: 'badge-active',
        redeemed: 'badge-redeemed',
        expired: 'badge-expired',
    }[status] ?? 'badge';

    return <span className={cls}>{label}</span>;
};

export default StatusBadge;

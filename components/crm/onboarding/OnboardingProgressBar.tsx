'use client';

interface OnboardingProgressBarProps {
    progress: number;
    size?: 'sm' | 'md';
}

export default function OnboardingProgressBar({ progress, size = 'md' }: OnboardingProgressBarProps) {
    const height = size === 'sm' ? 'h-2' : 'h-3';
    const color = progress === 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-orange-500';

    return (
        <div className={`w-full ${height} bg-muted rounded-full overflow-hidden`}>
            <div
                className={`${height} ${color} rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

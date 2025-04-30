/**
 * Time frame selector component with minimalist design for the Review section
 */
import { KnowledgeTimeFrameType } from '@/app/types/review';

interface TimeFrameSelectorProps {
  selectedTimeFrame: KnowledgeTimeFrameType;
  onSelect: (timeFrame: KnowledgeTimeFrameType) => void;
}

export function TimeFrameSelector({ selectedTimeFrame, onSelect }: TimeFrameSelectorProps) {
  const timeFrames: { id: KnowledgeTimeFrameType; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  return (
    <div className='flex items-center'>
      <span className='mr-3 text-xs font-medium text-slate-500'>View:</span>
      <div className='flex rounded-lg p-0.5'>
        {timeFrames.map((timeFrame) => (
          <button
            key={timeFrame.id}
            onClick={() => onSelect(timeFrame.id)}
            className={`rounded px-4 py-1.5 text-xs font-medium transition-all ${
              selectedTimeFrame === timeFrame.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
            aria-pressed={selectedTimeFrame === timeFrame.id}
          >
            {timeFrame.label}
          </button>
        ))}
      </div>
    </div>
  );
}

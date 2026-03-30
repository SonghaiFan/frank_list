import { Plus } from 'lucide-react';
import type { AppMode, Group } from '@/lib/notebook-types';
import { cn } from '@/lib/cn';

interface GroupTabsProps {
  activeGroupId: string;
  groups: Group[];
  mode: AppMode;
  onCreateGroup: () => void;
  onSelectGroup: (groupId: string) => void;
}

export function GroupTabs({
  activeGroupId,
  groups,
  mode,
  onCreateGroup,
  onSelectGroup,
}: GroupTabsProps) {
  return (
    <div className="mb-3 px-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all',
              group.id === activeGroupId
                ? 'border-klein bg-klein text-white shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-500 hover:border-klein hover:text-klein'
            )}
            title={group.id}
          >
            {group.title}
          </button>
        ))}
        {mode === 'edit' && (
          <button
            onClick={onCreateGroup}
            className="shrink-0 rounded-full border border-dashed border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition-all hover:border-klein hover:text-klein flex items-center gap-2"
          >
            <Plus size={14} />
            新建一组
          </button>
        )}
      </div>
      <div className="ui-mono px-1 opacity-45">当前组 ID: {activeGroupId}</div>
    </div>
  );
}

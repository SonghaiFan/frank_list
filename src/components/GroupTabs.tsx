import { Plus } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';
import type { AppMode, Group } from '@/lib/notebook-types';
import { cn } from '@/lib/cn';
import { useI18n } from '@/hooks/useI18n';
import { layoutSpring } from '@/lib/motion';

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
  const { t } = useI18n();

  return (
    <>
      <LayoutGroup id="group-tabs">
        <nav className="mb-3 flex items-center gap-2 overflow-x-auto px-2 pb-2 no-scrollbar" aria-label={t('groupTabs.currentGroupId', { id: activeGroupId })}>
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;

            return (
              <motion.button
                key={group.id}
                type="button"
                layout="position"
                transition={{ layout: layoutSpring }}
                onClick={() => onSelectGroup(group.id)}
                className={cn(
                  'relative isolate shrink-0 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-klein text-white shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:border-klein hover:text-klein'
                )}
                title={group.id}
              >
                {isActive && (
                  <motion.span
                    layoutId="group-tabs-active-pill"
                    className="absolute inset-0 rounded-full bg-klein"
                    transition={{ layout: layoutSpring }}
                  />
                )}
                <span className="relative z-10">{group.title}</span>
              </motion.button>
            );
          })}
          {mode === 'edit' && (
            <motion.button
              type="button"
              layout="position"
              transition={{ layout: layoutSpring }}
              onClick={onCreateGroup}
              className="flex shrink-0 items-center gap-2 rounded-full border border-dashed border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:border-klein hover:text-klein"
            >
              <Plus size={14} />
              {t('groupTabs.newGroup')}
            </motion.button>
          )}
        </nav>
      </LayoutGroup>
      <div className="ui-mono px-1 opacity-45">{t('groupTabs.currentGroupId', { id: activeGroupId })}</div>
    </>
  );
}

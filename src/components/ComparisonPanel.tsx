import { motion } from 'motion/react';
import type { Group, ListItem } from '../lib/notebook-types';
import { cn } from '../lib/cn';

interface ComparisonPanelProps {
  comparison: {
    bothDone: ListItem[];
    bothNotDone: ListItem[];
    heDoneINot: ListItem[];
    iDoneHeNot: ListItem[];
  };
  group: Group;
}

export function ComparisonPanel({ comparison, group }: ComparisonPanelProps) {
  return (
    <motion.div
      key={`result-${group.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="hybrid-paper"
    >
      <div className="paper-lines">
        <div className="paper-content pt-3">
          <div className="mb-4 border-b border-neutral-100 on-lines">
            <div className="ui-label text-klein">Comparison</div>
            <div className="list-text">{group.title}</div>
          </div>
          <ResultSection title="共同完成" items={comparison.bothDone} color="bg-klein" />
          <ResultSection title="我已完成" items={comparison.iDoneHeNot} color="bg-neutral-800" />
          <ResultSection title="对方已完成" items={comparison.heDoneINot} color="bg-neutral-400" />
          <ResultSection title="都没有完成" items={comparison.bothNotDone} color="bg-neutral-200" />
        </div>
      </div>
    </motion.div>
  );
}

function ResultSection({ title, items, color }: { title: string; items: ListItem[]; color: string }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-3 border-b border-neutral-100 on-lines">
        <div className={cn('w-1.5 h-4 rounded-full', color)} />
        <span className="ui-label text-neutral-400">{title}</span>
        <span className="ui-mono ml-auto">[{items.length}]</span>
      </h3>
      <ul className="space-y-0">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-neutral-200 shrink-0" />
            <span className="list-text on-lines text-neutral-700 flex-1">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

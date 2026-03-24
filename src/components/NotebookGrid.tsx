import React from 'react';
import { motion } from 'motion/react';
import { Group } from '../lib/notebook-types';
import { ClosedNotebook } from './ClosedNotebook';

interface NotebookGridProps {
    groups: Group[];
    ticks: Record<string, boolean>;
    onSelectGroup: (group: Group) => void;
}

export function NotebookGrid({ groups, ticks, onSelectGroup }: NotebookGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 p-8 place-items-center">
            {groups.map((group) => {
                const totalItems = group.items.length;
                const completedItems = group.items.filter(item => ticks[item.id]).length;
                
                return (
                    <ClosedNotebook
                        key={group.id}
                        group={group}
                        totalItems={totalItems}
                        completedItems={completedItems}
                        onClick={() => onSelectGroup(group)}
                    />
                );
            })}
        </div>
    );
}

import React from 'react';
import { motion } from 'motion/react';
import { CardCover } from './CardCover';
import { Group } from '../lib/notebook-types';
import { PAGE_CARD_HEIGHT_PX, PAGE_CARD_WIDTH_PX } from '../lib/workspace-constants';
import { cn } from '../lib/cn';

interface ClosedNotebookProps {
    group: Group;
    onClick: () => void;
    totalItems: number;
    completedItems: number;
}

export function ClosedNotebook({ group, onClick, totalItems, completedItems }: ClosedNotebookProps) {
    return (
        <motion.div 
            className="flex flex-col items-center gap-4 cursor-pointer group"
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="relative">
                {/* Paper stack effect behind */}
                 <div
                    className="absolute inset-0 bg-white rounded-[4px] border border-neutral-200 shadow-sm translate-x-1 translate-y-1"
                    style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${PAGE_CARD_HEIGHT_PX}px` }}
                />
                <div
                    className="absolute inset-0 bg-white rounded-[4px] border border-neutral-200 shadow-sm translate-x-2 translate-y-2"
                    style={{ width: `${PAGE_CARD_WIDTH_PX}px`, height: `${PAGE_CARD_HEIGHT_PX}px` }}
                />
                
                {/* The Cover */}
                <div>
                    <CardCover 
                        className="shadow-[0_20px_40px_rgba(0,0,0,0.1)] group-hover:shadow-[0_30px_60px_rgba(0,47,167,0.15)] transition-shadow duration-300"
                    />
                </div>

                {/* Spine overlay to hint at book structure */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/5 to-transparent pointer-events-none rounded-l-[4px]" />
            </div>

            <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-neutral-800 group-hover:text-klein transition-colors">
                    {group.title}
                </h3>
                <p className="font-mono text-xs text-neutral-400">
                    {completedItems} / {totalItems} ITEMS
                </p>
            </div>
        </motion.div>
    );
}

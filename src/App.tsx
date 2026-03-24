import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Check, Plus, Trash2, ArrowLeft, Users, Heart, Info, X, QrCode, RotateCcw } from 'lucide-react';
import LZString from 'lz-string';
import { QRCodeCanvas } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Default bucket list items
const DEFAULT_ITEMS = [
  "送礼物", "被送礼物", "暗恋", "明恋", "失恋", "表白", "被表白",
  "留长发", "剪短发", "染发", "漂发", "烫发", "化妆", "做美甲",
  "放下一个人", "有过遗憾", "爱而不得", "双向奔赴", "当海王",
  "拒绝他人表白", "表白被拒", "被渣", "犯过傻", "装糊涂", "犯校规", "打架",
  "迟到", "旷课", "上课睡觉", "被叫家长", "喝酒", "抽烟", "纹身", "去清吧", "和朋友去KTV", "断片失眠一天",
  "吵架", "绝交", "晚上一个人哭", "捐血", "住院", "做手术", "晕倒", "会做饭", "做一桌菜",
  "做饭给家人", "做甜品给喜欢的人", "有超过10年的好朋友", "有个无条件可信任的朋友",
  "买花", "被送花", "给自己买礼物", "通宵补作业", "一个人散步", "夜跑", "深夜散心",
  "向陌生人吐露心声", "一个人出去吃饭", "一个人看电影", "摄影", "一个人去酒吧",
  "一个人过生日", "一个人逛超市", "一个人去图书馆", "一个人看病", "一个人去唱歌", "社死过",
  "一个人出门远行", "一个人在外难过", "给自己写信", "出国一个人旅游", "跟朋友旅游",
  "拥有要好的异性朋友", "谈恋爱", "考试不及格", "考试第一名", "当班干部", "竞选学生会",
  "上电视", "上报纸", "登台演出", "主持节目", "演讲", "野性消费", "买东西被宰",
  "被老师点名表扬", "被老师点名批评", "全校表扬", "被背叛", "被害", "被坚定选择", "获奖",
  "学一种语言", "写论文", "写书", "写诗", "写日记", "写剧本", "写歌", "拍影片"
];

// Helper to generate a consistent color from a string ID
const getColorFromId = (id: string) => {
  if (!id || id === 'local') return 'bg-neutral-200';
  const colors = [
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 
    'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 
    'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400', 
    'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const DEFAULT_ITEMS_INDEX_MAP = Object.fromEntries(DEFAULT_ITEMS.map((item, idx) => [item, idx]));

// Compact data structure for sharing
interface CompactListData {
  v: number; // version
  o: string; // ownerId
  i: (number | [number, number] | string)[]; // items (index, range [start, end], or custom string)
  t: string; // ticks as bitmask string "1010..."
}

const compressList = (items: string[], ticks: Record<string, boolean>, ownerId: string): CompactListData => {
  const compressedItems: (number | [number, number] | string)[] = [];
  let rangeStart = -1;
  let lastIdx = -1;

  const flushRange = () => {
    if (rangeStart !== -1) {
      if (rangeStart === lastIdx) {
        compressedItems.push(rangeStart);
      } else {
        compressedItems.push([rangeStart, lastIdx]);
      }
      rangeStart = -1;
    }
  };

  items.forEach(item => {
    const idx = DEFAULT_ITEMS_INDEX_MAP[item];
    if (idx !== undefined) {
      if (rangeStart === -1) {
        rangeStart = idx;
        lastIdx = idx;
      } else if (idx === lastIdx + 1) {
        lastIdx = idx;
      } else {
        flushRange();
        rangeStart = idx;
        lastIdx = idx;
      }
    } else {
      flushRange();
      compressedItems.push(item);
    }
  });
  flushRange();

  const ticksBitmask = items.map(item => ticks[item] ? '1' : '0').join('');

  return {
    v: 2, // New version
    o: ownerId,
    i: compressedItems,
    t: ticksBitmask
  };
};

const decompressList = (data: any): ListData => {
  if (data.v === 2) {
    const items: string[] = [];
    data.i.forEach((entry: any) => {
      if (typeof entry === 'number') {
        items.push(DEFAULT_ITEMS[entry]);
      } else if (Array.isArray(entry)) {
        for (let i = entry[0]; i <= entry[1]; i++) {
          items.push(DEFAULT_ITEMS[i]);
        }
      } else {
        items.push(entry);
      }
    });
    const ticks = data.t.split('').map((bit: string) => bit === '1');
    return { items, ticks, ownerId: data.o };
  }
  // Backward compatibility for v1 or raw format
  return data;
};

interface ListData {
  items: string[];
  ticks: boolean[];
  ownerId: string;
}

export default function App() {
  const [myId, setMyId] = useState<string>('local');
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [myTicks, setMyTicks] = useState<Record<string, boolean>>({});
  const [itemOrigins, setItemOrigins] = useState<Record<string, string>>({});
  const [sharedTicks, setSharedTicks] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<'edit' | 'compare-step-1' | 'compare-result'>('edit');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [newItemText, setNewItemText] = useState(''); 
  const paperRef = useRef<HTMLDivElement>(null);

  // Initialize from URL and LocalStorage
  useEffect(() => {
    // 1. Get or generate My Unique ID
    let localId = localStorage.getItem('rams-user-id');
    if (!localId) {
      localId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('rams-user-id', localId);
    }
    setMyId(localId);

    // 2. Load local items from storage
    const savedItems = localStorage.getItem('rams-life-items');
    const savedTicks = localStorage.getItem('rams-life-ticks');
    const savedOrigins = localStorage.getItem('rams-life-origins');
    
    let currentItems = DEFAULT_ITEMS;
    let currentOrigins: Record<string, string> = {};
    
    // Initialize default origins
    DEFAULT_ITEMS.forEach(item => {
      currentOrigins[item] = 'local';
    });

    if (savedItems) {
      try {
        currentItems = JSON.parse(savedItems);
      } catch (e) {
        console.error("Failed to parse saved items", e);
      }
    }
    
    if (savedOrigins) {
      try {
        currentOrigins = { ...currentOrigins, ...JSON.parse(savedOrigins) };
      } catch (e) {
        console.error("Failed to parse saved origins", e);
      }
    }
    
    setItemOrigins(currentOrigins);

    if (savedTicks) {
      try {
        setMyTicks(JSON.parse(savedTicks));
      } catch (e) {
        console.error("Failed to parse saved ticks", e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    
    if (key) {
      try {
        const decoded = LZString.decompressFromEncodedURIComponent(key);
        if (decoded) {
          const rawData = JSON.parse(decoded);
          const data = decompressList(rawData);
          
          // Merge logic
          const mergedItems = [...currentItems];
          const existingSet = new Set(currentItems);
          const incomingTicksMap: Record<string, boolean> = {};
          const newOrigins = { ...currentOrigins };

          data.items.forEach((item, idx) => {
            incomingTicksMap[item] = data.ticks[idx];
            if (!existingSet.has(item)) {
              mergedItems.push(item);
              existingSet.add(item);
              // Only mark as shared if it's truly new to this user
              newOrigins[item] = data.ownerId || 'unknown';
            }
          });

          setItems(mergedItems);
          setSharedTicks(incomingTicksMap);
          setItemOrigins(newOrigins);
          setMode('compare-step-1');
        }
      } catch (e) {
        console.error("Failed to decode shared key", e);
        setItems(currentItems);
      }
    } else {
      setItems(currentItems);
    }
  }, []);

  // Persist local changes
  useEffect(() => {
    // We save whenever items, ticks or origins change to ensure persistence
    localStorage.setItem('rams-life-items', JSON.stringify(items));
    localStorage.setItem('rams-life-ticks', JSON.stringify(myTicks));
    localStorage.setItem('rams-life-origins', JSON.stringify(itemOrigins));
  }, [items, myTicks, itemOrigins]);

  const toggleTick = (text: string, e?: React.MouseEvent | React.ChangeEvent) => {
    const isChecking = !myTicks[text];
    setMyTicks(prev => ({
      ...prev,
      [text]: isChecking
    }));

    if (isChecking && e && confettiRef.current && paperRef.current) {
      // Use screen coordinates directly for full-screen ConfettiPhysics
      let x, y;
      if ('clientX' in e && e.clientX !== undefined) {
        x = e.clientX;
        y = e.clientY;
      } else {
        // Fallback for ChangeEvent (keyboard or direct input)
        const targetRect = (e.target as HTMLElement).getBoundingClientRect();
        x = targetRect.left + targetRect.width / 2;
        y = targetRect.top + targetRect.height / 2;
      }
      
      if (!isNaN(x) && !isNaN(y)) {
        confettiRef.current.spawn(x, y);
      }
    }
  };

  const addItem = () => {
    const text = newItemText.trim();
    if (text && !items.includes(text)) {
      setItems([...items, text]);
      setItemOrigins(prev => ({ ...prev, [text]: 'local' }));
      setNewItemText('');
    }
  };

  const removeItem = (text: string) => {
    setItems(items.filter(item => item !== text));
    const newTicks = { ...myTicks };
    delete newTicks[text];
    setMyTicks(newTicks);
    
    const newOrigins = { ...itemOrigins };
    delete newOrigins[text];
    setItemOrigins(newOrigins);
  };

  const generateShareUrl = () => {
    const compactData = compressList(items, myTicks, myId);
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(compactData));
    const url = new URL(window.location.href);
    url.searchParams.set('key', encoded);
    return url.toString();
  };

  const copyToClipboard = async () => {
    const url = generateShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const startComparison = () => {
    setMode('compare-result');
  };

  const backToEdit = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setMode('edit');
    setSharedTicks({});
  };

  const clearAllData = () => {
    // Removed window.confirm as it doesn't work well in iframes
    window.history.replaceState({}, '', window.location.pathname);
    localStorage.removeItem('rams-life-items');
    localStorage.removeItem('rams-life-ticks');
    localStorage.removeItem('rams-life-origins');
    setItems(DEFAULT_ITEMS);
    setMyTicks({});
    setSharedTicks({});
    setItemOrigins({});
    setMode('edit');
  };

  // Comparison logic
  const comparison = useMemo(() => {
    if (mode !== 'compare-result') return null;

    const bothDone: string[] = [];
    const bothNotDone: string[] = [];
    const iDoneHeNot: string[] = [];
    const heDoneINot: string[] = [];

    items.forEach((item) => {
      const myTick = !!myTicks[item];
      const hisTick = !!sharedTicks[item];

      if (myTick && hisTick) bothDone.push(item);
      else if (!myTick && !hisTick) bothNotDone.push(item);
      else if (myTick && !hisTick) iDoneHeNot.push(item);
      else if (!myTick && hisTick) heDoneINot.push(item);
    });

    return { bothDone, bothNotDone, iDoneHeNot, heDoneINot };
  }, [items, myTicks, sharedTicks, mode]);

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-xl"
      >
        {/* Top Navigation */}
        <nav className="mb-8 flex justify-between items-center px-2">
          <div className="flex flex-col">
            <span className="ui-label">人生清单</span>
            <span className="ui-mono uppercase tracking-tighter">
              {mode === 'edit' ? 'v1.0 / 编辑' : 'v1.0 / 对比'}
            </span>
          </div>
          <div className="flex gap-3">
            {mode !== 'edit' && (
              <button onClick={backToEdit} className="ui-btn-circle" title="Back to Edit">
                <ArrowLeft size={18} />
              </button>
            )}
            {mode === 'edit' && (
              <button onClick={clearAllData} className="ui-btn-circle text-neutral-300 hover:text-klein" title="Reset to Default">
                <RotateCcw size={18} />
              </button>
            )}
            {mode === 'edit' && (
              <button 
                onClick={() => setShowQrCode(true)} 
                className="ui-btn-circle"
                title="QR Code"
              >
                <QrCode size={18} />
              </button>
            )}
            {mode === 'edit' && (
              <button 
                onClick={copyToClipboard} 
                className={cn("ui-btn-circle", copySuccess && "active")}
                title="Share Link"
              >
                {copySuccess ? <Check size={18} /> : <Share2 size={18} />}
              </button>
            )}
          </div>
        </nav>

        {/* Hybrid Paper Section */}
        <div className="hybrid-paper" ref={paperRef}>
          <div className="paper-lines">
            <div className="paper-content">
              <AnimatePresence mode="wait">
                {mode === 'compare-result' && comparison ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-0"
                  >
                    <ResultSection title="共同完成" items={comparison.bothDone} color="bg-klein" itemOrigins={itemOrigins} />
                    <ResultSection title="我已完成" items={comparison.iDoneHeNot} color="bg-neutral-800" itemOrigins={itemOrigins} />
                    <ResultSection title="对方已完成" items={comparison.heDoneINot} color="bg-neutral-400" itemOrigins={itemOrigins} />
                    <ResultSection title="共同目标" items={comparison.bothNotDone} color="bg-neutral-200" itemOrigins={itemOrigins} />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {mode === 'compare-step-1' && (
                      <div className="text-klein font-bold list-text on-lines mb-9">
                        收到同步请求：请在下方勾选你的进度以进行对比。
                        <br />
                        ---
                      </div>
                    )}

                    <ul className="space-y-0">
                      {items.map((item) => (
                        <motion.li 
                          key={item}
                          className="group relative"
                        >
                          <input 
                            type="checkbox" 
                            checked={!!myTicks[item]}
                            onChange={(e) => toggleTick(item, e)}
                            className="rams-checkbox absolute left-[-55px]"
                          />
                          <div className="flex items-center gap-2">
                            <span 
                              className={cn(
                                "flex-1 list-text on-lines cursor-pointer select-none",
                                myTicks[item] && "opacity-20 line-through"
                              )}
                              onClick={(e) => toggleTick(item, e)}
                            >
                              {item}
                            </span>
                            {itemOrigins[item] && itemOrigins[item] !== 'local' && (
                              <div 
                                className={cn("w-1.5 h-1.5 rounded-full shrink-0", getColorFromId(itemOrigins[item]))}
                                title={`Shared by ${itemOrigins[item]}`}
                              />
                            )}
                          </div>
                          {mode === 'edit' && (
                            <button 
                              onClick={() => removeItem(item)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-klein transition-all ml-auto"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </motion.li>
                      ))}
                    </ul>

                    {mode === 'edit' && (
                      <div className="input-row border-t border-neutral-100 mt-9 on-lines">
                        <Plus size={18} className="text-klein mr-4 shrink-0" />
                        <input 
                          type="text" 
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addItem()}
                          placeholder="添加新项目..."
                          className="flex-1 bg-transparent border-none outline-none list-text on-lines placeholder:text-neutral-200 h-full"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <footer className="mt-10 flex flex-col items-center">
          {mode === 'compare-step-1' && (
            <button 
              onClick={startComparison}
              className="px-12 py-4 bg-neutral-900 text-white rounded-full font-medium tracking-tight shadow-xl hover:bg-black transition-all flex items-center gap-3"
            >
              <Users size={18} />
              对比进度
            </button>
          )}
          <div className="mt-6 ui-mono opacity-20">
            RAMS-NOTEBOOK HYBRID / v1.0
          </div>
        </footer>

        {/* QR Code Modal */}
        <AnimatePresence>
          {showQrCode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setShowQrCode(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full flex flex-col items-center gap-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center space-y-2">
                  <h3 className="text-klein font-bold text-lg">扫码分享清单</h3>
                  <p className="text-neutral-400 text-sm">让对方扫一扫，开启对比</p>
                </div>
                
                <div className="p-4 bg-white border-4 border-neutral-50 rounded-2xl shadow-inner">
                  <QRCodeCanvas 
                    value={generateShareUrl()} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <button 
                  onClick={() => setShowQrCode(false)}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl font-medium transition-colors"
                >
                  关闭
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ResultSection({ title, items, color, itemOrigins }: { title: string, items: string[], color: string, itemOrigins: Record<string, string> }) {
  if (items.length === 0) return null;
  
  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-3 border-b border-neutral-100 on-lines">
        <div className={cn("w-1.5 h-4 rounded-full", color)}></div>
        <span className="ui-label text-neutral-400">{title}</span>
        <span className="ui-mono ml-auto">[{items.length}]</span>
      </h3>
      <ul className="space-y-0">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-neutral-200 shrink-0"></span>
            <span className="list-text on-lines text-neutral-700 flex-1">{item}</span>
            {itemOrigins[item] && itemOrigins[item] !== 'local' && (
              <div 
                className={cn("w-1.5 h-1.5 rounded-full shrink-0", getColorFromId(itemOrigins[item]))}
                title={`Shared by ${itemOrigins[item]}`}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

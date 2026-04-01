export const PAGE_ITEM_CAPACITY = 10;
export const PAGE_LINE_HEIGHT_PX = 36;
export const PAGE_CARD_OVERHEAD_LINES = 4;
export const PAGE_CARD_WIDTH_PX = 550;
export const GALLERY_NOTEBOOK_SCALE = 0.85;

export const DEFAULT_GROUP_ID = '0';
export const PAGE_SIZE = PAGE_ITEM_CAPACITY;
export const LOCAL_STATE_STORAGE_KEY = 'rams-life-state';

export function getPageCardHeight(itemCapacity: number) {
  return (itemCapacity + PAGE_CARD_OVERHEAD_LINES) * PAGE_LINE_HEIGHT_PX;
}

export function getPageCardFrameStyle(itemCapacity = PAGE_ITEM_CAPACITY) {
  return {
    width: `${PAGE_CARD_WIDTH_PX}px`,
    height: `${getPageCardHeight(itemCapacity)}px`,
  } as const;
}

export const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const BIT_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
export const TOP_SEP = '\u0001';
export const GROUP_SEP = '\u0002';
export const GROUP_FIELD_SEP = '\u0003';
export const ITEM_SEP = '\u0004';
export const ITEM_FIELD_SEP = '\u0005';
export const ESCAPE_CHAR = '\\';

export const DEFAULT_ITEMS = [
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

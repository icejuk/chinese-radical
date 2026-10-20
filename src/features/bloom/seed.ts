import type { WordGraph } from './map'
import { woodExpansionNodes } from './woodExpansion'
import { peopleExpansionNodes } from './peopleExpansion'
import { dailyExpansionNodes } from './dailyExpansion'
import { foundationExpansionNodes } from './foundationExpansion'
import { vocabularyCharacters } from './characterCatalog'

// Curated prototype seed, not a 2,000-character or linguistically audited corpus.
const prototypeSeedGraph: WordGraph = {
  "nodes": [
    {
      "id": "c:学",
      "kind": "character",
      "zh": "学",
      "py": "xué",
      "th": "เรียน",
      "group": "learning"
    },
    {
      "id": "c:生",
      "kind": "character",
      "zh": "生",
      "py": "shēng",
      "th": "เกิด / ชีวิต",
      "group": "learning"
    },
    {
      "id": "c:校",
      "kind": "character",
      "zh": "校",
      "py": "xiào",
      "th": "โรงเรียน (ใน 学校)",
      "group": "learning"
    },
    {
      "id": "c:习",
      "kind": "character",
      "zh": "习",
      "py": "xí",
      "th": "ฝึก / เรียนรู้",
      "group": "learning"
    },
    {
      "id": "c:木",
      "kind": "character",
      "zh": "木",
      "py": "mù",
      "th": "ไม้ / ต้นไม้",
      "group": "wood"
    },
    {
      "id": "c:林",
      "kind": "character",
      "zh": "林",
      "py": "lín",
      "th": "ป่า / หมู่ไม้",
      "group": "wood"
    },
    {
      "id": "c:森",
      "kind": "character",
      "zh": "森",
      "py": "sēn",
      "th": "ป่าทึบ / หนาแน่น",
      "group": "wood"
    },
    {
      "id": "c:休",
      "kind": "character",
      "zh": "休",
      "py": "xiū",
      "th": "พัก",
      "group": "wood"
    },
    {
      "id": "c:水",
      "kind": "character",
      "zh": "水",
      "py": "shuǐ",
      "th": "น้ำ",
      "group": "water"
    },
    {
      "id": "c:河",
      "kind": "character",
      "zh": "河",
      "py": "hé",
      "th": "แม่น้ำ",
      "group": "water"
    },
    {
      "id": "c:海",
      "kind": "character",
      "zh": "海",
      "py": "hǎi",
      "th": "ทะเล",
      "group": "water"
    },
    {
      "id": "c:洗",
      "kind": "character",
      "zh": "洗",
      "py": "xǐ",
      "th": "ล้าง / ซัก",
      "group": "water"
    },
    {
      "id": "c:人",
      "kind": "character",
      "zh": "人",
      "py": "rén",
      "th": "คน",
      "group": "people"
    },
    {
      "id": "c:你",
      "kind": "character",
      "zh": "你",
      "py": "nǐ",
      "th": "คุณ / เธอ",
      "group": "people"
    },
    {
      "id": "c:他",
      "kind": "character",
      "zh": "他",
      "py": "tā",
      "th": "เขา (ผู้ชาย)",
      "group": "people"
    },
    {
      "id": "c:们",
      "kind": "character",
      "zh": "们",
      "py": "men",
      "th": "คำต่อท้ายบอกกลุ่มคน",
      "group": "people"
    },
    {
      "id": "w:学生",
      "kind": "word",
      "zh": "学生",
      "py": "xuésheng",
      "th": "นักเรียน",
      "group": "learning"
    },
    {
      "id": "w:学校",
      "kind": "word",
      "zh": "学校",
      "py": "xuéxiào",
      "th": "โรงเรียน",
      "group": "learning"
    },
    {
      "id": "w:学习",
      "kind": "word",
      "zh": "学习",
      "py": "xuéxí",
      "th": "เรียนรู้",
      "group": "learning"
    },
    {
      "id": "w:大学",
      "kind": "word",
      "zh": "大学",
      "py": "dàxué",
      "th": "มหาวิทยาลัย",
      "group": "learning"
    },
    {
      "id": "w:同学",
      "kind": "word",
      "zh": "同学",
      "py": "tóngxué",
      "th": "เพื่อนร่วมชั้น",
      "group": "learning"
    },
    {
      "id": "w:数学",
      "kind": "word",
      "zh": "数学",
      "py": "shùxué",
      "th": "คณิตศาสตร์",
      "group": "learning"
    },
    {
      "id": "w:生日",
      "kind": "word",
      "zh": "生日",
      "py": "shēngrì",
      "th": "วันเกิด",
      "group": "learning"
    },
    {
      "id": "w:生活",
      "kind": "word",
      "zh": "生活",
      "py": "shēnghuó",
      "th": "ชีวิต / การใช้ชีวิต",
      "group": "learning"
    },
    {
      "id": "w:医生",
      "kind": "word",
      "zh": "医生",
      "py": "yīshēng",
      "th": "แพทย์",
      "group": "learning"
    },
    {
      "id": "w:生气",
      "kind": "word",
      "zh": "生气",
      "py": "shēngqì",
      "th": "โกรธ",
      "group": "learning"
    },
    {
      "id": "w:生词",
      "kind": "word",
      "zh": "生词",
      "py": "shēngcí",
      "th": "คำศัพท์ใหม่",
      "group": "learning"
    },
    {
      "id": "w:校园",
      "kind": "word",
      "zh": "校园",
      "py": "xiàoyuán",
      "th": "บริเวณโรงเรียน",
      "group": "learning"
    },
    {
      "id": "w:校长",
      "kind": "word",
      "zh": "校长",
      "py": "xiàozhǎng",
      "th": "ผู้อำนวยการโรงเรียน",
      "group": "learning"
    },
    {
      "id": "w:练习",
      "kind": "word",
      "zh": "练习",
      "py": "liànxí",
      "th": "ฝึกฝน",
      "group": "learning"
    },
    {
      "id": "w:习惯",
      "kind": "word",
      "zh": "习惯",
      "py": "xíguàn",
      "th": "ความเคยชิน",
      "group": "learning"
    },
    {
      "id": "w:复习",
      "kind": "word",
      "zh": "复习",
      "py": "fùxí",
      "th": "ทบทวน",
      "group": "learning"
    },
    {
      "id": "w:预习",
      "kind": "word",
      "zh": "预习",
      "py": "yùxí",
      "th": "เตรียมบทเรียนล่วงหน้า",
      "group": "learning"
    },
    {
      "id": "w:木头",
      "kind": "word",
      "zh": "木头",
      "py": "mùtou",
      "th": "ไม้",
      "group": "wood"
    },
    {
      "id": "w:树木",
      "kind": "word",
      "zh": "树木",
      "py": "shùmù",
      "th": "ต้นไม้",
      "group": "wood"
    },
    {
      "id": "w:木材",
      "kind": "word",
      "zh": "木材",
      "py": "mùcái",
      "th": "เนื้อไม้ / ไม้แปรรูป",
      "group": "wood"
    },
    {
      "id": "w:木工",
      "kind": "word",
      "zh": "木工",
      "py": "mùgōng",
      "th": "งานช่างไม้",
      "group": "wood"
    },
    {
      "id": "w:木门",
      "kind": "word",
      "zh": "木门",
      "py": "mùmén",
      "th": "ประตูไม้",
      "group": "wood"
    },
    {
      "id": "w:木马",
      "kind": "word",
      "zh": "木马",
      "py": "mùmǎ",
      "th": "ม้าไม้",
      "group": "wood"
    },
    {
      "id": "w:树林",
      "kind": "word",
      "zh": "树林",
      "py": "shùlín",
      "th": "ป่า / หมู่ไม้",
      "group": "wood"
    },
    {
      "id": "w:园林",
      "kind": "word",
      "zh": "园林",
      "py": "yuánlín",
      "th": "สวน",
      "group": "wood"
    },
    {
      "id": "w:林业",
      "kind": "word",
      "zh": "林业",
      "py": "línyè",
      "th": "ป่าไม้ / การป่าไม้",
      "group": "wood"
    },
    {
      "id": "w:森林",
      "kind": "word",
      "zh": "森林",
      "py": "sēnlín",
      "th": "ป่า",
      "group": "wood"
    },
    {
      "id": "w:休息",
      "kind": "word",
      "zh": "休息",
      "py": "xiūxi",
      "th": "พักผ่อน",
      "group": "wood"
    },
    {
      "id": "w:休假",
      "kind": "word",
      "zh": "休假",
      "py": "xiūjià",
      "th": "ลาพัก",
      "group": "wood"
    },
    {
      "id": "w:午休",
      "kind": "word",
      "zh": "午休",
      "py": "wǔxiū",
      "th": "พักกลางวัน",
      "group": "wood"
    },
    {
      "id": "w:水果",
      "kind": "word",
      "zh": "水果",
      "py": "shuǐguǒ",
      "th": "ผลไม้",
      "group": "water"
    },
    {
      "id": "w:水杯",
      "kind": "word",
      "zh": "水杯",
      "py": "shuǐbēi",
      "th": "แก้วน้ำ",
      "group": "water"
    },
    {
      "id": "w:开水",
      "kind": "word",
      "zh": "开水",
      "py": "kāishuǐ",
      "th": "น้ำต้ม / น้ำต้มสุก",
      "group": "water"
    },
    {
      "id": "w:水平",
      "kind": "word",
      "zh": "水平",
      "py": "shuǐpíng",
      "th": "ระดับ",
      "group": "water"
    },
    {
      "id": "w:水面",
      "kind": "word",
      "zh": "水面",
      "py": "shuǐmiàn",
      "th": "ผิวน้ำ",
      "group": "water"
    },
    {
      "id": "w:河水",
      "kind": "word",
      "zh": "河水",
      "py": "héshuǐ",
      "th": "น้ำในแม่น้ำ",
      "group": "water"
    },
    {
      "id": "w:河流",
      "kind": "word",
      "zh": "河流",
      "py": "héliú",
      "th": "แม่น้ำ / ลำน้ำ",
      "group": "water"
    },
    {
      "id": "w:黄河",
      "kind": "word",
      "zh": "黄河",
      "py": "Huáng Hé",
      "th": "แม่น้ำเหลือง",
      "group": "water"
    },
    {
      "id": "w:大海",
      "kind": "word",
      "zh": "大海",
      "py": "dàhǎi",
      "th": "ทะเล / ท้องทะเล",
      "group": "water"
    },
    {
      "id": "w:海水",
      "kind": "word",
      "zh": "海水",
      "py": "hǎishuǐ",
      "th": "น้ำทะเล",
      "group": "water"
    },
    {
      "id": "w:海边",
      "kind": "word",
      "zh": "海边",
      "py": "hǎibiān",
      "th": "ริมทะเล",
      "group": "water"
    },
    {
      "id": "w:洗手",
      "kind": "word",
      "zh": "洗手",
      "py": "xǐshǒu",
      "th": "ล้างมือ",
      "group": "water"
    },
    {
      "id": "w:洗衣服",
      "kind": "word",
      "zh": "洗衣服",
      "py": "xǐ yīfu",
      "th": "ซักเสื้อผ้า",
      "group": "water"
    },
    {
      "id": "w:洗澡",
      "kind": "word",
      "zh": "洗澡",
      "py": "xǐzǎo",
      "th": "อาบน้ำ",
      "group": "water"
    },
    {
      "id": "w:人们",
      "kind": "word",
      "zh": "人们",
      "py": "rénmen",
      "th": "ผู้คน",
      "group": "people"
    },
    {
      "id": "w:人生",
      "kind": "word",
      "zh": "人生",
      "py": "rénshēng",
      "th": "ชีวิตคน",
      "group": "people"
    },
    {
      "id": "w:个人",
      "kind": "word",
      "zh": "个人",
      "py": "gèrén",
      "th": "บุคคล / ส่วนบุคคล",
      "group": "people"
    },
    {
      "id": "w:人民",
      "kind": "word",
      "zh": "人民",
      "py": "rénmín",
      "th": "ประชาชน",
      "group": "people"
    },
    {
      "id": "w:工人",
      "kind": "word",
      "zh": "工人",
      "py": "gōngrén",
      "th": "คนงาน",
      "group": "people"
    },
    {
      "id": "w:中国人",
      "kind": "word",
      "zh": "中国人",
      "py": "Zhōngguó rén",
      "th": "คนจีน",
      "group": "people"
    },
    {
      "id": "w:你好",
      "kind": "word",
      "zh": "你好",
      "py": "nǐ hǎo",
      "th": "สวัสดี",
      "group": "people"
    },
    {
      "id": "w:你们",
      "kind": "word",
      "zh": "你们",
      "py": "nǐmen",
      "th": "พวกคุณ",
      "group": "people"
    },
    {
      "id": "w:他们",
      "kind": "word",
      "zh": "他们",
      "py": "tāmen",
      "th": "พวกเขา",
      "group": "people"
    },
    {
      "id": "w:我们",
      "kind": "word",
      "zh": "我们",
      "py": "wǒmen",
      "th": "พวกเรา",
      "group": "people"
    }
  ],
  "edges": [
    {
      "source": "c:生",
      "target": "w:学生",
      "kind": "contains-character"
    },
    {
      "source": "c:学",
      "target": "w:学生",
      "kind": "contains-character"
    },
    {
      "source": "c:学",
      "target": "w:学校",
      "kind": "contains-character"
    },
    {
      "source": "c:校",
      "target": "w:学校",
      "kind": "contains-character"
    },
    {
      "source": "c:习",
      "target": "w:学习",
      "kind": "contains-character"
    },
    {
      "source": "c:学",
      "target": "w:学习",
      "kind": "contains-character"
    },
    {
      "source": "c:学",
      "target": "w:大学",
      "kind": "contains-character"
    },
    {
      "source": "c:学",
      "target": "w:同学",
      "kind": "contains-character"
    },
    {
      "source": "c:学",
      "target": "w:数学",
      "kind": "contains-character"
    },
    {
      "source": "c:生",
      "target": "w:生日",
      "kind": "contains-character"
    },
    {
      "source": "c:生",
      "target": "w:生活",
      "kind": "contains-character"
    },
    {
      "source": "c:生",
      "target": "w:医生",
      "kind": "contains-character"
    },
    {
      "source": "c:生",
      "target": "w:生气",
      "kind": "contains-character"
    },
    {
      "source": "c:生",
      "target": "w:生词",
      "kind": "contains-character"
    },
    {
      "source": "c:校",
      "target": "w:校园",
      "kind": "contains-character"
    },
    {
      "source": "c:校",
      "target": "w:校长",
      "kind": "contains-character"
    },
    {
      "source": "c:习",
      "target": "w:练习",
      "kind": "contains-character"
    },
    {
      "source": "c:习",
      "target": "w:习惯",
      "kind": "contains-character"
    },
    {
      "source": "c:习",
      "target": "w:复习",
      "kind": "contains-character"
    },
    {
      "source": "c:习",
      "target": "w:预习",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "w:木头",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "w:树木",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "w:木材",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "w:木工",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "w:木门",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "w:木马",
      "kind": "contains-character"
    },
    {
      "source": "c:林",
      "target": "w:树林",
      "kind": "contains-character"
    },
    {
      "source": "c:林",
      "target": "w:园林",
      "kind": "contains-character"
    },
    {
      "source": "c:林",
      "target": "w:林业",
      "kind": "contains-character"
    },
    {
      "source": "c:森",
      "target": "w:森林",
      "kind": "contains-character"
    },
    {
      "source": "c:林",
      "target": "w:森林",
      "kind": "contains-character"
    },
    {
      "source": "c:休",
      "target": "w:休息",
      "kind": "contains-character"
    },
    {
      "source": "c:休",
      "target": "w:休假",
      "kind": "contains-character"
    },
    {
      "source": "c:休",
      "target": "w:午休",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:水果",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:水杯",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:开水",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:水平",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:水面",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:河水",
      "kind": "contains-character"
    },
    {
      "source": "c:河",
      "target": "w:河水",
      "kind": "contains-character"
    },
    {
      "source": "c:河",
      "target": "w:河流",
      "kind": "contains-character"
    },
    {
      "source": "c:河",
      "target": "w:黄河",
      "kind": "contains-character"
    },
    {
      "source": "c:海",
      "target": "w:大海",
      "kind": "contains-character"
    },
    {
      "source": "c:海",
      "target": "w:海水",
      "kind": "contains-character"
    },
    {
      "source": "c:水",
      "target": "w:海水",
      "kind": "contains-character"
    },
    {
      "source": "c:海",
      "target": "w:海边",
      "kind": "contains-character"
    },
    {
      "source": "c:洗",
      "target": "w:洗手",
      "kind": "contains-character"
    },
    {
      "source": "c:洗",
      "target": "w:洗衣服",
      "kind": "contains-character"
    },
    {
      "source": "c:洗",
      "target": "w:洗澡",
      "kind": "contains-character"
    },
    {
      "source": "c:们",
      "target": "w:人们",
      "kind": "contains-character"
    },
    {
      "source": "c:人",
      "target": "w:人们",
      "kind": "contains-character"
    },
    {
      "source": "c:生",
      "target": "w:人生",
      "kind": "contains-character"
    },
    {
      "source": "c:人",
      "target": "w:人生",
      "kind": "contains-character"
    },
    {
      "source": "c:人",
      "target": "w:个人",
      "kind": "contains-character"
    },
    {
      "source": "c:人",
      "target": "w:人民",
      "kind": "contains-character"
    },
    {
      "source": "c:人",
      "target": "w:工人",
      "kind": "contains-character"
    },
    {
      "source": "c:人",
      "target": "w:中国人",
      "kind": "contains-character"
    },
    {
      "source": "c:你",
      "target": "w:你好",
      "kind": "contains-character"
    },
    {
      "source": "c:们",
      "target": "w:你们",
      "kind": "contains-character"
    },
    {
      "source": "c:你",
      "target": "w:你们",
      "kind": "contains-character"
    },
    {
      "source": "c:们",
      "target": "w:他们",
      "kind": "contains-character"
    },
    {
      "source": "c:他",
      "target": "w:他们",
      "kind": "contains-character"
    },
    {
      "source": "c:们",
      "target": "w:我们",
      "kind": "contains-character"
    },
    {
      "source": "c:木",
      "target": "c:校",
      "kind": "contains-component"
    },
    {
      "source": "c:木",
      "target": "c:林",
      "kind": "contains-component"
    },
    {
      "source": "c:木",
      "target": "c:森",
      "kind": "contains-component"
    },
    {
      "source": "c:人",
      "target": "c:休",
      "kind": "contains-component"
    },
    {
      "source": "c:木",
      "target": "c:休",
      "kind": "contains-component"
    },
    {
      "source": "c:水",
      "target": "c:河",
      "kind": "contains-component"
    },
    {
      "source": "c:水",
      "target": "c:海",
      "kind": "contains-component"
    },
    {
      "source": "c:水",
      "target": "c:洗",
      "kind": "contains-component"
    },
    {
      "source": "c:人",
      "target": "c:你",
      "kind": "contains-component"
    },
    {
      "source": "c:人",
      "target": "c:他",
      "kind": "contains-component"
    },
    {
      "source": "c:人",
      "target": "c:们",
      "kind": "contains-component"
    }
  ]
}


// Rebuild word membership from the vocabulary itself, including shared words across groups.
const originalNodes = [...prototypeSeedGraph.nodes, ...woodExpansionNodes]
const originalIds = new Set(originalNodes.map(node => node.id))
const previousNodes = [...originalNodes, ...dailyExpansionNodes.filter(node => !originalIds.has(node.id))]
const previousIds = new Set(previousNodes.map(node => node.id))
const initialNodes = [...previousNodes, ...peopleExpansionNodes.filter(node => !previousIds.has(node.id))]
const initialIds = new Set(initialNodes.map(node => node.id))
const foundationNodes = [...initialNodes, ...foundationExpansionNodes.filter(node => !initialIds.has(node.id))]
const foundationIds = new Set(foundationNodes.map(node => node.id))
const nodes = [...foundationNodes, ...vocabularyCharacters.filter(node => !foundationIds.has(node.id)).map(node => ({
  ...node, group: foundationNodes.find(word => word.kind === 'word' && word.zh.includes(node.zh))?.group ?? node.group,
}))]
export const bloomSeedGraph: WordGraph = {
  nodes,
  edges: [
    ...prototypeSeedGraph.edges.filter(edge => edge.kind === 'contains-component'),
    ...nodes.filter(node => node.kind === 'character').flatMap(character =>
      nodes.filter(node => node.kind === 'word' && node.zh.includes(character.zh))
        .map(word => ({ source: character.id, target: word.id, kind: 'contains-character' as const }))),
  ],
}

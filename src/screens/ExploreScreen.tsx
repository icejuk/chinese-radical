import { useMemo, useState } from 'react'
import { hanzi } from '../data/hanzi'
import type { Radical } from '../data/types'
import { learnRads } from '../lib/tree'
import { starsGet } from '../lib/srs'

type Scope = 'all' | 'radical' | 'hanzi'

const plain = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('th')

export function ExploreScreen({
  onPickRadical,
  onPickChar,
}: {
  onPickRadical: (radical: Radical) => void
  onPickChar: (char: string) => void
}) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const needle = plain(query.trim())
  const stars = useMemo(() => starsGet(), [])

  const radicalResults = useMemo(() => {
    if (scope === 'hanzi') return []
    if (!needle) return learnRads
    return learnRads.filter((radical) =>
      plain([radical.r, radical.py, radical.th, radical.en, radical.cat].join(' ')).includes(needle),
    )
  }, [needle, scope])

  const hanziResults = useMemo(() => {
    if (scope === 'radical') return []
    // หน้า browse เริ่มจากรากก่อน; ตัวอักษรทั้งหมดค่อยเปิดเมื่อเลือกแท็บหรือเริ่มค้น
    if (!needle && scope === 'all') return []
    if (!needle) return hanzi
    return hanzi.filter((item) =>
      plain([item.zh, item.py, item.th, item.parts.join(' '), item.hint].join(' ')).includes(needle),
    )
  }, [needle, scope])

  const total = radicalResults.length + hanziResults.length

  return (
    <div className="explore">
      <div className="explore-search-wrap">
        <span aria-hidden>⌕</span>
        <input
          className="explore-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="พิมพ์ 人 · ren · คน"
          aria-label="ค้นด้วยตัวจีน พินอิน หรือคำแปลไทย"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button type="button" aria-label="ล้างคำค้น" onClick={() => setQuery('')}>×</button>
        )}
      </div>

      <div className="v2-segment explore-segment" role="tablist" aria-label="ประเภทที่ค้น">
        <button type="button" role="tab" aria-selected={scope === 'all'} onClick={() => setScope('all')}>ทั้งหมด</button>
        <button type="button" role="tab" aria-selected={scope === 'radical'} onClick={() => setScope('radical')}>ราก</button>
        <button type="button" role="tab" aria-selected={scope === 'hanzi'} onClick={() => setScope('hanzi')}>ตัวอักษร</button>
      </div>

      <div className="explore-summary">
        <div>
          <b>{query ? `ผลค้นหา “${query}”` : 'เริ่มจากรากที่อยากรู้'}</b>
          <span>{total} รายการ · ค้นตัวจีน พินอิน หรือภาษาไทยได้</span>
        </div>
      </div>

      {radicalResults.length > 0 && (
        <section className="explore-section">
          <div className="explore-heading"><b>ราก</b><span>{radicalResults.length}</span></div>
          <div className="explore-grid">
            {radicalResults.map((radical) => (
              <button key={radical.r} type="button" className="explore-card" onClick={() => onPickRadical(radical)}>
                <span className="explore-type">ราก</span>
                <span className="zh explore-glyph">{radical.r}</span>
                <span className="py">{radical.py}</span>
                <b>{radical.th}</b>
                {stars.has(radical.r) && <span className="explore-star">●</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {hanziResults.length > 0 && (
        <section className="explore-section">
          <div className="explore-heading"><b>ตัวอักษร</b><span>{hanziResults.length}</span></div>
          <div className="explore-grid">
            {hanziResults.map((item) => (
              <button key={item.zh} type="button" className="explore-card" onClick={() => onPickChar(item.zh)}>
                <span className="explore-type">HSK {item.hsk ?? '–'}</span>
                <span className="zh explore-glyph">{item.zh}</span>
                <span className="py">{item.py}</span>
                <b>{item.th}</b>
                <span className="zh explore-parts">{item.parts.join(' ')}</span>
                {stars.has(item.zh) && <span className="explore-star">●</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="explore-empty">
          <span className="zh">空</span>
          <b>ยังไม่เจอคำนี้</b>
          <p>ลองพิมพ์ตัวจีน พินอินแบบไม่มีวรรณยุกต์ หรือคำแปลไทยสั้นๆ</p>
        </div>
      )}
    </div>
  )
}

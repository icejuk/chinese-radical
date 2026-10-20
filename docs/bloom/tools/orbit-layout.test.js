import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { bloomSeedGraph } from '../../../src/features/bloom/seed'
import { arrangeOrbit, overlaps, routeOrbitEdge } from '../orbit-layout.js'
function fixture(){
 const source=readFileSync(new URL('../map-preview.js',import.meta.url),'utf8')
 const nodes=Function(source.slice(0,source.indexOf('const $='))+';return data')()
 const assigned=new Set(nodes.map(n=>n.zh))
 for(const zh of ['学','生','日','人','家','水','木','休']){
  if(!assigned.has(zh)){nodes.push({...bloomSeedGraph.nodes.find(n=>n.zh===zh),hub:1,parent:null});assigned.add(zh)}
  for(const word of bloomSeedGraph.nodes.filter(n=>n.kind==='word'&&n.zh.includes(zh))){if(!assigned.has(word.zh)){nodes.push({...word,hub:0,parent:zh});assigned.add(word.zh)}}
 }
 return nodes
}
describe('ORBIT preview layout',()=>{
 it('keeps all 63 words and reserves clear space around every card',()=>{
  const nodes=fixture();arrangeOrbit(nodes)
  expect(nodes.filter(n=>!n.hub)).toHaveLength(63)
  const collisions=[]
  nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{if(overlaps(a,b,24))collisions.push([a.zh,b.zh])}))
  expect(collisions).toEqual([])
 })
 it('routes every real relationship around unrelated cards',()=>{
  const nodes=fixture();arrangeOrbit(nodes)
  const failed=nodes.filter(n=>n.parent).filter(n=>!routeOrbitEdge(nodes.find(p=>p.zh===n.parent),n,nodes).clear).map(n=>n.zh)
  expect(failed).toEqual([])
 })
 it('does not change coordinates when rebuilt with the same content',()=>{
  const a=fixture(),b=fixture();arrangeOrbit(a);arrangeOrbit(b)
  expect(a.map(n=>[n.zh,n.x,n.y])).toEqual(b.map(n=>[n.zh,n.x,n.y]))
 })
})

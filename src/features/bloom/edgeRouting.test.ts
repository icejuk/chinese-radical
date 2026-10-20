import { describe, it, expect } from 'vitest'
import { routeMapEdge } from './edgeRouting'
import { unifiedTreeLayout } from './tree'
describe('ORBIT edge routing', () => {
  it('detours around a card between source and target', () => {
    const source={x:0,y:100,width:100,height:100},target={x:600,y:100,width:100,height:100},obstacle={x:280,y:50,width:140,height:200}
    const route=routeMapEdge(source,target,[source,target,obstacle])
    expect(route.clear).toBe(true)
    expect(route.d).toContain('Q')
  })
  it('keeps occurrence identity and nodes stable while routing an expanded family', () => {
    const at='c:人/w:家人/c:家'
    const tree=unifiedTreeLayout(['c:人'],[at])
    const snapshot=JSON.stringify(tree)
    for(const box of tree.nodes.filter(node=>node.parent)){
      const parent=tree.nodes.find(node=>node.id===box.parent)!
      const route=routeMapEdge(parent,box,tree.nodes)
      expect(route.d).not.toContain('NaN')
      expect(route.clear, box.id).toBe(true)
    }
    expect(JSON.stringify(tree)).toBe(snapshot)
    expect(tree.nodes.some(node=>node.id===at)).toBe(true)
  })
})

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const wb=Workbook.create()
const headers=['id','test_name','category','priority','precondition','test_steps','expected_result','status','actual_result','evidence']
for (const [name,file] of [['Web','BLOOM-Web.json'],['E2E','BLOOM-E2E.json']]) {
 const rows=JSON.parse(await fs.readFile(path.join(root,file),'utf8'))
 const sheet=wb.worksheets.add(name)
 sheet.showGridLines=false
 sheet.getRange(`A1:J${rows.length+6}`).format.font={name:'Arial',size:11,color:'#173E35'}
 sheet.getRange('A2:G2').merge();sheet.getRange('A2').values=[[`BLOOM ${name} test cases`]]
 sheet.getRange('A2:G2').format.font={name:'Arial',size:16,bold:true,color:'#246D57'}
 sheet.getRange('A3:J3').merge();sheet.getRange('A3').values=[['Source: chat requirements and docs/bloom/PLAN.md. Full learning release 2026-10-18. Execution status recorded per case; remaining device checks are Not run. Evidence: VERIFICATION.md.']]
 sheet.getRange('A3:J3').format.font={name:'Arial',size:10,color:'#668175'}
 sheet.getRange('A4').values=[['Total']];sheet.getRange('B4').formulas=[[`=COUNTA(A7:A${rows.length+6})`]]
 sheet.getRange('C4').values=[['Not run']];sheet.getRange('D4').formulas=[[`=COUNTIF(H7:H${rows.length+6},"Not run")`]]
 sheet.getRange('E4').values=[['Passed']];sheet.getRange('F4').formulas=[[`=COUNTIF(H7:H${rows.length+6},"Passed")`]]
 sheet.getRange('G4').values=[['Failed']];sheet.getRange('H4').formulas=[[`=COUNTIF(H7:H${rows.length+6},"Failed")`]]
 sheet.getRange('A4:H4').format.rowHeight=26
 const values=[headers,...rows.map(row=>headers.map(key=>Array.isArray(row[key])?row[key].map((t,i)=>`${i+1}. ${t}`).join('\n'):row[key]))]
 sheet.getRange(`A6:J${rows.length+6}`).values=values
 sheet.tables.add(`A6:J${rows.length+6}`,true,`Bloom${name}Cases`)
 sheet.getRange('A6:J6').format={fill:'#246D57',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30}
 const body=sheet.getRange(`A7:J${rows.length+6}`);body.format.wrapText=true;body.format.verticalAlignment='top';body.format.rowHeight=88
 for(let row=7;row<=rows.length+6;row++)sheet.getRange(`A${row}:J${row}`).format.fill=row%2?'#F3F8EE':'#FFFFFF';
 body.format.borders={preset:'inside',style:'thin',color:'#D5E4D5'};
 const widths=[95,300,120,70,300,390,420,115,280,220]
 widths.forEach((w,i)=>sheet.getRangeByIndexes(0,i,rows.length+6,1).format.columnWidthPx=w)
 sheet.getRange(`H7:H${rows.length+6}`).dataValidation={rule:{type:'list',values:['Not run','Passed','Failed','Blocked']}}
 sheet.getRange(`H7:H${rows.length+6}`).conditionalFormats.add('containsText',{text:'Failed',format:{fill:'#FCE6DA',font:{color:'#9B4227',bold:true}}})
 sheet.freezePanes.freezeRows(6)
}
wb.recalculate()
console.log((await wb.inspect({kind:'region',sheetId:'Web',range:'A4:H4',maxChars:1200,tableMaxRows:2,tableMaxCols:8})).ndjson)
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(path.join(root,'BLOOM-test-cases.xlsx'))
for(const name of ['Web','E2E']) {
 const preview=await wb.render({sheetName:name,range:'E6:H9',scale:1,format:'png'})
 await fs.writeFile(path.join(root,'tools',`${name}-preview.png`),new Uint8Array(await preview.arrayBuffer()))
}
console.log('Exported BLOOM-test-cases.xlsx with Web and E2E sheets.')

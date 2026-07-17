const fs = require('fs')
const sql = fs.readFileSync('prisma/migrations/001_initial/migration.sql', 'utf8')
const tables = {}
const re = /CREATE TABLE "(\w+)" \(([\s\S]*?)\);/g
let m
while ((m = re.exec(sql))) {
  const name = m[1]
  const body = m[2]
  const cols = []
  body.split('\n').forEach((line) => {
    line = line.trim().replace(/,$/, '')
    const cm = line.match(/^"(\w+)"\s+([\w()]+)/)
    if (cm && !/^(PRIMARY|FOREIGN|CONSTRAINT|UNIQUE)/.test(line.toUpperCase())) {
      cols.push(cm[1])
    }
  })
  tables[name] = { columns: cols, fks: [] }
}
const fkre = /CREATE TABLE "(\w+)"[\s\S]*?FOREIGN KEY "(\w+)" REFERENCES "(\w+)"/g
while ((m = fkre.exec(sql))) {
  const tname = m[1]
  const col = m[2]
  const ref = m[3]
  if (tables[tname]) tables[tname].fks.push({ column: col, ref })
}
fs.writeFileSync('lib/schema-d1.json', JSON.stringify(tables, null, 1))
console.log('tables', Object.keys(tables).length)
Object.keys(tables).forEach((t) => {
  console.log(t, 'cols=' + tables[t].columns.length, 'fks=' + tables[t].fks.length)
})

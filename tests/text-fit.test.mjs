import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authoredLines,balancedLines} from '../src/text-fit.mjs';
const measure=text=>text.length;
test('authored paragraphs keep their order and explicit empty lines',()=>{
  assert.deepEqual(authoredLines('  Первая  строка.\r\n\n  Вторая строка.  '),['Первая строка.','','Вторая строка.']);
  assert.deepEqual(balancedLines('Первая строка.\nВторая строка.',50,1,measure),['Первая строка.','Вторая строка.']);
});
test('long tips distribute words without an isolated last word',()=>{
  const text='Соберите все медали растений одного семейства, чтобы открыть соответствующую Мяту!';
  const lines=balancedLines(text,49,1,measure);
  assert.equal(lines.length,2);assert.equal(lines.join(' '),text);assert.ok(lines.every(line=>line.length<=49&&line.split(' ').length>1));
  assert.ok(Math.max(...lines.map(measure))-Math.min(...lines.map(measure))<15);
});
test('empty, unbreakable and exceptionally long tips preserve all text',()=>{
  assert.deepEqual(balancedLines('',20,1,measure),['']);
  assert.deepEqual(balancedLines('Супердлинноеслово',4,1,measure),['Супердлинноеслово']);
  const text=Array.from({length:200},(_,i)=>'слово'+i).join(' '),lines=balancedLines(text,55,1,measure);
  assert.equal(lines.join(' '),text);assert.ok(lines.every(line=>line.length<=55));
});

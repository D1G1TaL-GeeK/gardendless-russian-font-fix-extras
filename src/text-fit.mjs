export function authoredLines(text) {
  return String(text).trim().split(/\r?\n/).map(line=>line.trim().replace(/\s+/g," "));
}

export function balancedLines(text,width,size,measure,style) {
  const result=[];
  for(const paragraph of authoredLines(text)) {
    const words=paragraph.split(" "),count=words.length,greedy=[];
    let current="";
    for(const word of words){const next=current?`${current} ${word}`:word;if(current&&measure(next,style)*size>width){greedy.push(current);current=word;}else current=next;}
    greedy.push(current);
    const rows=greedy.length;
    if(rows===1||count>160){result.push(...greedy);continue;}
    const widths=new Map(),line=(i,j)=>words.slice(i,j).join(" ");
    const span=(i,j)=>{const key=i*count+j;if(!widths.has(key))widths.set(key,measure(line(i,j),style)*size);return widths.get(key);};
    const dp=Array.from({length:rows+1},()=>Array(count+1).fill(Infinity)),previous=dp.map(row=>row.map(()=>-1));dp[0][0]=0;
    for(let row=1;row<=rows;row++)for(let end=row;end<=count;end++)for(let begin=end-1;begin>=row-1;begin--) {
      const w=span(begin,end);if(w>width&&end>begin+1)break;
      if(w>width||!Number.isFinite(dp[row-1][begin]))continue;
      const slack=(width-w)/Math.max(1,width),cost=dp[row-1][begin]+slack*slack;
      if(cost<dp[row][end]){dp[row][end]=cost;previous[row][end]=begin;}
    }
    if(previous[rows][count]<0){result.push(...greedy);continue;}
    let end=count;const lines=[];
    for(let row=rows;row>0;row--){const begin=previous[row][end];lines.unshift(line(begin,end));end=begin;}
    result.push(...lines);
  }
  return result;
}

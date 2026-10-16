import {test,expect} from '@playwright/test';
test('maximize and restore interpolate the actual visible window rectangle',async({page})=>{
 await page.goto('./?lite=1');
 await page.getByRole('button',{name:'Открыть Обо мне',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Обо мне',exact:true});
 await expect.poll(()=>dialog.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
 const original=(await dialog.boundingBox())!;
 async function sample(){return page.evaluate(()=>new Promise<number[]>(resolve=>{
  const dialog=document.querySelector('[role="dialog"]')!;
  const values:number[]=[];const start=performance.now();
  (dialog.querySelector('[aria-label="Развернуть Обо мне"]') as HTMLButtonElement).click();
  function frame(){values.push(dialog.getBoundingClientRect().width);if(performance.now()-start<1000)requestAnimationFrame(frame);else resolve(values);}
  requestAnimationFrame(frame);
 }));}
 const expanding=await sample();
 expect(expanding[0]).toBeLessThan(original.width+40);
 const max=expanding.at(-1)!;
 expect(max).toBeGreaterThan(1000);
 expect(expanding.filter(w=>w>original.width+60&&w<max-60).length).toBeGreaterThan(5);
 const restoring=await sample();
 expect(restoring[0]).toBeGreaterThan(max-40);
 expect(restoring.at(-1)).toBeCloseTo(original.width,0);
 expect(restoring.filter(w=>w>original.width+60&&w<max-60).length).toBeGreaterThan(5);
});

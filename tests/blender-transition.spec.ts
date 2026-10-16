import {test,expect} from '@playwright/test';
test('scene never leaves the viewport during overshoot and reverse, Blender asset loads',async({page})=>{
 const assets:string[]=[];
 page.on('response',r=>{if(r.url().endsWith('/models/laptop.glb')&&r.ok())assets.push(r.url());});
 await page.goto('./');
 const stage=page.locator('.experience-stage');
 await expect(stage).toHaveAttribute('data-scene-ready','true');
 await page.screenshot({path:'../../work/liquid-blob-final.png'});
 await page.evaluate(()=>{
  (window as any).stageSamples=[];
  let frames=0;
  function sample(){const r=document.querySelector('.experience-stage')!.getBoundingClientRect();(window as any).stageSamples.push([r.top,r.height,innerHeight]);if(frames++<240)requestAnimationFrame(sample);}
  requestAnimationFrame(sample);
  scrollTo(0,innerHeight*6);
 });
 await expect(stage).toHaveClass(/is-active/);
 await page.mouse.move(1300,700);
 await page.waitForTimeout(800);
 await page.mouse.wheel(0,-120);
 await expect(stage).not.toHaveClass(/is-active/);
 await page.waitForTimeout(1100);
 const samples=await page.evaluate(()=>(window as any).stageSamples as number[][]);
 expect(samples.length).toBeGreaterThan(3);
 expect(samples.every(([top,height,viewport])=>Math.abs(top)<1&&Math.abs(height-viewport)<1)).toBe(true);
 expect(assets).toHaveLength(1);
 await page.screenshot({path:'../../work/blender-return.png'});
});
test('window can move all the way to the menubar',async({page})=>{
 await page.goto('./?lite=1');
 await page.getByRole('button',{name:'Открыть Обо мне',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Обо мне',exact:true});
 await expect.poll(()=>dialog.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
 const title=await dialog.locator('.window-title').boundingBox();
 await page.mouse.move(title!.x+170,title!.y+20);await page.mouse.down();await page.mouse.move(title!.x+170,0,{steps:12});await page.mouse.up();
 const bar=await page.locator('.menubar').boundingBox();
 await expect.poll(async()=>(await dialog.boundingBox())!.y).toBeCloseTo(bar!.height,0);
 await page.screenshot({path:'../../work/window-top-fixed.png'});
});

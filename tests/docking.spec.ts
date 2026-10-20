import {test,expect} from '@playwright/test';

test('scroll entry absorbs momentum, keeps windows scrollable and allows deliberate exit',async({page})=>{
  await page.goto('./#studio');
  const stage=page.locator('.experience-stage');
  await expect(stage).toHaveAttribute('data-scene-ready','true');
  await page.evaluate(()=>scrollTo(0,innerHeight*4.5*.87));
  await expect.poll(()=>page.locator('.skip-intro').evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(.05);
  await expect(page.locator('.scroll-prompt,.lite-button')).toHaveCount(0);
  await page.evaluate(()=>scrollTo(0,innerHeight*4.5));
  await expect(stage).toHaveClass(/is-active/,{timeout:15000});
  const position=await page.evaluate(()=>scrollY);
  await page.mouse.move(1400,850);
  await page.mouse.wheel(0,-25);
  await page.mouse.wheel(0,400);
  await expect(stage).toHaveClass(/is-active/);
  expect(await page.evaluate(()=>scrollY)).toBe(position);
  await page.getByRole('button',{name:'Открыть Обо мне',exact:true}).click();
  const about=page.getByRole('dialog',{name:'Обо мне',exact:true});
  await about.locator('.window-body').hover();
  await page.mouse.wheel(0,-600);
  await expect(stage).toHaveClass(/is-active/);
  await page.mouse.move(1400,850);
  await page.waitForTimeout(800);
  await page.mouse.wheel(0,-120);
  await expect(stage).not.toHaveClass(/is-active/);
  await expect(page.locator('.desktop-surface')).toHaveAttribute('inert','');
});

test('icons stay in one column and entry fade is visible with an explicit terminal prompt',async({page})=>{
  await page.goto('./?lite=1#studio');
  for(const height of [900,715]){
    await page.setViewportSize({width:1100,height});
    const about=await page.getByRole('button',{name:'Открыть Обо мне',exact:true}).boundingBox();
    const contact=await page.getByRole('button',{name:'Открыть Контакты',exact:true}).boundingBox();
    expect(contact!.x).toBeCloseTo(about!.x,0);
    expect(contact!.y).toBeGreaterThan(about!.y);
  }
  await page.getByRole('button',{name:'Открыть Терминал',exact:true}).click();
  const terminal=page.getByRole('dialog',{name:'Терминал',exact:true});
  const initialOpacity=await terminal.evaluate(el=>Number(getComputedStyle(el).opacity));
  expect(initialOpacity).toBeLessThan(.9);
  await expect.poll(()=>terminal.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
  await expect(page.getByPlaceholder('Например: help или open ai-hunter')).toBeVisible();
  await expect(page.getByRole('button',{name:'Выполнить команду'})).toBeVisible();
  await page.screenshot({path:'test-results/legacy/terminal-final.png'});
});

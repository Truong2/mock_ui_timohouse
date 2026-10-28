// User-level persistence, dirty-form protection and approval, with desktop/mobile captures.
async (host) => {
  const context=await host.context().browser().newContext(),page=await context.newPage(),results=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const check=(name,pass)=>{results.push({name,pass:!!pass});if(!pass)throw Error(name);};
  try{
    await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D#/demo/own-01');
    await page.setViewportSize({width:1440,height:900});
    await page.waitForFunction(()=>TH.recordActions.formAdapter&&TH.db.recordHistory);
    await page.evaluate(()=>{TH.db=TH.seed();Object.assign(TH.store.state,{role:'admin',building:'ALL',period:'2026-10',pkg:'D',drafts:{},ui:{}});TH.recordActions.init();TH.app.refresh();});
    const original=await page.evaluate(()=>TH.calc.owner('CN-001').name);
    await page.locator('[data-act="rec.open"][data-type="owner"][data-id="CN-001"][data-action="edit"]').first().click();
    await page.getByLabel(/Họ tên \/ tên pháp nhân/).fill('Chưa lưu');
    await page.getByRole('button',{name:'Hủy chỉnh sửa',exact:true}).click();
    check('dirty cancel asks before discarding',await page.getByRole('heading',{name:'Bỏ thay đổi chưa lưu?',exact:true}).isVisible());
    await page.getByRole('button',{name:'Bỏ thay đổi',exact:true}).click();
    check('cancel preserves original data',await page.evaluate(name=>TH.calc.owner('CN-001').name===name,original));
    await page.evaluate(()=>{TH.db.owners.push({id:'CN-UI-QA',name:'Hồ sơ nhập nhầm',phone:'0900000000',status:'active'});TH.app.refresh();TH.recordActions.open('owner','CN-UI-QA','delete');});
    await page.locator('.overlay:not(.is-closing)').last().getByLabel(/Lý do \/ căn cứ/).fill('Tạo trùng hồ sơ');
    await page.locator('[data-act="rec.save"][data-action="delete"]').click();
    await page.reload();
    check('soft deletion persists',await page.evaluate(()=>!TH.calc.owner('CN-UI-QA')&&TH.recordActions.trash('owner','CN-UI-QA').record.deleteReason==='Tạo trùng hồ sơ'));
    await page.locator('[data-act="rec.list"][data-mode="trash"]').first().click();
    await page.locator('[data-act="rec.open"][data-action="restore"][data-id="CN-UI-QA"]').click();
    await page.locator('[data-act="rec.save"][data-action="restore"]').click();
    await page.reload();
    check('restoration persists',await page.evaluate(()=>TH.calc.owner('CN-UI-QA').name==='Hồ sơ nhập nhầm'));
    await page.evaluate(()=>TH.recordActions.open('owner','CN-UI-QA','delete'));
    await page.locator('.overlay:not(.is-closing)').last().getByLabel(/Lý do \/ căn cứ/).fill('Kiểm tra quyền lại');
    await page.evaluate(()=>TH.store.set('role','hr'));
    await page.locator('[data-act="rec.save"][data-action="delete"]').click();
    check('role changed while dialog open blocks save',await page.evaluate(()=>!!TH.calc.owner('CN-UI-QA')));
    await page.evaluate(()=>{TH.modal.stack.slice().forEach(m=>TH.modal.close(m.key,{silent:true}));TH.store.set('role','admin');});
    const fixture=await page.evaluate(()=>{const r=TH.db.receipts.find(x=>x.status==='confirmed'&&TH.calc.invoice(x.invoiceId).period==='2026-09'),inv=TH.calc.invoice(r.invoiceId);window.__recordUiFixture={id:r.id,invoiceId:inv.id,before:JSON.stringify(r),paid:TH.calc.paid(inv.id),cash:TH.recordActions.cashFlow('2026-10','ALL').net};TH.recordActions.open('receipt',r.id,'correct');return {id:r.id,amount:r.amount};});
    await page.getByLabel('Tổng giá trị đúng sau điều chỉnh (đ)',{exact:true}).fill(String(fixture.amount-10000));
    await page.locator('.overlay:not(.is-closing)').last().getByLabel(/Lý do \/ căn cứ/).fill('Ghi dư 10.000 đồng');
    await page.locator('[data-act="rec.save"][data-action="correct"]').click();
    const correction=await page.evaluate(()=>TH.db.recordCorrections[TH.db.recordCorrections.length-1].id);
    check('request has no immediate balance effect',await page.evaluate(()=>TH.calc.paid(window.__recordUiFixture.invoiceId)===window.__recordUiFixture.paid));
    await page.evaluate(id=>{TH.store.set('role','accountant');TH.recordActions.open('correction',id,'approve');},correction);
    await page.locator('[data-act="rec.save"][data-action="approve"]').click();
    check('approved recording correction has exact debt and no cash change',await page.evaluate(()=>{const f=window.__recordUiFixture;return TH.calc.paid(f.invoiceId)===f.paid-10000&&JSON.stringify(TH.recordActions.get('receipt',f.id))===f.before&&TH.recordActions.cashFlow('2026-10','ALL').net===f.cash;}));
    await page.reload();
    check('approval persists after reload',await page.evaluate(id=>TH.recordActions.get('correction',id).status==='approved',correction));
    await page.evaluate(()=>{TH.store.set('role','admin');TH.app.refresh();});
    await page.screenshot({path:'C:/Users/truon/Downloads/mockup/docs/qa/records-desktop.png',fullPage:true});
    await page.setViewportSize({width:375,height:812});
    await page.evaluate(()=>TH.recordActions.open('owner','CN-001','edit'));
    await page.locator('.overlay:not(.is-closing)').last().evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished)));
    check('375px form fits viewport',await page.evaluate(()=>{const r=document.querySelector('.overlay:last-child [role=dialog]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1;}));
    await page.screenshot({path:'C:/Users/truon/Downloads/mockup/docs/qa/records-mobile.png'});
    await page.keyboard.press('Tab');
    check('keyboard focus remains inside modal',await page.evaluate(()=>!!document.activeElement.closest('[role=dialog]')));
    check('no browser errors',!errors.length);
    return{pass:true,checks:results.length,results,errors};
  }catch(e){return{pass:false,failure:e.message,results,errors};}finally{await context.close();}
}

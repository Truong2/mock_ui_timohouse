// Isolated browser context: package entitlements, single-record flows and arithmetic parity.
async (host) => {
  const context = await host.context().browser().newContext();
  const page = await context.newPage(), results = [], errors = [];
  const check = (id, pass, evidence) => { results.push({id, pass:!!pass, evidence}); if (!pass) throw Error(id + ': ' + JSON.stringify(evidence)); };
  page.on('pageerror', e => errors.push(e.message));
  const reset = async pkg => page.evaluate(k => {
    TH.modal.stack.slice().forEach(m => TH.modal.close(m.key, {silent:true}));
    TH.db = TH.seed(); Object.assign(TH.store.state, {pkg:k, role:'admin', building:'ALL', period:'2026-10', ui:{}, drafts:{}, editing:null, showLocked:true});
    TH.app.guard = null; TH.app.refresh();
  }, pkg);
  try {
    await page.goto('http://127.0.0.1:8779/index.html?previewPackage=A&policyQa='+Date.now()+'#/');
    await page.waitForFunction(() => window.TH && TH.packagePolicy && TH.packagePolicy.installed);
    check('POLICY', await page.evaluate(() => TH.FEATURES.length === 52 && TH.DATA_SCHEMA === 12 && TH.PKG_KEYS.map(k=>TH.PACKAGES[k].price).join('|') === '50–60 triệu|70–80 triệu|80–90 triệu|90–100 triệu'), 'Registry, schema and prices retained');
    let reference;
    for (const pkg of ['A','B','C','D']) {
      await reset(pkg);
      const parity = await page.evaluate(() => {
        const out = [];
        for (const p of TH.PERIODS) for (const b of TH.db.buildings) {
          const r = TH.calc.perfBuilding(p,b.id), t = TH.perfTier(r);
          if (Math.abs(t.D-(r.A-r.A*r.B+r.C))>0.001) throw Error('Formula gated by package');
          out.push([p,b.id,t.D,t.hs,t.Dprov,TH.calc.pnl(p,b.id,'kd').lnr,TH.calc.pnl(p,b.id,'tong').lnr]);
        }
        return JSON.stringify({out, salaries:TH.calc.payroll('2026-10').map(x=>x.total), reports:Object.keys(TH.reports.TYPES)});
      });
      if (!reference) reference = parity;
      check('ARITHMETIC-'+pkg, parity === reference, '18 building-period results, payroll and two report types match across packages');
      const blocked = await page.evaluate(() => {
        const before = JSON.stringify(TH.db), names = [];
        for (const name of Object.keys(TH.packagePolicy.actions)) {
          const rule = TH.packagePolicy.actions[name], el = {dataset:{screen:'OWN-IMP',id:'unused'}};
          const feature = typeof rule === 'function' ? rule(el) : rule;
          if (TH.has(feature)) continue;
          const fn = TH.act[name] || TH.onChange[name]; if (!fn) continue;
          fn(el); names.push(name);
          TH.modal.stack.slice().forEach(m=>TH.modal.close(m.key,{silent:true}));
        }
        return {unchanged:before===JSON.stringify(TH.db), names};
      });
      check('DIRECT-GUARDS-'+pkg, blocked.unchanged && (pkg==='D' || blocked.names.length>0), blocked);
    }
    await reset('A');
    await page.goto('http://127.0.0.1:8779/index.html?previewPackage=A#/demo/own-imp');
    await page.waitForSelector('[data-locked="F002.B"]');
    check('IMPORT-DEEP-LINK-A', await page.locator('[data-act="imp.commit"]').count()===0, 'Import route shows package lock and manual alternative');
    await reset('A'); await page.evaluate(()=>TH.go('INV-01')); await page.waitForSelector('#inv1-room');
    const empty = await page.evaluate(()=>{const n=TH.db.invoices.length;TH.act['inv.gen']({dataset:{}});return n===TH.db.invoices.length;});
    check('A-INVOICE-REQUIRES-ROOM', empty, 'No silent all-room fallback');
    const profiles=await page.evaluate(()=>{
      const set=(form,data)=>Object.entries(data).forEach(([k,v])=>TH.store.setDraft(form,k,v));
      set('own-new',{id:'CN-QA',name:'Chủ nhà mô phỏng QA',phone:'0900000000'});TH.act['own.save']({dataset:{}});
      set('bld-new',{id:'TH-QA',name:'Tòa mô phỏng QA',owner:'CN-QA',manager:'NV-003'});TH.act['bld.save']();
      set('room-new',{b:'TH-QA',code:'101',rent:'3000000'});TH.act['room.save']({dataset:{id:'new'}});
      set('cus-new',{name:'Khách mô phỏng QA',phone:'0900000001'});TH.act['cus.save']();const customer=TH.db.customers[TH.db.customers.length-1];
      set('con-new',{customer:customer.id,room:'QA-101',rent:'3000000',deposit:'3000000',start:'2026-10-01',end:'2027-09-30'});TH.act['con.approve']();
      const c=TH.calc.contractOfRoom('QA-101');
      return {owner:!!TH.db.owners.find(o=>o.id==='CN-QA'),building:!!TH.calc.building('TH-QA'),room:!!TH.calc.room('QA-101'),contract:!!c&&c.customerId===customer.id};
    });
    check('A-PROFILE-CONTRACT-FLOW',Object.values(profiles).every(Boolean),profiles);
    await reset('A'); await page.evaluate(()=>TH.go('INV-01'));await page.waitForSelector('#inv1-room');
    const gen = await page.evaluate(()=>{
      TH.store.setUi('INV-01','b','TH-TX'); TH.store.setUi('INV-01','multi',true);
      const cs=TH.db.contracts.filter(c=>c.status==='active'&&c.buildingId==='TH-TX');
      TH.db.invoices=TH.db.invoices.filter(i=>i.period!=='2026-10'||i.buildingId!=='TH-TX');
      TH.store.setUi('INV-01','room',cs[0].roomId);
      const n=TH.db.invoices.length;TH.act['inv.gen']({dataset:{}});
      const added=TH.db.invoices.slice(n); TH.act['inv.gen']({dataset:{}});
      return {added:added.map(i=>i.roomId), room:cs[0].roomId, unique:TH.db.invoices.length===n+1};
    });
    check('A-INVOICE-SINGLE-IDEMPOTENT',gen.added.length===1&&gen.added[0]===gen.room&&gen.unique,gen);
    // Seed ready drafts for two rooms to distinguish single confirmation from batch confirmation.
    await page.evaluate(()=>{
      const cs=TH.db.contracts.filter(c=>c.status==='active'&&c.buildingId==='TH-CG').slice(0,2);
      TH.db.invoices=TH.db.invoices.filter(i=>i.period!=='2026-10'||!cs.some(c=>c.roomId===i.roomId));
      cs.forEach(c=>{const i=TH.buildInvoice(TH.db,c,'2026-10','draft');i.readingOk=true;i.lines.forEach(l=>l.draft=false);TH.db.invoices.push(i);});
      TH.store.setUi('INV-01','b','TH-CG');TH.store.setUi('INV-01','room',cs[0].roomId);
      window.__confirmIds=cs.map(c=>TH.db.invoices.find(i=>i.period==='2026-10'&&i.roomId===c.roomId).id);
      // Avoid rendering synthetic ready drafts, which would legitimately rebuild their sources.
      window.__refresh=TH.app.refresh;TH.app.refresh=()=>{};
      TH.act['inv.confirm']();
    });
    await page.locator('[data-act="confirm.ok"]').last().click();
    const confirmed=await page.evaluate(()=>{const s=__confirmIds.map(id=>TH.calc.invoice(id).status);TH.app.refresh=__refresh;return s;});
    check('A-CONFIRM-SINGLE',confirmed[0]==='confirmed'&&confirmed[1]==='draft',confirmed);
    await reset('B');
    await page.evaluate(()=>{
      TH.store.setUi('INV-01','b','TH-TX');TH.db.invoices=TH.db.invoices.filter(i=>i.period!=='2026-10'||i.buildingId!=='TH-TX');
      const n=TH.db.invoices.length;TH.act['inv.gen']({dataset:{}});window.__batchAdded=TH.db.invoices.length-n;
    });
    check('B-INVOICE-BATCH',await page.evaluate(()=>__batchAdded>1),'One operation creates multiple room invoices');
    // A pending C/D confirmation must recheck entitlement on completion.
    await reset('D');
    await page.evaluate(()=>{TH.act['rpt.lock']();TH.store.state.pkg='A';});
    await page.locator('[data-act="confirm.ok"]').last().click();
    check('DOWNGRADE-CONFIRM-GUARD',await page.evaluate(()=>!TH.db.periodLocks['2026-10']),'D confirmation cannot lock a period after downgrade');
    await reset('A');
    for(const pkg of ['A','B','C','D']){
      const r=await page.evaluate(k=>{TH.store.state.pkg=k;TH.store.state.period='2026-10';const shares=TH.calc.sharesFor('TH-CG','2026-10');TH.store.setUi('SHARE-01','b','TH-CG');TH.store.setDraft('shr-TH-CG-2026-10',shares[0].id,'0');const before=JSON.stringify(TH.db.shares);TH.act['shr.save']();return before===JSON.stringify(TH.db.shares);},pkg);
      check('SHARE-100-'+pkg,r,'Invalid allocation is rejected at every tier');
    }
    for(const pkg of ['A','B','C','D']){
      await reset(pkg);
      const r=await page.evaluate(()=>{
        const i=TH.db.invoices.find(i=>i.status==='confirmed'&&TH.calc.debt(i)>0&&TH.calc.customer(i.customerId).oaLinked);
        const tpl=TH.db.oaTemplates.find(t=>t.kind!=='expiry'&&t.status==='approved');
        TH.db.messages=TH.db.messages.filter(m=>m.invoiceId!==i.id);
        const sent=TH.zaloSend(i,tpl.id), n=TH.db.messages.length, again=TH.zaloSend(i,tpl.id);
        TH.db.receipts.push({id:'QA-FULL',invoiceId:i.id,amount:TH.calc.debt(i),status:'confirmed',receivedAt:TH.TODAY});
        const reminder=TH.zaloSend(i,'TPL-02');
        return {sent,unique:TH.db.messages.length<=n+1,again,reminder};
      });
      check('OA-SAFETY-'+pkg,r.sent==='sent'&&r.again!=='sent'&&r.reminder!=='sent'&&r.unique,r);
    }
    await reset('A');
    const stale=await page.evaluate(()=>{TH.store.setUi('OA-01','sel',TH.db.invoices.slice(0,2).map(i=>i.id));const before=JSON.stringify(TH.db);TH.act['oa.send']();return before===JSON.stringify(TH.db);});
    check('A-OA-STALE-MULTI',stale,'Saved multi-selection cannot send from A');
    const single=await page.evaluate(()=>{const i=TH.db.invoices.find(i=>i.status==='confirmed'&&TH.calc.customer(i.customerId).oaLinked);TH.db.messages=[];TH.store.setUi('OA-01','sel',[i.id]);TH.store.setUi('OA-01','tpl','TPL-01');TH.act['oa.send']();return TH.db.messages.length===1;});
    check('A-OA-SINGLE',single,'A retains functional OCR/OA baseline');
    const badVersion=await page.evaluate(()=>TH.reports.preview({type:'RPT-05',period:'2026-09',buildingIds:['TH-CG'],previousRunId:'existing'}));
    check('REPORT-VERSION-DIRECT-GUARD',!badVersion.ok,'Direct report API cannot create an advanced version from A');
    // Real save/export parity of both original report types for each tier.
    for(const pkg of ['A','B','C','D']){
      await reset(pkg);
      const reports=await page.evaluate(()=>['RPT-04','RPT-05'].map(type=>{
        const p=TH.reports.preview({type,period:'2026-09',buildingIds:['TH-CG'],tpl:'MAU-BCKD'});
        if(!p.ok)return {type,error:p.error};
        TH.reports.reviewState(p.draft).groups.forEach(g=>{TH.reports.markSeen(p.draft.id,g.id);TH.reports.setReview(p.draft.id,g.id,true);});
        const s=TH.reports.confirm(p.draft.id,{acknowledgeWarnings:true});
        const r=s.ok&&TH.reports.run(s.runIds[0]);
        return {type,ok:s.ok,match:r&&JSON.stringify(r.snapshot.vals)===JSON.stringify(p.draft.items[0].vals)};
      }));
      check('REPORT-SAVE-'+pkg,reports.every(r=>r.ok&&r.match),reports);
    }
    await reset('A');
    const manualMeter=await page.evaluate(()=>{
      TH.db.readings=TH.db.readings.filter(r=>!(r.roomId==='TX-102'&&r.period==='2026-10'));
      TH.store.setDraft('mtr1-TX-102','ep','100');TH.store.setDraft('mtr1-TX-102','wp','10');TH.store.setDraft('mtr1-TX-102','e','150');TH.store.setDraft('mtr1-TX-102','w','15');
      TH.act['mtr.save1']({dataset:{id:'TX-102'}});const r=TH.calc.reading('TX-102','2026-10');return r&&r.elecCur===150&&r.elecPrev===100&&r.waterCur===15;
    });
    check('A-FIRST-READING',manualMeter,'First-month entry is available without a seeded reading');
    const negativeMeter=await page.evaluate(()=>{const before=JSON.stringify(TH.db.readings);TH.store.setDraft('mtr1-TX-102','e','1');TH.store.setDraft('mtr1-TX-102','w','15');TH.act['mtr.save1']({dataset:{id:'TX-102'}});return before===JSON.stringify(TH.db.readings);});
    check('A-METER-VALIDATION',negativeMeter,'Invalid readings do not require an advanced package to be rejected');
    await reset('A');
    await page.evaluate(()=>TH.go('CON-02','new'));await page.waitForSelector('[data-act="con.approve"]');
    const overlap=await page.evaluate(()=>{
      const binding=document.querySelector('[data-draft$=".room"]').dataset.draft,form=binding.slice(0,binding.indexOf('.'));
      const c=TH.db.contracts.find(c=>c.status==='active');
      Object.entries({customer:c.customerId,room:c.roomId,rent:String(c.rent),deposit:String(c.deposit),start:c.start,end:c.end}).forEach(([k,v])=>TH.store.setDraft(form,k,v));
      const before=TH.db.contracts.length;TH.act['con.approve']();return before===TH.db.contracts.length;
    });
    check('A-CONTRACT-OVERLAP',overlap,'Overlapping tenancy is rejected before any customer/contract mutation');
    await reset('A');
    const receipt=await page.evaluate(()=>{
      const i=TH.db.invoices.find(i=>i.status==='confirmed'&&i.period==='2026-10'&&TH.calc.debt(i)>0),before=TH.db.receipts.length;
      TH.store.setDraft('pay-rep','inv',i.id);TH.store.setDraft('pay-rep','amount',String(TH.calc.debt(i)+100000));TH.store.setDraft('pay-rep','_requestId','QA-REPEAT');
      TH.act['pay.reportSave']();const added=TH.db.receipts.slice(before);
      TH.store.setDraft('pay-rep','inv',i.id);TH.store.setDraft('pay-rep','amount','100');TH.store.setDraft('pay-rep','_requestId','QA-REPEAT');TH.act['pay.reportSave']();
      return {one:added.length===1&&added[0].invoiceId===i.id,noDuplicate:TH.db.receipts.length===before+1,credit:TH.calc.balance(i)>0};
    });
    check('A-RECEIPT-ONE-CREDIT-IDEMPOTENT',receipt.one&&receipt.noDuplicate&&receipt.credit,receipt);
    const salary=await page.evaluate(()=>{
      const a=TH.db.staff.slice(0,2),p='sal-2026-10';a.forEach(s=>TH.store.setDraft(p,s.id+'.base',String(s.base+1000)));
      const before=a.map(s=>s.base);TH.act['sal.saveSetup']({dataset:{id:a[0].id}});
      const saved=TH.calc.payroll('2026-10');
      return saved.find(r=>r.staff.id===a[0].id).base===before[0]+1000&&saved.find(r=>r.staff.id===a[1].id).base===before[1]&&a.every((s,i)=>s.base===before[i]);
    });
    check('A-SALARY-SINGLE',salary,'Saving one employee leaves other employee drafts untouched');
    const denied=await page.evaluate(()=>{TH.store.state.role='hr';const before=JSON.stringify(TH.db);TH.act['inv.gen']({dataset:{}});TH.zaloSend(TH.db.invoices[0],'TPL-01');return before===JSON.stringify(TH.db);});
    check('ROLE-INDEPENDENT',denied,'A higher tier never grants a role permission');
    await reset('D');
    const scan=await page.evaluate(()=>{const r=TH.qaSmoke(),m=TH.scanMapping();const missing=[];TH.FEATURES.forEach(f=>['B','C','D'].forEach(k=>{if(!m[f.id+'.'+k])missing.push(f.id+'.'+k);}));return {total:r.total,fails:r.fails,missing};});
    check('SMOKE-MAPPING',scan.total===1168&&!scan.fails.length&&!scan.missing.length,scan);
    for(const width of [375,768,1024,1440])for(const pkg of ['A','B','C','D']){
      await page.setViewportSize({width,height:950});await reset(pkg);
      await page.evaluate(()=>TH.router.go('#/'));await page.waitForSelector('.landing-pricing');
      await page.locator('.plan[data-pkg="'+pkg+'"] button').click();
      check('LAYOUT-'+width+'-'+pkg,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pricing page fits viewport and selected package');
      if(width===375||width===1440)await page.screenshot({path:'D:/mock_ui_timohouse/docs/qa/package-policy/'+pkg+'-'+width+'.png'});
    }
    check('CONSOLE',!errors.length,errors);
    return {date:'2026-10-24',passed:results.length,results};
  }finally{await context.close();}
}

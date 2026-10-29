// Isolated regression for record lifecycles, dated amendments, reversals and import rollback.
async (host) => {
  const context = await host.context().browser().newContext(), page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('http://127.0.0.1:8779/index.html?previewPackage=D#/demo/own-01');
    await page.waitForFunction(() => TH.recordActions.defaultPeriod && TH.db.salaryInputs);
    const results = await page.evaluate(() => {
      const out = [], R = TH.recordActions, C = TH.calc;
      const check = (name, ok) => { out.push({name, pass:!!ok}); };
      const reset = pkg => { TH.db = TH.seed(); Object.assign(TH.store.state, {pkg:pkg||'D',role:'admin',building:'ALL',period:'2026-10',ui:{},drafts:{}}); R.init(); };
      reset();
      const samples = {
        owner:{id:'X-owner',name:'A',status:'active'}, building:{id:'X-building',ownerId:'CN-001',name:'A',status:'active'}, room:{id:'X-room',buildingId:'T17',floor:1,area:20,status:'vacant'},
        customer:{id:'X-customer',name:'A',status:'active',vehicles:[]}, contractDraft:{id:'X-contractDraft',roomId:'101T17',buildingId:'T17',customerId:'KH-001',rent:1000000,deposit:1000000,start:'2026-10-01',end:'2027-10-01',note:'',status:'draft'},
        leaseDraft:{id:'X-leaseDraft',buildingId:'T17',ownerId:'CN-001',rent:1000000,deposit:1000000,start:'2030-01-01',end:'2031-01-01',payCycle:3,payTo:10,note:'',status:'draft'},
        followup:{id:'X-followup',contractId:TH.db.contracts[0].id,result:'no_answer',note:'',status:'draft'}, assignment:{id:'X-assignment',buildingId:'T17',staffId:'NV-006',from:TH.TODAY,role:'Bảo vệ',status:'active'},
        asset:{id:'X-asset',buildingId:'T17',name:'A',qty:1,status:'active'}, document:{id:'X-document',buildingId:'T17',file:'a.pdf',kind:'Khác',note:'',status:'active'},
        landlordPay:{id:'X-landlordPay',buildingId:'T17',from:'2028-01',to:'2028-03',paid:0,amount:100000,note:''}, reading:{id:'X-reading',roomId:'101T17',period:'2026-05',elecPrev:0,elecCur:1,waterPrev:0,waterCur:1,status:'draft'},
        fee:{id:'X-fee',roomId:'101T17',period:'2026-05',name:'A',qty:1,price:1000,status:'draft'}, invoice:{id:'X-invoice',buildingId:'T17',roomId:'101T17',period:'2026-10',total:1000,lines:[{type:'rent',name:'A',amount:1000}],status:'draft',note:''},
        receipt:{id:'X-receipt',invoiceId:TH.db.invoices.find(x=>x.period==='2026-10'&&x.status==='confirmed').id,amount:1000,receivedAt:'2026-10-20',status:'draft',reportedBy:'NV-001',note:''},
        depositCase:{id:'X-depositCase',contractId:TH.db.contracts[0].id,state:'reconciling',amount:1000,refundAmount:1000,forfeitAmount:0,deductions:[],note:''}, deposit:{id:'X-deposit',buildingId:'T17',period:'2026-10',amount:1000,status:'draft',note:''},
        expense:{id:'X-expense',buildingId:'T17',period:'2026-10',description:'A',amount:1000,status:'draft',createdBy:'NV-001'}, staff:{id:'X-staff',name:'A',phone:'0',team:'VP',status:'active'}, team:{id:'X-team',name:'A',leaderId:'NV-001',status:'active'},
        salaryInput:{id:'X-salaryInput',staffId:'NV-001',period:'2026-10',base:1000,allowance:0,status:'draft'}, salaryAdjustment:{id:'X-salaryAdjustment',staffId:'NV-001',period:'2026-10',amount:1000,reason:'A',status:'draft'},
        shareholder:{id:'X-shareholder',name:'A',phone:'0',status:'active'}, oaSchedule:{id:'X-oaSchedule',name:'A',day:10,templateId:'TPL-02',status:'active'}, oaTemplate:{id:'X-oaTemplate',name:'A',body:'A',status:'draft'}, user:{id:'X-user',staffId:'NV-006',username:'qa.user',role:'manager',scope:['T17'],status:'active'}
      };
      const value = {owner:{name:'B'},building:{name:'B'},room:{floor:2},customer:{name:'B'},contractDraft:{note:'B'},leaseDraft:{note:'B'},followup:{note:'B'},assignment:{role:'Bảo trì'},asset:{name:'B'},document:{file:'b.pdf'},landlordPay:{note:'B'},reading:{elecCur:2},fee:{price:2000},invoice:{note:'B'},receipt:{note:'B'},depositCase:{note:'B'},deposit:{note:'B'},expense:{description:'B'},staff:{name:'B'},team:{name:'B'},salaryInput:{base:2000},salaryAdjustment:{reason:'B'},shareholder:{name:'B'},oaSchedule:{day:11},oaTemplate:{body:'B'},user:{username:'qa.user2'}};
      for (const [type, sample] of Object.entries(samples)) {
        reset();
        // Isolate unused readings / fees from the seed invoices.
        if (['fee','reading'].includes(type)) TH.db.invoices=TH.db.invoices.filter(i=>i.roomId!==sample.roomId||i.period!==sample.period);
        R.list(type).push(sample);
        check(type+' edit',R.execute(type,sample.id,'edit',{values:value[type]}).ok);
        check(type+' soft delete',R.execute(type,sample.id,'delete',{reason:'Nhập nhầm'}).ok && !R.get(type,sample.id));
        check(type+' restore',R.execute(type,sample.id,'restore').ok && !!R.get(type,sample.id));
      }
      reset();
      const owner={id:'DUP',name:'A',status:'active'};TH.db.owners.push(owner);R.execute('owner','DUP','delete',{reason:'Trùng'});TH.db.owners.push({id:'DUP',name:'B',status:'active'});
      check('restore duplicate blocked',!R.execute('owner','DUP','restore').ok);
      reset();
      const ct=TH.db.contracts.find(c=>c.status==='active'), before=JSON.stringify(TH.db.invoices.filter(i=>i.contractId===ct.id&&i.status==='confirmed')), rent=ct.rent, old=TH.buildInvoice(TH.db,ct,'2026-08','draft').total;
      check('dated contract terms',R.execute('contract',ct.id,'terms',{rent:rent+100000,effectiveFrom:'2026-10',reason:'Thỏa thuận'}).ok);
      check('past contract rate retained',TH.buildInvoice(TH.db,ct,'2026-08','draft').total===old);
      check('confirmed invoices immutable',JSON.stringify(TH.db.invoices.filter(i=>i.contractId===ct.id&&i.status==='confirmed'))===before);
      check('current contract rate applied',TH.buildInvoice(TH.db,ct,'2026-10','draft').lines.find(l=>l.type==='rent').price===rent+100000);
      check('double amendment blocked',!R.execute('contract',ct.id,'terms',{rent:rent+100000,effectiveFrom:'2026-10',reason:'Lặp'}).ok);
      const list=R.contractAt(ct,'2026-10').priceList.map(l=>({...l,price:l.code==='NET'?l.price+30000:l.price}));
      check('fee amendment',R.execute('contract',ct.id,'terms',{rent:rent+100000,effectiveFrom:'2026-10',priceList:list,reason:'Đổi phí'}).ok);
      check('fee old period retained',TH.buildInvoice(TH.db,ct,'2026-08','draft').total===old);
      reset();
      const shares=C.sharesFor('T17','2026-10').map(x=>({...x})), oldShares=JSON.stringify(C.sharesFor('T17','2026-09'));shares[0].ratio-=1;shares[1].ratio+=1;
      check('share table version',R.saveShares('T17','2026-10',shares).ok);
      check('past share ratios retained',JSON.stringify(C.sharesFor('T17','2026-09').map(x=>({...x,to:null})))===oldShares);
      check('new share total 100',C.sum(C.sharesFor('T17','2026-10'),x=>x.ratio)===100);
      reset();
      const receipt=TH.db.receipts.find(r=>r.status==='confirmed'&&C.invoice(r.invoiceId).period==='2026-09'), inv=C.invoice(receipt.invoiceId), dest=TH.db.invoices.find(i=>i.customerId===inv.customerId&&i.id!==inv.id&&i.status==='confirmed');
      if(dest){const paid=C.paid(inv.id),other=C.paid(dest.id),cash=C.summary('2026-10',inv.buildingId).collected;
      const cr=R.execute('receipt',receipt.id,'correct',{targetPeriod:'2026-10',amount:receipt.amount-10000,reason:'Chuyển phân bổ',mode:'allocation',targetInvoiceId:dest.id});check('allocation request',cr.ok);TH.store.state.role='accountant';check('allocation approval',R.execute('correction',cr.record.id,'approve').ok);check('allocation balances',C.paid(inv.id)===paid-10000&&C.paid(dest.id)===other+10000);check('allocation has no cash movement',C.summary('2026-10',inv.buildingId).collected===cash);}
      reset();
      const deposit=TH.db.deposits.find(d=>d.status==='confirmed'&&d.type==='refund'&&d.period==='2026-09')||TH.db.deposits.find(d=>d.status==='confirmed'&&d.type==='refund'), dp=JSON.stringify(deposit), past=JSON.stringify(C.pnl('2026-09',deposit.buildingId,'tong'));
      const dc=R.execute('deposit',deposit.id,'correct',{targetPeriod:'2026-10',amount:deposit.amount-10000,mode:'recording',reason:'Ghi sai hoàn cọc'});check('deposit correction request',dc.ok);TH.store.state.role='accountant';check('deposit correction approval',R.execute('correction',dc.record.id,'approve').ok);check('deposit source immutable',JSON.stringify(deposit)===dp);check('deposit old period unchanged',JSON.stringify(C.pnl('2026-09',deposit.buildingId,'tong'))===past);
      reset();
      const importRows=[{id:'IMP-EXP-1',buildingId:'T17',period:'2026-10',description:'Nhập chi phí',amount:1000,status:'draft',createdBy:'NV-001'}];
      const batch=R.commitRecordImport('expense',importRows);check('import persists rows',batch.ok&&R.get('expense','IMP-EXP-1'));check('import rollback restores data',R.rollbackImport(batch.record.id).ok&&!R.get('expense','IMP-EXP-1'));check('import double rollback blocked',!R.rollbackImport(batch.record.id).ok);
      const batch2=R.commitRecordImport('expense',[{...importRows[0],id:'IMP-EXP-2'}]);R.execute('expense','IMP-EXP-2','edit',{values:{description:'Đã sửa'}});R.execute('expense','IMP-EXP-2','edit',{values:{description:'Nhập chi phí'}});check('rollback blocks even reverted later edits',!R.rollbackImport(batch2.record.id).ok);
      reset();const oldPay=JSON.stringify(C.payroll('2026-09'));TH.store.setDraft('sal-2026-10','NV-003.base',9990000);TH.act['sal.saveSetup']({dataset:{id:'NV-003'}});check('salary input saved by period',R.list('salaryInput').some(x=>x.staffId==='NV-003'&&x.base===9990000));check('salary old period unchanged',JSON.stringify(C.payroll('2026-09'))===oldPay);
      reset();const tpl=R.create('oaTemplate',{name:'Mẫu QA',body:'Nhắc {phong}'});check('OA template real creation',tpl.ok);check('OA template approval',R.execute('oaTemplate',tpl.record.id,'approve').ok);const sch=R.create('oaSchedule',{name:'Lịch QA',templateId:'TPL-02',day:10});check('OA schedule creation',sch.ok);const count=TH.db.messages.length;check('OA schedule execution',R.execute('oaSchedule',sch.record.id,'run',{reason:'Kiểm thử'}).ok&&TH.db.messages.length>count);check('OA schedule duplicate blocked',!R.execute('oaSchedule',sch.record.id,'run',{reason:'Lặp'}).ok);
      reset();TH.db.messages.push({id:'QUEUE',invoiceId:TH.db.invoices[0].id,status:'queued'});check('queued message cancellation',R.execute('message','QUEUE','cancel',{reason:'Sai khách'}).ok);check('sent message immutable',!R.execute('message',TH.db.messages.find(m=>m.status==='sent').id,'cancel',{reason:'Sai'}).ok);
      reset();
      const vi={id:'XE-QA',type:'Xe máy',plate:'29A-QA',brand:'A',status:'pending',from:TH.TODAY,to:null};TH.db.customers[0].vehicles.push(vi);
      check('vehicle edit',R.execute('vehicle',vi.id,'edit',{values:{brand:'B'}}).ok);check('vehicle soft delete',R.execute('vehicle',vi.id,'delete',{reason:'Nhầm'}).ok);check('vehicle restores into correct customer',R.execute('vehicle',vi.id,'restore').ok&&TH.db.customers[0].vehicles.some(x=>x.id===vi.id));
      const doc=TH.db.documents.find(d=>d.contractId&&d.contractId!=='—'),oldFile=doc.file;check('customer document replacement',R.execute('customerDocument',doc.id,'edit',{values:{file:'thay_the.pdf'}}).ok&&doc.versions.some(v=>v.file===oldFile));check('used customer document delete blocked',!R.execute('customerDocument',doc.id,'delete',{reason:'Sai'}).ok);check('customer document unlink',R.execute('customerDocument',doc.id,'unlink',{reason:'Gỡ bản cũ'}).ok&&doc.status==='archived');check('customer document relink',R.execute('customerDocument',doc.id,'activate').ok);
      reset();
      const cancellable={...TH.db.invoices.find(i=>i.status==='confirmed'&&i.period==='2026-10'),id:'INV-CANCEL-QA'};TH.db.invoices.push(cancellable);
      TH.db.receipts.push({id:'PT-CANCEL-QA',invoiceId:cancellable.id,amount:1000,receivedAt:TH.TODAY,status:'pending',reportedBy:'NV-001'});
      check('cancel blocked by pending receipt',!R.execute('invoice',cancellable.id,'cancel',{reason:'Nhầm'}).ok);R.execute('receipt','PT-CANCEL-QA','withdraw');
      check('cancel unpaid invoice',R.execute('invoice',cancellable.id,'cancel',{reason:'Nhầm'}).ok);check('double cancellation blocked',!R.execute('invoice',cancellable.id,'cancel',{reason:'Lặp'}).ok);
      reset();
      const cashSource=TH.db.receipts.find(r=>r.status==='confirmed'&&C.invoice(r.invoiceId).period==='2026-09'),cashBefore=R.cashFlow('2026-10','ALL').net;
      check('cash correction requires actual transaction date',!R.execute('receipt',cashSource.id,'correct',{targetPeriod:'2026-10',amount:cashSource.amount-10000,mode:'cash',reason:'Hoàn thực tế',evidence:'UNC-QA'}).ok);
      const cashCorrection=R.execute('receipt',cashSource.id,'correct',{targetPeriod:'2026-10',amount:cashSource.amount-10000,mode:'cash',reason:'Hoàn thực tế',evidence:'UNC-QA',date:'2026-10-20'});check('cash correction request',cashCorrection.ok);TH.store.state.role='accountant';check('cash correction approved',R.execute('correction',cashCorrection.record.id,'approve').ok);check('cash moves exactly once by actual refund',R.cashFlow('2026-10','ALL').net===cashBefore-10000);
      reset();const lockedSource=TH.db.expenses.find(e=>e.status==='approved'&&e.period==='2026-09');const lc=R.execute('expense',lockedSource.id,'correct',{targetPeriod:'2026-10',amount:lockedSource.amount-1000,reason:'Sai số'});TH.db.periodLocks['2026-10']={locked:true};TH.store.state.role='accountant';check('locking target during approval blocks posting',!R.execute('correction',lc.record.id,'approve').ok&&lc.record.status==='pending');
      reset();const shareImport=C.sharesFor('T17','2026-10').map(s=>({...s})),priorShares=JSON.stringify(shareImport);shareImport[0].ratio-=1;shareImport[1].ratio+=1;const sb=R.commitRecordImport('share',shareImport);check('share import produces reversible version',sb.ok);check('share import rollback is atomic',R.rollbackImport(sb.record.id).ok&&JSON.stringify(C.sharesFor('T17','2026-10'))===priorShares);
      reset();TH.store.state.role='hr';const eGuard=TH.db.expenses.find(e=>e.status==='draft'),eBefore=JSON.stringify(eGuard);if(eGuard){TH.act['exp.submit']({dataset:{id:eGuard.id}});check('legacy direct financial handler rechecks role',JSON.stringify(eGuard)===eBefore);}
      reset();
      const reclass=TH.db.expenses.find(e=>e.status==='approved'&&e.period==='2026-09'&&e.category==='repair'),sourceCopy=JSON.stringify(reclass),pnlBefore=C.pnl('2026-10',reclass.buildingId,'kd'),pastPnl=JSON.stringify(C.pnl('2026-09',reclass.buildingId,'kd'));
      const repairCount=()=>{const d=TH.reports.preview({type:'RPT-REP',period:'2026-10',buildingIds:[reclass.buildingId]},{transient:true}).draft;return d.items[0].vals.tong[TH.reports.keyOf([reclass.buildingId])].jobs;};const jobs=repairCount();
      const rc=R.execute('expense',reclass.id,'correct',{targetPeriod:'2026-10',amount:reclass.amount,reason:'Sửa nhóm chi',replacement:{category:'internet',description:'Chi phí mạng'}});check('same amount reclassification request',rc.ok);TH.store.state.role='accountant';check('reclassification approval',R.execute('correction',rc.record.id,'approve').ok);const moved=C.pnl('2026-10',reclass.buildingId,'kd');check('reclassification moves correct cost buckets',moved.repair===pnlBefore.repair-reclass.amount&&moved.cNet===pnlBefore.cNet+reclass.amount&&moved.lnr===pnlBefore.lnr);check('correction does not count additional repair jobs',Number.isFinite(jobs)&&repairCount()===jobs);
      const rc2=R.execute('expense',reclass.id,'correct',{targetPeriod:'2026-10',amount:reclass.amount-1000,reason:'Điều chỉnh lần tiếp theo',replacement:{category:'repair'}});check('second correction uses current classification',rc2.ok);TH.store.state.role='admin';check('second independent approval',R.execute('correction',rc2.record.id,'approve').ok);const moved2=C.pnl('2026-10',reclass.buildingId,'kd');check('sequential reversals do not duplicate costs',moved2.repair===pnlBefore.repair-1000&&moved2.cNet===pnlBefore.cNet&&moved2.lnr===pnlBefore.lnr+1000);check('reclassification preserves locked source and report',JSON.stringify(reclass)===sourceCopy&&JSON.stringify(C.pnl('2026-09',reclass.buildingId,'kd'))===pastPnl);
      reset();const ownerBefore=JSON.stringify(C.owner('CN-002'));TH.store.setUi('OWN-IMP','policy','update');TH.store.setUi('OWN-IMP','excluded',[2]);TH.act['imp.commit']({dataset:{screen:'OWN-IMP'}});const masterBatch=TH.db.importBatches[0];check('master import excludes unchecked rows',masterBatch.changes&&!C.owner('CN-101')&&!!C.owner('CN-102'));check('master import undo restores old records',R.rollbackImport(masterBatch.id).ok&&JSON.stringify(C.owner('CN-002'))===ownerBefore&&!C.owner('CN-102'));
      reset();TH.store.setUi('OWN-IMP','policy','update');TH.store.setUi('OWN-IMP','excluded',[2]);TH.act['imp.commit']({dataset:{screen:'OWN-IMP'}});const depBatch=TH.db.importBatches[0],unmodified=JSON.stringify(C.owner('CN-002'));TH.db.invoices.push({...TH.db.invoices.find(i=>i.buildingId==='S9'),id:'NEW-AFTER-IMPORT'});check('master rollback blocks new downstream dependencies',!R.rollbackImport(depBatch.id).ok&&JSON.stringify(C.owner('CN-002'))===unmodified&&!!C.owner('CN-102'));
      reset();
      for(const pkg of ['A','B','C','D'])for(const role of ['admin','accountant','manager','hr']){Object.assign(TH.store.state,{pkg,role});for(const [id,v]of Object.entries(TH.views)){if(!TH.canScreen(id)||!v.render)continue;try{let args={screen:id,param:v.scanParam||null};v.render(args);}catch(e){out.push({name:'render '+pkg+' '+role+' '+id+': '+e.message,pass:false});}}}
      return out;
    });
    return {pass:results.every(x=>x.pass)&&!errors.length,checks:results.length,failed:results.filter(x=>!x.pass),errors};
  } catch(e) { return {pass:false,failure:e.message,errors}; }
  finally {await context.close();}
}

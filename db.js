// db.js — thin promise wrapper around IndexedDB. Everything stays on-device.
const DB_NAME = 'ledger-journal';
const DB_VERSION = 2;
let _db = null;

function openDB(){
  if(_db) return Promise.resolve(_db);
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('trades')){
        const s = db.createObjectStore('trades', { keyPath:'id' });
        s.createIndex('date', 'date');
        s.createIndex('accountId', 'accountId');
      }
      if(!db.objectStoreNames.contains('accounts')){
        db.createObjectStore('accounts', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('setups')){
        db.createObjectStore('setups', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('rules')){
        db.createObjectStore('rules', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('checklist')){
        db.createObjectStore('checklist', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('goals')){
        db.createObjectStore('goals', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('meta')){
        db.createObjectStore('meta', { keyPath:'key' });
      }
    };
    req.onsuccess = ()=>{ _db = req.result; resolve(_db); };
    req.onerror = ()=> reject(req.error);
    req.onblocked = ()=> reject(new Error('DB_BLOCKED'));
  });
}

function tx(storeName, mode='readonly'){
  return openDB().then(db=> db.transaction(storeName, mode).objectStore(storeName));
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

const DB = {
  uid,

  async seedIfEmpty(){
    const accounts = await this.accounts.all();
    if(accounts.length === 0){
      await this.accounts.put({ id: uid(), name:'Personal', type:'personal', balance:0 });
    }
    const setups = await this.setups.all();
    if(setups.length === 0){
      for(const name of ['Breakout','Reversal','Trend Pullback']){
        await this.setups.put({ id: uid(), name });
      }
    }
  },

  trades: {
    async all(){
      const store = await tx('trades');
      return new Promise((res, rej)=>{
        const req = store.getAll();
        req.onsuccess = ()=> res(req.result.sort((a,b)=> b.date.localeCompare(a.date) || b.createdAt-a.createdAt));
        req.onerror = ()=> rej(req.error);
      });
    },
    async get(id){
      const store = await tx('trades');
      return new Promise((res, rej)=>{
        const req = store.get(id);
        req.onsuccess = ()=> res(req.result);
        req.onerror = ()=> rej(req.error);
      });
    },
    async put(trade){
      const store = await tx('trades','readwrite');
      return new Promise((res, rej)=>{
        const req = store.put(trade);
        req.onsuccess = ()=> res(trade);
        req.onerror = ()=> rej(req.error);
      });
    },
    async delete(id){
      const store = await tx('trades','readwrite');
      return new Promise((res, rej)=>{
        const req = store.delete(id);
        req.onsuccess = ()=> res();
        req.onerror = ()=> rej(req.error);
      });
    }
  },

  accounts: {
    async all(){
      const store = await tx('accounts');
      return new Promise((res, rej)=>{
        const req = store.getAll();
        req.onsuccess = ()=> res(req.result);
        req.onerror = ()=> rej(req.error);
      });
    },
    async put(acc){
      const store = await tx('accounts','readwrite');
      return new Promise((res, rej)=>{
        const req = store.put(acc);
        req.onsuccess = ()=> res(acc);
        req.onerror = ()=> rej(req.error);
      });
    },
    async delete(id){
      const store = await tx('accounts','readwrite');
      return new Promise((res, rej)=>{
        const req = store.delete(id);
        req.onsuccess = ()=> res();
        req.onerror = ()=> rej(req.error);
      });
    }
  },

  setups: {
    async all(){
      const store = await tx('setups');
      return new Promise((res, rej)=>{
        const req = store.getAll();
        req.onsuccess = ()=> res(req.result);
        req.onerror = ()=> rej(req.error);
      });
    },
    async put(s){
      const store = await tx('setups','readwrite');
      return new Promise((res, rej)=>{
        const req = store.put(s);
        req.onsuccess = ()=> res(s);
        req.onerror = ()=> rej(req.error);
      });
    },
    async delete(id){
      const store = await tx('setups','readwrite');
      return new Promise((res, rej)=>{
        const req = store.delete(id);
        req.onsuccess = ()=> res();
        req.onerror = ()=> rej(req.error);
      });
    }
  },

  rules: {
    async all(){
      const store = await tx('rules');
      return new Promise((res, rej)=>{
        const req = store.getAll();
        req.onsuccess = ()=> res(req.result);
        req.onerror = ()=> rej(req.error);
      });
    },
    async put(r){
      const store = await tx('rules','readwrite');
      return new Promise((res, rej)=>{
        const req = store.put(r);
        req.onsuccess = ()=> res(r);
        req.onerror = ()=> rej(req.error);
      });
    },
    async delete(id){
      const store = await tx('rules','readwrite');
      return new Promise((res, rej)=>{
        const req = store.delete(id);
        req.onsuccess = ()=> res();
        req.onerror = ()=> rej(req.error);
      });
    }
  },

  checklist: {
    async all(){
      const store = await tx('checklist');
      return new Promise((res, rej)=>{
        const req = store.getAll();
        req.onsuccess = ()=> res(req.result);
        req.onerror = ()=> rej(req.error);
      });
    },
    async put(item){
      const store = await tx('checklist','readwrite');
      return new Promise((res, rej)=>{
        const req = store.put(item);
        req.onsuccess = ()=> res(item);
        req.onerror = ()=> rej(req.error);
      });
    },
    async delete(id){
      const store = await tx('checklist','readwrite');
      return new Promise((res, rej)=>{
        const req = store.delete(id);
        req.onsuccess = ()=> res();
        req.onerror = ()=> rej(req.error);
      });
    }
  },

  goals: {
    async all(){
      const store = await tx('goals');
      return new Promise((res, rej)=>{
        const req = store.getAll();
        req.onsuccess = ()=> res(req.result);
        req.onerror = ()=> rej(req.error);
      });
    },
    async put(item){
      const store = await tx('goals','readwrite');
      return new Promise((res, rej)=>{
        const req = store.put(item);
        req.onsuccess = ()=> res(item);
        req.onerror = ()=> rej(req.error);
      });
    },
    async delete(id){
      const store = await tx('goals','readwrite');
      return new Promise((res, rej)=>{
        const req = store.delete(id);
        req.onsuccess = ()=> res();
        req.onerror = ()=> rej(req.error);
      });
    }
  },

  // Full local backup — since there's no server, this is the only way to move
  // data between devices or keep a safety copy.
  async exportAll(){
    const [trades, accounts, setups, rules, checklist, goals] = await Promise.all([
      this.trades.all(), this.accounts.all(), this.setups.all(), this.rules.all(),
      this.checklist.all(), this.goals.all()
    ]);
    return { version:2, exportedAt:new Date().toISOString(), trades, accounts, setups, rules, checklist, goals };
  },

  async importAll(data){
    if(!data || !Array.isArray(data.trades)) throw new Error('Invalid backup file');
    for(const t of data.trades) await this.trades.put(t);
    for(const a of (data.accounts||[])) await this.accounts.put(a);
    for(const s of (data.setups||[])) await this.setups.put(s);
    for(const r of (data.rules||[])) await this.rules.put(r);
    for(const c of (data.checklist||[])) await this.checklist.put(c);
    for(const g of (data.goals||[])) await this.goals.put(g);
  }
};

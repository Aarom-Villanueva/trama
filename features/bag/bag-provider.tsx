'use client';
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import {getProduct,money} from '@/data/products';
export type BagItem={slug:string;size:string;quantity:number};
type BagContext={items:BagItem[];ready:boolean;add:(item:BagItem)=>void;change:(slug:string,size:string,quantity:number)=>void;remove:(slug:string,size:string)=>void;count:number;subtotal:number;message:string};
const Context=createContext<BagContext|null>(null);
export const BAG_KEY='trama-selection-v1';
export function BagProvider({children}:{children:ReactNode}){
 const [items,setItems]=useState<BagItem[]>([]);const [ready,setReady]=useState(false);
 useEffect(()=>{try{const v=JSON.parse(localStorage.getItem(BAG_KEY)||'[]');if(Array.isArray(v))setItems(v.filter(x=>{const p=getProduct(x?.slug);return p&&p.sizes.includes(x.size)&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=99}));}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(BAG_KEY,JSON.stringify(items))}catch{}},[items,ready]);
 const add=(item:BagItem)=>{const p=getProduct(item.slug);if(!p||!p.sizes.includes(item.size)||!Number.isInteger(item.quantity)||item.quantity<1)return;setItems(old=>{const found=old.find(x=>x.slug===item.slug&&x.size===item.size);return found?old.map(x=>x===found?{...x,quantity:Math.min(99,x.quantity+item.quantity)}:x):[...old,{...item,quantity:Math.min(99,item.quantity)}]})};
 const change=(slug:string,size:string,quantity:number)=>{if(!Number.isInteger(quantity)||quantity<1||quantity>99)return;setItems(old=>old.map(x=>x.slug===slug&&x.size===size?{...x,quantity}:x))};
 const remove=(slug:string,size:string)=>setItems(old=>old.filter(x=>!(x.slug===slug&&x.size===size)));
 const subtotal=items.reduce((n,x)=>n+(getProduct(x.slug)?.price||0)*x.quantity,0);
 const message=['Hola, quisiera consultar esta selección de TRAMA (demostración):','',...items.map(x=>{const p=getProduct(x.slug)!;return `${x.quantity} × ${p.name} — ${p.color} — Talla ${x.size} — ${money(p.price*x.quantity)}`;}),'',`Subtotal referencial: ${money(subtotal)}`,'¿Podrían confirmarme disponibilidad y costo de envío?'].join('\n');
 return <Context.Provider value={{items,ready,add,change,remove,count:items.reduce((n,x)=>n+x.quantity,0),subtotal,message}}>{children}</Context.Provider>
}
export function useBag(){const c=useContext(Context);if(!c)throw new Error('BagProvider missing');return c}

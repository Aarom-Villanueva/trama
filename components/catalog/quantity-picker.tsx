'use client';
import {Button} from '@/components/ui/button';
import {Minus,Plus} from 'lucide-react';
export function QuantityPicker({value,onChange,label='Cantidad',max=99}:{value:number;onChange:(value:number)=>void;label?:string;max?:number}){return <div className="quantity" role="group" aria-label={label}><Button variant="ghost" size="icon" aria-label={'Reducir '+label} disabled={value<=1} onClick={()=>onChange(value-1)}><Minus size={14}/></Button><output aria-label={label}>{value}</output><Button variant="ghost" size="icon" aria-label={'Aumentar '+label} disabled={value>=max} onClick={()=>onChange(value+1)}><Plus size={14}/></Button></div>}

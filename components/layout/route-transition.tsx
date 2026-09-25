'use client';

import {useEffect, useRef, useState} from 'react';
import {usePathname, useSearchParams} from 'next/navigation';

const FULL_DURATION = 740;
const REDUCED_DURATION = 80;

export function TransitionOverlay({phase = 'visible'}:{phase?:'visible'|'out'}){
  return <div className="route-transition" data-phase={phase} aria-hidden="true">
    <span className="route-transition-word">{['T','R','A','M','A'].map((letter,index)=><span className="route-transition-letter" key={`${letter}-${index}`}>{letter}</span>)}</span>
  </div>;
}

export function RouteTransition(){
  const pathname=usePathname();
  const searchParams=useSearchParams();
  const locationKey=`${pathname}?${searchParams.toString()}`;
  const previousKey=useRef(locationKey);
  const mounted=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [visible,setVisible]=useState(true);
  const [phase,setPhase]=useState<'visible'|'out'>('visible');

  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration=reduced?REDUCED_DURATION:FULL_DURATION;
    const finish=()=>{
      setPhase('out');
      timer.current=setTimeout(()=>setVisible(false),reduced?40:180);
    };
    const start=()=>{
      if(timer.current)clearTimeout(timer.current);
      setVisible(true);
      setPhase('visible');
      timer.current=setTimeout(finish,duration-180);
    };

    if(!mounted.current){
      mounted.current=true;
      start();
    }else if(previousKey.current!==locationKey){
      previousKey.current=locationKey;
      start();
    }else if(!timer.current){
      // React Strict Mode runs effects twice in development; keep the initial transition finite.
      start();
    }

    return ()=>{if(timer.current){clearTimeout(timer.current);timer.current=null}};
  },[locationKey]);

  if(!visible)return null;
  return <TransitionOverlay phase={phase}/>;
}

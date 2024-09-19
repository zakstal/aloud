import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from './ui/tooltip';

export const AudioPlayerButton = ({
    url
}: {
    url: string
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioRef.current.addEventListener("ended", function(){
        setIsPlaying(false)
   });
}, [audioRef.current])

  const togglePlayPause = () => {
    const audio = audioRef.current;
    console.log('audio', audio, isPlaying)
    if (isPlaying) {
        console.log("pause")
        audio.pause();
    } else {
        console.log("play",audio.play)
      audio.play();
    }
  
    setIsPlaying(!isPlaying);
  };

  return (
    <div >
      <audio src={url} ref={audioRef}>
        <source src={url} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      <button className="p-4" onClick={togglePlayPause}>
        {isPlaying ? <Image width="10" height="10" src="/pause.png"/> : <Image width="10" height="10" src="/play.png"/>}
        
      </button>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";


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
}, [])

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
        audio.pause();
    } else {
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
        {isPlaying ? <Image alt="pause button" width="10" height="10" src="/pause.png"/> : <Image alt="play button" width="10" height="10" src="/play.png"/>}
        
      </button>
    </div>
  );
};

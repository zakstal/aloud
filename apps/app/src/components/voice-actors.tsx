"use client"

import { Character } from '@/components/character';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Voice } from '@v1/script-to-audio/voices'
import {
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import './voice-actors.css';

type VoiceActorsInput = {
  character: { name: string, gender: string} | null;
  voices: string[];
  onClose: () => void;
  onSelectVoice: (viceActor: Voice) => void;
}

function SmallHeading ({ text }: { text: string}) {
  return (
    <div className="sticky pt-2 pb-2 z-50 top-0 pl-2 bg-[hsl(var(--background))]">
      <p className="text-xs font-small leading-none text-muted-foreground">{text}</p>
    </div>
  )
}
export function VoiceActors({
  character,
  voices,
  onClose,
  onSelectVoice
}: VoiceActorsInput) {
  return (
    <div className="">
      <div className="z-40 sticky top-0" >
       <ChevronLeft
        className="cursor-pointer mb-4 z-50 chevron chevron-in"
        onClick={onClose}
        />
        <div className="sticky top-0 z-50 header header-in">
          <CardHeader className="p-2 pt-0 border-0">
            <div className="flex flex-row gap-4" >
                <CardTitle>Fined a voice for</CardTitle>
                <CardDescription>
                    {/* {`${characters?.length || 0} characters`} */}
                </CardDescription>
            </div>
            {/* <div className="flex items-center justify-between">
                  <div className="flex" style={{ flex: '2'}}>
                    <p className="text-xs font-small leading-none text-muted-foreground" >{'Character name'}</p>
                  </div>
                  <div style={{ flex: '1'}}>
                    <p className="text-xs font-small leading-none text-muted-foreground" >{'voice actor'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-small leading-none text-muted-foreground">{''}</p>
                </div>
              </div> */}
          </CardHeader>
        </div>
        <Character
          key={character?.id}
          name={character?.name}
          gender={character?.gender}
          className="mb-2"
          avatar={character?.audio_character_version?.voice_data?.avatar}
        />
        <Separator className="mt-2"/>
        {/* <div>
          <div className="flex gap-2">
            <SmallHeading text="Eleven labs" />
            <SmallHeading text="Murf" />
          </div>
          <Separator className=""/>
          <div className="flex gap-2">
            <SmallHeading text="gender" />
            <SmallHeading text="Murf" />
          </div>
        </div> */}
      </div>
      {/** Fix tye style issue. just a hack for now to view the full dropdown */}
      <div className="space-y-2 overflow-scroll h-screen appear appear-in" style={{ paddingBottom: '317px'}}>
        <SmallHeading text="Eleven labs" />
        { voices?.elevenLabs?.map(data => <Character key={data?.id} name={data.name} avatar={data.avatar} gender={`${data.gender}  ${data.age}  ${data.accent}`} assigned="" preview={data?.preview} onClick={() => onSelectVoice(data, character)}/> )}
        {/* <SmallHeading text="Murph" />
        { voices?.murph?.map(data => <Character key={data?.id} name={data.name} avatar={data.avatar} gender={`${data.gender}  ${data.age}  ${data.accent}`} assigned="" onClick={() => onSelectVoice(data, character)}/> )} */}
      </div>
    </div>
  );
}

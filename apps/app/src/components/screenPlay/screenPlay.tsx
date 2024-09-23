'use client'

import './screenplay.css'
import { Heading } from '@/components/ui/heading';
import { Characters } from '@/components/characters';
import { VoiceActors } from '@/components/voice-actors';
import { useState } from 'react'
import { cn } from '@/lib/utils';
import { Voice } from '@v1/script-to-audio/voices'
import { ScrollArea } from '@/components/ui/scroll-area';
import AudioPlayer from '@/components/ui/AudioPlayer'
import { Button } from '@/components/ui/button';
import { ScrollText } from 'lucide-react';
import { Progress } from '@/components/ui/progress'
import { ScriptEditor } from '@/components/scriptEditor/script-editor'

export default function ScreenPlayConatiner({
  screenPlayText,
  title,
  characters,
  voices,
  onSelectVoice,
  audioVersionNumber,
  processAudio,
  audioVersions,
  scriptTokens,
}) {
  const [voiceSelectionOpen, setVoiceSelectionOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)

  if (!screenPlayText) return <div className="flex justify-center h-screen items-center"><Progress /></div>

  return (
    <div className="flex flex-row gap-4 text-lg script-parent items-streatch pl-4">
        <aside className="script-characters flex-1 pb-8 pt-16 max-w-72">
            <div className="col-span-4 md:col-span-3 rounded-4 script-card">
                <div className="p-2 pt-0">
                    <Button
                        type="button"
                        className='mb-4'
                        onClick={processAudio}
                        variant="outline"
                        size="sm"
                    >
                        <span className=""> Get Audio!</span>
                        {/* <ScrollText className="h-4 w-4" /> */}
                    </Button>

                    <AudioPlayer audioVersions={audioVersions}/>
                </div>
                {
                    voiceSelectionOpen 
                    ? 
                        <div
                            className={cn(
                            `relative  hidden flex-none border-r transition-[width] duration-500 md:block`,
                            voiceSelectionOpen ? 'w-75' : 'w-[75px]',
                            )}
                        >
                            <VoiceActors
                            character={selectedCharacter}
                            onClose={() => {
                                setSelectedCharacter(null)
                                setVoiceSelectionOpen(false)
                            }}
                            voices={voices}
                            audioVersionNumber={audioVersionNumber}
                            onSelectVoice={(voice: Voice, character) => {
                                onSelectVoice(voice, character)
                                setVoiceSelectionOpen(false)
                            }}
                        />
                        </div>
                    : (
                        <ScrollArea >
                            <Characters
                            characters={characters}
                            audioVersionNumber={audioVersionNumber}
                            onCharacterClick={(character) => {
                                setSelectedCharacter(character)
                                setVoiceSelectionOpen(true)
                            }}
                            />
                        </ScrollArea>
                    )
                }
            </div>
        </aside>
        {/* <div className="script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-5xl font-courier" contentEditable={true} dangerouslySetInnerHTML={{ __html: screenPlayText?.replace(/&nbsp;/g, '') }}></div> */}
        < ScriptEditor
            className="script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-4xl font-courier"
            scriptTokens={scriptTokens}
        />
    </div>
  );
}


// {
//     voiceSelectionOpen 
//     ? 
//     : <VoiceActors />
// }
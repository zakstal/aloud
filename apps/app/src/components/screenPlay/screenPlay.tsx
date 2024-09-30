'use client'

import './screenplay.css'
import { Characters } from '@/components/characters';
import { VoiceActors } from '@/components/voice-actors';
import { useState } from 'react'
import { cn } from '@/lib/utils';
import { Voice } from '@v1/script-to-audio/voices'
import AudioPlayer from '@/components/ui/AudioPlayer'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'
import { ScriptEditor } from '@/components/scriptEditor/script-editor'
import PDFLocalUplaod from '@/components/pdf-upload-local'


export default function ScreenPlayConatiner({
  screenPlayText,
  characters,
  voices,
  onSelectVoice,
  audioVersionNumber,
  processAudio,
  audioVersions,
  scriptTokens,
  isLoading,
  startScreenPlay,
  audioScreenPlayVersion
}) {
  const [voiceSelectionOpen, setVoiceSelectionOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [currentLinePlaying, setCurrentLinePlaying] = useState(null)

  if (isLoading) return <div className="flex justify-center h-screen items-center"><Progress /></div>

  return (
    <>
    <div>
        <div className="flex flex-row gap-4 text-lg script-parent items-streatch">
            <aside className="script-characters flex-1 pt-16 max-w-72">
                { screenPlayText !== undefined
                ?
                <>
                <div className="col-span-4 md:col-span-3 rounded-4 script-card">
                    {
                        voiceSelectionOpen
                        ? 
                            <div
                                className={cn(
                                ` pl-8 pr-4 relative  hidden flex-none transition-[width] duration-500 md:block`,
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
                            <div className="pl-8" >
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
                                <Characters
                                characters={characters}
                                audioVersionNumber={audioVersionNumber}
                                onCharacterClick={(character) => {
                                    setSelectedCharacter(character)
                                    setVoiceSelectionOpen(true)
                                }}
                                />
                            </div>
                        )
                    }
                </div>
                </> 
                : null }   
            </aside>
            {/* <div className="script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-5xl font-courier" contentEditable={true} dangerouslySetInnerHTML={{ __html: screenPlayText?.replace(/&nbsp;/g, '') }}></div> */}
            {
                screenPlayText !== undefined 
                ?
                <ScriptEditor
                    className="script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-4xl font-courier"
                    scriptTokens={scriptTokens}
                    audioScreenPlayVersion={audioScreenPlayVersion}
                    currentLinePlaying={currentLinePlaying}
                    pdfText={screenPlayText}
                />
                : <div className={'script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-4xl font-courier script-editor'}>
                    <h1 className="text-3xl pb-6 pt-16 tracking-tight text-center ">🎉  Welcome! 🎊</h1>
                    <h4 className="text-3xl pb-6 pt-16 tracking-tight text-center ">Start a new script</h4>
                    {/* <ProductForm /> */}
                    <PDFLocalUplaod startScreenPlay={startScreenPlay} />
                    <Button
                        variant="outline"
                        className="text-md h-20 mt-6 w-full"
                        onClick={() => startScreenPlay()}
                    >
                        Go to a blank document
                    </Button>
                </div>
            }
        </div>
        <AudioPlayer
            audioVersions={audioVersions}
            setCurrentLinePlaying={setCurrentLinePlaying}
        />
    </div>
    </>
  );
}


// {
//     voiceSelectionOpen 
//     ? 
//     : <VoiceActors />
// }
'use client'

import './screenplay.css'
import { Characters } from '@/components/characters';
import { VoiceActors } from '@/components/voice-actors';
import { useState } from 'react'
import { cn } from '@/lib/utils';
import { Voice } from '@v1/script-to-audio/voices'
import AudioPlayer from '@/components/ui/AudioPlayer-refactor'
// import AudioPlayer from '@/components/ui/AudioPlayer'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'
import { ScriptEditor } from '@/components/scriptEditor/script-editor'
import PDFLocalUplaod from '@/components/pdf-upload-local'
import { ProductForm } from '@/components/forms/product-form';
import { getSignedUrl } from '@/actions/screenPlays/get-signed-url'
import { updateOrCreateLines } from '@/actions/screenPlays/update-lines'
import { cancelProcessAudio } from '@/actions/screenPlays/cancel-process-audio'
import { ProgressLoader } from '@/components/progressLoader';

function GetAudio({ audioBeingGotten, processAudio, setAudioBeingGotten, audioScreenPlayVersion }) {
    const status = audioScreenPlayVersion.status
    const totalLines  = audioScreenPlayVersion.total_lines
    const totalLinesCompleted  = audioScreenPlayVersion.total_lines_completed
    const progress = totalLinesCompleted != null && totalLines != null ? (totalLinesCompleted / totalLines) * 100 : 0
    if (status === 'full') return (
        <div className="text-sm px-4 completed py-2 border-1 rounded-2xl">Completed</div>
    )
    // if (status === 'full') return (
    //     <SplatButton/>
    // )

    if (status === 'inProgress') return (
        <div className="flex gap-2 items-center text-sm">
            <ProgressLoader
                className="progress-loading "
                progress={Number(progress.toFixed())}
                isLoading={audioBeingGotten}
                onClick={async () => {
                    setAudioBeingGotten(true)
                    const res = await cancelProcessAudio({ audioVersionId:audioScreenPlayVersion.id })
                    setAudioBeingGotten(false)
                    console.log('res', res)
                }}
            />
            
            <span>{totalLinesCompleted}</span>
            /
            <span>{totalLines}</span>
            <span>lines</span>
        </div>
    )

    return (
        
        <Button
            type="button"
            className='flex gap-3'
            onClick={async () => {
                setAudioBeingGotten(true)
                const res = await processAudio()
                setAudioBeingGotten(false)
                // if (['inProgress', 'full'].includes(res.status)) {
                // }
            }}
            variant="outline"
            size="sm"
        >
            <span className=""> {!audioBeingGotten ? "Get Audio!" : "in progress" }</span>
            { audioBeingGotten ? <Progress hw={20} bw={2} className=""/> : null}
        </Button>
    )
}

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
  audioScreenPlayVersion,
  lines,
  setCharacters,
  screenplayId,
}) {
  const [voiceSelectionOpen, setVoiceSelectionOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [currentLinePlaying, setCurrentLinePlaying] = useState(null)
  const [audioBeingGotten, setAudioBeingGotten] = useState(false)

  if (isLoading) return <div className="flex justify-center h-screen items-center"><Progress /></div>

  return (
    <>
    <div>
        <div className="flex flex-row gap-4 text-lg script-parent items-streatch">
            <aside className="script-characters flex-1 pt-20 max-w-72">
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
                                <div className="h-14 flex items-center" >
                                    <GetAudio
                                        audioBeingGotten={audioBeingGotten}
                                        processAudio={processAudio}
                                        setAudioBeingGotten={setAudioBeingGotten}
                                        audioScreenPlayVersion={audioScreenPlayVersion}
                                    />
                                </div>
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
                    scriptTokens={lines}
                    audioScreenPlayVersion={audioScreenPlayVersion.id}
                    currentLinePlaying={currentLinePlaying}
                    pdfText={screenPlayText}
                    saveLines={updateOrCreateLines}
                    setCharacters={setCharacters}
                    screenplayId={screenplayId}
                    characters={characters}
                />
                : <div className={'script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-4xl font-courier script-editor'}>
                    <h1 className="text-3xl pb-6 pt-16 tracking-tight text-center ">🎉  Welcome! 🎊</h1>
                    <h4 className="text-3xl pb-6 pt-16 tracking-tight text-center ">Start a new script</h4>
                    <ProductForm />
                    {/* <PDFLocalUplaod startScreenPlay={startScreenPlay} /> */}
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
            getSignedUrl={(url: string) => getSignedUrl({ url })}
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
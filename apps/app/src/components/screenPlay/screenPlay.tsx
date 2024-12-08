'use client'

import './screenplay.css'

import { Characters } from '@/components/characters';
import { VoiceActors } from '@/components/voice-actors';
import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils';
import { Voice } from '@v1/script-to-audio/voices'
import AudioPlayer from '@/components/ui/AudioPlayer-refactor'
// import AudioPlayer from '@/components/ui/AudioPlayer'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'
// import { ScriptEditor } from '@/components/scriptEditor/script-editor'
import ScriptEditor from '@/components/scriptEditor2'
import PDFLocalUplaod from '@/components/pdf-upload-local'
import { ProductForm } from '@/components/forms/product-form';
import { getSignedUrl } from '@/actions/screenPlays/get-signed-url'
import { cancelProcessAudio } from '@/actions/screenPlays/cancel-process-audio'
import { ProgressLoader } from '@/components/progressLoader';
import * as Tooltip from "@radix-ui/react-tooltip";


const TooltipContainer = ({ children, text, sideOffset = 1 }) => {
	return (
		<Tooltip.Provider>
			<Tooltip.Root delayDuration={0}>
				<Tooltip.Trigger asChild>
					{children}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content className="TooltipContent" sideOffset={sideOffset}>
                            {text}
						<Tooltip.Arrow className="TooltipArrow" />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
};

function GetAudio({ audioBeingGotten, processAudio, cancelProcessAudio, audioScreenPlayVersion, isEditorDirty }) {
    const status = audioScreenPlayVersion.status
    const [totalLines, setTotalLines]  = useState(0)
    const [totalLinesCompleted, setTotalLinesCompleted]  = useState(0)
    useEffect(() => {
        if (audioScreenPlayVersion?.total_lines) {
            setTotalLines(audioScreenPlayVersion?.total_lines)
        }
        
        if (audioScreenPlayVersion?.total_lines_completed) {
            setTotalLinesCompleted(audioScreenPlayVersion?.total_lines_completed)
        }
        
    }, [audioScreenPlayVersion?.total_lines_completed, audioScreenPlayVersion?.total_lines])

    const progress = totalLinesCompleted != null && totalLines != null ? (totalLinesCompleted / totalLines) * 100 : 0
    let element = null

    switch(isEditorDirty && status === 'full' ? '' : status) {
        case 'full':
            element = <div className="text-sm px-4 completed py-2 border-1 rounded-2xl">Completed</div>
            break;
        case 'inProgress':
            element =
            <ProgressLoader
                className="progress-loading "
                progress={Number(progress.toFixed())}
                isLoading={audioBeingGotten}
                onClick={cancelProcessAudio}
            />
            break;
        case 'partial':
        case 'failed':
            element =
            <TooltipContainer text="There were some... issues getting your audio. Feel free to try again.">
                <Button
                    type="button"
                    className={cn('flex gap-3', status === 'failed' && "failed")}
                    onClick={processAudio}
                    variant="outline"
                    size="sm"
                >
                    <span className=""> {!audioBeingGotten ? "Finish Audio!" : "in progress" }</span>
                    { audioBeingGotten ? <Progress hw={20} bw={2} className=""/> : null}
                </Button>
            </TooltipContainer>
            break;
        default:
            element = (
                <Button
                    type="button"
                    className='flex gap-3'
                    onClick={processAudio}
                        variant="outline"
                        size="sm"
                        >
                    <span className=""> {!audioBeingGotten ? "Get Audio!" : "in progress" }</span>
                    { audioBeingGotten ? <Progress hw={20} bw={2} className=""/> : null}
                </Button>
            )
        }

    return (
        <div>
            <div className="flex gap-2 items-center text-sm">
                {element}
            </div>
            {/* <div className="flex gap-2 items-center text-sm pt-3 pl-2">
                <TooltipContainer text="Lines with completed audio.">
                    <span>{totalLinesCompleted}</span>
                </TooltipContainer>
                /
                <TooltipContainer text="Total audio lines without audio.">
                    <span>{Math.max(totalLines - totalLinesCompleted, 0)}</span>
                </TooltipContainer>
                <span>lines</span>
                <span>-</span>
                <TooltipContainer text="Updates you make are automatically saved and versioned. This is the current version.">
                    <span className="font-bold">v{audioScreenPlayVersion.version_number}</span>
                </TooltipContainer>
            </div> */}
        </div>
    )
}

export default function ScreenPlayConatiner({
  screenPlayText,
  user,
  characters,
  charactersTemp,
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
  updateOrCreateLines,
  title,
}) {
  const [voiceSelectionOpen, setVoiceSelectionOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [currentLinePlaying, setCurrentLinePlaying] = useState(null)
  const [audioBeingGotten, setAudioBeingGotten] = useState(false)
  const [currentlyPlayingLineId, setCurrentlyPlayingLineId] = useState(false)
  const [isEditorDirty, setIsEditorDirty] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [startScreenPlayButtonPressed, setStartScreenPlayButtonPressed] = useState(false)

  // TODO this needs to be fixed up probably by moving the script editor to a provider
  const saveFunc = useRef(null)
  const setSaveFunc = useCallback((saveFunction) => {
    saveFunc.current = saveFunction
  }, [])

  
  if (isLoading) return <div className="flex justify-center h-screen items-center"><Progress /></div>

  return (
    <>
        <div className="flex flex-col h-full">
        <div className="flex flex-1 flex-row gap-4 overflow-auto text-lg script-parent items-streatch">
            <aside className="script-characters flex-1 pt-16 max-w-64 h-full">
                { screenPlayText !== undefined
                ?
                <>
                <div className="col-span-4 md:col-span-3 rounded-4 script-card h-full overflow-hidden">
                   
                    <div
                        className={cn(
                        ` pl-8 pr-4 relative  hidden flex-none transition-[width] duration-500 md:block h-full overflow-hidden`,
                        // voiceSelectionOpen ? 'w-75' : 'w-[75px]',
                        voiceSelectionOpen ? '' : 'sp-hidden',
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

                    <div className={cn("pl-8 h-full", voiceSelectionOpen ? 'sp-hidden' : '')} >
                        {/* <div className="h-24 flex items-center" > */}
                            <GetAudio
                                isEditorDirty={isEditorDirty}
                                audioBeingGotten={audioBeingGotten}
                                processAudio={async () => {
                                    setAudioBeingGotten(true)
                                    console.log('saveFunc.current', saveFunc.current)
                                    if (!saveFunc.current) return
                                    console.log('saveFunc.current after')
                                    const res = await saveFunc.current()
                                    if (res?.success && !res.success) {
                                        setAudioBeingGotten(false)
                                        return
                                    }
                                    await processAudio(res?.audioScreenPlayVersionId)
                                    setAudioBeingGotten(false)
                                }}
                                cancelProcessAudio={async () => {
                                    setAudioBeingGotten(true)
                                    const res = await cancelProcessAudio({ audioVersionId: audioScreenPlayVersion?.id })
                                    setAudioBeingGotten(false)
                                }}
                                setAudioBeingGotten={setAudioBeingGotten}
                                audioScreenPlayVersion={audioScreenPlayVersion}
                            />
                        {/* </div> */}
                        <Characters
                            characters={characters}
                            charactersTemp={charactersTemp}
                            audioVersionNumber={audioVersionNumber}
                            onCharacterClick={(character) => {
                                setSelectedCharacter(character)
                                setVoiceSelectionOpen(true)
                            }}
                        />
                    </div>
                    
                </div>
                </> 
                : null }   
            </aside>
            {/* <div className="script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-5xl font-courier" contentEditable={true} dangerouslySetInnerHTML={{ __html: screenPlayText?.replace(/&nbsp;/g, '') }}></div> */}
            {
                screenPlayText !== undefined 
                ?
                <ScriptEditor
                    user={user}
                    className="script-text bg-white p-8 pt-0 pb-[70px] outline-none border-slate-400 overflow-scroll max-w-4xl font-courier"
                    scriptTokens={lines}
                    audioScreenPlayVersion={audioScreenPlayVersion?.id}
                    audioScreenPlayVersionStatus={audioScreenPlayVersion?.status}
                    currentLinePlaying={currentLinePlaying}
                    pdfText={screenPlayText}
                    saveLines={updateOrCreateLines}
                    setCharacters={setCharacters}
                    screenplayId={screenplayId}
                    characters={characters}
                    audioVersionNumber={audioVersionNumber}
                    currentTokenId={currentlyPlayingLineId}
                    highlightToken={isPlaying}
                    selectToken={setCurrentlyPlayingLineId}
                    setSaveFunc={setSaveFunc}
                    setIsEditorDirty={setIsEditorDirty}
                />
                : <div className={'script-text bg-white p-8 pt-0 outline-none border-slate-400 overflow-scroll max-w-4xl font-courier'}>
                    <h1 className="text-3xl pb-6 pt-16 tracking-tight text-center ">🎉  Welcome! 🎊</h1>
                    <h4 className="text-3xl pb-6 pt-16 tracking-tight text-center ">Start a new script</h4>
                        <ProductForm />
                    {/* <PDFLocalUplaod startScreenPlay={startScreenPlay} /> */}

                        <Button
                            variant="outline"
                            className="text-md h-20 mt-6  box-border w-full"
                            onClick={() => {
                                if (startScreenPlayButtonPressed) return
                                setStartScreenPlayButtonPressed(true)
                                startScreenPlay()
                            }}
                        >
                            Go to a blank document
                            { startScreenPlayButtonPressed ? <Progress hw={20} bw={2} className="ml-3"/> : null}
                        </Button>
                </div>
            }
        </div>
        <AudioPlayer
            key={audioScreenPlayVersion?.id}
            audioVersions={audioVersions}
            setCurrentLinePlaying={setCurrentLinePlaying}
            getSignedUrl={(url: string) => getSignedUrl({ url })}
            setCurrentlyPlayingLineId={setCurrentlyPlayingLineId}
            currentlyPlayingLineId={currentlyPlayingLineId}
            setIsPlaying={setIsPlaying}
            title={title}
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
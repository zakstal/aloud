'use client'

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductForm } from '@/components/forms/product-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getScreenPlay } from '@/actions/screenPlays/get-screen-play'
import { updateAudioCharacterVersionAction } from '@/actions/audioCharacterVersion/update-audio-character-version'
import React, { useState, useEffect} from 'react';
import { useParams, useRouter } from 'next/navigation';
import ScreenPlayConatiner from '@/components/screenPlay/screenPlay'
import voices, { Voice } from '@v1/script-to-audio/voices'
import { processAudio } from '@/actions/screenPlays/process-audio'


const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Screen-play', link: '/dashboard/screen-play' },
  { title: 'Create', link: '/dashboard/screen-play/create' }
];

type screenPlay = {
  error: string | null;
}

function updateCharacter(character, characters, setCharacters) {
// TODO put this into an update function
  const newCharacters: any[] = [...characters]
  for (const idx in newCharacters) {
    const newCharacter: any = newCharacters[idx]
    if (newCharacter.id !== character.id) continue
    newCharacters[idx] = character
    break;
  }

  setCharacters(newCharacters)
}


function updateAudioVersions (audioVersions, setAudioVersions) {
  if (!audioVersions) return
  const newAudioVersions = audioVersions.sort((a, b) => {
    return a.lines.order - b.lines.order
  })
  setAudioVersions(newAudioVersions)
}

export default function Page() {
  const params = useParams();

  const [screenPlay, setScreenPlay ] = useState({})
  const [characters, setCharacters ] = useState([])
  const [audioVersions, setAudioVersions ] = useState([])

  useEffect(() => {
    if (params?.screenplayid) {
      getScreenPlay({ screenPlayId: params.screenplayid }).then((screenPlay) => {
        const data = screenPlay?.data?.data && screenPlay?.data?.data
        const audio_screenplay_version = data?.audio_screenplay_versions && data?.audio_screenplay_versions[data?.audio_screenplay_versions.length - 1]
        const audio_version = audio_screenplay_version?.audio_version

        updateAudioVersions(audio_version, setAudioVersions)
        setScreenPlay(screenPlay)
        setCharacters(data?.characters)
    })
    }

  }, [params])

  if (!screenPlay.error && screenPlay?.data?.data) {
    // console.log('screenPlay&&&', screenPlay?.data?.data)
    breadcrumbItems.pop()
    breadcrumbItems.push({ title: screenPlay?.data?.data.title, link: `/dashboard/screen-play/${screenPlay?.title}` })
  }

  const data = screenPlay?.data?.data && screenPlay?.data?.data

  const audioScreenPlayVersion = data?.audio_screenplay_versions && data?.audio_screenplay_versions[0]
  const audioVersionNumber = audioScreenPlayVersion?.version_number

  // TODO add type for character
  // TODO add type for audio character version
  return (
    <>  
      {
        params.screenplayid !== 'new' || screenPlay?.data?.data 
        ? 
        <ScreenPlayConatiner
          title={data?.title}
          screenPlayText={data?.screen_play_text}
          characters={characters}
          voices={voices}
          audioVersionNumber={audioVersionNumber}
          audioVersions={audioVersions}
          scriptTokens={data?.screen_play_fountain}
          processAudio={async () => {
            processAudio({ screenPlayVersionId: audioScreenPlayVersion.id })
          }}
          onSelectVoice={async (voice: Voice, character) => {
            const audioCharacterVersion = character.audio_character_version.find(version => version.version_number === audioVersionNumber)
            const audioCharacterVersionId = audioCharacterVersion?.id
            // TODO add some error handling
            try {
              const res = await updateAudioCharacterVersionAction({
                audioCharacterVersionId,
                voice_id: voice.voiceId,
                voice_data: voice,
                voice_name: voice.name,
              })

              console.log("here", res)
              if (res.data.error) {
                throw 'Error updating voice'
              }

              const updatedCharacter = res?.data?.data
              console.log('updatedCharacter------', updatedCharacter)
              updateCharacter(updatedCharacter, characters, setCharacters)
              
            } catch(e) {
              // toast
            }
          }}
        />
        :
          <div className="flex-1 space-y-4 p-8">
          <ProductForm
          categories={[
            { _id: 'shirts', name: 'shirts' },
            { _id: 'pants', name: 'pants' }
          ]}
          initialData={null}
          key={null}
          />
        </div>
      }
    </>
  );
}
'use client'

import { getScreenPlay } from '@/actions/screenPlays/get-screen-play'
import { updateAudioCharacterVersionAction } from '@/actions/audioCharacterVersion/update-audio-character-version'
import React, { useState, useEffect} from 'react';
import { useParams, useRouter } from 'next/navigation';
import ScreenPlayConatiner from '@/components/screenPlay/screenPlay'
import voices, { Voice } from '@v1/script-to-audio/voices'
import { processAudio } from '@/actions/screenPlays/process-audio'
import { startScreenPlay } from '@/actions/screenPlays/create-screenplay'
import { getSignedUrl } from '@/actions/screenPlays/get-signed-url'


const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Screen-play', link: '/dashboard/screen-play' },
  { title: 'Create', link: '/dashboard/screen-play/create' }
];

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


function updateLines (audioVersions, setAudioVersions) {
  if (!audioVersions) return
  const newAudioVersions = audioVersions.sort((a, b) => {
    return a.order - b.order
  })
  setAudioVersions(newAudioVersions)
}

export default function Page() {
  const params = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading ] = useState(true)
  const [screenPlay, setScreenPlay ] = useState({})
  const [characters, setCharacters ] = useState([])
  const [lines, setLines ] = useState([])
  const [audioVersions, setAudioVersions ] = useState([])

  useEffect(() => {
    if (params?.screenplayid) {
      getScreenPlay({ screenPlayId: params.screenplayid })
        .then((screenPlay) => {
          const data = screenPlay?.data?.data && screenPlay?.data?.data
          const audio_screenplay_version = data?.audio_screenplay_versions && data?.audio_screenplay_versions[data?.audio_screenplay_versions.length - 1]
          const audio_version = audio_screenplay_version?.audio_version

          console.log('data-----------------', data)
          setAudioVersions(audio_version)
          updateLines(data?.lines, setLines)
          setScreenPlay(screenPlay)
          setCharacters(data?.characters)
      })
      .finally(() => {
        setIsLoading(false)
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
        <ScreenPlayConatiner
          title={data?.title}
          isLoading={isLoading}
          screenPlayText={data?.screen_play_text}
          startScreenPlay={async (obj = {}) => {
            console.log("start screen play")
            try {

              const res = await startScreenPlay(obj)
              const id = res?.data?.id
              console.log("res", res)
              if (id) {
                router.push(`/dashboard/screen-play/${id}`);
              }
            } catch(e) {
              console.log('error uploading screenplay', e)
            }
          }}
          characters={characters}
          voices={voices}
          audioScreenPlayVersion={audioScreenPlayVersion?.id}
          audioVersionNumber={audioVersionNumber}
          audioVersions={audioVersions}
          lines={lines}
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

              if (res.data.error) {
                throw 'Error updating voice'
              }

              const updatedCharacter = res?.data?.data
              updateCharacter(updatedCharacter, characters, setCharacters)
              
            } catch(e) {
              // toast
            }
          }}
        />

    </>
  );
}

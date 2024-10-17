'use client'

import { getScreenPlay } from '@/actions/screenPlays/get-screen-play'
import { updateAudioCharacterVersionAction } from '@/actions/audioCharacterVersion/update-audio-character-version'
import React, { useState, useEffect} from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ScreenPlayConatiner from '@/components/screenPlay/screenPlay'
import voices, { Voice } from '@v1/script-to-audio/voices'
import { processAudio } from '@/actions/screenPlays/process-audio'
import { startScreenPlay } from '@/actions/screenPlays/create-screenplay'
import { getSignedUrl } from '@/actions/screenPlays/get-signed-url'
import { createClient } from "@v1/supabase/client";
const supabase = createClient();

type Character = { name: string, gender: string | null }

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Screen-play', link: '/dashboard/screen-play' },
  { title: 'Create', link: '/dashboard/screen-play/create' }
];

function updateCharacter(character, characters, setCharacters) {
// TODO put this into an update function
  const newCharacters: any[] = [...characters]
  let didFind = false
  for (const idx in newCharacters) {
    const newCharacter: any = newCharacters[idx]
    if (!newCharacter.id || newCharacter.id !== character.id) continue
    newCharacters[idx] = character
    didFind = true
    break;
  }

  if (!didFind) {
    newCharacters.push(character)
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
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading ] = useState(true)
  const [screenPlay, setScreenPlay ] = useState({})
  const [characters, setCharacters ] = useState([])
  const [charactersTemp, setCharactersTemp ] = useState([])
  const [lines, setLines ] = useState([])
  const [audioVersions, setAudioVersions ] = useState([])

  useEffect(() => {
    console.log('connect to supeabase realtime----------------')
    const channel = supabase
      .channel('*')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_character_version' }, (payload) =>
        console.log("paylaod-------------", payload)
        // setPosts((posts: any) => [...posts, payload.new])
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
          setCharacters(data?.characters || [])
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

  const audioScreenPlayVersion = data?.audio_screenplay_versions && data?.audio_screenplay_versions[data?.audio_screenplay_versions.length - 1]
  const audioVersionNumber = audioScreenPlayVersion?.version_number

  console.log('characters---------', characters)
  // TODO add type for character
  // TODO add type for audio character version
  return (
    <>  
        <ScreenPlayConatiner
          title={data?.title}
          screenplayId={params?.screenplayid}
          isLoading={isLoading}
          setCharacters={setCharactersTemp}
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
          characters={[...characters, ...charactersTemp]}
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

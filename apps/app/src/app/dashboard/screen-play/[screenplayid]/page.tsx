'use client'

import { getScreenPlay } from '@/actions/screenPlays/get-screen-play'
import { updateAudioCharacterVersionAction } from '@/actions/audioCharacterVersion/update-audio-character-version'
import React, { useState, useEffect} from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import ScreenPlayConatiner from '@/components/screenPlay/screenPlay'
import voices, { Voice } from '@v1/script-to-audio/voices'
import { processAudio } from '@/actions/screenPlays/process-audio'
import { startScreenPlay } from '@/actions/screenPlays/create-screenplay'
import { createClient } from "@v1/supabase/client";
import { updateOrCreateLines } from '@/actions/screenPlays/update-lines'
import { useToast } from '@/components/ui/use-toast';
import { useSession } from "@v1/supabase/supbaseSessionContext";
import { useScriptMeta } from '@/components/scriptEditor2/scriptMetaContext'

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


function updateLines (lines, setLines) {
  if (!lines) return
  const newLInes = lines.sort((a, b) => {
    return a.order - b.order
  })
  setLines(newLInes)
}

function updateItemInArray(item, array) {
  const index = array.findIndex((arrItem) => arrItem.id === item.id);

  if (index !== -1) {
    array[index] = { ...array[index], ...item }; // Update the item in the array
  }
}

function findReverse(array, callback) {
  for (let i = array.length - 1; i >= 0; i--) {
    const isTrue: boolean = callback(array[i])
    if (isTrue) return array[i] 
  }
  return null
}

const statusToastMessage = {
  failed: 'There was an issue getting your audio and none of your audio was retrieved. This is likely a system problm.',
  partial: 'There was an issue getting some of your audio. Try again.',
  full: 'Audio retrived!',
  inProgress: 'Were getting your audio!',
}

const statusAudioVersion = {}

export default function Page() {
  const { session } = useSession();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scriptMeta = useScriptMeta()

  const [isLoading, setIsLoading ] = useState(true)
  const [screenPlay, setScreenPlay ] = useState({})
  const [characters, setCharacters ] = useState([])
  const [charactersTemp, setCharactersTemp ] = useState([])
  const [lines, setLines ] = useState([])
  const [audioVersions, setAudioVersions ] = useState([])
  const [audioScreenPlayVersion, setAudioScreenPlayVersion ] = useState([])
  const { toast } = useToast();

  if (!screenPlay.error && screenPlay?.data?.data) {
    // console.log('screenPlay&&&', screenPlay?.data?.data)
    breadcrumbItems.pop()
    breadcrumbItems.push({ title: screenPlay?.data?.data.title, link: `/dashboard/screen-play/${screenPlay?.title}` })
  }

  const data = screenPlay?.data?.data && screenPlay?.data?.data
  
  const audioVersionNumber = audioScreenPlayVersion?.version_number


  useEffect(() => {
    if (!audioScreenPlayVersion) {
      return
    }

    const channel = supabase.channel('*');

    // Subscribe to audio_screenplay_versions table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'audio_screenplay_versions',
        filter: 'id=eq.' + audioScreenPlayVersion?.id
      },
      (payload) => {
        console.log("----------------------audio_screenplay_versions", payload)

        const lastStatus = statusAudioVersion[payload?.new?.id]
        
        const message = statusToastMessage[payload?.new?.status]
        
        if (message && payload?.new?.status !== lastStatus) {
          statusAudioVersion[payload?.new?.id] = payload?.new?.status
          toast({
            title: 'Process audio info',
            description: message
          });
        }

        if (payload?.new?.id && !lastStatus) {
          statusAudioVersion[payload?.new?.id] = payload?.new?.status
        }

        setAudioScreenPlayVersion({
          ...audioScreenPlayVersion,
          ...payload.new,
        })
      }
    );
  
    // Subscribe to audio_version table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'audio_version',
        // Uncomment if you want to filter by audio_screenplay_version_id
        filter: 'audio_screenplay_version_id=eq.' + audioScreenPlayVersion?.id
      },
      /**
       * 
       * @param payload 
       * Example:
       * {
          "schema": "public",
          "table": "audio_version",
          "commit_timestamp": "2024-10-17T20:26:12.633Z",
          "eventType": "UPDATE",
          "new": {
              "audio_character_version_id": "cf1513b9-753c-4b6c-84d4-506f71eae52d",
              "audio_file_url": "091b4dc3-c34c-4ad3-87da-682bcf40d867/dc35ece7-d08a-4240-a3ad-54506fd19a50-44-elevenLabs-George.mp3",
              "audio_screenplay_version_id": "dc35ece7-d08a-4240-a3ad-54506fd19a50",
              "created_at": "2024-10-17T20:16:05.43333+00:00",
              "duration_in_seconds": 13.142,
              "id": "26903fa9-7df3-4926-a1de-2fcec6684dc4",
              "line_id": "bf346567-26a9-47de-bbca-93dd33ec094f",
              "order": null,
              "screenplay_id": "dd0a8ddd-69ab-4828-bd8a-af2413fab29a",
              "version_number": 1
          },
          "old": {
              "id": "26903fa9-7df3-4926-a1de-2fcec6684dc4"
          },
          "errors": null
      }
       */
      (payload) => {

        // assuming for now that only inserts will be triggered

        console.log("----------------------audio_version", payload)
        updateItemInArray(payload.new, audioVersions)
        setAudioVersions([...audioVersions])
      }
    );

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [screenPlay])


  useEffect(() => {
    if (params?.screenplayid) {
      const versionNumber = Number(searchParams.get('version')) || null // we don't want NaN

      getScreenPlay({ screenPlayId: params.screenplayid, versionNumber  })
        .then((screenPlay) => {

          const data = screenPlay?.data?.data && screenPlay?.data?.data

          const audio_screenplay_version = data?.audio_screenplay_versions && 
            versionNumber && versionNumber <= data?.audio_screenplay_versions.length
            ? data?.audio_screenplay_versions.find(version => version.version_number === versionNumber) // get version if version number should exist
            : data?.audio_screenplay_versions[data?.audio_screenplay_versions.length - 1] // if no version number get the most recent

          console.log('data-----------------', data)
          
          const audio_version = data?.lines
          .filter(line => line?.audio_version?.length)
          .filter(line => Boolean(line?.text))
          .map(line => findReverse(line.audio_version, (version) => Boolean(version.audio_file_url)))
          .filter(Boolean)
          // .map(line => line.audio_version[line.audio_version.length - 1])
          
          setAudioVersions(audio_version)
          setLines(data?.lines)
          setScreenPlay(screenPlay)
          setCharacters(data?.characters || [])
          setAudioScreenPlayVersion(audio_screenplay_version)
      })
      .catch(error => {
        console.log("error", error)
      })
      .finally(() => {
        setIsLoading(false)
      })
    }

  }, [params])

  // TODO add type for character
  // TODO add type for audio character version

  return (
    <>  
        <ScreenPlayConatiner
          key={params?.screenplayid}
          user={session}
          title={data?.title}
          screenplayId={params?.screenplayid}
          isLoading={isLoading}
          setCharacters={characters => {
            setCharactersTemp(characters)
          }}
          screenPlayText={data?.screen_play_text}
          startScreenPlay={async (obj = {}) => {
            try {

              const res = await startScreenPlay(obj)
              const id = res?.data?.data?.id
              if (id) {
                router.push(`/dashboard/screen-play/${id}`);
              }
            } catch(e) {
              console.log('error uploading screenplay', e)
            }
          }}
          updateOrCreateLines={async (changes, toastAlert) => {
            if (toastAlert) {
              toast({
                title: 'Saving changes',
                description: 'Saving your script updates'
              })
            }
            const res = await updateOrCreateLines(changes)

            if (toastAlert) {
              toast({
                title: 'Changes saved',
                description: 'Your changes have been saved!'
              })
            }

            //TODO clean this up a little more
            if (res.validationErrors) {
              toast({
                title: 'Validation errors',
                // description: res.validationErrors
              })
              console.log('validation errors', res.validationErrors)
              return {
                success: false
              }
            }

            if (res.serverError) {
              toast({
                title: 'Error saving lines',
                description: res.serverError
              })
              return {
                success: false
              }
            }
            
            if (res.error) {
              toast({
                title: 'Error updating lines',
                description: res.error
              })
              return {
                success: false
              }
            }
            if (res?.data?.error) {
              toast({
                title: 'Error updating lines',
                description: res.data.data.error
              })
              return {
                success: false
              }
            }

            const params = new URLSearchParams(searchParams.toString())
            const versionNumber = res?.data?.data?.version_number
            if (versionNumber) {
              params.set('version', versionNumber)
              router.push(`${pathname}?${params.toString()}`, { shallow: true })
            }
            
            setAudioScreenPlayVersion(res.data.data)
            return {
              success: true,
              audioScreenPlayVersionId: res.data.data.id
            }
          }}
          characters={[...characters, ...charactersTemp]}
          charactersTemp={charactersTemp}
          voices={voices}
          audioScreenPlayVersion={audioScreenPlayVersion}
          audioVersionNumber={audioVersionNumber}
          audioVersions={audioVersions}
          lines={lines}
          scriptTokens={data?.screen_play_fountain}
          processAudio={async (screenPlayVersionId) => {
            const activeCharacters = new Set(scriptMeta.getCharacters()?.map(character => character.id))

            // we have the characters that come in from the server, but we may delete characers
            // befor saving. ScriptMeta holds the info on what are the correct characters to show.
            const charactersToDisplay = characters.filter(character => activeCharacters.has(character.id))

            if (charactersToDisplay.some(character => !Boolean(character?.audio_character_version?.voice_id))) {
              toast({
                  title: 'Characters need voices assigned',
                  description: 'Characters need voice actors assigned to them. Choose a voice for your character by clicking on a character.'
                  });
  
              return
          }
            toast({
              title: 'Getting audio',
              description: 'We are getting your audio.'
            });
            const res = await processAudio({ screenPlayVersionId: screenPlayVersionId || audioScreenPlayVersion.id })

            let data = null
            let error = false
            if (res.ok) {
              try {

                data = await res.json()
              } catch(e) {
                console.log('error', e)
                data = '' + e
                error = true
              }
            } else {
              error = true
              data = await res.text()
            }

            if (error) {
              toast({
                title: 'Process audio error',
                description: data
              });
            }
            
            if (data.status === 'inProgress') {
              toast({
                title: 'Process audio',
                description: 'Your audio is already processing!'
              });
            }

            if (data.status === 'full') {
              toast({
                title: 'Process audio',
                description: 'Audio has already been processed.'
              });
            }
            return data
          }}
          onSelectVoice={async (voice: Voice, character) => {
            // get the version or the latest
            let audioCharacterVersion = character.audio_character_version
            // audioCharacterVersion = audioCharacterVersion ? audioCharacterVersion : character.audio_character_version[character.audio_character_version.length - 1]
            const audioCharacterVersionId = audioCharacterVersion?.id
            // TODO add some error handling
            try {
              const res = await updateAudioCharacterVersionAction({
                audioCharacterVersionId,
                voice_id: voice.voiceId,
                voice_data: voice,
                voice_name: voice.name,
              })

              if (res?.data?.error) {
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

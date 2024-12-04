"use client"

import { Character, CharacterType } from '@/components/character';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import './characters.css'
import { useEffect, useRef } from 'react';
import { useScriptMeta } from '@/components/scriptEditor2/scriptMetaContext'

type CharactersInput = {
  characters: string[],
  charactersTemp: string[],
  audioVersionNumber: number,
  onCharacterClick: (character: CharacterType) => CharacterType,
}

export function Characters({
  characters,
  onCharacterClick,
  audioVersionNumber,
}: CharactersInput) {

  const scriptMeta = useScriptMeta()
  const activeCharacters = new Set(scriptMeta?.getCharacters()?.map(character => character.id))

  // we have the characters that come in from the server, but we may delete characers
  // befor saving. ScriptMeta holds the info on what are the correct characters to show.
  const charactersToDisplay = characters?.filter(character => activeCharacters.has(character.id))
  return (
    <>
      <div className="sticky top-0 z-50 header header-in" >
        <CardHeader className="p-0 pb-6 pt-6 pl-2">
          <div className="flex flex-row gap-4" >
              <CardTitle>Characters</CardTitle>
              <CardDescription>
                  {/* {`${characters?.length || 0} characters`} */}
              </CardDescription>
          </div>
          <div className="flex items-center justify-between">
            </div>
        </CardHeader>
      </div>
    
      <div className="space-y-2 overflow-scroll h-[67%] appear appear-in">
        { charactersToDisplay?.map(data => {

          let characterVersion = data?.audio_character_version
          // characterVersion = characterVersion ? characterVersion : data?.audio_character_version && data?.audio_character_version[data?.audio_character_version?.length - 1]
          return (
          <Character
            key={data.id}
            name={data.name} 
            gender={data.gender} 
            avatar={characterVersion?.voice_data?.avatar}
            assigned={characterVersion}
            onClick={() => onCharacterClick(data)}
          />
          )
        })
        }
      </div>
    </>
  )
}

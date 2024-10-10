"use client"

import { Character, CharacterType } from '@/components/character';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import './characters.css'

type CharactersInput = {
  characters: string[],
  audioVersionNumber: number,
  onCharacterClick: (character: CharacterType) => CharacterType,
}

export function Characters({
  characters,
  onCharacterClick,
  audioVersionNumber,
}: CharactersInput) {
  return (
    <div>
      <div className="sticky top-0 z-50 header header-in" >
        <CardHeader className="p-0 pb-6 pt-6 pl-2">
          <div className="flex flex-row gap-4" >
              <CardTitle>Characters</CardTitle>
              <CardDescription>
                  {`${characters?.length || 0} characters`}
              </CardDescription>
          </div>
          <div className="flex items-center justify-between">
                {/* <div className="flex" style={{ flex: '1'}}>
                  <p className="text-xs font-small leading-none text-muted-foreground" >{'Character name'}</p>
                </div>
                <div style={{ flex: '1'}}>
                  <p className="text-xs font-small leading-none text-muted-foreground" >{'voice actor'}</p>
                </div>
                <div>
                  <p className="text-xs font-small leading-none text-muted-foreground">{''}</p>
              </div> */}
            </div>
        </CardHeader>
      </div>
      <CardContent className="p-0">
       
          <div className="space-y-2 overflow-scroll h-screen appear appear-in pb-8" style={{ paddingBottom: '50px' }}>
            { characters?.map(data => {
              console.log("data character", data)
              const characterVersion = audioVersionNumber ? data?.audio_character_version?.find(version => version.version_number === audioVersionNumber) : null
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
      </CardContent>
      </div>
  )
}

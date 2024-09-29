"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AudioPlayerButton } from '@/components/ui/audioButtonOnly'

type characterInput = {
  name: string;
  gender: string;
  stryle: string;
  assigned: string;
  preview: string;
  avatar: string;
  className: string | null;
  onClick: () => {} | null;
}

export type CharacterType = {
  name: string,
  gender: string,
}


export function Character ({
  name = '',
  gender = '',
  onClick,
  className = '',
  preview,
  avatar,
  style,
  assigned }: characterInput) {
  const abbreveation = name?.split(' ')?.map((word: string) => word && word[0]?.toUpperCase())?.join('')
  return (
    <div
      
      style={style}
      className={"flex items-start cursor-pointer hover:bg-[hsl(var(--card))] px-2 py-2 rounded-lg items-start" + className}
    >
      <div className="flex items-start w-[110px]" style={{ flex: '2'}} onClick={onClick}>
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar} alt="Avatar" />
          <AvatarFallback>{abbreveation}</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-xs text-muted-foreground italic">
            {gender}
          </p>
        </div>
        {/* <div className="ml-auto font-medium">+$1,999.00</div> */}
      </div>
      <div className="max-w-40" onClick={onClick} >
        {
          assigned ? (
            !assigned?.voice_id
              ? <p className="text-sm font-medium leading-none">{''}</p>
              :  <div className="ml-4 space-y-1" >
              <p className="text-sm font-medium leading-none">{assigned.voice_name}</p>
              <p className="text-xs text-muted-foreground italic self-stretch">
                {`${assigned.voice_data.gender}  ${assigned.voice_data.age}  ${assigned.voice_data.accent}`}
              </p>
            </div>
          )
          : null
        }
      </div>
      
        {

        preview 
        ?
        <div className="" > 
          <AudioPlayerButton
              url={preview}
            />
        </div>
        : null
        }
    </div>
  )
}

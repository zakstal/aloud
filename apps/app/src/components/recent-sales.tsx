import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type characterInput = {
  name: string;
}

function Character ({ name = '', gender = '' }: characterInput) {
  const abbreveation = name.split(' ').map((word: string) => word[0].toUpperCase()).join('')
  return (
    <div className="flex items-center justify-between ">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
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
      <div className="">
        <p className="text-sm font-medium leading-none">{'--'}</p>
      </div>
      <div className="">
        <p className="text-sm font-medium leading-none">{''}</p>
      </div>
    </div>
  )
}

type RecentSalesInput = {
  characters: string[]
}
export function RecentSales({
  characters
}: RecentSalesInput) {
  return (
    <>
      <div className="flex items-center justify-between pb-7">
          <div className="flex">
            <div>
              <p className="text-xs font-small leading-none text-muted-foreground">{'Character name'}</p>
            </div>
            {/* <div className="ml-auto font-medium">+$1,999.00</div> */}
          </div>
          <div>
            <p className="text-xs font-small leading-none text-muted-foreground">{'voice actor'}</p>
          </div>
          <div>
            <p className="text-xs font-small leading-none text-muted-foreground">{''}</p>
        </div>
      </div>
      <div className="space-y-8">
        { characters.map(data => <Character name={data.name} gender={data.gender} /> )}
      </div>
    </>
  );
}

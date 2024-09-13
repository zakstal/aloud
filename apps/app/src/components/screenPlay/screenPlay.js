import './screenplay.css'
import { Heading } from '@/components/ui/heading';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { RecentSales } from '@/components/recent-sales';



export default function ScreenPlayConatiner({
  screenPlayText,
  title,
  characters,
}) {
  return (
    <div className="pt-3">
        <Heading title={title}  className="script-heading" />
        <div className="flex flex-row gap-4 text-lg">
            <div className="script-text bg-white p-8 border rounded border-slate-500" dangerouslySetInnerHTML={{ __html: screenPlayText?.replace(/&nbsp;/g, '') }}></div>
            <aside className="script-characters flex-1">
                <Card className="col-span-4 md:col-span-3 h-screen rounded-4 overflow-scroll script-card">
                    <CardHeader>
                    <div className="flex flex-row gap-4">
                        <CardTitle>Characters</CardTitle>
                        <CardDescription>
                            {`${characters.length || 0} characters`}
                        </CardDescription>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <RecentSales characters={characters}/>
                    </CardContent>
                </Card>
            </aside>
        </div>
    </div>
  );
}

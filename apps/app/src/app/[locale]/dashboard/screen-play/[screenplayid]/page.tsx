'use client'

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductForm } from '@/components/forms/product-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getScreenPlay } from '@/actions/screenPlays/get-screen-play'
import React, { useState, useEffect} from 'react';
import { useParams, useRouter } from 'next/navigation';
import ScreenPlayConatiner from '@/components/screenPlay/screenPlay'

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Screen-play', link: '/dashboard/screen-play' },
  { title: 'Create', link: '/dashboard/screen-play/create' }
];

type screenPlay = {
  error: string | null;
}

export default function Page() {
  const params = useParams();

  const [screenPlay, setScreenPlay ] = useState({})
  useEffect(() => {
    console.log('params', params.screenplayid)
    if (params?.screenplayid) {
      getScreenPlay({ screenPlayId: params.screenplayid }).then(setScreenPlay as any)
    }
    // setScreenPlay(screenPlay)
  }, [params])

  if (!screenPlay.error && screenPlay?.data?.data) {
    // console.log('screenPlay&&&', screenPlay?.data?.data[0])
    breadcrumbItems.pop()
    breadcrumbItems.push({ title: screenPlay?.data?.data[0].title, link: `/dashboard/screen-play/${screenPlay?.title}` })
  }

  const data = screenPlay?.data?.data && screenPlay?.data?.data[0]

  return (
    <>
      <div className="flex-1 space-y-4 p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <ScrollArea className="h-screen">
        {
         screenPlay?.data?.data 
          ? 
          <ScreenPlayConatiner
            title={data.title}
            screenPlayText={data.screen_play_text}
            characters={data.characters}
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
        </ScrollArea>
      </div>
    </>
  );
}

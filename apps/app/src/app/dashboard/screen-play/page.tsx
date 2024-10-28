"use clinet";

import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
// import { deleteScreenPlayPermanatlyAction } from '@/actions/screenPlays/delete-screen-pay-permanat'
import { columns } from '@/components/tables/screenplays-tables/columns';
import { ScreenplayTable } from '@/components/tables/screenplays-tables/screenplays-table';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getScreenPlays } from '@/actions/screenPlays/get-screen-plays'
import { PieGraph } from '@/components/charts/pie-graph';


const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Screen plays', link: '/dashboard/screen-play' }
];

type paramsProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

export default async function page({ searchParams }: paramsProps) {
  const page = Number(searchParams.page) || 1;
  // const pageLimit = Number(searchParams.limit) || 10;
  // const country = searchParams.search || null;
  // const offset = (page - 1) * pageLimit;
  const resplay = await getScreenPlays()

  // const res = await fetch(
  //   `https://api.slingacademy.com/v1/sample-data/users?offset=${offset}&limit=${pageLimit}` +
  //     (country ? `&search=${country}` : '')
  // );
  // const employeeRes = await res.json();
  const totalUsers = 0//  employeeRes.total_users; //1000
  const pageCount = 0//Math.ceil(totalUsers / pageLimit);
  // const employee: Employee[] = employeeRes.users;
  return (
    <PageContainer>
      <div className="space-y-4 max-w-6xl">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`Screen plays`}
            description=""
          />

          <Link
            href={'/dashboard/screen-play/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />

        {
          resplay?.data?.data.length 
          ? <ScreenplayTable
            searchKey="country"
            pageNo={page}
            columnsFunc={columns}
            totalUsers={totalUsers}
            data={resplay?.data?.data}
            pageCount={pageCount}
            // onDelete={(id: string) => {
            //   deleteScreenPlayPermanatlyAction({ screenPlayId: id })
            // }}
          />
        : <div>
          <PieGraph />
        </div>
        }
      </div>
    </PageContainer>
  );
}

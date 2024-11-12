## Getting started


```sh
bun i
```

2. Copy `.env.example` to `.env` and update the variables.

```sh
# Copy .env.example to .env for each app
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/web/.env.example apps/web/.env
```

4. Start the development server from either bun or turbo:

```ts
bun dev // starts everything in development mode (web, app, api, email)
bun dev:app // starts the app in development mode
bun dev:api // starts the api in development mode
//bun dev:web // starts the web app in development mode
// bun dev:email // starts the email app in development mode
```

5. navigate to packages/jobs

`npx trigger.dev@latest dev`



## Jobs trigger.deb

Deployment

`npx trigger.dev@latest deploy`



## How tos
- (supabase google Oath set up)[https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=environment&environment=client]


## Issues
- get real images for the in the public space for voice actors
- character column on the scren play detail page goes to low on the page


## TODO
- [ ] terms and conditions
- [ ] privacy policy
- [ ] offline maybe
- [ ] better login page
- [ ] account limits
- [ ] skip forward and back on the player
- [ ] Merge packages/script-to-audio/src/parsers/fountainParser2 and apps/app/src/components/scriptEditor/script-tokens.tsx
- [ ] When creating text, make sure characters are assigned
    - [ ] This is not the case at the moment as we look if the last text was from a character. However  type “action” should be assigned to narrator
- [ ] When a new version is created, the UI needs to be updated with the correct ids for lines
- [ ] Ids created from new lines in the UI are prepended with “internal” this is being stripped out, but we don’t want it all together. Its also being used to determine newly created lines
- [ ] Going back and forth with ctrl+z and shift+ctrl+z between major server versions and how it interacts with the indexedDb version
    - [ ] How do we go to a previous version, then redo forwards 
    - [ ] What if we go back to a previous version and start editing how do we then undo?
- [ ] Versioning for character versions. 
    - [ ] Tie it to the version_number? Can the sql functions work properly to get a version?
    - [ ] 
- [ ] Removing characters from the script
- [ ] There is an issue using backspace delete on the script editor
- [ ] When deleting lines that were assigned to a character the lines need to be reassigned to narrator
- [ ] Sup abase transactions when updating lines
- [ ] Add check for assignment to audio character version before trying to get audio on the client
- [ ] Tracking of audio provider in DB
    - [ ] Check concurrency rate
    - [ ] Elegant failure when credits are out
- [ ] Very large documents take a while to load when from a pdf. Chunk it out
- [ ] Create new audio version when switching characters versions when audio is completed
- [ ] Character lines are being set to IsDialog true. This should not happen
- [ ] Add ability to add title of script 
- [ ] Initial item on blank doc needs an id
- [ ] Change color for loading progress indicator on the get audio button
- [ ] Reload audio if lines have changed and new audio gotten
- [ ] On get audio save
- [ ] Save every few seconds, if offline put in a queue
- [ ] Add the ability on save to delete characters
- [ ] Get save data from scriptMeta instead of looping through all items
- [ ] In the editor if you tab it will go down to the player
- [ ] Add aria labels

UPDATES
- add config
	- highlight lines on play
	- save rate

### Potential problems
- Indexed db gets too big
    - Modifies for the same element can be batched

## Supabase DB

### create a new migration
navigate to app/api
`npm run migrate:new <name_of_migration>`


### Reset db
reset db and re-run migtion
`npm run reset`


### CLI Login
`npm run login`


### Push schema changes to remote db
You must be logged in.
`npm run push`


## ORIGINAL README

![hero](image.png)


<p align="center">
	<h1 align="center"><b>Create v1</b></h1>
<p align="center">
    An open-source starter kit based on <a href="https://midday.ai">Midday</a>.
    <br />
    <br />
    <a href="https://v1.run"><strong>Website</strong></a> · 
    <a href="https://github.com/midday-ai/v1/issues"><strong>Issues</strong></a> · 
    <a href="#whats-included"><strong>What's included</strong></a> ·
    <a href="#prerequisites"><strong>Prerequisites</strong></a> ·
    <a href="#getting-started"><strong>Getting Started</strong></a> ·
    <a href="#how-to-use"><strong>How to use</strong></a>
  </p>
</p>

Everything you need to build a production ready SaaS, it's a opinionated stack based on learnings from building Midday using the latest Next.js framework, it's a monorepo with a focus on code reuse and best practices that will grow with your business.

## What's included

[Next.js](https://nextjs.org/) - Framework<br>
[Turborepo](https://turbo.build) - Build system<br>
[Biome](https://biomejs.dev) - Linter, formatter<br>
[TailwindCSS](https://tailwindcss.com/) - Styling<br>
[Shadcn](https://ui.shadcn.com/) - UI components<br>
[TypeScript](https://www.typescriptlang.org/) - Type safety<br>
[Supabase](https://supabase.com/) - Authentication, database, storage<br>
[Upstash](https://upstash.com/) - Cache and rate limiting<br>
[React Email](https://react.email/) - Email templates<br>
[Resend](https://resend.com/) - Email delivery<br>
[i18n](https://next-international.vercel.app/) - Internationalization<br>
[Sentry](https://sentry.io/) - Error handling/monitoring<br>
[Dub](https://dub.sh/) - Sharable links<br>
[Trigger.dev](https://trigger.dev/) - Background jobs<br>
[OpenPanel](https://openpanel.dev/) - Analytics<br>
[Polar](https://polar.sh) - Billing (coming soon)<br>
[react-safe-action](https://next-safe-action.dev) - Validated Server Actions<br>
[nuqs](https://nuqs.47ng.com/) - Type-safe search params state manager<br>
[next-themes](https://next-themes-example.vercel.app/) - Theme manager<br>

## Directory Structure

```
.
├── apps                         # App workspace
│    ├── api                     # Supabase (API, Auth, Storage, Realtime, Edge Functions)
│    ├── app                     # App - your product
│    ├── web                     # Marketing site
│    └── ...
├── packages                     # Shared packages between apps
│    ├── analytics               # OpenPanel analytics
│    ├── email                   # React email library
│    ├── jobs                    # Trigger.dev background jobs
│    ├── kv                      # Upstash rate-limited key-value storage
│    ├── logger                  # Logger library
│    ├── supabase                # Supabase - Queries, Mutations, Clients
│    └── ui                      # Shared UI components (Shadcn)
├── tooling                      # are the shared configuration that are used by the apps and packages
│    └── typescript              # Shared TypeScript configuration
├── .cursorrules                 # Cursor rules specific to this project
├── biome.json                   # Biome configuration
├── turbo.json                   # Turbo configuration
├── LICENSE
└── README.md
```

## Prerequisites

Bun<br>
Docker<br>
Upstash<br>
Dub<br>
Trigger.dev<br>
Resend<br>
Supabase<br>
Sentry<br>
OpenPanel<br>

## Getting Started

Clone this repo locally with the following command:

```bash
bunx degit midday-ai/v1 v1
```

1. Install dependencies using bun:

```sh
bun i
```

2. Copy `.env.example` to `.env` and update the variables.

```sh
# Copy .env.example to .env for each app
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/web/.env.example apps/web/.env
```

4. Start the development server from either bun or turbo:

```ts
bun dev // starts everything in development mode (web, app, api, email)
bun dev:web // starts the web app in development mode
bun dev:app // starts the app in development mode
bun dev:api // starts the api in development mode
bun dev:email // starts the email app in development mode

// Database
bun migrate // run migrations
bun seed // run seed
```

## How to use
This boilerplate is inspired by our work on Midday, and it's designed to serve as a reference for real-world apps. Feel free to dive into the code and see how we've tackled various features. Whether you're looking to understand authentication flows, database interactions, or UI components, you'll find practical, battle-tested implementations throughout the codebase. It's not just a starting point; it's a learning resource that can help you build your own applications.

With this, you have a great starting point for your own project.

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzakstal%2Faloud&env=RESEND_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,SENTRY_AUTH_TOKEN,NEXT_PUBLIC_SENTRY_DSN,SENTRY_ORG,SENTRY_PROJECT,DUB_API_KEY,NEXT_PUBLIC_OPENPANEL_CLIENT_ID,OPENPANEL_SECRET_KEY&project-name=create-v1&repository-name=create-v1&redirect-url=https%3A%2F%2Fv1.run&demo-title=Create%20v1&demo-description=An%20open-source%20starter%20kit%20based%20on%20Midday.&demo-url=https%3A%2F%2Fv1.run&demo-image=https%3A%2F%2Fv1.run%2Fopengraph-image.png&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6)

## Recognition

<a href="https://news.ycombinator.com/item?id=41408929">
  <img
    style="width: 250px; height: 54px;" width="250" height="54"
    alt="Featured on Hacker News"
    src="https://hackernews-badge.vercel.app/api?id=41408929"
  />
</a>


## Services we are using/paying for
- supabase, not paying for yet
- namesor.app, free tire - get name genders
- trigger.dev dashboard (https://cloud.trigger.dev/projects/v3/proj_zehvrgpxuqenrdxgbkfq)[https://cloud.trigger.dev/projects/v3/proj_zehvrgpxuqenrdxgbkfq] 

## Service links
- trigger.dev - Jobs (https://cloud.trigger.dev/orgs/aloud-8cc8/projects/v3/aloud-0V-A)[https://cloud.trigger.dev/orgs/aloud-8cc8/projects/v3/aloud-0V-A]
- supabase - Database (https://supabase.com/dashboard/project/guefjgyrsxtgxuboyzen)[https://supabase.com/dashboard/project/guefjgyrsxtgxuboyzen]
- Vercel - Deployment (https://vercel.com/zakstals-projects/aloud-app/BJX8mse2bjvFw9hqhtd1fpsWP3Kr)[https://vercel.com/zakstals-projects/aloud-app/BJX8mse2bjvFw9hqhtd1fpsWP3Kr]
- ElevenLabs - voices (https://elevenlabs.io/app/speech-synthesis/text-to-speech)[https://elevenlabs.io/app/speech-synthesis/text-to-speech]
- Murf.ai - voices (https://murf.ai/studio?workspaceId=WORKSPACEID017256620230338QV&folderId=WFRoot)[https://murf.ai/studio?workspaceId=WORKSPACEID017256620230338QV&folderId=WFRoot]
- Google cloud - Oauth (https://console.cloud.google.com/apis/credentials?project=aloud-435319&inv=1&invt=AbeZrA)[https://console.cloud.google.com/apis/credentials?project=aloud-435319&inv=1&invt=AbeZrA]
- Digital ocean - pdf-to-text internal api (https://cloud.digitalocean.com/apps/c3521227-e88d-4d93-aac9-b7dad804ec7b?source_ref=projects&i=5e4c8d)[https://cloud.digitalocean.com/apps/c3521227-e88d-4d93-aac9-b7dad804ec7b?source_ref=projects&i=5e4c8d]
- aloud-api - repo for the pdf-to-text api ( https://github.com/zakstal/aloud-api)[https://github.com/zakstal/aloud-api]
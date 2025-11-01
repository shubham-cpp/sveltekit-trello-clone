<script lang='ts'>
  import { asset } from '$app/paths'
  import { BadgeCheck, Bolt, Gauge, LayoutGrid, RefreshCw, Search, ServerCog, ShieldCheck, Users } from '@lucide/svelte'
  import { onDestroy, onMount } from 'svelte'
  import { fade, fly, scale } from 'svelte/transition'

  // Load screenshots from the screen-shots directory as URLs at build time
  // const screenshotsImport = import.meta.glob('/screen-shots/*.png', { eager: true, as: 'url' }) as Record<string, string>

  const screenshotsList = [
    'Account management.png',
    'Dashboard page.png',
    'Deleted boards.png',
    'Filters.png',
    'Invitations.png',
    'Invite people to dashboard.png',
    'Kanban board.png',
    'Login page.png',
    'Sign up.png',
    'Switch organisation.png',
  ]

  function filenameToTitle(path: string) {
    const file = path.split('/').pop() || ''
    const name = file.replace(/\.png$/i, '').replace(/[-_]/g, ' ')
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  const screenshots = screenshotsList
    .map(s => ({ url: asset(`/screen-shots/${s}`), title: filenameToTitle(s) }))
    // Stable order for a nice gallery
    .sort((a, b) => a.title.localeCompare(b.title))

  let current = 0
  let timer: number | undefined
  let paused = false

  function next() {
    current = (current + 1) % screenshots.length
  }
  function prev() {
    current = (current - 1 + screenshots.length) % screenshots.length
  }

  function startAuto() {
    stopAuto()
    timer = window.setInterval(() => {
      if (!paused && screenshots.length > 1)
        next()
    }, 4000)
  }
  function stopAuto() {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  onMount(() => {
    startAuto()
  })
  onDestroy(() => {
    stopAuto()
  })
</script>

<svelte:head>
  <title>Trello Clone — Plan, Track and Deliver with Ease</title>
  <meta name='description' content='Modern, fast, and collaborative project management with Kanban boards, powerful filters, organizations, and Redis-powered performance.' />
</svelte:head>

<!-- Hero -->
<section class='relative overflow-hidden'>
  <div class='
    absolute inset-0 -z-10 bg-gradient-to-b from-sky-600/20 via-transparent
    to-transparent
  '></div>
  <div class='
    container mx-auto px-4 py-16
    sm:py-24
  '>
    <div class='mx-auto max-w-3xl text-center'>
      <h1 class='
        text-4xl font-extrabold tracking-tight
        sm:text-6xl
      ' in:fade={{ duration: 400 }}>
        Organize work. Align teams. Ship faster.
      </h1>
      <p class='mt-6 text-lg text-foreground/80' in:fade={{ delay: 100, duration: 400 }}>
        A modern Trello-like experience built with SvelteKit, tuned for speed and collaboration.
        Real-time feel, beautiful UI, and a workflow that just flows.
      </p>

      <div class='mt-8 flex items-center justify-center gap-3' in:fade={{ delay: 150, duration: 400 }}>
        <a href='/(auth)/sign-up' class='
          inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3
          font-semibold text-primary-foreground shadow transition
          hover:opacity-90
        '>
          <Bolt class='h-5 w-5' /> Get Started
        </a>
        <a href='/(auth)/login' class='
          inline-flex items-center gap-2 rounded-lg border px-5 py-3
          font-semibold transition
          hover:bg-foreground/5
        '>
          Live Demo
        </a>
      </div>

      <div class='
        mt-10 flex items-center justify-center gap-3 text-xs text-foreground/60
      ' in:fade={{ delay: 200 }}>
        <BadgeCheck class='h-4 w-4' /> No credit card required
        <span aria-hidden='true'>•</span>
        <Gauge class='h-4 w-4' /> Redis-backed caching
        <span aria-hidden='true'>•</span>
        <ShieldCheck class='h-4 w-4' /> Secure by design
      </div>
    </div>

    <!-- Floating preview card -->
    {#if screenshots.length}
      <div class='
        mx-auto mt-14 max-w-5xl rounded-xl border bg-background/60 p-2 shadow-xl
        backdrop-blur
        supports-[backdrop-filter]:bg-background/40
      '
           in:fly={{ y: 24, duration: 450 }}>
        <div class='relative aspect-[16/9] overflow-hidden rounded-lg'>
          {#each screenshots as shot, i (shot.url)}
            {#if i === current}
              <img
                src={shot.url}
                alt={shot.title}
                class='absolute inset-0 h-full w-full object-cover'
                in:fade={{ duration: 250 }}
                out:fade={{ duration: 200 }}
                onmouseenter={() => (paused = true)}
                onmouseleave={() => (paused = false)}
              />
            {/if}
          {/each}

          <!-- Carousel Controls -->
          {#if screenshots.length > 1}
            <button class='
              absolute top-1/2 left-3 -translate-y-1/2 rounded-full
              bg-background/70 p-2 backdrop-blur transition
              hover:bg-background/90
            '
                    aria-label='Previous'
                    onclick={prev}
                    in:fade={{ duration: 200 }}>
              &#8592;
            </button>
            <button class='
              absolute top-1/2 right-3 -translate-y-1/2 rounded-full
              bg-background/70 p-2 backdrop-blur transition
              hover:bg-background/90
            '
                    aria-label='Next'
                    onclick={next}
                    in:fade={{ duration: 200 }}>
              &#8594;
            </button>

            <!-- Dots -->
            <div class='absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2'>
              {#each screenshots as _, i}
                <button
                  class={[
                    'h-2 w-2 rounded-full transition',
                    i === current && `bg-primary`,
                    i !== current && `bg-foreground/30`,
                  ]}

                  onclick={() => (current = i)}
                  aria-label={`Go to slide ${i + 1}`}
                ></button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</section>

<!-- Feature Highlights -->
<section class='
  container mx-auto px-4 py-16
  sm:py-24
'>
  <div class='mx-auto max-w-2xl text-center'>
    <h2 class='
      text-3xl font-bold
      sm:text-4xl
    ' in:fade={{ duration: 300 }}>Everything you need to move work forward</h2>
    <p class='mt-3 text-foreground/70' in:fade={{ delay: 80, duration: 300 }}>
      Opinionated defaults with the flexibility teams need. Designed for clarity and speed.
    </p>
  </div>

  <div class='
    mt-10 grid gap-4
    sm:grid-cols-2
    lg:grid-cols-3
  '>
    <div class='
      rounded-lg border p-5 transition
      hover:shadow-sm
    ' in:fly={{ y: 16, duration: 300 }}>
      <LayoutGrid class='h-6 w-6 text-primary' />
      <h3 class='mt-3 font-semibold'>Kanban Boards</h3>
      <p class='mt-1 text-sm text-foreground/70'>Columns, tasks, drag-and-drop, sorting, and everything you expect.</p>
    </div>

    <div class='
      rounded-lg border p-5 transition
      hover:shadow-sm
    ' in:fly={{ y: 16, duration: 300, delay: 50 }}>
      <Users class='h-6 w-6 text-primary' />
      <h3 class='mt-3 font-semibold'>Organizations</h3>
      <p class='mt-1 text-sm text-foreground/70'>Invite your team, manage roles, and collaborate across workspaces.</p>
    </div>

    <div class='
      rounded-lg border p-5 transition
      hover:shadow-sm
    ' in:fly={{ y: 16, duration: 300, delay: 100 }}>
      <Search class='h-6 w-6 text-primary' />
      <h3 class='mt-3 font-semibold'>Advanced Filters</h3>
      <p class='mt-1 text-sm text-foreground/70'>Powerful search and filtering by dates, owners, priority, and more.</p>
    </div>

    <div class='
      rounded-lg border p-5 transition
      hover:shadow-sm
    ' in:fly={{ y: 16, duration: 300, delay: 150 }}>
      <ServerCog class='h-6 w-6 text-primary' />
      <h3 class='mt-3 font-semibold'>Drizzle ORM + SQLite</h3>
      <p class='mt-1 text-sm text-foreground/70'>Typed schema, fast queries, and simple local development.</p>
    </div>

    <div class='
      rounded-lg border p-5 transition
      hover:shadow-sm
    ' in:fly={{ y: 16, duration: 300, delay: 200 }}>
      <RefreshCw class='h-6 w-6 text-primary' />
      <h3 class='mt-3 font-semibold'>Redis Caching</h3>
      <p class='mt-1 text-sm text-foreground/70'>Upstash Redis for low-latency reads with automatic invalidation.</p>
    </div>

    <div class='
      rounded-lg border p-5 transition
      hover:shadow-sm
    ' in:fly={{ y: 16, duration: 300, delay: 250 }}>
      <ShieldCheck class='h-6 w-6 text-primary' />
      <h3 class='mt-3 font-semibold'>Auth Built-in</h3>
      <p class='mt-1 text-sm text-foreground/70'>Email/password and Google OAuth via Better Auth. Secure by default.</p>
    </div>
  </div>
</section>

<!-- Gallery Grid -->
{#if screenshots.length}
  <section class='
    container mx-auto px-4 pb-16
    sm:pb-24
  '>
    <div class='mx-auto max-w-2xl text-center'>
      <h2 class='
        text-3xl font-bold
        sm:text-4xl
      ' in:fade={{ duration: 300 }}>A quick look inside</h2>
      <p class='mt-3 text-foreground/70' in:fade={{ delay: 80, duration: 300 }}>
        Clean layout, sensible defaults, and delightful interactions.
      </p>
    </div>

    <div class='
      mt-10 grid grid-cols-1 gap-4
      sm:grid-cols-2
      lg:grid-cols-3
    '>
      {#each screenshots as shot, i (shot.url)}
        <figure class='group overflow-hidden rounded-lg border bg-background'
                in:scale={{ duration: 250, start: 0.96 }}>
          <img src={shot.url} alt={shot.title} class='
            h-56 w-full object-cover transition
            group-hover:scale-[1.03]
          ' />
          <figcaption class='
            flex items-center justify-between px-3 py-2 text-sm
          '>
            <span class='font-medium'>{shot.title}</span>
            <span class='text-foreground/60'>#{i + 1}</span>
          </figcaption>
        </figure>
      {/each}
    </div>
  </section>
{/if}

<!-- CTA Footer -->
<section class='relative overflow-hidden border-t'>
  <div class='container mx-auto px-4 py-14'>
    <div class='mx-auto max-w-3xl text-center' in:fade={{ duration: 250 }}>
      <h3 class='
        text-2xl font-bold
        sm:text-3xl
      '>Ready to bring clarity to your workflow?</h3>
      <p class='mt-3 text-foreground/70'>
        Create your first board in seconds and invite your team when you're ready.
      </p>
      <div class='mt-7 flex items-center justify-center gap-3'>
        <a href='/(auth)/sign-up' class='
          inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3
          font-semibold text-primary-foreground shadow transition
          hover:opacity-90
        '>
          <Bolt class='h-5 w-5' /> Start for Free
        </a>
        <a href='/(auth)/login' class='
          inline-flex items-center gap-2 rounded-lg border px-5 py-3
          font-semibold transition
          hover:bg-foreground/5
        '>
          I already have an account
        </a>
      </div>
    </div>
  </div>
</section>

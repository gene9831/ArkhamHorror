import type { ComputedRef } from 'vue'
import { computed, ref, readonly } from 'vue'

interface BgmTrack {
  url: string
  title: string
}

interface BgmPlaylist {
  playlist: BgmTrack[]
}

export interface AudioPlayer {
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  previous: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  currentTrack: ComputedRef<{ url: string; title: string } | null>
  isPlaying: boolean
  isMuted: boolean
  volume: number
  playlist: BgmTrack[]
}

export function useAudioPlayer(): AudioPlayer {
  const audio = ref<HTMLAudioElement | null>(null)
  const playlist = ref<BgmTrack[]>([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const isMuted = ref(false)
  const volume = ref(0.4)
  const isLoaded = ref(false)

  const currentTrack = computed(() =>
    currentIndex.value >= 0 ? playlist.value[currentIndex.value] ?? null : null,
  )

  async function loadPlaylist() {
    if (isLoaded.value) return
    try {
      const res = await fetch('/bgm-playlist.json')
      const data: BgmPlaylist = await res.json()
      playlist.value = data.playlist
      isLoaded.value = true
    } catch (e) {
      console.warn('[AudioPlayer] Failed to load bgm-playlist.json', e)
    }
  }

  function createAudio(): HTMLAudioElement {
    const a = new Audio()
    a.volume = volume.value
    a.crossOrigin = 'anonymous'
    a.addEventListener('ended', () => {
      next()
    })
    a.addEventListener('error', () => {
      console.warn('[AudioPlayer] Track load error, skipping to next')
      next()
    })
    return a
  }

  function ensureAudio(): HTMLAudioElement {
    if (!audio.value) {
      audio.value = createAudio()
    }
    return audio.value
  }

  function crossfadeTo(url: string) {
    const a = ensureAudio()
    if (a.src === url) return

    const oldVolume = a.volume
    a.volume = 0
    a.src = url
    a.play().catch(() => {})
    // quick fade in
    const step = oldVolume / 10
    const iv = setInterval(() => {
      if (a.volume + step >= volume.value) {
        a.volume = volume.value
        clearInterval(iv)
      } else {
        a.volume += step
      }
    }, 50)
  }

  function playTrack(index: number) {
    if (playlist.value.length === 0) return
    currentIndex.value = Math.max(0, Math.min(index, playlist.value.length - 1))
    crossfadeTo(playlist.value[currentIndex.value].url)
    isPlaying.value = true
  }

  function play() {
    if (currentIndex.value < 0) {
      if (playlist.value.length === 0) {
        loadPlaylist().then(() => playTrack(0))
        return
      }
      playTrack(0)
      return
    }
    ensureAudio().play().catch(() => {})
    isPlaying.value = true
  }

  function pause() {
    audio.value?.pause()
    isPlaying.value = false
  }

  function toggle() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function next() {
    if (playlist.value.length === 0) return
    const nextIndex = (currentIndex.value + 1) % playlist.value.length
    playTrack(nextIndex)
  }

  function previous() {
    if (playlist.value.length === 0) return
    const prevIndex = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    playTrack(prevIndex)
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    if (audio.value) {
      audio.value.volume = isMuted.value ? 0 : volume.value
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audio.value) {
      audio.value.volume = isMuted.value ? 0 : volume.value
    }
  }

  return {
    play,
    pause,
    toggle,
    next,
    previous,
    setVolume,
    toggleMute,
    currentTrack,
    isPlaying: isPlaying.value,
    isMuted: isMuted.value,
    volume: volume.value,
    playlist: playlist.value,
  }
}

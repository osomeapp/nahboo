'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  Settings,
  Loader
} from 'lucide-react'
import { useVideoTracking } from '@/hooks/useAnalyticsTracking'

interface VideoPlayerProps {
  videoUrl: string
  videoId: string
  duration?: number
  title?: string
  autoplay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onProgress?: (currentTime: number, duration: number) => void
  onComplete?: () => void
}

export default function VideoPlayer({
  videoUrl,
  videoId,
  duration,
  title,
  autoplay = false,
  onPlay,
  onPause,
  onProgress,
  onComplete
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Analytics tracking
  const { trackPlay, trackPause, trackSeek, trackComplete } = useVideoTracking(videoId)

  // Extract video source based on URL type
  const getVideoSource = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Convert YouTube URL to embed URL
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      
      return {
        type: 'youtube' as const,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`,
        videoId
      }
    } else if (url.includes('vimeo.com')) {
      // Handle Vimeo URLs
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return {
        type: 'vimeo' as const,
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}`,
        videoId
      }
    } else {
      // Direct video file
      return {
        type: 'direct' as const,
        embedUrl: url,
        videoId: null
      }
    }
  }

  const videoSource = getVideoSource(videoUrl)

  // Handle video events
  useEffect(() => {
    const video = videoRef.current
    if (!video || videoSource.type !== 'direct') return

    const handleLoadedData = () => {
      setIsLoading(false)
      setVideoDuration(video.duration)
      if (autoplay) {
        video.play().catch(() => {
          // Autoplay failed, user interaction required
          setIsPlaying(false)
        })
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime, video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      trackPlay(video.currentTime, video.duration)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      trackPause(video.currentTime, video.duration)
      onPause?.()
    }

    const handleEnded = () => {
      setIsPlaying(false)
      trackComplete(video.currentTime, video.duration)
      onComplete?.()
    }

    const handleError = () => {
      setError('Failed to load video')
      setIsLoading(false)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [autoplay, onPlay, onPause, onProgress, onComplete, videoSource.type])

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(() => {
        setError('Unable to play video')
      })
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    setVolume(newVolume)
    video.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const handleSeek = (seekTime: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = seekTime
    setCurrentTime(seekTime)
    trackSeek(seekTime, video.duration)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const restart = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-gray-600 mb-2">Failed to load video</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  // YouTube/Vimeo embedded player
  if (videoSource.type === 'youtube' || videoSource.type === 'vimeo') {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <iframe
          src={videoSource.embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video content'}
        />
      </div>
    )
  }

  // Direct video player
  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden aspect-video group"
      onMouseMove={showControlsTemporarily}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSource.embedUrl}
        preload="metadata"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={togglePlay}
          className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-40 transition-all"
        >
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </div>
        </motion.button>
      )}

      {/* Controls Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: showControls ? 1 : 0,
          y: showControls ? 0 : 20
        }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4"
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="relative h-1 bg-white bg-opacity-20 rounded-full cursor-pointer group/progress">
            <input
              type="range"
              min="0"
              max={videoDuration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div 
              className="h-full bg-blue-500 rounded-full transition-all group-hover/progress:bg-blue-400"
              style={{ width: `${(currentTime / videoDuration) * 100}%` }}
            />
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-all"
              style={{ left: `${(currentTime / videoDuration) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={restart}
              className="p-2 text-white hover:text-blue-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1 text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 h-1 bg-white bg-opacity-20 rounded-full appearance-none slider"
              />
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-white hover:text-blue-400 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-blue-400 transition-colors"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
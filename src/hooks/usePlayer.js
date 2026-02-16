/**
 * usePlayer Hook
 * Manages video playback, progress tracking, and resume functionality
 * Uses Video.js for better compatibility
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { storageService } from '../services/storageService';
import { xtreamApi } from '../services/xtreamApi';

export const usePlayer = (streamId, movieData) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const playbackHealthIntervalRef = useRef(null);
  const hasTriedM3u8FallbackRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasResumed, setHasResumed] = useState(false);
  const containerExtension = (movieData?.containerExtension || 'mp4').toLowerCase();
  const contentType = movieData?.contentType || 'movie';
  const episodeId = movieData?.episodeId || null;
  const progressId = streamId;

  const getSourceType = useCallback((extension) => {
    if (extension === 'm3u8') return 'application/x-mpegURL';
    if (extension === 'ts') return 'video/mp2t';
    if (extension === 'mp4') return 'video/mp4';
    if (extension === 'webm') return 'video/webm';
    if (extension === 'ogg' || extension === 'ogv') return 'video/ogg';
    return null;
  }, []);

  const tryM3u8Fallback = useCallback((reason = '') => {
    if (!playerRef.current || !streamId) return false;
    if (containerExtension === 'm3u8' || hasTriedM3u8FallbackRef.current) return false;

    try {
      const fallbackUrl = xtreamApi.getPlaybackUrl(streamId, 'm3u8', contentType, episodeId);
      hasTriedM3u8FallbackRef.current = true;
      setError(null);
      setIsLoading(true);
      console.warn('Switching to m3u8 fallback:', reason, fallbackUrl);

      playerRef.current.src({
        src: fallbackUrl,
        type: 'application/x-mpegURL',
      });
      playerRef.current.load();
      return true;
    } catch (fallbackError) {
      console.error('m3u8 fallback failed:', fallbackError);
      return false;
    }
  }, [streamId, containerExtension, contentType, episodeId]);

  const stopPlaybackHealthCheck = useCallback(() => {
    if (playbackHealthIntervalRef.current) {
      clearInterval(playbackHealthIntervalRef.current);
      playbackHealthIntervalRef.current = null;
    }
  }, []);

  const startPlaybackHealthCheck = useCallback(() => {
    if (!playerRef.current) return;

    stopPlaybackHealthCheck();

    const startedAt = Date.now();
    playbackHealthIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const current = player.currentTime();
      const videoWidth = player.videoWidth();
      const videoHeight = player.videoHeight();
      const videoEl = videoRef.current;
      const decodedFrames = videoEl?.webkitDecodedFrameCount;
      const totalFrames = videoEl?.getVideoPlaybackQuality?.().totalVideoFrames;

      // If playback continues with no decoded video frames, switch to m3u8 as a codec-compatible fallback.
      if (
        containerExtension !== 'm3u8' &&
        current > 3 &&
        !player.paused() &&
        !hasTriedM3u8FallbackRef.current &&
        (
          videoWidth === 0 ||
          videoHeight === 0 ||
          (typeof decodedFrames === 'number' && decodedFrames === 0) ||
          (typeof totalFrames === 'number' && totalFrames === 0)
        )
      ) {
        const fallbackUsed = tryM3u8Fallback('audio-only playback detected');
        if (!fallbackUsed) {
          setError('Goruntu alinmiyor. Yayinin video codec formatini tarayici desteklemiyor olabilir.');
          setIsLoading(false);
          stopPlaybackHealthCheck();
          return;
        }
        if (fallbackUsed) {
          stopPlaybackHealthCheck();
        }
        return;
      }

      // Stop checking after initial startup window.
      if (Date.now() - startedAt > 15000 || current > 15) {
        stopPlaybackHealthCheck();
      }
    }, 1000);
  }, [containerExtension, stopPlaybackHealthCheck, tryM3u8Fallback]);

  /**
   * Initialize Video.js player
   */
  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !streamId) return;

    try {
      hasTriedM3u8FallbackRef.current = false;
      hasStartedPlaybackRef.current = false;

      const streamUrl = xtreamApi.getPlaybackUrl(streamId, containerExtension, contentType, episodeId);
      const sourceType = getSourceType(containerExtension);

      console.log('Stream URL:', streamUrl);

      const videoJsOptions = {
        autoplay: false,
        controls: false,
        responsive: true,
        fluid: true,
        preload: 'auto',
        sources: [
          {
            src: streamUrl,
            ...(sourceType ? { type: sourceType } : {}),
          },
        ],
        html5: {
          vhs: {
            overrideNative: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
      };

      const player = videojs(videoRef.current, videoJsOptions, function onPlayerReady() {
        console.log('Video.js player ready');
        setPlaybackRate(this.playbackRate() || 1);
        setIsLoading(false);

        setTimeout(() => {
          attemptResume();
        }, 500);
      });

      player.on('error', () => {
        const playerError = player.error();
        console.error('Video.js error:', playerError);

        const fallbackUsed = tryM3u8Fallback(`error code ${playerError?.code || 'unknown'}`);
        if (!fallbackUsed) {
          setError(playerError?.message || 'Video oynatma hatasi');
          setIsLoading(false);
        }
      });

      player.on('waiting', () => {
        if (!hasStartedPlaybackRef.current) {
          setIsLoading(true);
        }
      });

      player.on('canplay', () => {
        setIsLoading(false);
      });

      player.on('loadeddata', () => {
        setIsLoading(false);
      });

      player.on('playing', () => {
        hasStartedPlaybackRef.current = true;
        setIsLoading(false);
      });

      player.on('loadedmetadata', () => {
        const videoWidth = player.videoWidth();
        const videoHeight = player.videoHeight();

        console.log('Video metadata:', {
          videoWidth,
          videoHeight,
          duration: player.duration(),
        });

        if ((videoWidth === 0 || videoHeight === 0) && containerExtension !== 'm3u8') {
          const fallbackUsed = tryM3u8Fallback('no video track detected in metadata');
          if (!fallbackUsed) {
            setError('Bu yayinda ses geliyor ama video codec tarayicida desteklenmiyor olabilir.');
          }
        }
      });

      player.on('play', () => {
        setIsPlaying(true);
        startProgressTracking();
        startPlaybackHealthCheck();
      });

      player.on('pause', () => {
        setIsPlaying(false);
        saveProgress();
        stopPlaybackHealthCheck();
      });

      player.on('timeupdate', () => {
        setCurrentTime(player.currentTime());
        setDuration(player.duration());
        if (player.currentTime() > 0.2) {
          hasStartedPlaybackRef.current = true;
          setIsLoading(false);
        }
      });

      player.on('ended', () => {
        setIsPlaying(false);
        stopProgressTracking();
        stopPlaybackHealthCheck();
        saveProgress();
      });

      player.on('volumechange', () => {
        setVolume(player.volume());
        setIsMuted(player.muted());
      });

      player.on('ratechange', () => {
        setPlaybackRate(player.playbackRate());
      });

      playerRef.current = player;
    } catch (initError) {
      console.error('Error initializing player:', initError);
      setError('Player baslatma hatasi');
      setIsLoading(false);
    }
  }, [streamId, containerExtension, contentType, episodeId, getSourceType, tryM3u8Fallback]);

  /**
   * Attempt to resume playback from saved position
   */
  const attemptResume = useCallback(() => {
    if (!playerRef.current || hasResumed) return;

    if (contentType !== 'movie' && contentType !== 'series') return;
    const savedProgress = storageService.getProgress(progressId, contentType);

    if (savedProgress && savedProgress.currentTime > 5) {
      playerRef.current.currentTime(savedProgress.currentTime);
      setHasResumed(true);
      console.log('Resumed from:', savedProgress.currentTime);
    }
  }, [progressId, hasResumed, contentType]);

  /**
   * Save progress to localStorage
   */
  const saveProgress = useCallback(() => {
    if (!playerRef.current || !streamId || contentType === 'live') return;

    const current = playerRef.current.currentTime();
    const total = playerRef.current.duration();

    if (current > 0 && total > 0 && !isNaN(current) && !isNaN(total)) {
      storageService.saveProgress(progressId, current, total, {
        title: movieData?.title || '',
        poster: movieData?.poster || '',
        containerExtension: containerExtension,
        contentType,
        episodeId,
      });
    }
  }, [progressId, streamId, movieData?.title, movieData?.poster, containerExtension, contentType, episodeId]);

  /**
   * Start saving progress at regular intervals
   */
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 5000);
  }, [saveProgress]);

  /**
   * Stop progress tracking
   */
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  /**
   * Play/Pause toggle
   */
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;

    if (playerRef.current.paused()) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, []);

  /**
   * Seek to specific time
   */
  const seekTo = useCallback((time) => {
    if (!playerRef.current) return;
    playerRef.current.currentTime(time);
  }, []);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    if (!playerRef.current.isFullscreen()) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      playerRef.current.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  /**
   * Change volume
   */
  const changeVolume = useCallback((value) => {
    if (!playerRef.current) return;

    const vol = Math.max(0, Math.min(1, value));
    playerRef.current.volume(vol);
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;

    const newMutedState = !playerRef.current.muted();
    playerRef.current.muted(newMutedState);
    setIsMuted(newMutedState);
  }, []);

  /**
   * Change playback speed
   */
  const changePlaybackRate = useCallback((value) => {
    if (!playerRef.current) return;

    const rate = Number(value);
    if (isNaN(rate) || rate <= 0) return;

    playerRef.current.playbackRate(rate);
    setPlaybackRate(rate);
  }, []);

  /**
   * Skip forward/backward
   */
  const skip = useCallback((seconds) => {
    if (!playerRef.current) return;
    const newTime = playerRef.current.currentTime() + seconds;
    playerRef.current.currentTime(newTime);
  }, []);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      stopProgressTracking();
      stopPlaybackHealthCheck();
    };
  }, [initializePlayer, stopProgressTracking, stopPlaybackHealthCheck]);

  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    isFullscreen,
    volume,
    isMuted,
    playbackRate,
    isLoading,
    error,
    togglePlay,
    seekTo,
    toggleFullscreen,
    changeVolume,
    toggleMute,
    changePlaybackRate,
    skip,
  };
};

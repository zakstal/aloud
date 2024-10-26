import React from 'react'
import raf from 'raf'
import Image from "next/image";
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import './AudioPlayer.css';
import { getWindow } from '@/getWindow'
import { ChevronLeft } from 'lucide-react';

let window = getWindow()
const BUTTON_SIZE = 12

let audioContext = null

async function appendBlob(arrayBuffer, sourceBuffer, mediaSource) {
    if (!audioContext) {
        audioContext = window && new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (!mediaSource.sourceBuffers.length) return

    if (sourceBuffer && !sourceBuffer?.updating) {
        // TODO this QuotaExceededError is not being handled.
        // a new source buffer may need to be added and then appended to ( mediaSource.addSourceBuffer('audio/mpeg')).
        // this will require further testing
        try {
            sourceBuffer.appendBuffer(arrayBuffer); // Append the new audio data
        }
        catch(e) {
            console.log('e', e.name, e)
            if (e.name !== 'QuotaExceededError') {
                throw e;
            }
        }
    }
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return Number(audioBuffer.duration)
}               

// TODO audio that is partially gotten still needs to load correclty in sequence.
// TODO only load the first batch until this starts playing, then load the rest
async function assembleSource(audioUrls, mediaSrcIn, setSrc) {
    if (!('MediaSource' in window && MediaSource.isTypeSupported('audio/mpeg'))) {
        console.log('MediaSource API is not supported in this browser.');
        return
    }

    let mediaSource = mediaSrcIn
    if (!mediaSource) {
        mediaSource = new MediaSource();
        setSrc(URL.createObjectURL(mediaSource), mediaSource)
    }

    if (mediaSource.readyState !== 'open') {
        await new Promise((resolve) => mediaSource.addEventListener('sourceopen', resolve))
    }

    // audioPlayer.play();
    
    let sourceBuffer = mediaSource?.sourceBuffers[0]
    // TODO this QuotaExceededError is not being handled
    // not sure the best route when adding a source buffer.
    // you can remove source buffers from mediaSource?.sourceBuffers[0]
    try {

        sourceBuffer = sourceBuffer ? sourceBuffer : mediaSource.addSourceBuffer('audio/mpeg');
    } catch(e) {
        console.log('e add source buffer', e.name, e)
        if (e.name !== 'QuotaExceededError') {
            throw e;
        }
    }
    const audioUrlLength = audioUrls.length
    const resultBuffers = new Array(audioUrlLength)
    let resolved = 0 
    await new Promise((resolve, reject) => {                
        for (const urlIdx in audioUrls) {
            const url = audioUrls[urlIdx]
            if (!url) continue

            if (mediaSource.readyState !== 'open') {
                continue
            }

            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    resultBuffers[urlIdx] = arrayBuffer
                    resolved++
                    if (resolved === audioUrlLength) {
                        resolve()
                    }
                })

        }
    })
    
    let appendedDuration = 0
    let durationByUrl = {}
    for (const idx in resultBuffers) {
        const buffer = resultBuffers[idx]
        const duration = await appendBlob(buffer, sourceBuffer, mediaSource);
        durationByUrl[audioUrls[idx]] = duration
        appendedDuration += duration
    }

    return [appendedDuration, durationByUrl]
} 

class AudioPlayer extends React.Component {
    player = null;
    mediaSrc = null;
    getSignedUrlNextNInProgress = false
    urlsAssembled = new Set()
    urlToDurationStartnd = {}

    constructor(props) {
        super(props)

        // we can pass in several urls representing audio files called audioVersions
        // so we can play them in sequence as if it were a single file. 
        const currentAudioVersion = this.props.currentlyPlayingLineId 
            ? this.props.audioVersions && this.props.audioVersions.find(version => version.line_id === this.props.currentlyPlayingLineId)
            : this.props.audioVersions && this.props.audioVersions[0]

        !this.props.currentlyPlayingLineId && this.setCurrentlyPlayingLineId(currentAudioVersion.line_id)

        // sum up all the durations for the audioversions
        const syntheticDuration = this.props.audioVersions && this.props.audioVersions.reduce((final, version) => {
            return final + version.duration_in_seconds
        }, 0)

        const disabled = this.checkDisabled(currentAudioVersion)

        console.log("AudioVersions", this.props.audioVersions)

        this.state = {
            playing: false,
            loaded: false,
            loop: false,
            mute: false,
            volume: 1.0,
            seek: 0.0,
            audioVersionDuration: 0,
            rate: 1,
            isSeeking: false,
            hours: 0,
            minutes: 0,
            seconds: 0,
            audioVersions: this.props.audioVersions,
            audioVersionsIdx: 0, // the audio calls handleEnd when it first starts playing, so we want to ignore it
            audioVersionsLength: this.props?.audioVersions?.length,
            currentAudioVersion,
            syntheticDuration,
            loadedDuration: 0,
            disabled: disabled,
            signedUrlById: {},
            isLoading: false,
            retryOnNoSrc: 0,
            seekedTo: null,
            objSrc: null,
            isAudioVersions: true,
        }



        this.handleToggle = this.handleToggle.bind(this)
        this.handleOnLoad = this.handleOnLoad.bind(this)
        this.handleOnEnd = this.handleOnEnd.bind(this)
        this.handleOnPlay = this.handleOnPlay.bind(this)
        this.handleStop = this.handleStop.bind(this)
        this.renderSeekPos = this.renderSeekPos.bind(this)
        this.handleLoopToggle = this.handleLoopToggle.bind(this)
        this.handleMuteToggle = this.handleMuteToggle.bind(this)
        this.handleMouseDownSeek = this.handleMouseDownSeek.bind(this)
        this.handleMouseUpSeek = this.handleMouseUpSeek.bind(this)
        this.handleSeekingChange = this.handleSeekingChange.bind(this)
        this.handleRate = this.handleRate.bind(this)

        // load some limited amount of audio
        this.getSignedUrlNextN(3, false, 3)
    }

    checkDisabled(currentAudioVersion) {
        let disabled = false
        if (this.props.disabled === undefined) {
            disabled = !currentAudioVersion
        }
       
        if (currentAudioVersion === undefined) {
            disabled = !this.props.src
        } else if (currentAudioVersion && !currentAudioVersion.audio_file_url) {
            disabled = true
        }

        return disabled
    }

    async getSignedUrl(url, isPlaying) {
        const res = await this.props.getSignedUrl(url)
        console.log('res', url, res)

        const singedUrl = res?.data
        if (!singedUrl && isPlaying !== null) {
            // do some sort of error
            this.setNotIsLoading(false)
            return 
        }
        this.state.signedUrlById[url] = singedUrl

        if (isPlaying !== null) {
            this.setNotIsLoading(isPlaying)
        }
    }
 
    async getSignedUrlNextN(chunkSize, isPlaying, maxLoadingAmt) {
        console.log('getSignedUrlNextN', this.state.audioVersionsIdx)
        if (this.getSignedUrlNextNInProgress) return
        this.getSignedUrlNextNInProgress = true

        // get urls that exist and have not been processed 
        const audioVersionsFilered = this.state.audioVersions
            .map(audioVersion => audioVersion.audio_file_url)
            .filter(url => !this.urlsAssembled.has(url))
            .filter(Boolean)

        const audioVersions = !maxLoadingAmt ? audioVersionsFilered : audioVersionsFilered.slice(0, maxLoadingAmt)

        // TODO this is probably not good to set as it will never be triggered
        if (!audioVersions.length) {
            this.setState({
                isAudioVersions: false
            })

            return
        }

        // batch get signed urls and append to mediaSrc in chunks
        for (let i = 0; i < audioVersions.length; i += chunkSize ) {

            const urls = audioVersions.slice(i, i + chunkSize)
            urls.forEach((url, idx) => this.urlsAssembled.add(url))
            const res = await this.props.getSignedUrl(urls)

            const singedUrls = res?.data?.map(obj => obj.signedUrl)

            // if no signed urls on the first batch stop loading
            if (i === 0 && (!singedUrls || !singedUrls.length) && isPlaying !== null) {
                // do some sort of error
                this.setNotIsLoading(false)
                urls.forEach((url, idx) => this.urlsAssembled.delete(url))
                this.getSignedUrlNextNInProgress = false
                return 
            }

            
            const [duration, durationByUrl] = await assembleSource(singedUrls, this.mediaSrc, (src, mediaSrc) => {
                this.mediaSrc = mediaSrc
                this.setState({
                    objSrc: src
                })
            })

            let durationCount = this.state.loadedDuration || 0
            urls.forEach((url, idx) => {

                const signedUrl = singedUrls[idx]
                const duration = durationByUrl[signedUrl]
                const durationStart = durationCount

                durationCount += duration
                const endDuration = durationCount

                if (!this.urlToDurationStartnd[url]) {
                    this.urlToDurationStartnd[url] = { startTime: durationStart, endTime: endDuration }
                }
            });

            this.setState({
                syntheticDuration: this.state.syntheticDuration < this.state.loadedDuration ? this.state.loadedDuration + duration : this.state.syntheticDuration,
                loadedDuration: this.state.loadedDuration + duration
            })

            // If isPlaying is true we want to start playing asap
            // once the objSrc has data
            if (isPlaying !== null) {
                this.setNotIsLoading(isPlaying)
            }

            this.getSignedUrlNextNInProgress = false
        }


    }


    componentDidUpdate(prevProps) {
        // currentlyPlayingLineId can be set by other components
        // but is also set internally which triggers componentDidUpdate.
        // there could be a more efficeint way of doing this.
        const currentAudioVersion = this.props.currentlyPlayingLineId 
            ? this.props.audioVersions && this.props.audioVersions.find(version => version.line_id === this.props.currentlyPlayingLineId)
            : this.props.audioVersions && this.props.audioVersions[0]

        !this.props.currentlyPlayingLineId && this.setCurrentlyPlayingLineId(currentAudioVersion.line_id)


        let didUpdate = false

        // set the current seek time if a playing line has been set somewhere else
        if (this.state.currentAudioVersion.line_id !== this.props.currentlyPlayingLineId) {
            const { startTime = 0 } = this.getDurationByUrl(currentAudioVersion.audio_file_url) || {}
            this.handleSeekingChange(startTime)
        }

        const disabled = this.checkDisabled(currentAudioVersion)
        const nextState = {}
        

        if (!this.state.currentAudioVersion || currentAudioVersion.id !== this.state.currentAudioVersion.id) {
            didUpdate = true
            nextState.currentAudioVersion = currentAudioVersion
        }
        
        if (this.state.disabled !== disabled) {
            didUpdate = true
        }

        nextState.disabled = disabled

        if (didUpdate) {
            nextState.isAudioVersions = true
            this.setState(nextState)
        }
    }

    componentWillUnmount() {
        this.clearRAF()
    }

    handleToggle() {
        console.log('handleToggle----------')
        if (!this.state.playing) {
            this.props.setIsPlaying && this.props.setIsPlaying(true)
            this.player.play()
        } else {
            this.props.setIsPlaying && this.props.setIsPlaying(false)
            this.player.pause()
        }
        this.setState({
            playing: !this.state.playing
        })

    }

    handleOnLoad() {
        if (this.state.seekedTo) {
            this.player.currentTime = this.state.seekedTo
        }

        console.log('handleOnLoad---------------')
        if (this.state.playing) {
            this.player.play()
        } else {
            this.player.pause()
        }
        this.setState({
            loaded: true,
            seekedTo: null,
            duration: this.state.syntheticDuration || this?.player?.duration
        })
    }

    handleOnPlay() {
        console.log('handle on play------')
        this.setState({
            playing: true
        })
        this.player.play()
        this.renderSeekPos()
    }

    getSignedUrlNext() {
        const currentAudioVersion = this.state.currentAudioVersion

        let nextIndex = this.state.audioVersionsIdx + 1
        const newAudioVersion = currentAudioVersion ? this.state.audioVersions[nextIndex] : null

        const originalUrl = newAudioVersion?.audio_file_url

        if (!this.state.signedUrlById[originalUrl]) {
            this.getSignedUrl(originalUrl)
        }
    }

    handleOnEnd() {
        console.log('on end====================')
        this.player.stop()
        const currentAudioVersion = this.state.currentAudioVersion

        let nextIndex = this.state.audioVersionsIdx + 1
        const newAudioVersion = currentAudioVersion ? this.state.audioVersions[nextIndex] : null

        this.props.setCurrentLinePlaying && this.props.setCurrentLinePlaying(newAudioVersion)

        this.setState({
            playing: newAudioVersion ? true : false,
            isLoading: false,
            currentAudioVersion: newAudioVersion || (this.state.audioVersions || this.state.audioVersions[0]),
            audioVersionDuration: this.state.seek || 0,
            // audioVersionDuration: this.state.audioVersionDuration + (newAudioVersion?.duration_in_seconds || 0),
            audioVersionsIdx: nextIndex > this.state.audioVersionsLength ? 0 : nextIndex
        })
        if (!newAudioVersion) {
            this.clearRAF()
        }
    }

    handleStop() {
        console.log("handle stop-------------------")

        this.player.pause()
        this.props.setIsPlaying && this.props.setIsPlaying(false)
        this.setState({
            playing: false // Need to update our local state so we don't immediately invoke autoplay
        })
        this.renderSeekPos()
    }

    handleLoopToggle() {
        this.setState({
            loop: !this.state.loop
        })
    }

    handleMuteToggle() {
        this.setState({
            mute: !this.state.mute
        })
    }

    handleMouseDownSeek() {
        console.log('handleMouseDownSeek')
        this.setState({
            isSeeking: true
        })
    }

    handleMouseUpSeek(e) {
        console.log('handleMouseUpSeek')
        this.setState({
            isSeeking: false
        })

        // this.player.seek(e.target.value)
    }

    handleSeekingChange(e) {
        const seekChange = parseFloat(e || 0)
     
        this.player.currentTime = seekChange || 0
        this.setState({
            isSeeking: true,
            seek: parseFloat(e || 0)
        })
    }

    getDurationByUrl(url) {
        if (!url) return
        return this.urlToDurationStartnd[url]
    }

    setCurrentlyPlayingLineId(lineId) {
        this.props.setCurrentlyPlayingLineId && this.props.setCurrentlyPlayingLineId(lineId)
    }

    // this is mostly to broadcast out which line we are on
    setCurrentAudioVersion(currentTime) {
        const currentAudioVersion = this.state.currentAudioVersion
        const durations = this.getDurationByUrl(currentAudioVersion.audio_file_url) || {}
        if (!durations) return

        const { startTime, endTime } = durations;

        const isBeforeEnd = currentTime < endTime
        const isAfterStart = currentTime > startTime
        
        if (isBeforeEnd && isAfterStart) return

        // find the next audioVersion or start from the beginning
        const idx = isAfterStart ? this.state.audioVersionsIdx : 0

        for (let i = idx; i < this.state.audioVersions.length; i++) {
            const audioVersion = this.state.audioVersions[i]
            const durations= this.getDurationByUrl(audioVersion.audio_file_url)
            if (!durations) break // we've likely run to the end of the loaded data ready to be played

            const { startTime, endTime } = durations
            const isBetween = currentTime > startTime && currentTime < endTime
            if (!isBetween) continue
            this.setState({
                currentAudioVersion: audioVersion,
                audioVersionsIdx: i
            })

            this.setCurrentlyPlayingLineId(audioVersion.line_id)
            return

        }
    }

    renderSeekPos() {
        if (this.player.currentTime >= this.state.duration) {
            this.handleToggle()
        }

        if (!this.state.isSeeking) {
            this.setState({
                seek: this.player.currentTime + this.state.audioVersionDuration
            })
        }

        if (this.state.playing) {
            this.setCurrentAudioVersion(this.player.currentTime)
            this._raf = raf(this.renderSeekPos)
        }
    }

    handleRate(e) {
        const rate = parseFloat(e.target.value)
        this.player.rate(rate)
        this.setState({ rate })
    }

    clearRAF() {
        raf.cancel(this._raf)
    }

    setIsLoading(callback) {
        if (this.state.isLoading) return
        this.setState({
            isLoading: true,
            playing: false
        }, callback)
    }

    setNotIsLoading(isPlaying) {
        this.setState({
            isLoading: false,
            // playing: isPlaying === undefined ?  true : isPlaying
        })
    }

    removeCurrentSrc() {
        const id = this.state?.currentAudioVersion?.id
        if (!id) return
        this.state.signedUrlById[id] = null
        this.handleToggle()
    }

    getSrc() {
        if (this.props.src) return this.props.src
        if (!this.state.currentAudioVersion) return ''
        let url = this.state.objSrc
        const timeLeftToEnd = (this.state.loadedDuration - (this?.player?.currentTime || 0))
        const shouldLoadMore = timeLeftToEnd < 10

        console.log('shouldLoadMore', shouldLoadMore)
        console.log('this.state.loadedDuration - (this?.player?.currentTime || 0)', this.state.loadedDuration - (this?.player?.currentTime || 0))
        if (url && shouldLoadMore) {
            if (timeLeftToEnd < 0) {
                this.setIsLoading()
            }

            this.getSignedUrlNextN(5)

            return url
        }

        
        console.log("loading", this.state.loadedDuration, this.state.syntheticDuration)
        if (!url && !this.state.isLoading && this.state.isAudioVersions !== false && !!this.state.currentAudioVersion?.audio_file_url) {

            let isPlaying = this.state.playing
            console.log("is loading urls---------")
            this.setIsLoading()
            this.getSignedUrlNextN(5, isPlaying)
        }
        return url
    }

    render() {
        const disabledClass = this.state.disabled ? 'disabled' : ''
        const src = this.getSrc()

        const percentLoaded = Number(((this.state.loadedDuration / this.state.syntheticDuration) * 100).toFixed())

        const finaLength = this.state.syntheticDuration ? new Date(this.state.syntheticDuration * 1000).toISOString().substring(14, 19) : '00'
        const currentLength = this.state.seek ? new Date(this.state.seek * 1000).toISOString().substring(14, 19) : '00'
        return (
            <div className={'max-w-[600px] audio-player-container py-3 px-6 z-50 border-t' + ' ' + disabledClass}>
        
                    <audio
                        id="player-aloud"
                        ref={(ref) => {
                            this.player = ref
                        }}
                        src={src || "none"}
                        onCanPlayThrough={this.handleOnLoad}
                        onPlay={this.handleOnPlay}
                        onEnded={this.handleOnEnd}
                        ended={this.handleOnEnd}
                        onError={(e) => {
                            console.log("error with player", e, src, this.state.objSrc)
                        }}
                        loop={this.state.loop}
                        muted={this.state.mute}
                        volume={this.state.volume}
                    ></audio>
                
           
                <div
                    className="flex bg-[#101010] grey-400 font-mono rounded-lg gap-8 items-center">

                    <div className="mx-auto flex gap-4 play-button-container justify-center">
                        {
                            this.state.playing 
                            ?
                            <button
                                disabled={this.props.disabled}
                                className={cn("play-button", this.state.isLoading ? 'pulse' : '')}
                                onClick={this.handleStop}
                            >
                                <Image width={BUTTON_SIZE} height={BUTTON_SIZE} src="/pause.png" alt="pause button"/> 
                            </button>
                            :
                            <button
                            disabled={this.props.disabled}
                            className={cn("play-button", this.state.isLoading ? 'pulse' : '')}
                                onClick={this.handleToggle}
                            >
                                <Image className="play-icon" width={BUTTON_SIZE} height={BUTTON_SIZE} src="/play.png" alt="play button"/>
                            </button>
                        }
                    </div>

                    
                    <Slider.Root
                        className="SliderRoot w-full"
                        type='range'
                        min='0'
                        max={this.state.duration ? this.state.duration.toFixed(2) : 0}
                        step='.01'
                        value={[this.state.seek]}
                        onValueChange={this.handleSeekingChange}
                        onValueCommit={this.handleMouseUpSeek}
                    >
                        <Slider.Track className="SliderTrack" style={{ background: `linear-gradient(to right, color(display-p3 0 0 0/0.3) ${percentLoaded}%, color(display-p3 0.004 0.039 0.2/0.122) ${percentLoaded}%)`}}>
                            <Slider.Range className="SliderRange" />
                        </Slider.Track>
                        <Slider.Thumb className={'SliderThumb ' + disabledClass} aria-label="Volume" />
                    </Slider.Root>
                    <p className="text-xs time-container flex justify-start">{`${currentLength} / ${finaLength}`}</p>
                </div>
            </div>
        )
    }
}

export default AudioPlayer
import React from 'react'
import raf from 'raf'
import Image from "next/image";
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import './AudioPlayer.css';
import { getWindow } from '@/getWindow'

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
    for (const buffer of resultBuffers) {
        const duration = await appendBlob(buffer, sourceBuffer, mediaSource);
        appendedDuration += duration
    }

    return appendedDuration
} 

class AudioPlayer extends React.Component {
    player = null;
    mediaSrc = null;
    urlsAssembled = new Set()

    constructor(props) {
        super(props)

        // we can pass in several urls representing audio files called audioVersions
        // so we can play them in sequence as if it were a single file. 
        const currentAudioVersion = this.props.audioVersions && this.props.audioVersions[0]

        // sum up all the durations for the audioversions
        const syntheticDuration = this.props.audioVersions && this.props.audioVersions.reduce((final, version) => {
            return final + version.duration_in_seconds
        }, 0)

        console.log('this.props.audioVersions', this.props.audioVersions)

        let disabled = false
        if (this.props.disabled === undefined) {
            disabled = !currentAudioVersion
        }
       
        if (currentAudioVersion === undefined) {
            disabled = !this.props.src
        }

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
 
    async getSignedUrlNextN(chunkSize, isPlaying) {
        const audioVersions = this.state.audioVersions
            .map(audioVersion => audioVersion.audio_file_url)
            .filter(url => !this.urlsAssembled.has(url))
            .filter(Boolean)

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
            const res = await this.props.getSignedUrl(urls)

            const singedUrls = res?.data?.map(obj => obj.signedUrl)

            // if no signed urls on the first batch stop loading
            if (i === 0 && (!singedUrls || !singedUrls.length) && isPlaying !== null) {
                // do some sort of error
                this.setNotIsLoading(false)
            
                return 
            }

            const duration = await assembleSource(singedUrls, this.mediaSrc, (src, mediaSrc) => {
                this.mediaSrc = mediaSrc
                this.state.objSrc = src
            })

            urls.forEach(url => this.urlsAssembled.add(url));

            this.setState({
                syntheticDuration: this.state.syntheticDuration < this.state.loadedDuration ? this.state.loadedDuration + duration : this.state.syntheticDuration,
                loadedDuration: this.state.loadedDuration + duration
                
            })

            // If isPlaying is true we want to start playing asap
            // once the objSrc has data
            if (isPlaying !== null) {
                this.setNotIsLoading(isPlaying)
            }
        }


    }

    componentWillUnmount() {
        this.clearRAF()
    }

    handleToggle() {
        console.log('handleToggle', this.state.playing)
        if (!this.state.playing) {
            this.player.play()
        } else {
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

        if (!url && !this.state.isLoading && this.state.isAudioVersions !== false) {
            let isPlaying = this.state.playing
            this.setIsLoading(() => {
                this.getSignedUrlNextN(5, isPlaying)
            })
        }
        return url
    }

    render() {
        const disabledClass = this.state.disabled ? 'disabled' : ''
        const src = this.getSrc()

        const percentLoaded = Number(((this.state.loadedDuration / this.state.syntheticDuration) * 100).toFixed())
        console.log("percentLoaded", percentLoaded)
        console.log("this.state.loadedDuration / this.state.syntheticDuration", this.state.loadedDuration / this.state.syntheticDuration)
        console.log("this.state.loadedDuration", this.state.loadedDuration)
        console.log("this.state.syntheticDuration", this.state.syntheticDuration)

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
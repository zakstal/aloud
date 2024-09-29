import React from 'react'
import ReactHowler from 'react-howler'
import raf from 'raf'
import Image from "next/image";
import * as Slider from '@radix-ui/react-slider';
import './AudioPlayer.css';

// import { FaPlay, FaStop } from 'react-icons/fa'
// import Switch from './Switch'
// import Loading from './Loading'
// import TimeItem from './TimeItem'
const BUTTON_SIZE = 12

function createThrottle(callback) {
    let int = null
    return function(val) {
        if (int) {
            clearTimeout(int)
        }

        int = setTimeout(function() {
            callback(val)
        }, 1000)
    }
}

// const SliderSeek = ({
//     handleSeekingChange,
//     handleMouseDownSeek,
//     handleMouseUpSeek,
//     max,
//     seek,
//     classNameThumb,
//  }) => {
//     // const [seekInternal, setSeekInternal ] = useState(seek)
//     // const handleSeek = useCallback(createThrottle((e) => {
//     //     setSeekInternal(seek)
//     //     handleSeekingChange(e)
//     // }).bind(this), [])
//     return (
//         <Slider.Root
//             className="SliderRoot w-full"
//             type='range'
//             min='0'
//             max={max}
//             step='.01'
//             value={ seek}
//             onValueChange={(e) => {
//                 handleSeekingChange(e)
//                 // setSeekInternal(e)
//                 // handleSeek(e)
//             }}
//             onMouseDown={handleMouseDownSeek}
//             onMouseUp={handleMouseUpSeek}
//         >
//         <Slider.Track className="SliderTrack">
//             <Slider.Range className="SliderRange" />
//         </Slider.Track>
//         <Slider.Thumb className={'SliderThumb ' + classNameThumb} aria-label="Volume" />
//     </Slider.Root>

//     )
// }

class AudioPlayer extends React.Component {
    constructor(props) {
        super(props)

        // we can pass in several urls representing audio files called audioVersions
        // so we can play them in sequence as if it were a single file. 
        const currentAudioVersion = this.props.audioVersions && this.props.audioVersions[0]

        // sum up all the durations for the audioversions
        const syntheticDuration = this.props.audioVersions && this.props.audioVersions.reduce((final, version) => {
            return final + version.duration_in_seconds
        }, 0)


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
            disabled: disabled
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
        this.setAudioVersionOnSeek = this.setAudioVersionOnSeek.bind(this)
        this.throttledSetAudioVersion = createThrottle(this.setAudioVersionOnSeek.bind(this)).bind(this)
    }

    componentWillUnmount() {
        this.clearRAF()
    }

    setAudioVersionOnSeek(seekNumber) {
        if (!seekNumber) return;
        let duration = 0;
        let foundIdx = 0
        const version = this.state.audioVersions.find((version, idx) => {
            const currentDuration = duration
            const nextDuration = duration + version.duration_in_seconds
            duration = nextDuration;

            if (seekNumber >= nextDuration) return false
            if (seekNumber < currentDuration) return false

            foundIdx = idx
            return true
        })

        this.player.seek(duration - seekNumber)

        
        this.setState({
            audioVersionDuration: duration - version?.duration_in_seconds,
            currentAudioVersion: version,
            isSeeking: false,
            audioVersionsIdx: foundIdx,
        })

    }

    handleToggle() {
        this.setState({
            playing: !this.state.playing
        })
    }

    handleOnLoad() {
        this.setState({
            loaded: true,
            duration: this.state.syntheticDuration || this.player.duration()
        })
    }

    handleOnPlay() {
        this.setState({
            playing: true
        })
        this.renderSeekPos()
    }

    handleOnEnd() {

        // if (this.state.audioVersionsIdx === 0) {
        //     this.setState({
        //         audioVersionsIdx: 1
        //     })
        //     return
        // }

        const currentAudioVersion = this.state.currentAudioVersion

        let nextIndex = this.state.audioVersionsIdx + 1
        const newAudioVersion = currentAudioVersion ? this.state.audioVersions[nextIndex] : null

        this.props.setCurrentLinePlaying && this.props.setCurrentLinePlaying(newAudioVersion)

        this.setState({
            playing: newAudioVersion ? true : false,
            currentAudioVersion: newAudioVersion || (this.state.audioVersions || this.state.audioVersions[0]),
            audioVersionDuration: this.state.audioVersionDuration + (newAudioVersion?.duration_in_seconds || 0),
            audioVersionsIdx: nextIndex > this.state.audioVersionsLength ? 0 : nextIndex
        })
        if (!newAudioVersion) {
            this.clearRAF()
        }
    }

    handleStop() {
        this.player.stop()
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
        this.setState({
            isSeeking: true
        })
    }

    handleMouseUpSeek(e) {
        this.setState({
            isSeeking: false
        })

        // this.player.seek(e.target.value)
    }

    handleSeekingChange(e) {
        this.setState({
            isSeeking: true,
            seek: parseFloat(e || 0)
        })

        this.throttledSetAudioVersion(e && e[0])
    }

    renderSeekPos() {
        if (!this.state.isSeeking && this.player.seek) {
            this.setState({
                seek: this.player.seek() + this.state.audioVersionDuration
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

    getSrc() {
        if (this.props.src) return this.props.src
        if (!this.state.currentAudioVersion) return ''

        return this.state?.currentAudioVersion?.audio_file_url
    }

    render() {
        const disabledClass = this.state.disabled ? 'disabled' : ''
        const src = this.getSrc()

        const finaLength = this.state.syntheticDuration ? new Date(this.state.syntheticDuration * 1000).toISOString().substring(14, 19) : '00'
        const currentLength = this.state.seek ? new Date(this.state.seek * 1000).toISOString().substring(14, 19) : '00'
        return (
            <div className={'max-w-[600px] audio-player-container py-3 px-6 z-50 border-t' + ' ' + disabledClass}>
                {/* { src ?  */}
                    <ReactHowler
                        src={src || 'none'}
                        playing={this.state.playing}
                        onLoad={this.handleOnLoad}
                        onPlay={this.handleOnPlay}
                        onEnd={this.handleOnEnd}
                        loop={this.state.loop}
                        mute={this.state.mute}
                        volume={this.state.volume}
                        onSeek={() => {
                            // console.log('seeking-------')
                        }}
                        ref={(ref) => {
                            this.player = ref
                        }}
                    />
                    {/* // : null
                    // } */}
           
                <div className="flex bg-[#101010] grey-400 font-mono rounded-lg gap-8 items-center">

                    <div className="mx-auto flex gap-4 play-button-container justify-center">
                        {
                            this.state.playing 
                            ?
                            <button
                                disabled={this.props.disabled}
                                className="play-button"
                                onClick={this.handleStop}
                            >
                                <Image width={BUTTON_SIZE} height={BUTTON_SIZE} src="/pause.png" alt="pause button"/> 
                            </button>
                            :
                            <button
                            disabled={this.props.disabled}
                                className="play-button"
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
                        onMouseDown={this.handleMouseDownSeek}
                        onMouseUp={this.handleMouseUpSeek}
                    >
                        <Slider.Track className="SliderTrack">
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
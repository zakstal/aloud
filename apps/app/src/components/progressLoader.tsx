import { cn } from '@/lib/utils';
import './progressLoader.css'

export const ProgressLoader = ({ progress = 90, className, onClick, isLoading = false }) => {
    const dashedStroke = 216
    const dashedOffset = ((dashedStroke - 85)  * (1 - (progress/100))) + 85
    return (
    <div id="myLoaderpro" className={cn("loaderpro", className)} onClick={onClick}>
        <div className="loaderpro__graphics">
            { isLoading ?
                null: 
                <>
                    <div data-js="count" className="loaderpro__count progress">{progress}%</div>
                    <div data-js="count" className="loaderpro__count cancel">cancel</div>
                </>
            }
        </div>
        <svg className="loaderpro__circle" xmlns="http://www.w3.org/2000/svg">
            <circle className="loaderpro__track" cx="50%" cy="50%"></circle>
        

            { isLoading ? 
                <circle 
                    className={cn("loaderpro__animated-circle", { 'loaderpro__animated-circle--animate': isLoading })} 
                    cx="50%" 
                    cy="50%"
                    style={{
                        strokeOpacity: 1,
                        strokeDasharray: 23 + 'px',
                        strokeDashoffset: 12 + 'px',
                    }}
                ></circle>
            : 
            <circle data-js="bar" className="loaderpro__bar" cx="50%" cy="50%" style={{
                    strokeOpacity: 1,
                    strokeDasharray: dashedStroke + 'px',
                    strokeDashoffset: dashedOffset + 'px',
                }}></circle>
            }
        </svg>
    </div>
    )
}


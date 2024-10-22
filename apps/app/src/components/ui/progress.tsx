import { cn } from '@/lib/utils';
import './progress.css'

export const Progress = ({ hw = 70, bw = 5, className = ''} = {}) => {
    return <div className={cn("loader", className)} style={{ '--hw': hw + 'px', '--bw': bw + 'px'}}></div>
}
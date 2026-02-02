
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogFeedProps {
  logs: LogEntry[];
}

const LogFeed: React.FC<LogFeedProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 bg-neutral-900 rounded-lg p-3 font-mono text-[10px] sm:text-[11px] leading-relaxed text-neutral-300 border border-white/5 h-24 sm:h-32 overflow-y-auto log-feed-scroll"
    >
      {logs.map((log, idx) => (
        <div key={idx} className="flex gap-2 text-neutral-400 mb-0.5">
          <span className="text-neutral-500 min-w-[70px]">[{log.timestamp}]</span>
          <span className={`font-bold min-w-[40px] ${
            log.level === 'INFO' ? 'text-blue-400' :
            log.level === 'LOAD' ? 'text-green-400' :
            log.level === 'EXEC' ? 'text-primary' :
            'text-red-400'
          }`}>
            {log.level}
          </span>
          <span className="text-neutral-300">{log.message}</span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-neutral-600 italic">No logs in current session...</div>
      )}
    </div>
  );
};

export default LogFeed;

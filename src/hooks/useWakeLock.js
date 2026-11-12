import { useEffect, useRef, useState } from 'react';

export function useWakeLock(enabled = false) {
  const wakeLockRef = useRef(null);
  const [wakeLockStatus, setWakeLockStatus] = useState('Screen can sleep during a quiet moment.');

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) {
      setWakeLockStatus('Wake lock is not available on this device.');
      return undefined;
    }

    let active = true;

    async function requestWakeLock() {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (!active) {
          await lock.release();
          return;
        }

        wakeLockRef.current = lock;
        setWakeLockStatus('Screen wake lock is active so the session stays visible.');

        lock.addEventListener('release', () => {
          if (active) {
            setWakeLockStatus('Wake lock released. The screen may sleep again.');
          }
        });
      } catch (error) {
        setWakeLockStatus('Wake lock could not be acquired. The screen may sleep while listening.');
      }
    }

    requestWakeLock();

    return () => {
      active = false;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => undefined);
      }
    };
  }, [enabled]);

  return wakeLockStatus;
}

// Sound effects utility
const audioCache: Map<string, HTMLAudioElement> = new Map();

// Mute state - stored in localStorage for persistence
let isMuted = typeof window !== 'undefined' && localStorage.getItem('sfx-muted') === 'true';

export function getMuted(): boolean {
    return isMuted;
}

export function setMuted(muted: boolean): void {
    isMuted = muted;
    if (typeof window !== 'undefined') {
        localStorage.setItem('sfx-muted', muted.toString());
    }
}

export function toggleMuted(): boolean {
    setMuted(!isMuted);
    return isMuted;
}

function getAudio(src: string): HTMLAudioElement {
    if (!audioCache.has(src)) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audioCache.set(src, audio);
    }
    return audioCache.get(src)!;
}

type SoundName = 'button-press' | 'button-release' | 'flip' | 'lost-streak' | '1-3' | '4-5' | '6-7' | '8-9' | 'tails' | 'heads1' | 'heads2' | 'heads3' | 'heads4' | 'heads5' | 'heads6' | 'heads7' | 'heads8' | 'heads9' | 'win-fanfare' | 'win-applause';

export function playSound(soundName: SoundName) {
    if (isMuted) return;

    const audio = getAudio(`/sfx/${soundName}.mp3`);
    // Clone the audio to allow overlapping plays
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = 0.5;
    clone.play().catch(() => {
        // Ignore autoplay errors - user hasn't interacted yet
    });
}

export function playButtonPress() {
    playSound('button-press');
}

export function playButtonRelease() {
    playSound('button-release');
}

export function playFlip() {
    playSound('flip');
}

export function playLostStreak() {
    playSound('lost-streak');
}

export function playTails() {
    playSound('tails');
}

// Play streak-specific sound based on streak number
export function playStreakSound(streak: number) {
    switch (streak) {
        case 1:
            playSound('heads1');
            playSound('1-3');
            break;
        case 2:
            playSound('heads2');
            playSound('1-3');
            break;
        case 3:
            playSound('heads3');
            playSound('1-3');
            break;
        case 4:
            playSound('heads4');
            playSound('4-5');
            break;
        case 5:
            playSound('heads5');
            playSound('4-5');
            break;
        case 6:
            playSound('heads6');
            playSound('6-7');
            break;
        case 7:
            playSound('heads7');
            playSound('6-7');
            break;
        case 8:
            playSound('heads8');
            playSound('8-9');
            break;
        case 9:
            playSound('heads9');
            playSound('8-9');
            break;
    }
}

// Play win celebration sounds
export function playWin() {
    playSound('win-fanfare');
    playSound('win-applause');
}

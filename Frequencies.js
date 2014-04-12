Frequencies = {
    keys: {
        'C': ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6', 'C7'],
        'Db': ['Db5', 'Eb5', 'F5', 'Gb5', 'Ab5', 'Bb5', 'C6', 'Db6', 'Eb6', 'F6', 'Gb6', 'Ab6', 'Bb6', 'C7', 'Db7'],
        'D': ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6', 'E6', 'F#6', 'G6', 'A6', 'B6', 'C#7', 'D7'],
        'Eb': ['Eb5', 'F5', 'G5', 'Ab5', 'Bb5', 'C6', 'D6', 'Eb6', 'F6', 'G6', 'Ab6', 'Bb6', 'C7', 'D7', 'Eb7'],
        'E': ['E5', 'F#5', 'G#5', 'A5', 'B5', 'C#6', 'D#6', 'E6', 'F#6', 'G#6', 'A6', 'B6', 'C#7', 'D#7', 'E7'],
        'F': ['F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'Bb6', 'C7', 'D7', 'E7', 'F7'],
        'F#': ['F#5', 'G#5', 'A#5', 'B5', 'C#6', 'D#6', 'E#6', 'F#6', 'G#6', 'A#6', 'B6', 'C#7', 'D#7', 'E#7', 'F#7'],
        'G': ['G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F#6', 'G6', 'A6', 'B6', 'C7', 'D7', 'E7', 'F#7', 'G7'],
        'Ab': ['Ab5', 'Bb5', 'C6', 'Db6', 'Eb6', 'F6', 'G6', 'Ab6', 'Bb6', 'C7', 'Db7', 'Eb7', 'F7', 'G7', 'Ab7'],
        'A': ['A5', 'B5', 'C#6', 'D6', 'E6', 'F#6', 'G#6', 'A6', 'B6', 'C#7', 'D7', 'E7', 'F#7', 'G#7', 'A7'],
        'Bb': ['Bb5', 'C6', 'D6', 'Eb6', 'F6', 'G6', 'A6', 'Bb6', 'C7', 'D7', 'Eb7', 'F7', 'G7', 'A7', 'Bb7'],
        'B': ['B5', 'C#6', 'D#6', 'E6', 'F#6', 'G#6', 'A#6', 'B6', 'C#7', 'D#7', 'E7', 'F#7', 'G#7', 'A#7', 'B7']
    },
    sounds: {}
};

Frequencies.load = function (key) {
    var frequencies = [];
    for (var i = Frequencies.keys[key].length - 1; i >= 0; i--) {
        frequencies.push({
            name: Frequencies.keys[key][i].replace(/\d/g, ''),
            sound: Frequencies.loadSound(Frequencies.keys[key][i])
        });
    }
    return frequencies;
};

Frequencies.loadSound = function (note) {
    var TONES = 'CDEFGAB';
    if (note[1] == 'b') {
        note = TONES[(TONES.indexOf(note[0]) + 13) % TONES.length] + '#' + note.substring(2);
    }
    note = note.replace('E#', 'F');
    if (!(note in Frequencies.sounds)) {
        var fileName = note.replace('#', 'sharp').toLowerCase();
        Frequencies.sounds[note] = new Howl({
            urls: ['sounds/' + fileName + '.ogg', 'sounds/' + fileName + '.mp3']
        });
    }
    return Frequencies.sounds[note];
};
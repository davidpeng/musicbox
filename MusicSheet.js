function MusicSheet(key, length, noteDelay) {
    this.key = key;
    this.frequencies = Frequencies.load(key);
    this.sheet = new Array(length);
    for (var column = 0; column < this.sheet.length; column++) {
        this.sheet[column] = new Array(this.frequencies.length);
        for (var row = 0; row < this.frequencies.length; row++) {
            this.sheet[column][row] = false;
        }
    }
    this.noteDelay = noteDelay;
    this.currentColumn = 0;
    this.playTimeoutId = null;
    this.selectedNotes = [];
}

MusicSheet.prototype.reset = function (key, length, noteDelay) {
    if (this.key != key) {
        this.key = key;
        this.frequencies = Frequencies.load(this.key);
        for (var column = 0; column < this.sheet.length; column++) {
            while (this.sheet[column].length < this.frequencies.length) {
                this.sheet[column].push(false);
            }
            this.sheet[column].length = this.frequencies.length;
        }
    }
    for (var column = this.sheet.length; column < length; column++) {
        this.sheet[column] = new Array(this.frequencies.length);
        for (var row = 0; row < this.frequencies.length; row++) {
            this.sheet[column][row] = false;
        }
    }
    this.sheet.length = length;
    this.noteDelay = noteDelay;
    this.currentColumn = Math.min(this.currentColumn, this.sheet.length - 1);
    var i = 0;
    while (i < this.selectedNotes.length) {
        if (this.selectedNotes[i].column > this.sheet.length ||
            this.selectedNotes[i].row > this.frequencies.length) {
            this.deselectNote(this.selectedNotes[i].column, this.selectedNotes[i].row);
        } else {
            i++;
        }
    }
};

MusicSheet.prototype.addNote = function (column, row) {
    this.sheet[column][row] = true;
};

MusicSheet.prototype.removeNote = function (column, row) {
    this.deselectNote(column, row);
    this.sheet[column][row] = false;
};

MusicSheet.prototype.playColumn = function (column) {
    for (var row = 0; row < this.frequencies.length; row++) {
        if (this.sheet[column][row]) {
            this.frequencies[row].sound.play();
        }
    }
};

MusicSheet.prototype.play = function (callback) {
    this.playColumn(this.currentColumn);
    if (this.currentColumn < this.sheet.length - 1) {
        this.currentColumn++;
        var sheet = this;
        this.playTimeoutId = setTimeout(function () {
            sheet.play(callback);
        }, this.noteDelay);
    } else {
        this.currentColumn = 0;
        if (this.playTimeoutId != null) {
            clearTimeout(this.playTimeoutId);
            this.playTimeoutId = null;
        }
    }
    callback();
};

MusicSheet.prototype.stop = function () {
    if (this.playTimeoutId != null) {
        clearTimeout(this.playTimeoutId);
        this.playTimeoutId = null;
    }
};

MusicSheet.prototype.selectNote = function (column, row) {
    if (this.sheet[column][row] && !this.isNoteSelected(column, row)) {
        this.selectedNotes.push({
            column: column,
            row: row
        });
    }
};

MusicSheet.prototype.isNoteSelected = function (column, row) {
    for (var i = 0; i < this.selectedNotes.length; i++) {
        if (this.selectedNotes[i].column == column && this.selectedNotes[i].row == row) {
            return true;
        }
    }
    return false;
};

MusicSheet.prototype.deselectNote = function (column, row) {
    for (var i = 0; i < this.selectedNotes.length; i++) {
        if (this.selectedNotes[i].column == column && this.selectedNotes[i].row == row) {
            this.selectedNotes.splice(i, 1);
            break;
        }
    }
};

MusicSheet.prototype.getFirstSelectedColumn = function () {
    var firstColumn = this.sheet.length;
    for (var i = 0; i < this.selectedNotes.length; i++) {
        firstColumn = Math.min(firstColumn, this.selectedNotes[i].column);
    }
    if (firstColumn == this.sheet.length) {
        return null;
    }
    return firstColumn;
};

MusicSheet.prototype.isWholeColumnSelected = function (column) {
    var columnHasSelected = false;
    for (var row = 0; row < this.frequencies.length; row++) {
        if (this.sheet[column][row]) {
            if (this.isNoteSelected(column, row)) {
                columnHasSelected = true;
            } else {
                return false;
            }
        }
    }
    return columnHasSelected;
};

MusicSheet.prototype.selectColumn = function (column) {
    for (var row = 0; row < this.frequencies.length; row++) {
        if (this.sheet[column][row]) {
            this.selectNote(column, row);
        }
    }
};

MusicSheet.prototype.deselectColumn = function (column) {
    for (var row = 0; row < this.frequencies.length; row++) {
        if (this.sheet[column][row]) {
            this.deselectNote(column, row);
        }
    }
};

MusicSheet.prototype.shiftSelectedNotes = function (targetColumn) {
    if (this.selectedNotes.length == 0) {
        return;
    }
    var leftColumn = this.sheet.length;
    var rightColumn = -1;
    for (var i = 0; i < this.selectedNotes.length; i++) {
        leftColumn = Math.min(leftColumn, this.selectedNotes[i].column);
        rightColumn = Math.max(rightColumn, this.selectedNotes[i].column);
    }
    var columnCount = rightColumn - leftColumn + 1;
    targetColumn = Math.min(targetColumn, this.sheet.length - columnCount);
    targetColumn = Math.max(targetColumn, 0);
    if (targetColumn < leftColumn) {
        this.sheet = this.sheet.slice(0, targetColumn).concat(
            this.sheet.slice(leftColumn, leftColumn + columnCount),
            this.sheet.slice(targetColumn, leftColumn),
            this.sheet.slice(leftColumn + columnCount));
    } else {
        var shiftColumn = Math.max(targetColumn, leftColumn + columnCount);
        this.sheet = this.sheet.slice(0, leftColumn).concat(
            this.sheet.slice(shiftColumn, shiftColumn + targetColumn - leftColumn),
            this.sheet.slice(leftColumn, leftColumn + columnCount),
            this.sheet.slice(shiftColumn + targetColumn - leftColumn));
    }
    for (var i = 0; i < this.selectedNotes.length; i++) {
        this.selectedNotes[i].column += targetColumn - leftColumn;
    }
};

MusicSheet.prototype.serialize = function () {
    return JSON.stringify({
        key: this.key,
        sheet: this.sheet,
        noteDelay: this.noteDelay
    });
};

MusicSheet.prototype.load = function (serialization) {
    var data = JSON.parse(serialization);
    this.key = data.key;
    this.frequencies = Frequencies.load(data.key);
    this.sheet = data.sheet;
    this.noteDelay = data.noteDelay;
    this.currentColumn = 0;
    this.stop();
    this.selectedNotes.length = 0;
};
function MusicSheetView(model, element) {
    this.model = model;
    this.canvas = $(element).find('canvas')[0];
    this.canvasContext = this.canvas.getContext('2d');
    this.noteImage = $(element).find('.noteImage')[0];
    this.selectedNoteImage = $(element).find('.selectedNoteImage')[0];
    this.positionImage = $(element).find('.positionImage')[0];
    this.scrollX = 0;
    this.mouseIn = false;
    this.mouseDown = false;
    this.ctrlDown = false;
    this.resize();
    
    var view = this;
    
    $(window).resize(function () {
        view.resize();
    });
    
    $(this.canvas).mousemove(function (event) {
        view.mouseIn = true;
        view.mouseX = event.pageX - this.offsetLeft;
        view.mouseY = event.pageY - this.offsetTop;
        if (view.mouseDown) {
            if (!view.mouseDragged &&
                (Math.abs(view.mouseX - view.mouseDownX) > MusicSheetView.NOTE_IMAGE_WIDTH / 2 ||
                 Math.abs(view.mouseY - view.mouseDownY) > MusicSheetView.NOTE_IMAGE_HEIGHT / 2)) {
                view.mouseDragged = true;
            }
        }
        view.updateCursor();
        view.paintCanvas();
    });
    
    $(this.canvas).mouseleave(function () {
        view.mouseIn = false;
        view.paintCanvas();
    });
    
    $(this.canvas).mousedown(function (event) {
        view.mouseDown = true;
        view.mouseDownX = event.pageX - this.offsetLeft;
        view.mouseDownY = event.pageY - this.offsetTop;
        view.mouseDragged = false;
    });
    
    $(this.canvas).mouseup(function (event) {
        if (!view.mouseDown) {
            return;
        }
        view.mouseDown = false;
        if (view.mouseDragged) {
            view.mouseDragged = false;
            if (event.ctrlKey) {
                var left = Math.min(view.mouseDownX, view.mouseX);
                var right = Math.max(view.mouseDownX, view.mouseX);
                var top = Math.min(view.mouseDownY, view.mouseY);
                var bottom = Math.max(view.mouseDownY, view.mouseY);
                var firstColumn = Math.ceil((left - view.getOffsetX()) / MusicSheetView.CELL_SIZE);
                var lastColumn = Math.floor((right - view.getOffsetX()) / MusicSheetView.CELL_SIZE);
                var firstRow = Math.ceil((top - view.getOffsetY()) / MusicSheetView.CELL_SIZE);
                var lastRow = Math.floor((bottom - view.getOffsetY()) / MusicSheetView.CELL_SIZE);
                for (var column = firstColumn; column <= lastColumn; column++) {
                    for (var row = firstRow; row <= lastRow; row++) {
                        view.model.selectNote(column, row);
                    }
                }
            } else {
                view.scrollX += view.mouseDownX - view.mouseX;
                view.scrollX = view.constrainScrollX(view.scrollX);
            }
        } else {
            var hoverSelection = view.getHoverSelection();
            if (hoverSelection != null) {
                if (event.ctrlKey) {
                    if (view.model.isNoteSelected(hoverSelection.column, hoverSelection.row)) {
                        view.model.deselectNote(hoverSelection.column, hoverSelection.row);
                    } else {
                        view.model.selectNote(hoverSelection.column, hoverSelection.row);
                    }
                } else {
                    if (view.model.sheet[hoverSelection.column][hoverSelection.row]) {
                        view.model.removeNote(hoverSelection.column, hoverSelection.row);
                    } else {
                        view.model.addNote(hoverSelection.column, hoverSelection.row);
                    }
                    view.model.playColumn(hoverSelection.column);
                }
                view.paintCanvas();
            } else {
                var hoverPosition = view.getHoverPosition();
                if (hoverPosition != null) {
                    if (event.ctrlKey) {
                        if (view.model.isWholeColumnSelected(hoverPosition)) {
                            view.model.deselectColumn(hoverPosition);
                        } else {
                            view.model.selectColumn(hoverPosition);
                        }
                    } else {
                        view.model.currentColumn = hoverPosition;
                        view.model.playColumn(hoverPosition);
                    }
                }
            }
        }
    });
    
    $(document).keydown(function (event) {
        view.ctrlDown = event.ctrlKey;
        switch (event.keyCode) {
            case 27:
                view.model.selectedNotes.length = 0;
                break;
            case 46:
                while (view.model.selectedNotes.length > 0) {
                    var note = view.model.selectedNotes[0];
                    view.model.removeNote(note.column, note.row);
                }
                view.model.selectedNotes.length = 0;
                break;
            case 37:
                var firstSelectedColumn = view.model.getFirstSelectedColumn();
                if (firstSelectedColumn != null) {
                    view.model.shiftSelectedNotes(firstSelectedColumn - 1);
                }
                break;
            case 39:
                var firstSelectedColumn = view.model.getFirstSelectedColumn();
                if (firstSelectedColumn != null) {
                    view.model.shiftSelectedNotes(firstSelectedColumn + 1);
                }
                break;
        }
        view.updateCursor();
        view.paintCanvas();
    });
    
    $(document).keyup(function (event) {
        view.ctrlDown = event.ctrlKey;
        view.updateCursor();
        view.paintCanvas();
    });
}

MusicSheetView.CELL_SIZE = 36;
MusicSheetView.NOTE_IMAGE_WIDTH = 24;
MusicSheetView.NOTE_IMAGE_HEIGHT = 24;
MusicSheetView.POSITION_IMAGE_WIDTH = 23;
MusicSheetView.POSITION_IMAGE_HEIGHT = 34;

MusicSheetView.prototype.resize = function () {
    this.computeFrequencyMarginWidth();
    this.canvas.width = Math.min(this.frequencyMarginWidth + MusicSheetView.CELL_SIZE * this.model.sheet.length, $(window).width());
    this.canvas.height = MusicSheetView.CELL_SIZE + MusicSheetView.CELL_SIZE * this.model.frequencies.length - MusicSheetView.CELL_SIZE / 2 + MusicSheetView.POSITION_IMAGE_HEIGHT;
    this.paintCanvas();
};

MusicSheetView.prototype.computeFrequencyMarginWidth = function () {
    var maximumWidth = 0;
    for (var i = 0; i < this.model.frequencies.length; i++) {
        maximumWidth = Math.max(maximumWidth, this.canvasContext.measureText(this.model.frequencies[i].name).width);
    }
    this.frequencyMarginWidth = 10 + maximumWidth + MusicSheetView.CELL_SIZE / 2;
};

MusicSheetView.prototype.getOffsetX = function () {
    var scrollX = this.scrollX;
    if (this.mouseDragged && !this.ctrlDown) {
        scrollX += this.mouseDownX - this.mouseX;
    }
    return this.frequencyMarginWidth - this.constrainScrollX(scrollX);
};

MusicSheetView.prototype.getOffsetY = function () {
    return MusicSheetView.CELL_SIZE;
};

MusicSheetView.prototype.constrainScrollX = function (scrollX) {
    scrollX = Math.max(scrollX, 0);
    scrollX = Math.min(scrollX, this.model.sheet.length * MusicSheetView.CELL_SIZE - this.canvas.width + this.frequencyMarginWidth);
    return scrollX;
};

MusicSheetView.prototype.updateCursor = function () {
    if (this.ctrlDown) {
        this.canvas.style.cursor = 'copy';
    } else if (this.mouseDragged) {
        this.canvas.style.cursor = 'move';
    } else if (this.getHoverSelection() != null || this.getHoverPosition() != null) {
        this.canvas.style.cursor = 'pointer';
    } else {
        this.canvas.style.cursor = '';
    }
};

MusicSheetView.prototype.paintCanvas = function () {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.canvasContext.strokeStyle = 'black';
    var gridTop = this.getRowY(0);
    var gridBottom = this.getRowY(this.model.frequencies.length - 1);
    for (var column = 0; column < this.model.sheet.length; column += 2) {
        this.canvasContext.beginPath();
        this.canvasContext.lineWidth = column % 4 == 0 ? 2 : 1;
        var x = this.getColumnX(column);
        this.canvasContext.moveTo(x, gridTop);
        this.canvasContext.lineTo(x, gridBottom);
        this.canvasContext.stroke();
    }
    var gridLeft = this.getColumnX(0);
    var gridRight = this.getColumnX(this.model.sheet.length - 1);
    for (var row = 0; row < this.model.frequencies.length; row++) {
        this.canvasContext.beginPath();
        this.canvasContext.lineWidth = row % 2 == 0 ? 4 : 1;
        var y = this.getRowY(row);
        this.canvasContext.moveTo(gridLeft, y);
        this.canvasContext.lineTo(gridRight, y);
        this.canvasContext.stroke();
    }
    this.canvasContext.lineWidth = 1;
    
    for (var column = 0; column < this.model.sheet.length; column++) {
        for (var row = 0; row < this.model.frequencies.length; row++) {
            if (this.model.sheet[column][row] && !this.model.isNoteSelected(column, row)) {
                var x = this.getColumnX(column) - MusicSheetView.NOTE_IMAGE_WIDTH / 2;
                var y = this.getRowY(row) - MusicSheetView.NOTE_IMAGE_HEIGHT / 2;
                this.canvasContext.drawImage(this.noteImage, x, y);
            }
        }
    }
    
    for (var i = 0; i < this.model.selectedNotes.length; i++) {
        var column = this.model.selectedNotes[i].column;
        var row = this.model.selectedNotes[i].row;
        var x = this.getColumnX(column) - MusicSheetView.NOTE_IMAGE_WIDTH / 2;
        var y = this.getRowY(row) - MusicSheetView.NOTE_IMAGE_HEIGHT / 2;
        this.canvasContext.drawImage(this.selectedNoteImage, x, y);
    }
    
    this.canvasContext.drawImage(this.positionImage, this.getColumnX(this.model.currentColumn) - MusicSheetView.POSITION_IMAGE_WIDTH / 2, this.canvas.height - MusicSheetView.POSITION_IMAGE_HEIGHT);
    
    if (!(this.mouseDragged && this.ctrlDown)) {
        var hoverSelection = this.getHoverSelection();
        if (hoverSelection != null &&
            !this.model.sheet[hoverSelection.column][hoverSelection.row] &&
            !this.model.isNoteSelected(hoverSelection.column, hoverSelection.row)) {
            this.canvasContext.globalAlpha = 0.5;
            var x = this.getColumnX(hoverSelection.column) - MusicSheetView.NOTE_IMAGE_WIDTH / 2;
            var y = this.getRowY(hoverSelection.row) - MusicSheetView.NOTE_IMAGE_HEIGHT / 2;
            this.canvasContext.drawImage(this.noteImage, x, y);
            this.canvasContext.globalAlpha = 1;
        }
        
        var hoverPosition = this.getHoverPosition();
        if (hoverPosition != null && hoverPosition != this.model.currentColumn) {
            this.canvasContext.globalAlpha = 0.5;
            this.canvasContext.drawImage(this.positionImage, this.getColumnX(hoverPosition) - MusicSheetView.POSITION_IMAGE_WIDTH / 2, this.canvas.height - MusicSheetView.POSITION_IMAGE_HEIGHT);
            this.canvasContext.globalAlpha = 1;
        }
    }
    
    var textRight = this.frequencyMarginWidth - MusicSheetView.CELL_SIZE / 2;
    this.canvasContext.clearRect(0, 0, textRight, this.canvas.height - MusicSheetView.POSITION_IMAGE_HEIGHT);
    this.canvasContext.textAlign = 'right';
    this.canvasContext.textBaseline = 'middle';
    this.canvasContext.fillStyle = 'black';
    for (var row = 0; row < this.model.frequencies.length; row++) {
        this.canvasContext.fillText(this.model.frequencies[row].name, textRight, this.getRowY(row));
    }
    
    if (this.mouseDragged && this.ctrlDown) {
        this.canvasContext.globalAlpha = 0.5;
        this.canvasContext.fillStyle = '#dcdcdc';
        this.canvasContext.fillRect(this.mouseDownX, this.mouseDownY, this.mouseX - this.mouseDownX, this.mouseY - this.mouseDownY);
        this.canvasContext.globalAlpha = 1;
        this.canvasContext.strokeStyle = 'white';
        this.canvasContext.strokeRect(this.mouseDownX, this.mouseDownY, this.mouseX - this.mouseDownX, this.mouseY - this.mouseDownY);
    }
};

MusicSheetView.prototype.getColumnX = function (column) {
    return this.getOffsetX() + MusicSheetView.CELL_SIZE * column;
};

MusicSheetView.prototype.getRowY = function (row) {
    return this.getOffsetY() + MusicSheetView.CELL_SIZE * row;
};

MusicSheetView.prototype.getHoverSelection = function () {
    if (!this.mouseIn) {
        return null;
    }
    var column = Math.round((this.mouseX - this.getOffsetX()) / MusicSheetView.CELL_SIZE);
    var row = Math.round((this.mouseY - this.getOffsetY()) / MusicSheetView.CELL_SIZE);
    if (column < 0 || column >= this.model.sheet.length || row < 0 || row >= this.model.frequencies.length) {
        return null;
    }
    var x = this.getColumnX(column);
    var y = this.getRowY(row);
    if (Math.abs(this.mouseX - x) <= MusicSheetView.NOTE_IMAGE_WIDTH / 2 && Math.abs(this.mouseY - y) <= MusicSheetView.NOTE_IMAGE_HEIGHT / 2) {
        return {
            column: column,
            row: row
        };
    }
    return null;
};

MusicSheetView.prototype.getHoverPosition = function () {
    if (!this.mouseIn || this.mouseY < this.canvas.height - MusicSheetView.POSITION_IMAGE_HEIGHT) {
        return null;
    }
    var column = Math.round((this.mouseX - this.getOffsetX()) / MusicSheetView.CELL_SIZE);
    if (column < 0 || column >= this.model.sheet.length) {
        return null;
    }
    return column;
};
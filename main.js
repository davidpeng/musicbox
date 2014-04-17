$(window).load(function () {
    for (var key in Frequencies.keys) {
        $('#key').append($('<option>').text(key));
    }

    var musicSheet = new MusicSheet('C', 100, 100);
    var sheetView = new MusicSheetView(musicSheet, $('#musicSheet'));
    
    $('#playButton').click(function () {
        musicSheet.stop();
        musicSheet.play(function () {
            sheetView.paintCanvas();
        });
    });
    
    $('#stopButton').click(function () {
        musicSheet.stop();
    });
    
    $('#loadButton').click(function () {
        $('#file').click();
    });
    
    $('#settingsButton').click(function () {
        $('#key').val(musicSheet.key);
        $('#sheetLength').val(musicSheet.sheet.length);
        $('#noteDelay').val(musicSheet.noteDelay);
        $('#settingsModal').modal('show');
    });
    
    $('#saveButton').click(function () {
        var blob = new Blob([musicSheet.serialize()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, $('#fileName').val());
        $('#saveModal').modal('hide');
    });
    
    $('#file').change(function () {
        var files = $('#file')[0].files;
        if (files.length == 0) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (event) {
            $('#loadButton').popover('hide');
            try {
                musicSheet.load(event.target.result);
                $('#fileName').val(files[0].name);
                sheetView.resize();
            } catch (exception) {
                showAlert('Oh no!', 'Couldn\'t load the file you selected. Did you pick the right file?');
            }
            $('#file').val('');
        };
        reader.readAsText(files[0]);
        $('#loadButton').popover('show');
    });
    
    $('#saveSettingsButton').click(function () {
        var key = $('#key').val();
        var sheetLength = parseInt($('#sheetLength').val());
        var noteDelay = parseInt($('#noteDelay').val());
        musicSheet.reset(key, sheetLength, noteDelay);
        sheetView.resize();
        $('#settingsModal').modal('hide');
    });
    
    $('#settingsForm').bootstrapValidator({
        submitButtons: '#saveSettingsButton',
        live: 'enabled',
        fields: {
            sheetLength: {
                validators: {
                    notEmpty: {
                        message: 'Sheet length is required.'
                    },
                    greaterThan: {
                        message: 'Sheet length must be at least 1.',
                        value: 1,
                        inclusive: false
                    },
                    lessThan: {
                        message: 'Sheet length can be at most 1000.',
                        value: 1000,
                        inclusive: false
                    }
                }
            },
            noteDelay: {
                validators: {
                    notEmpty: {
                        message: 'Beat interval is required.'
                    },
                    integer: {
                        message: 'Beat interval must be a whole number.'
                    },
                    greaterThan: {
                        message: 'Beat interval must be greater than 0.',
                        value: 0,
                        inclusive: true
                    }
                }
            }
        }
    });
    
    function showAlert(title, body) {
        $('#alertModal .modal-title').html(title);
        $('#alertModal .modal-body').html(body);
        $('#alertModal').modal('show');
    }
});
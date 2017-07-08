/*********************************************************************************** *
 * MIT License
 *
 * Copyright (c) 2017 Raphael "rGunti" Guntersweiler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ********************************************************************************* */

$(document).ready(function() {
    var options = $('#createPlaylistSelector');
    var playlistNameTextbox = $('#createPlaylistPlaylistName');

    $('#addToPlaylistModal').on('shown.bs.modal', function() {
        var song = $('#addToPlaylistModal').data('song');
        $('#addToPlaylistModal .result-title').text(song.Title || song.file);
        $('#addToPlaylistModal .result-artist').text(song.Artist || '-');

        $('.loading-indicator').fadeIn();

        options.empty();
        $.ajax({
            url: '/mpd/playlists',
            method: 'get'
        }).done(function(d) {
            if (d.ok) {
                options.append($('<option></option>').val('NEW').text(' <New Playlist> '));
                $.each(d.data, function() {
                    options.append($('<option></option>').text(this.playlist));
                });
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.toaster({
                title: 'Error',
                message: 'Something went horribly wrong here D:\nSome more detail for you: ' + textStatus,
                priority: 'danger'
            });
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            $('.loading-indicator').fadeOut();
        });
    });

    $('#addToPlaylistModal form').submit(function(e) {
        e.preventDefault();
        $('.loading-indicator').fadeIn();

        var song = $('#addToPlaylistModal').data('song');
        var data = {
            playlist: playlistNameTextbox.val(),
            uri: song.file
        };

        sendSimpleAjaxRequest('/mpd/playlists/content', 'post', data, function(d) {
            $('#addToPlaylistModal').modal('hide');
            $('.loading-indicator').fadeOut();
            $.toaster({
                title: 'Song added',
                message: '"' + (song.Title || song.file) + '" to Playlist "' + data.playlist + '"'
            });
        }, function() {
            $('#addToPlaylistModal').modal('hide');
            $('.loading-indicator').fadeOut();
        });
        playlistNameTextbox.val('');
    });

    $('#addToPlaylistModal button.modal-button-cancel').click(function() {
        $('#addToPlaylistModal').modal('hide');
    });

    options.change(function(e) {
        console.log(e);
        if (options.val() === 'NEW') {
            playlistNameTextbox.val('').parent().show();
        } else {
            var selectedText = $('option:selected', options).text();
            playlistNameTextbox.val(selectedText).parent().hide();
        }
    });
});

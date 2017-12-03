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

var options;
var playlistNameTextbox;
function onAddToPlaylistModalOpen() {
    var song = $('#addToPlaylistModal').data('song');
    $('#addToPlaylistModal .result-title').text(song.Title || song.file);
    $('#addToPlaylistModal .result-artist').text(song.Artist || '-');

    LoadingIndicator.show();

    options.empty();
    $.ajax({
        url: '/mpd/playlists',
        method: 'get'
    }).done(function(d) {
        if (d.ok) {
            $.each(d.data, function() {
                var option = $('<a class="collection-item"></a>');
                option.text(this.playlist);
                option.click(function() {
                    playlistNameTextbox.val(option.text())
                });
                options.append(option);
            });
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        Materialize.toast('Something went horribly wrong here D:\nSome more detail for you: ' + textStatus);
    }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
        LoadingIndicator.hide();
    });
}

$(document).ready(function() {
    options = $('#createPlaylistPlaylistCollection');
    playlistNameTextbox = $('#createPlaylistPlaylistName');

    $('#addToPlaylistModalForm').submit(function(e) {
        e.preventDefault();
        LoadingIndicator.show();

        var song = $('#addToPlaylistModal').data('song');
        var data = {
            playlist: playlistNameTextbox.val(),
            uri: song.file
        };

        sendSimpleAjaxRequest('/mpd/playlists/content', 'post', data, function(d) {
            $('#addToPlaylistModal').modal('close');
            LoadingIndicator.hide();
            Materialize.toast('"' + (song.Title || song.file) + '" added to Playlist "' + data.playlist + '"',
                2500);
        }, function() {
            $('#addToPlaylistModal').modal('close');
            LoadingIndicator.hide();
        });
        playlistNameTextbox.val('');
    });

    $('#addToPlaylistModal button.modal-button-cancel').click(function() {
        $('#addToPlaylistModal').modal('hide');
    });
});

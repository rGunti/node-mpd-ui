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
    var songs = [];
    var renderedItems = 0;

    function renderSongs(startIndex) {
        for (var i = startIndex; i < startIndex + 10 && i < songs.length; i++) {
            var song = songs[i];
            var item = $('#queueItemTemplate').clone();

            $('.result-title', item).text(song.Title || song.file);
            if (song.Artist) {
                $('.result-artist', item).text(song.Artist);
            } else {
                $('.result-artist', item).hide();
            }
            $('.result-length', item).text(formatTimeWithMinutes(song.Time));
            $('.result-pos', item).text(Number(song.Pos) + 1);

            item.data('song', song);
            item.click(onSongClick);
            item.appendTo('#queueRenderTarget').hide();

            renderedItems++;
        }
        fadeInHiddenElement();
        if (!hasMoreSongs()) {
            $('#queueLoadMoreButton').attr('disabled', true);
        } else {
            $('#queueLoadMoreButton').attr('disabled', false);
        }
    }

    function fadeInHiddenElement() {
        console.log('Fade In');
        var item = $('#queueRenderTarget .list-group-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, fadeInHiddenElement);
        }
    }

    function hasMoreSongs() {
        return (renderedItems < songs.length);
    }

    function onSongClick(e) {
        var target = $(e.currentTarget);
        var song = target.data('song');

        //$('#selectActionModal .result-title').text(song.Title || song.file);
        //$('#selectActionModal .result-artist').text(song.Artist || '');
        //$('#selectActionModal').data('song', song);
        //$('#selectActionModal').modal('show');
    }

    $('#queueLoadMoreButton').click(function(e) {
        renderSongs(renderedItems);
    });

    $.ajax({
        url: '/mpd/queue',
        method: 'get',
        beforeSend: function() {

        }
    }).done(function(data, textStatus, jqXHR) {
        if (data.ok) {
            if (data.data && data.data.length >= 1) {
                songs = data.data;
                renderSongs(0);
            } else {
                $.toaster({
                    title: 'No Songs found',
                    message: 'Add a few songs to the queue to start the party.',
                    priority: 'info'
                });
            }
        } else {
            $.toaster({
                title: 'Error',
                message: data.message,
                priority: 'danger'
            });
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        // -
    }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
        // -
    });
});

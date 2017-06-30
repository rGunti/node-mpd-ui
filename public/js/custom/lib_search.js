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
            var item = $('#searchResultItemTemplate').clone();

            $('.result-title', item).text(song.Title || song.file);
            if (song.Artist) {
                $('.result-artist', item).text(song.Artist);
            } else {
                $('.result-artist', item).hide();
            }
            $('.result-length', item).text(formatTimeWithMinutes(song.Time));

            item.data('song', song);
            item.click(onSongClick);
            item.appendTo('#searchResultRenderTarget').hide();

            renderedItems++;
        }
        fadeInHiddenElement();
        if (!hasMoreSongs()) {
            $('#searchResultLoadMoreButton').attr('disabled', true);
        }
    }

    function fadeInHiddenElement() {
        console.log('Fade In');
        var item = $('#searchResultRenderTarget .list-group-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, fadeInHiddenElement);
        }
    }

    $('#searchResultLoadMoreButton').click(function(e) {
        renderSongs(renderedItems);
    });

    function hasMoreSongs() {
        return (renderedItems < songs.length);
    }

    function onSongClick(e) {
        var target = $(e.currentTarget);
        var song = target.data('song');

        $('#selectActionModal .result-title').text(song.Title || song.file);
        $('#selectActionModal .result-artist').text(song.Artist || '');
        $('#selectActionModal').data('song', song);
        $('#selectActionModal').modal('show');
    }

    $('#songActionAddToPlaylistButton').click(function(e) {
        var song = $('#selectActionModal').data('song');
        $('#selectActionModal').modal('hide');
        $.ajax({
            url: '/mpd/queue/add',
            method: 'post',
            data: {
                uri: song.file
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                $.toaster({
                    title: 'Added to Queue',
                    message: song.Title || song.file
                });
            } else {
                $.toaster({
                    title: 'Error',
                    message: data.message,
                    priority: 'danger'
                });
            }
        });
    });

    $('#librarySearchForm').submit(function(e) {
        e.preventDefault();

        var data = {
            title: $('#librarySearchTitle').val(),
            artist: $('#librarySearchArtist').val(),
            album: $('#librarySearchAlbum').val(),
            genre: $('#librarySearchGenre').val()
        };

        if (!data.title && !data.artist && !data.album && !data.genre) {
            $.toaster({
                title: 'Nothing entered',
                message: 'Please enter something to search for.',
                priority: 'warning'
            });
            $('#librarySearchTitle').focus().select();
            return;
        }

        $.ajax({
            url: '/mpd/library/search',
            method: 'post',
            data: data,
            beforeSend: function() {
                $('#collapseSearchForm button[type=submit] img.loading').show();
                $('#collapseSearchForm button[type=submit] i').hide();
                $('#collapseSearchForm button[type=submit]').attr('disabled', true);

                $('#searchResultRenderTarget').empty();
            }
        }).done(function(data, textStatus, jqXHR) {
            //console.log(data);
            if (data.ok) {
                if (data.data && data.data.length >= 1) {
                    songs = data.data;
                    renderSongs(0);

                    $('#collapseSearchForm').collapse('hide');
                    $('#collapseSearchResult').collapse('show');
                } else {
                    $.toaster({
                        title: 'No Songs found',
                        message: 'Maybe try something else.',
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
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            $('#collapseSearchForm button img.loading').hide();
            $('#collapseSearchForm button i').show();
            $('#collapseSearchForm button[type=submit]').attr('disabled', false);
        });
    });

    $('#searchAgainButton').click(function(e) {
        $('#collapseSearchForm').collapse('show');
        $('#collapseSearchResult').collapse('hide');
        $('#librarySearchTitle').focus().select();

        $('#searchResultLoadMoreButton').attr('disabled', false);
        songs = [];
        renderedItems = 0;
    });

    $.get('/mpd/library/genres', function(data) {
        $('#librarySearchGenre').typeahead({ source: data.data }, 'json');
    });

    $('#librarySearchTitle').focus().select();
});

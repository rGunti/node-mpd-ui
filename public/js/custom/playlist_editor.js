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
    var playlist_name = $('#playlistName').val();
    var songs = [];
    var renderedItems = 0;
    var PAGE_SIZE = 10;

    function renderPlaylist(startIndex) {
        renderedItems = startIndex;
        for (var i = startIndex; i < startIndex + PAGE_SIZE && i < songs.length; i++) {
            var song = songs[i];

            // Song can be null (for some reason)
            if (!song) {
                songs.splice(i, 1);
                continue;
            }

            var item = $('#playlistItemTemplate').clone();
            item.attr('id', '');

            $('.result-pos', item).text(i + 1);
            $('.result-title', item).text(song.Title || song.file);
            $('.result-artist', item).text(song.Artist || '-');
            $('.result-length', item).text(formatTimeWithMinutes(song.Time));

            song.Pos = i;

            item.data('song', song);
            item.click(onSongClick);
            item.appendTo('#playlistRenderTarget').hide();

            renderedItems++;
        }
        fadeInHiddenElement();
        $('.playlistPositionIndicator').text((startIndex + 1) + '-' + renderedItems + '/' + songs.length);
    }

    function fadeInHiddenElement() {
        //console.log('Fade In');
        var item = $('#playlistRenderTarget .list-group-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, fadeInHiddenElement);
        }
    }

    function fadeOutVisibleElements(callback) {
        //console.log('Fade Out');
        var item = $('#playlistRenderTarget .list-group-item:visible:last');
        if (item.length > 0) {
            item.fadeOut(50, function() {
                item.remove();
                fadeOutVisibleElements(callback);
            });
        } else {
            if (callback) callback();
        }
    }

    function onSongClick(e) {
        var target = $(e.currentTarget);
        var song = target.data('song');

        $('#selectActionModal .result-pos').text((song.Pos + 1));
        $('#selectActionModal .result-title').text(song.Title || song.file);
        $('#selectActionModal .result-artist').text(song.Artist || '-');
        $('#selectActionModal').data('song', song).modal('show');
    }

    $('.playlistLoadMoreButton').click(function(e) {
        var target = renderedItems;
        reloadPlaylistData(function(d,o) {
            //console.log(d.length, o.length, renderedItems);
            if (d.length === o.length && target === o.length) {
                $.toaster({
                    title: 'Info',
                    message: 'You\'ve reached the end of the playlist.',
                    priority: 'info'
                });
                return;
            }
            if (d.length <= target) {
                target = d.length - 1;
                var mod = target % PAGE_SIZE;
                if (mod > 0) {
                    target -= mod;
                } else {
                    target -= PAGE_SIZE;
                }
            }
            fadeOutVisibleElements(function() {
                renderPlaylist(target);
            });
        });
    });

    $('.playlistReloadButton').click(function(e) {
        var target = renderedItems - (renderedItems % PAGE_SIZE);
        if (target === renderedItems) target -= PAGE_SIZE;
        reloadPlaylistData(function(d) {
            //console.log(renderedItems, target, d.length);

            if (d.length < target) {
                target = d.length - 1;
                var mod = target % PAGE_SIZE;
                if (mod > 0) {
                    target -= mod;
                } else {
                    target -= PAGE_SIZE;
                }
            }

            fadeOutVisibleElements(function() {
                renderPlaylist(Math.max(0, target));
            });
        });
    });

    $('.playlistLoadLessButton').click(function(e) {
        var target = renderedItems - PAGE_SIZE;
        var mod = target % PAGE_SIZE;
        if (mod > 0) {
            target -= mod;
        } else {
            target -= PAGE_SIZE;
        }
        //console.log(renderedItems, mod, target);

        reloadPlaylistData(function(d, o) {
            //console.log(d.length);

            if (d.length < target) {
                target = d.length - 1;
                mod = target % PAGE_SIZE;
                if (mod > 0) {
                    target -= mod;
                } else {
                    target -= PAGE_SIZE;
                }
            }

            fadeOutVisibleElements(function() {
                renderPlaylist(Math.max(0, target));
            });
        });
    });

    $('#selectActionModal button').click(function(e) {
        var song = $('#selectActionModal').data('song');
        var action = $(e.currentTarget).data('action');
        //console.log(song, action);

        if (!action) { return; }

        switch (action) {
            case 'delete-song':
                sendSimpleAjaxRequest(
                    '/mpd/playlists/item/remove',
                    'delete',
                    { name: playlist_name, pos: song.Pos },
                    function(d) {
                        $('#playlistLoading').fadeOut();
                        $('.playlistReloadButton:first').click();

                        $.toaster({
                            title: 'Song removed',
                            message: song.Title || song.file
                        });
                    },
                    function() { $('#playlistLoading').fadeOut(); }
                );
                break;
            default:
                $.toaster({
                    title: 'Unknown Action',
                    message: action,
                    priority: 'danger'
                });
                break;
        }
        $('#selectActionModal').modal('hide');
    });

    function reloadPlaylistData(renderCallback) {
        $.ajax({
            url: '/mpd/playlists/content',
            data: { name: playlist_name, '_t': new Date().getTime() },
            method: 'get',
            beforeSend: function() {
                $('.loading-indicator').fadeIn();
                $('.playlistNavigationButtons').attr('disabled', true);
            }
        }).done(function(data, textStatus, jqXHR) {
            console.log(data);
            if (data.ok) {
                var oldSongs = songs;
                if (data.data && data.data.length >= 1) {
                    songs = data.data;
                    renderCallback(songs, oldSongs);
                } else {
                    $.toaster({
                        title: 'Playlist empty',
                        message: 'Add items to the playlist by using the Library functions.',
                        priority: 'info'
                    });
                    songs = [];
                    renderCallback([], oldSongs);
                }
            } else {
                $.toaster({
                    title: 'Error',
                    message: data.message,
                    priority: 'danger'
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
            $('.playlistNavigationButtons').attr('disabled', false);
        });
    }

    reloadPlaylistData(function(data) {
        renderPlaylist(0);
    });
});

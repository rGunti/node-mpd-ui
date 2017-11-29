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
    var PAGE_SIZE = 10;

    function generateSongInfoText(song) {
        return '<b>' + (song.Title || song.file) + '</b>' + (song.Artist ? ' by <b>' + song.Artist + '</b>' : '')
    }

    function renderSongs(startIndex) {
        renderedItems = startIndex;
        for (var i = startIndex; i < startIndex + PAGE_SIZE && i < songs.length; i++) {
            var song = songs[i];

            // Song can be null (for some reason)
            if (!song) {
                songs.splice(i, 1);
                continue;
            }

            var item = $('#queueItemTemplate').clone();
            item.attr('id', '');

            $('.result-title', item).text(song.Title || song.file);
            if (song.Artist) {
                $('.result-artist', item).text(song.Artist);
            } else {
                $('.result-artist', item).hide();
            }
            $('.result-length', item).text(formatTimeWithMinutes(song.Time));
            $('.result-pos', item).text(Number(song.Pos) + 1);

            var button = $('.result-actions', item);
            button.click(onSongClick);
            button.data('song', song);

            item.appendTo('#queueRenderTarget').hide();

            renderedItems++;
        }
        fadeInHiddenElement();
        $('.queuePositionIndicator').text((startIndex + 1) + '-' + renderedItems + '/' + songs.length);
    }

    function fadeInHiddenElement() {
        //console.log('Fade In');
        var item = $('#queueRenderTarget .collection-item:hidden:first');
        if (item.length > 0) {
            item.fadeIn(100, fadeInHiddenElement);
        }
    }

    function fadeOutVisibleElements(callback) {
        //console.log('Fade Out');
        var item = $('#queueRenderTarget .collection-item:visible:last');
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

        $('#selectActionModal .result-pos').text(Number(song.Pos) + 1);
        $('#selectActionModal .result-title').text(song.Title || song.file);
        $('#selectActionModal .result-artist').text(song.Artist || '');
        $('#selectActionModal').data('song', song).modal('show');
    }

    $('.queueLoadMoreButton').click(function(e) {
        var target = renderedItems;
        reloadQueueData(function(d,o) {
            //console.log(d.length, o.length, renderedItems);
            if (d.length === o.length && target === o.length) {
                $.toaster({
                    title: 'Info',
                    message: 'You\'ve reached the end of the queue.',
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
                renderSongs(target);
            });
        });
    });

    $('.queueReloadButton').click(function(e) {
        var target = renderedItems - (renderedItems % PAGE_SIZE);
        if (target === renderedItems) target -= PAGE_SIZE;
        reloadQueueData(function(d) {
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
                renderSongs(Math.max(0, target));
            });
        });
    });

    $('.queueLoadLessButton').click(function(e) {
        var target = renderedItems - PAGE_SIZE;
        var mod = target % PAGE_SIZE;
        if (mod > 0) {
            target -= mod;
        } else {
            target -= PAGE_SIZE;
        }
        //console.log(renderedItems, mod, target);

        reloadQueueData(function(d, o) {
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
                renderSongs(Math.max(0, target));
            });
        });
    });

    $('#selectActionModal button').click(function(e) {
        var song = $('#selectActionModal').data('song');
        var action = $(e.currentTarget).data('action');
        //console.log(song, action);

        if (!action) { return; }

        switch (action) {
            case 'play':
                sendSimpleAjaxRequest('/mpd/queue/' + song.Pos + '/play', 'post', null, function(r) {
                    $.toaster({
                        title: 'Now Playing',
                        message: generateSongInfoText(song)
                    });
                });
                break;
            case 'remove':
                sendSimpleAjaxRequest('/mpd/queue/' + song.Pos + '/remove', 'post', null, function(r) {
                    $.toaster({
                        title: 'Removed from queue',
                        message: generateSongInfoText(song)
                    });
                    $('.queueReloadButton').first().click();
                });
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

    $('#clearQueueLink').click(function(e) {
        $('#clearQueueModal').modal('open');
    });

    $('#clearQueueModal .confirm-yes').click(function(e) {
        sendSimpleAjaxRequest(
            '/mpd/queue/clear',
            'post',
            null,
            function() {
                $('#clearQueueModal').modal('close');
                LoadingIndicator.hide();
                Materialize.toast('Queue cleared!', 2500);
                $('.queueReloadButton').first().click();
            },
            function() {
                LoadingIndicator.hide();
            }
        );
    });

    $('#createPlaylistFromQueueLink').click(function(e) {
        e.preventDefault();
        $('#createPlaylistModal').modal('show');
    });

    $('#createPlaylistModal button.modal-button-cancel').click(function() {
        $('#createPlaylistModal').modal('hide');
    });

    $('#createPlaylistModal form').submit(function(e) {
        e.preventDefault();
        LoadingIndicator.show();


        var playlistName = $('#createPlaylistPlaylistName').val();
        sendSimpleAjaxRequest(
            '/mpd/queue/toPlaylist',
            'post',
            { name: playlistName },
            function() {
                $('#createPlaylistPlaylistName').val('');
                $('#createPlaylistModal').modal('hide');
                LoadingIndicator.hide();

                $.toaster({
                    title: 'Playlist created',
                    message: playlistName
                });
            },
            function() {
                LoadingIndicator.hide();
            }
        );
    });

    function reloadQueueData(renderCallback) {
        $.ajax({
            url: '/mpd/queue',
            method: 'get',
            beforeSend: function() {
                LoadingIndicator.show();
                $('.queueNavigationButtons').attr('disabled', true);
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                if (data.data && data.data.length >= 1) {
                    var oldSongs = songs;
                    songs = data.data;
                    renderCallback(songs, oldSongs);
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
            $.toaster({
                title: 'Error',
                message: 'Something went horribly wrong here D:\nSome more detail for you: ' + textStatus,
                priority: 'danger'
            });
        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
            LoadingIndicator.hide();
            $('.queueNavigationButtons').attr('disabled', false);
        });
    }

    reloadQueueData(function(data) {
        renderSongs(0);
    });
});

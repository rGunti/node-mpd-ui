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
    var playlists = [];
    var renderedItems = 0;
    var PAGE_SIZE = 10;

    function sortPlaylists(a, b){
        if (a.playlist < b.playlist) return -1;
        else if(a.playlist > b.playlist) return 1;
        else return 0;
    }

    function renderPlaylists(startIndex) {
        playlists.sort(sortPlaylists);

        renderedItems = startIndex;
        for (var i = startIndex; i < startIndex + PAGE_SIZE && i < playlists.length; i++) {
            var playlist = playlists[i];

            // Song can be null (for some reason)
            if (!playlist) {
                playlists.splice(i, 1);
                continue;
            }

            var item = $('#playlistItemTemplate').clone();
            item.attr('id', '');

            $('.result-name', item).text(playlist.playlist);

            item.data('playlist', playlist);
            item.click(onPlaylistClick);
            item.appendTo('#playlistRenderTarget').hide();

            renderedItems++;
        }
        fadeInHiddenElement();
        $('.playlistPositionIndicator').text((startIndex + 1) + '-' + renderedItems + '/' + playlists.length);
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

    function onPlaylistClick(e) {
        var target = $(e.currentTarget);
        var playlist = target.data('playlist');

        $('#selectActionModal .result-name').text(playlist.playlist);
        $('#selectActionModal').data('playlist', playlist).modal('show');
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
                renderPlaylists(target);
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
                renderPlaylists(Math.max(0, target));
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
                renderPlaylists(Math.max(0, target));
            });
        });
    });

    $('#selectActionModal button').click(function(e) {
        var playlist = $('#selectActionModal').data('playlist');
        var action = $(e.currentTarget).data('action');
        //console.log(song, action);

        if (!action) { return; }

        switch (action) {
            case "load-playlist":
                $('#playlistLoading').fadeIn();
                sendSimpleAjaxRequest(
                    '/mpd/queue/fromPlaylist',
                    'post',
                    { name: playlist.playlist },
                    function (d) {
                        $('#playlistLoading').fadeOut();
                        $('.playlistReloadButton:first').click();

                        $.toaster({
                            title: 'Playlist loaded',
                            message: playlist.playlist
                        });
                    },
                    function() {
                        $('#playlistLoading').fadeOut();
                    }
                );
                break;
            case "delete-playlist":
                $('#playlistLoading').fadeIn();
                sendSimpleAjaxRequest(
                    '/mpd/playlists',
                    'delete',
                    { name: playlist.playlist },
                    function (d) {
                        $('#playlistLoading').fadeOut();
                        $('.playlistReloadButton:first').click();

                        $.toaster({
                            title: 'Playlist deleted',
                            message: playlist.playlist
                        });
                    },
                    function() {
                        $('#playlistLoading').fadeOut();
                    }
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
            url: '/mpd/playlists',
            method: 'get',
            beforeSend: function() {
                $('.loading-indicator').fadeIn();
                $('.playlistNavigationButtons').attr('disabled', true);
            }
        }).done(function(data, textStatus, jqXHR) {
            if (data.ok) {
                if (data.data && data.data.length >= 1) {
                    var oldSongs = playlists;
                    playlists = data.data;
                    renderCallback(playlists, oldSongs);
                } else {
                    $.toaster({
                        title: 'No Playlists found',
                        message: 'Create a playlist by saving the current queue.',
                        priority: 'info'
                    });
                    renderCallback([], playlists);
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
        renderPlaylists(0);
    });
});

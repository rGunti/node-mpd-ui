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

function calculateArtworkWidth() {
    // Calculate Album Cover Height
    var screenHeight = $(window).height();
    var screenWidth = $(window).width();
    var contentWidth = $('.main-raised > .container').width();
    var contentMargin = Number($('.main-raised > .container').css('padding-left').replace('px',''));

    var footerHeight = $('footer').height();
    var navHeight = 100;
    var currentTitleHeight = $('#currentTitle').parent().height();
    var currentArtistAlbumHeight = $('#currentArtist').parent().height();
    var timestampHeight = $('#currentTimestamp').parent().parent().height();
    var timestampBarHeight = $('#timestampProgressBar').parent().parent().height();
    var buttonHeight = $('.row.text-center').height();
    var failSafe = 30;

    var songInfoHeight = currentTitleHeight + currentArtistAlbumHeight + timestampHeight + timestampBarHeight;

    var albumCoverHeight = screenHeight
        - footerHeight
        - navHeight
        - songInfoHeight
        - buttonHeight
        - failSafe
    ;
    albumCoverHeight = Math.min(albumCoverHeight, screenWidth);

    $('.album-cover-row').css({ height: albumCoverHeight + 15, position: 'relative' });
    $('.album-cover-row > img')
        .height(albumCoverHeight)
        .width(albumCoverHeight)
        .css({
            left: (contentWidth / 2) - (albumCoverHeight / 2) + contentMargin,
            position: 'absolute'
        })
    ;
    $('.album-cover-row').show();
}

/**
 * Updates a given Song Info and triggers the recalculation method, unless prevented by parameter
 * @param target Target Object (jQuery Selector)
 * @param value Value
 * @param preventEvent If given and true, the recalculation will not be triggered
 */
function updateSongInfoText(target, value, preventEvent) {
    $(target).text(value);
    if (!preventEvent) calculateArtworkWidth();
}

function updateSongTitle(value, preventEvent) { updateSongInfoText('#currentTitle', value, preventEvent) }
function updateSongArtist(value, preventEvent) { updateSongInfoText('#currentArtist', value, preventEvent) }
function updateSongAlbum(value, preventEvent) { updateSongInfoText('#currentAlbum', value, preventEvent) }
function updateSongTimestamp(value) { updateSongInfoText('#currentSongLength', value, true); }
function updateCurrentTimestamp(value) { updateSongInfoText('#currentTimestamp', value, true); }

function updatePlayPauseButton(state) {
    $('#playPauseButton > i.material-icons').text((state === 'play' ? 'pause' : 'play_arrow'));
}

function updateTimestampProgressBar(val, max) {
    $('#timestampProgressBar').css({
        width: ((val / max) * 100) + '%'
    });
}

function updateAllSongInfo(title, artist, album, length, lengthString, timestamp, timestampString, state) {
    updateSongTitle(title, false);
    updateSongArtist(artist, false);
    updateSongAlbum(album, false);
    updateSongTimestamp(lengthString);
    updateCurrentTimestamp(timestampString);
    updatePlayPauseButton(state);
    updateTimestampProgressBar(timestamp, length);

    calculateArtworkWidth();
}

function updateUILoop() {
    $.ajax({
        url: '/mpd/status'
    }).done(function(response) {
        if (response.ok) {
            updateAllSongInfo(
                (response.data.currentSong ? response.data.currentSong.Title || '-' : '-'),
                (response.data.currentSong ? response.data.currentSong.Artist || '-' : '-'),
                (response.data.currentSong ? response.data.currentSong.Album || '-' : '-'),
                response.data.songLength,
                response.data.songLengthString,
                response.data.currentTimestamp,
                response.data.currentTimestampString,
                response.data.state
            );
        }

        setTimeout(updateUILoop, 250);
    });
}

function executeSimpleRequest(url, method) {
    $.ajax({ url: url, method: method || 'post' });
}

$(document).ready(function() {
    // Resize Stuff if the Window Size changes
    $(window).resize(calculateArtworkWidth);

    // Initial Recalc Method
    calculateArtworkWidth();

    // Initialize UI Loop
    updateUILoop();

    // Set Button Events
    $('#previousSongButton').click(function() { executeSimpleRequest('/mpd/control/prev') });
    $('#playPauseButton').click(function() { executeSimpleRequest('/mpd/control/playPause') });
    $('#nextSongButton').click(function() { executeSimpleRequest('/mpd/control/skip') });
});

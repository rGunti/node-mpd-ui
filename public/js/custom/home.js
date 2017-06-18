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
    function calculateArtworkWidth() {
        // Calculate Album Cover Height
        var screenHeight = $(window).height();
        var screenWidth = $(window).width();
        var contentWidth = $('.main-raised > .container').width();
        var contentMargin = Number($('.main-raised > .container').css('padding-left').replace('px',''));

        var footerHeight = $('footer').height();
        var navHeight = 100;
        var songInfoHeight = 25 + 21 + 21 + 24;
        var buttonHeight = 61;
        var failSafe = 30;

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

    $(window).resize(calculateArtworkWidth);

    calculateArtworkWidth();
});

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

const LoadingIndicator = {
    getContent: function() {
        return '<div class="preloader-wrapper small active">' +
            '<div class="spinner-layer spinner-blue-only">' +
            '<div class="circle-clipper left">' +
            '<div class="circle"></div>' +
            '</div>' +
            '<div class="gap-patch">' +
            '<div class="circle"></div>' +
            '</div>' +
            '<div class="circle-clipper right">' +
            '<div class="circle"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '&nbsp;&nbsp;&nbsp;' +
            'Loading ...';
    },
    instance: null,
    show: function() {
        if (!LoadingIndicator.instance) {
            LoadingIndicator.instance = Materialize.toast(LoadingIndicator.getContent(), Infinity, 'indigo darken-4');
        }
    },
    hide: function() {
        if (LoadingIndicator.instance) {
            LoadingIndicator.instance.remove();
            LoadingIndicator.instance = null;
        }
    }
};
